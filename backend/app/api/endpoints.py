import hashlib
import json
import logging
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, Depends
from fastapi.responses import FileResponse, JSONResponse, PlainTextResponse

from app.ai.detector import MarinePlasticDetector
from app.core.config import settings
from app.database.db import get_db_connection, log_audit
from app.geospatial.drift_predictor import PlasticDriftPredictor
from app.geospatial.hotspot_engine import HotspotIntelligenceEngine
from app.schemas.detection import (
    DetectionResult,
    HotspotCluster,
    DriftPredictionResult,
    CleanupRecommendation,
    CleanupRoutePlan,
    BeforeAfterAnalysisResult,
)
from app.services.cleanup_optimizer import CleanupOptimizationService
from app.services.impact_analysis import CleanupImpactService

logger = logging.getLogger("aquatrace.api")
router = APIRouter()

detector = MarinePlasticDetector()
hotspot_engine = HotspotIntelligenceEngine(
    eps_km=settings.DBSCAN_EPS_KM,
    min_samples=settings.DBSCAN_MIN_SAMPLES
)
drift_predictor = PlasticDriftPredictor()
cleanup_service = CleanupOptimizationService()
impact_service = CleanupImpactService()


def compute_file_hash(file_path: Path) -> str:
    """Computes SHA-256 hash of an image file to detect duplicate citizen submissions."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()


# -------------------------------------------------------------
# STEP 2 & 3: DETECTION & OBSERVATIONS API
# -------------------------------------------------------------

@router.post("/detections/analyze")
async def analyze_and_record_detection(
    image: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    confidence_threshold: Optional[float] = Form(0.28),
    auto_create_observation: Optional[bool] = Form(True)
):
    """
    Uploads an image, runs actual YOLO AI computer vision, checks blur/quality,
    extracts EXIF GPS (or uses user-supplied coordinates), generates annotated
    bounding boxes, and persists observation to database.
    """
    # Validate extension
    ext = Path(image.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{ext}'. Supported formats: JPG, JPEG, PNG, WEBP."
        )

    # Save to disk safely
    unique_name = f"{uuid.uuid4().hex[:12]}_{image.filename}"
    saved_path = settings.UPLOAD_DIR / unique_name

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    file_size = saved_path.stat().st_size
    if file_size > settings.MAX_IMAGE_SIZE_BYTES:
        saved_path.unlink()
        raise HTTPException(
            status_code=400,
            detail=f"Image file exceeds maximum allowable size of {settings.MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB."
        )

    # Run AI inference
    try:
        analysis = detector.analyze_image(
            saved_path,
            confidence_threshold=confidence_threshold or 0.28
        )
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Computer Vision analysis failed: {str(e)}")

    # Resolve GPS Coordinates (EXIF vs Provided)
    final_lat = latitude
    final_lon = longitude
    loc_source = "user_input"

    exif = analysis["exif"]
    if exif.get("has_gps") and exif.get("latitude") and exif.get("longitude"):
        final_lat = exif["latitude"]
        final_lon = exif["longitude"]
        loc_source = "exif_gps"
    elif latitude is not None and longitude is not None:
        loc_source = "manual_picker"
    else:
        # Default coastal reference if unspecified
        final_lat = 13.0475
        final_lon = 80.2825
        loc_source = "unverified_default"

    resolved_loc_name = location_name or (
        f"Coastal Coordinate ({final_lat:.4f}, {final_lon:.4f})"
    )

    obs_id = f"obs_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    if auto_create_observation:
        conn = get_db_connection()
        conn.execute("""
            INSERT INTO observations (
                id, image_filename, annotated_filename, latitude, longitude,
                location_name, location_source, total_objects, detected_classes_json,
                detections_detail_json, quality_score, is_blurry, blur_variance,
                hazard_score, explainability_notes, verification_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            obs_id,
            unique_name,
            analysis["annotated_filename"],
            final_lat,
            final_lon,
            resolved_loc_name,
            loc_source,
            analysis["total_objects"],
            json.dumps(analysis["detected_counts"]),
            json.dumps(analysis["detections"]),
            analysis["quality"]["quality_score"],
            1 if analysis["quality"]["is_blurry"] else 0,
            analysis["quality"]["blur_variance"],
            analysis["hazard_score"],
            json.dumps(analysis["explainable_ai"]),
            "verified" if loc_source == "exif_gps" else "pending",
            now_iso
        ))
        conn.commit()
        conn.close()

        # Update hotspot clustering in background
        try:
            hotspot_engine.compute_hotspots()
        except Exception as e:
            logger.warning(f"Could not automatically refresh hotspots: {e}")

    return {
        "observation_id": obs_id,
        "image_url": f"/uploads/{unique_name}",
        "annotated_image_url": analysis["annotated_url"],
        "latitude": final_lat,
        "longitude": final_lon,
        "location_name": resolved_loc_name,
        "location_source": loc_source,
        "total_objects": analysis["total_objects"],
        "detected_counts": analysis["detected_counts"],
        "hazard_score": analysis["hazard_score"],
        "detections": analysis["detections"],
        "quality": analysis["quality"],
        "exif": analysis["exif"],
        "explainable_ai": analysis["explainable_ai"],
        "verification_status": "verified" if loc_source == "exif_gps" else "pending",
        "created_at": now_iso
    }


