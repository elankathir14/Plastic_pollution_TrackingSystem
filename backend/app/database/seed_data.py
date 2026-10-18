import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.core.config import settings
from app.database.db import get_db_connection, init_db
from app.geospatial.hotspot_engine import HotspotIntelligenceEngine

logger = logging.getLogger("aquatrace.seed")


def seed_sample_data():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM observations")
    count = cursor.fetchone()[0]
    if count > 0:
        logger.info(f"Database already contains {count} observations. Skipping seed.")
        conn.close()
        return

    logger.info("Seeding realistic coastal marine pollution records...")
    now = datetime.now(timezone.utc)

    # Real coastal monitoring locations along Coromandel & Gulf of Mannar
    seed_records = [
        {
            "id": "obs_marina_001",
            "image_filename": "seed_marina_bottles.jpg",
            "annotated_filename": "seed_marina_bottles_annotated.jpg",
            "latitude": 13.0500,
            "longitude": 80.2824,
            "location_name": "Marina Beach South Shoreline, Chennai",
            "location_source": "exif_gps",
            "total_objects": 8,
            "classes": {"plastic_bottle": 5, "food_container": 2, "plastic_bag": 1},
            "hazard_score": 78.5,
            "quality_score": 0.88,
            "is_blurry": 0,
            "blur_variance": 142.3,
            "days_ago": 1.2
        },
        {
            "id": "obs_marina_002",
            "image_filename": "seed_marina_debris.jpg",
            "annotated_filename": "seed_marina_debris_annotated.jpg",
            "latitude": 13.0535,
            "longitude": 80.2840,
            "location_name": "Marina Lighthouse Fishermen Cove, Chennai",
            "location_source": "exif_gps",
            "total_objects": 12,
            "classes": {"plastic_bottle": 7, "plastic_bag": 3, "fishing_gear": 2},
            "hazard_score": 92.0,
            "quality_score": 0.91,
            "is_blurry": 0,
            "blur_variance": 165.8,
            "days_ago": 2.5
        },
        {
            "id": "obs_besant_001",
            "image_filename": "seed_besant_shore.jpg",
            "annotated_filename": "seed_besant_shore_annotated.jpg",
            "latitude": 12.9982,
            "longitude": 80.2721,
            "location_name": "Besant Nagar (Elliot's Beach) Tidal Line",
            "location_source": "exif_gps",
            "total_objects": 6,
            "classes": {"food_container": 3, "plastic_bottle": 2, "plastic_bag": 1},
            "hazard_score": 54.0,
            "quality_score": 0.82,
            "is_blurry": 0,
            "blur_variance": 118.0,
            "days_ago": 3.1
        },
        {
            "id": "obs_ennore_001",
            "image_filename": "seed_ennore_estuary.jpg",
            "annotated_filename": "seed_ennore_estuary_annotated.jpg",
            "latitude": 13.2312,
            "longitude": 80.3298,
            "location_name": "Ennore Creek Estuary Tidal Mouth",
            "location_source": "exif_gps",
            "total_objects": 19,
            "classes": {"fishing_gear": 6, "plastic_fragment": 8, "plastic_bottle": 5},
            "hazard_score": 96.5,
            "quality_score": 0.79,
            "is_blurry": 0,
            "blur_variance": 95.4,
            "days_ago": 4.0
        },
        {
            "id": "obs_kovalam_001",
            "image_filename": "seed_kovalam_cove.jpg",
            "annotated_filename": "seed_kovalam_cove_annotated.jpg",
            "latitude": 12.7885,
            "longitude": 80.2520,
            "location_name": "Kovalam Surf Point & Rocky Headland",
            "location_source": "manual_picker",
            "total_objects": 4,
            "classes": {"plastic_bottle": 2, "beverage_can": 1, "plastic_bag": 1},
            "hazard_score": 42.0,
            "quality_score": 0.85,
            "is_blurry": 0,
            "blur_variance": 130.0,
            "days_ago": 5.8
        },
        {
            "id": "obs_mannar_001",
            "image_filename": "seed_mannar_reef.jpg",
            "annotated_filename": "seed_mannar_reef_annotated.jpg",
            "latitude": 9.2831,
            "longitude": 79.1325,
            "location_name": "Gulf of Mannar Biosphere Marine Reserve (Mandapam)",
            "location_source": "exif_gps",
            "total_objects": 15,
            "classes": {"fishing_gear": 7, "plastic_bag": 5, "plastic_bottle": 3},
            "hazard_score": 98.0,
            "quality_score": 0.94,
            "is_blurry": 0,
            "blur_variance": 180.2,
            "days_ago": 6.5
        }
    ]

    for rec in seed_records:
        created_dt = now - timedelta(days=rec["days_ago"])
        explain_ai = {
            "model_name": "YOLOv8-Marine-v1.0",
            "inference_time_ms": 42.5,
            "confidence_threshold_used": 0.28,
            "total_candidates_analyzed": rec["total_objects"] + 4,
            "detected_count": rec["total_objects"],
            "key_factors": [
                f"High confidence visual cluster of {rec['total_objects']} debris items.",
                f"Hazard score {rec['hazard_score']}/100 based on persistent non-biodegradable polymers."
            ],
            "reliability_assessment": "High (verified field GPS capture)",
            "model_limitations": ["Turbid coastal surf and sand coverage may conceal smaller fragments."]
        }

        # Create dummy detection boxes
        dummy_boxes = []
        for cat_k, cnt in rec["classes"].items():
            for i in range(cnt):
                dummy_boxes.append({
                    "x1": 50 + i * 40,
                    "y1": 60 + i * 30,
                    "x2": 150 + i * 40,
                    "y2": 180 + i * 30,
                    "confidence": round(0.75 + (i % 4) * 0.05, 2),
                    "class_id": 0,
                    "class_name": cat_k,
                    "display_name": cat_k.replace("_", " ").title(),
                    "display_name_ta": cat_k,
                    "hazard_level": "high" if cat_k in ["fishing_gear", "plastic_bag"] else "medium",
                    "hazard_weight": 1.6 if cat_k == "fishing_gear" else 1.2,
                    "decomposition_years": 450,
                    "color_hex": "#06b6d4" if "bottle" in cat_k else "#ef4444"
                })

        cursor.execute("""
            INSERT INTO observations (
                id, image_filename, annotated_filename, latitude, longitude,
                location_name, location_source, total_objects, detected_classes_json,
                detections_detail_json, quality_score, is_blurry, blur_variance,
                hazard_score, explainability_notes, verification_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rec["id"],
            rec["image_filename"],
            rec["annotated_filename"],
            rec["latitude"],
            rec["longitude"],
            rec["location_name"],
            rec["location_source"],
            rec["total_objects"],
            json.dumps(rec["classes"]),
            json.dumps(dummy_boxes),
            rec["quality_score"],
            rec["is_blurry"],
            rec["blur_variance"],
            rec["hazard_score"],
            json.dumps(explain_ai),
            "verified",
            created_dt.isoformat()
        ))

    # Seed verified cleanup activities
    cleanups = [
        {
            "id": "clean_001",
            "title": "Marina Beach Youth Coastal Restoration",
            "location_name": "Marina Beach North Promenade, Chennai",
            "latitude": 13.0601,
            "longitude": 80.2855,
            "event_date": (now - timedelta(days=10)).strftime("%Y-%m-%d"),
            "organizer": "Bay Conservation Volunteers & Student League",
            "volunteers_count": 45,
            "before_count": 38,
            "after_count": 4,
            "reduction_pct": 89.5,
            "verified_weight_kg": 184.5,
            "notes": "Collected predominantly PET beverage bottles and takeout food containers along the high-tide wrack line."
        },
        {
            "id": "clean_002",
            "title": "Ghost Gear Removal & Mangrove Protection",
            "location_name": "Ennore Creek Backwaters",
            "latitude": 13.2250,
            "longitude": 80.3200,
            "event_date": (now - timedelta(days=18)).strftime("%Y-%m-%d"),
            "organizer": "Artisanal Fishermen Guild & Marine Rescue",
            "volunteers_count": 22,
            "before_count": 26,
            "after_count": 3,
            "reduction_pct": 88.5,
            "verified_weight_kg": 340.0,
            "notes": "Retrieved 4 heavy tangled monofilament gillnets smothering young mangrove roots."
        }
    ]

    for c in cleanups:
        cursor.execute("""
            INSERT INTO cleanup_activities (
                id, title, location_name, latitude, longitude, event_date,
                organizer, volunteers_count, before_image, after_image,
                before_observation_id, after_observation_id, before_count,
                after_count, reduction_pct, verified_weight_kg, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["id"], c["title"], c["location_name"], c["latitude"], c["longitude"],
            c["event_date"], c["organizer"], c["volunteers_count"],
            "seed_clean_before.jpg", "seed_clean_after.jpg",
            "obs_seed_before", "obs_seed_after",
            c["before_count"], c["after_count"], c["reduction_pct"],
            c["verified_weight_kg"], "completed", c["notes"],
            (now - timedelta(days=5)).isoformat()
        ))

    # Seed citizen reports
    reports = [
        {
            "id": "rep_001",
            "reporter_name": "Karthik Subramanian",
            "contact_email": "karthik.sub@gmail.com",
            "latitude": 13.0489,
            "longitude": 80.2831,
            "location_name": "Marina Beach Promenade (Behind Gandhi Statue)",
            "image_filename": "seed_report_bottles.jpg",
            "description": "Large accumulation of single-use water bottles and snack packaging left after Sunday evening gathering.",
            "waste_estimate": "heavy",
            "observation_id": "obs_marina_001",
            "status": "verified",
            "admin_notes": "Verified by coastal ranger patrol on Oct 16.",
            "days_ago": 1.5
        },
        {
            "id": "rep_002",
            "reporter_name": "Priya Ramesh",
            "contact_email": "priya.marinediver@outlook.com",
            "latitude": 12.9850,
            "longitude": 80.2640,
            "location_name": "Thiruvanmiyur Coastal Rocks",
            "image_filename": "seed_report_nets.jpg",
            "description": "Ghost fishing net trapped on submerged littoral rocks endangering local olive ridley sea turtle nesting path.",
            "waste_estimate": "critical",
            "observation_id": "obs_besant_001",
            "status": "investigating",
            "admin_notes": "Rapid response dive crew scheduled for dispatch.",
            "days_ago": 0.8
        }
    ]

    for rep in reports:
        cursor.execute("""
            INSERT INTO citizen_reports (
                id, reporter_name, contact_email, latitude, longitude,
                location_name, image_filename, description, waste_estimate,
                observation_id, status, admin_notes, image_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rep["id"], rep["reporter_name"], rep["contact_email"],
            rep["latitude"], rep["longitude"], rep["location_name"],
            rep["image_filename"], rep["description"], rep["waste_estimate"],
            rep["observation_id"], rep["status"], rep["admin_notes"],
            f"hash_{rep['id']}", (now - timedelta(days=rep["days_ago"])).isoformat()
        ))

    conn.commit()
    conn.close()
    logger.info("Sample coastal data seeded successfully.")

    # Run hotspot clustering on seed data
    engine = HotspotIntelligenceEngine(eps_km=settings.DBSCAN_EPS_KM, min_samples=1)
    engine.compute_hotspots()
    logger.info("Hotspot clusters computed and synchronized.")


if __name__ == "__main__":
    seed_sample_data()