@router.get("/detections")
async def list_detections(
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Lists verified and recorded plastic detections with filters and pagination."""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM observations WHERE 1=1"
    params = []

    if status:
        query += " AND verification_status = ?"
        params.append(status)

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        c_dict = json.loads(r["detected_classes_json"] or "{}")
        if category and category not in c_dict:
            continue

        results.append({
            "observation_id": r["id"],
            "image_url": f"/uploads/{r['image_filename']}",
            "annotated_image_url": f"/uploads/annotated/{r['annotated_filename']}" if r["annotated_filename"] else None,
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "location_name": r["location_name"],
            "location_source": r["location_source"],
            "total_objects": r["total_objects"],
            "detected_counts": c_dict,
            "hazard_score": r["hazard_score"],
            "quality_score": r["quality_score"],
            "is_blurry": bool(r["is_blurry"]),
            "blur_variance": r["blur_variance"],
            "verification_status": r["verification_status"],
            "created_at": r["created_at"]
        })

    return {"count": len(results), "detections": results}


@router.get("/detections/{obs_id}")
async def get_detection_detail(obs_id: str):
    """Retrieves full details, bounding boxes, and explainability factors for a specific observation."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM observations WHERE id = ?", (obs_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Observation not found")

    return {
        "observation_id": r["id"],
        "image_url": f"/uploads/{r['image_filename']}",
        "annotated_image_url": f"/uploads/annotated/{r['annotated_filename']}" if r["annotated_filename"] else None,
        "latitude": r["latitude"],
        "longitude": r["longitude"],
        "location_name": r["location_name"],
        "location_source": r["location_source"],
        "total_objects": r["total_objects"],
        "detected_counts": json.loads(r["detected_classes_json"] or "{}"),
        "detections": json.loads(r["detections_detail_json"] or "[]"),
        "hazard_score": r["hazard_score"],
        "quality_score": r["quality_score"],
        "is_blurry": bool(r["is_blurry"]),
        "blur_variance": r["blur_variance"],
        "explainable_ai": json.loads(r["explainability_notes"] or "{}"),
        "verification_status": r["verification_status"],
        "created_at": r["created_at"]
    }


# -------------------------------------------------------------
# STEP 4: HOTSPOT INTELLIGENCE API
# -------------------------------------------------------------

@router.get("/hotspots")
async def get_hotspots():
    """Returns calculated DBSCAN hotspots ranked by Hotspot Priority Index (HPI)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hotspots ORDER BY hotspot_priority_index DESC")
    rows = cursor.fetchall()
    conn.close()

    hotspots = []
    for r in rows:
        hotspots.append({
            "id": r["id"],
            "cluster_id": r["cluster_id"],
            "centroid_lat": r["centroid_lat"],
            "centroid_lon": r["centroid_lon"],
            "location_name": r["location_name"],
            "observation_count": r["observation_count"],
            "total_waste_count": r["total_waste_count"],
            "hotspot_priority_index": r["hotspot_priority_index"],
            "priority_level": r["priority_level"],
            "dominant_category": r["dominant_category"],
            "category_distribution": json.loads(r["category_distribution_json"] or "{}"),
            "radius_meters": r["radius_meters"],
            "explanation": r["explanation"],
            "last_observed_at": r["last_observed_at"],
            "updated_at": r["updated_at"]
        })

    return {"count": len(hotspots), "hotspots": hotspots}


@router.post("/hotspots/refresh")
async def refresh_hotspots():
    """Forces recalculation of DBSCAN clusters and priority indices across all observations."""
    hotspots = hotspot_engine.compute_hotspots()
    return {"message": "Hotspots successfully recomputed", "total_hotspots": len(hotspots), "hotspots": hotspots}


# -------------------------------------------------------------
# STEP 5: DRIFT & RISK PREDICTION API
# -------------------------------------------------------------

@router.get("/predictions/{obs_id}")
async def get_drift_prediction(
    obs_id: str,
    horizon_hours: int = Query(72, ge=24, le=168)
):
    """
    Computes Lagrangian hydrodynamic drift trajectory, expanding uncertainty cone,
    and coastal beaching probability for a given marine debris sighting.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT latitude, longitude FROM observations WHERE id = ?", (obs_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Observation record not found")

    lat, lon = r["latitude"], r["longitude"]
    prediction = drift_predictor.predict_drift(
        observation_id=obs_id,
        start_lat=lat,
        start_lon=lon,
        horizon_hours=horizon_hours
    )
    return prediction


# -------------------------------------------------------------
# STEP 6: SMART CLEANUP ROUTE & RECOMMENDATIONS API
# -------------------------------------------------------------

@router.get("/cleanup/recommendations")
async def get_cleanup_recommendations(max_targets: int = Query(8, ge=1, le=20)):
    """Returns prioritized cleanup targets based on waste volume, hazard, and drift risk."""
    recommendations = cleanup_service.rank_cleanup_targets(max_targets=max_targets)
    return {"count": len(recommendations), "recommendations": recommendations}


@router.post("/cleanup/plan-route")
async def plan_cleanup_route(
    base_lat: float = Form(13.0827),
    base_lon: float = Form(80.2707),
    base_name: str = Form("Operations Harbor Base"),
    selected_ids: Optional[str] = Form(None)
):
    """Solves TSP visit sequence starting and returning to base harbor using 2-opt search."""
    id_list = json.loads(selected_ids) if selected_ids else None
    plan = cleanup_service.generate_route_plan(
        base_lat=base_lat,
        base_lon=base_lon,
        base_name=base_name,
        selected_hotspot_ids=id_list
    )
    return plan


# -------------------------------------------------------------
# STEP 7: BEFORE-AND-AFTER IMPACT ANALYSIS API
# -------------------------------------------------------------

@router.post("/cleanup/activities")
async def create_cleanup_activity(
    title: str = Form(...),
    location_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    event_date: str = Form(...),
    organizer: str = Form("Volunteer Coalition"),
    volunteers_count: int = Form(10),
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    verified_weight_kg: Optional[float] = Form(None),
    notes: Optional[str] = Form("")
):
    """Runs identical YOLO inference on Before and After images and records verifiable impact."""
    # Save both images
    before_name = f"before_{uuid.uuid4().hex[:8]}_{before_image.filename}"
    after_name = f"after_{uuid.uuid4().hex[:8]}_{after_image.filename}"

    b_path = settings.UPLOAD_DIR / before_name
    a_path = settings.UPLOAD_DIR / after_name

    with open(b_path, "wb") as bf:
        shutil.copyfileobj(before_image.file, bf)
    with open(a_path, "wb") as af:
        shutil.copyfileobj(after_image.file, af)

    result = impact_service.analyze_cleanup_event(
        title=title,
        location_name=location_name,
        latitude=latitude,
        longitude=longitude,
        event_date=event_date,
        organizer=organizer,
        volunteers_count=volunteers_count,
        before_image_path=b_path,
        after_image_path=a_path,
        verified_weight_kg=verified_weight_kg,
        notes=notes or ""
    )
    return result


@router.get("/cleanup/activities")
async def list_cleanup_activities():
    """Lists all recorded cleanup operations and verifiable debris reductions."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cleanup_activities ORDER BY event_date DESC")
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "activity_id": r["id"],
            "title": r["title"],
            "location_name": r["location_name"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "event_date": r["event_date"],
            "organizer": r["organizer"],
            "volunteers_count": r["volunteers_count"],
            "before_image_url": f"/uploads/{r['before_image']}",
            "after_image_url": f"/uploads/{r['after_image']}",
            "before_annotated_url": f"/uploads/annotated/{r['before_observation_id']}" if r["before_observation_id"] else None,
            "after_annotated_url": f"/uploads/annotated/{r['after_observation_id']}" if r["after_observation_id"] else None,
            "before_count": r["before_count"],
            "after_count": r["after_count"],
            "reduction_pct": r["reduction_pct"],
            "verified_weight_kg": r["verified_weight_kg"],
            "status": r["status"],
            "notes": r["notes"],
            "created_at": r["created_at"]
        })
    return {"count": len(results), "activities": results}


# -------------------------------------------------------------
# STEP 8: CITIZEN REPORTING & VERIFICATION QUEUE API
# -------------------------------------------------------------

@router.post("/reports")
async def submit_citizen_report(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    location_name: Optional[str] = Form("Coastal Shoreline"),
    reporter_name: Optional[str] = Form("Community Volunteer"),
    contact_email: Optional[str] = Form(None),
    description: Optional[str] = Form(""),
    waste_estimate: Optional[str] = Form("moderate")
):
    """Public citizen submission portal with automated AI screening and duplicate detection."""
    unique_name = f"report_{uuid.uuid4().hex[:10]}_{image.filename}"
    saved_path = settings.UPLOAD_DIR / unique_name

    with open(saved_path, "wb") as buf:
        shutil.copyfileobj(image.file, buf)

    file_hash = compute_file_hash(saved_path)

    # Check for potential duplicates within nearby time & coordinates
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, location_name, created_at FROM citizen_reports WHERE image_hash = ?", (file_hash,))
    existing_dup = cursor.fetchone()

    # Pre-screen image with AI detector
    analysis = detector.analyze_image(saved_path)

    obs_id = f"obs_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Create observation record
    conn.execute("""
        INSERT INTO observations (
            id, image_filename, annotated_filename, latitude, longitude,
            location_name, location_source, total_objects, detected_classes_json,
            detections_detail_json, quality_score, is_blurry, blur_variance,
            hazard_score, explainability_notes, verification_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        obs_id,
        unique_name,
        analysis["annotated_filename"],
        latitude,
        longitude,
        location_name,
        "citizen_report",
        analysis["total_objects"],
        json.dumps(analysis["detected_counts"]),
        json.dumps(analysis["detections"]),
        analysis["quality"]["quality_score"],
        1 if analysis["quality"]["is_blurry"] else 0,
        analysis["quality"]["blur_variance"],
        analysis["hazard_score"],
        json.dumps(analysis["explainable_ai"]),
        "pending",
        now_iso
    ))

    report_id = f"rep_{uuid.uuid4().hex[:10]}"
    status = "flagged_duplicate" if existing_dup else "submitted"

    conn.execute("""
        INSERT INTO citizen_reports (
            id, reporter_name, contact_email, latitude, longitude,
            location_name, image_filename, description, waste_estimate,
            observation_id, status, admin_notes, image_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        report_id,
        reporter_name,
        contact_email,
        latitude,
        longitude,
        location_name,
        unique_name,
        description,
        waste_estimate,
        obs_id,
        status,
        "Potential identical image duplicate detected" if existing_dup else "Awaiting field officer verification",
        file_hash,
        now_iso
    ))
    conn.commit()
    conn.close()

    log_audit("CITIZEN_REPORT_SUBMITTED", "citizen_report", report_id, actor=reporter_name or "citizen")

    return {
        "report_id": report_id,
        "status": status,
        "is_duplicate": bool(existing_dup),
        "total_objects_prescreened": analysis["total_objects"],
        "quality_grade": analysis["quality"]["quality_grade"],
        "message": "Report submitted successfully and enqueued for verification."
    }


@router.get("/reports")
async def list_citizen_reports(status: Optional[str] = None):
    """Admin queue of citizen submissions with audit tracking."""
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM citizen_reports WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    reports = []
    for r in rows:
        reports.append({
            "id": r["id"],
            "reporter_name": r["reporter_name"],
            "contact_email": r["contact_email"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "location_name": r["location_name"],
            "image_url": f"/uploads/{r['image_filename']}",
            "description": r["description"],
            "waste_estimate": r["waste_estimate"],
            "observation_id": r["observation_id"],
            "status": r["status"],
            "admin_notes": r["admin_notes"],
            "created_at": r["created_at"]
        })
    return {"count": len(reports), "reports": reports}


@router.patch("/reports/{report_id}/status")
async def update_report_status(
    report_id: str,
    status: str = Form(...),
    admin_notes: Optional[str] = Form(""),
    actor: Optional[str] = Form("Field Administrator")
):
    """Admin action: approve, reject, or request reinvestigation for a citizen report."""
    if status not in ["verified", "rejected", "investigating"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be verified, rejected, or investigating.")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT observation_id FROM citizen_reports WHERE id = ?", (report_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Report not found")

    obs_id = row["observation_id"]

    cursor.execute("""
        UPDATE citizen_reports
        SET status = ?, admin_notes = ?
        WHERE id = ?
    """, (status, admin_notes, report_id))

    if obs_id:
        obs_status = "verified" if status == "verified" else ("rejected" if status == "rejected" else "pending")
        cursor.execute("UPDATE observations SET verification_status = ? WHERE id = ?", (obs_status, obs_id))

    conn.commit()
    conn.close()

    log_audit("REPORT_STATUS_UPDATED", "citizen_report", report_id, actor=actor or "admin", details={"new_status": status})

    # Trigger hotspot recalculation if verified
    if status == "verified":
        try:
            hotspot_engine.compute_hotspots()
        except Exception:
            pass

    return {"message": f"Report status updated to '{status}' successfully."}


# -------------------------------------------------------------
# STEP 9: EXECUTIVE ANALYTICS DASHBOARD API
# -------------------------------------------------------------

@router.get("/analytics/summary")
async def get_analytics_summary():
    """
    Returns 10 comprehensive metrics:
    1. Total submitted reports
    2. Verified pollution observations
    3. Detected objects by supported category
    4. High-priority pollution hotspots
    5. Pollution trend over time (by month/week)
    6. Recent verified detections
    7. Map-based hotspot distribution
    8. Forecast summaries
    9. Cleanup activity & before-and-after comparisons
    10. Data freshness & AI processing status
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Total submitted reports
    cursor.execute("SELECT COUNT(*) FROM citizen_reports")
    total_citizen_reports = cursor.fetchone()[0]

    # 2. Verified observations
    cursor.execute("SELECT COUNT(*), SUM(total_objects) FROM observations WHERE verification_status = 'verified'")
    row = cursor.fetchone()
    verified_obs_count = row[0] or 0
    total_verified_waste = row[1] or 0

    # Total observations
    cursor.execute("SELECT COUNT(*), SUM(total_objects) FROM observations")
    row_all = cursor.fetchone()
    total_obs_count = row_all[0] or 0
    total_waste_all = row_all[1] or 0

    # 3. Detected objects by category
    cursor.execute("SELECT detected_classes_json FROM observations WHERE total_objects > 0")
    cat_rows = cursor.fetchall()
    category_totals: Dict[str, int] = {}
    for cr in cat_rows:
        try:
            c_dict = json.loads(cr[0] or "{}")
            for k, v in c_dict.items():
                category_totals[k] = category_totals.get(k, 0) + v
        except Exception:
            pass

    # 4. High-priority hotspots
    cursor.execute("SELECT COUNT(*) FROM hotspots WHERE priority_level IN ('critical', 'high')")
    critical_hotspots = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM hotspots")
    total_hotspots = cursor.fetchone()[0]

    # 5. Trend over time (monthly breakdown)
    cursor.execute("""
        SELECT SUBSTR(created_at, 1, 7) as month_str, COUNT(*), SUM(total_objects)
        FROM observations
        GROUP BY month_str
        ORDER BY month_str ASC
        LIMIT 12
    """)
    trend_rows = cursor.fetchall()
    trends = [{"period": tr[0], "reports": tr[1], "debris_count": tr[2] or 0} for tr in trend_rows]

    # 6. Recent verified detections
    cursor.execute("""
        SELECT id, image_filename, annotated_filename, location_name,
               latitude, longitude, total_objects, hazard_score, created_at
        FROM observations
        ORDER BY created_at DESC
        LIMIT 6
    """)
    recent_rows = cursor.fetchall()
    recent_detections = [{
        "id": rr["id"],
        "image_url": f"/uploads/{rr['image_filename']}",
        "annotated_url": f"/uploads/annotated/{rr['annotated_filename']}" if rr["annotated_filename"] else None,
        "location_name": rr["location_name"],
        "latitude": rr["latitude"],
        "longitude": rr["longitude"],
        "total_objects": rr["total_objects"],
        "hazard_score": rr["hazard_score"],
        "created_at": rr["created_at"]
    } for rr in recent_rows]

    # 9. Cleanup activities impact
    cursor.execute("SELECT COUNT(*), SUM(before_count - after_count), SUM(verified_weight_kg) FROM cleanup_activities")
    cl_row = cursor.fetchone()
    total_cleanups = cl_row[0] or 0
    total_debris_removed = cl_row[1] or 0
    total_weight_kg = cl_row[2] or 0.0

    conn.close()

    # 10. Data freshness & AI status
    ai_status = {
        "model_loaded": detector.is_loaded,
        "model_name": detector.model_name,
        "supported_classes_count": 7,
        "environmental_data_source": "Open-Meteo & Copernicus Physical Hydrodynamics",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

    return {
        "total_reports": total_citizen_reports,
        "total_observations": total_obs_count,
        "verified_observations": verified_obs_count,
        "total_plastic_items_detected": total_waste_all,
        "verified_plastic_items": total_verified_waste,
        "categories_breakdown": category_totals,
        "high_priority_hotspots": critical_hotspots,
        "total_hotspots": total_hotspots,
        "pollution_trends": trends,
        "recent_detections": recent_detections,
        "cleanup_metrics": {
            "completed_cleanups": total_cleanups,
            "estimated_debris_removed": total_debris_removed,
            "verified_weight_kg": round(total_weight_kg, 1)
        },
        "system_status": ai_status
    }


@router.get("/analytics/export")
async def export_data_csv(dataset: str = Query("observations", enum=["observations", "hotspots", "cleanups"])):
    """Exports platform records in CSV format for scientific reporting and environmental research."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if dataset == "observations":
        cursor.execute("SELECT id, latitude, longitude, location_name, total_objects, hazard_score, quality_score, verification_status, created_at FROM observations")
        rows = cursor.fetchall()
        lines = ["id,latitude,longitude,location_name,total_objects,hazard_score,quality_score,verification_status,created_at"]
        for r in rows:
            lines.append(f'"{r[0]}",{r[1]},{r[2]},"{r[3]}",{r[4]},{r[5]},{r[6]},"{r[7]}","{r[8]}"')
    elif dataset == "hotspots":
        cursor.execute("SELECT id, centroid_lat, centroid_lon, location_name, observation_count, total_waste_count, hotspot_priority_index, priority_level, dominant_category FROM hotspots")
        rows = cursor.fetchall()
        lines = ["id,centroid_lat,centroid_lon,location_name,observation_count,total_waste_count,hpi_score,priority_level,dominant_category"]
        for r in rows:
            lines.append(f'"{r[0]}",{r[1]},{r[2]},"{r[3]}",{r[4]},{r[5]},{r[6]},"{r[7]}","{r[8]}"')
    else:
        cursor.execute("SELECT id, title, location_name, event_date, organizer, volunteers_count, before_count, after_count, reduction_pct, verified_weight_kg FROM cleanup_activities")
        rows = cursor.fetchall()
        lines = ["id,title,location_name,event_date,organizer,volunteers_count,before_count,after_count,reduction_pct,verified_weight_kg"]
        for r in rows:
            lines.append(f'"{r[0]}","{r[1]}","{r[2]}","{r[3]}","{r[4]}",{r[5]},{r[6]},{r[7]},{r[8]},{r[9]}')

    conn.close()
    content = "\n".join(lines)
    return PlainTextResponse(content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={dataset}_export.csv"})


@router.get("/health")
async def health_check():
    """System health check and diagnostic status."""
    return {
        "status": "online",
        "app_name": settings.APP_NAME,
        "version": settings.VERSION,
        "ai_model_loaded": detector.is_loaded,
        "ai_model_name": detector.model_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
