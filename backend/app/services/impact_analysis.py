import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any

from app.ai.detector import MarinePlasticDetector
from app.database.db import get_db_connection, log_audit

logger = logging.getLogger("aquatrace.impact")


class CleanupImpactService:
    """
    Performs comparative Before-and-After cleanup analysis, runs identical
    YOLO inference workflows on both images, computes absolute and percentage
    reduction metrics, and stores verified cleanup milestones.
    """

    def __init__(self):
        self.detector = MarinePlasticDetector()

    def analyze_cleanup_event(
        self,
        title: str,
        location_name: str,
        latitude: float,
        longitude: float,
        event_date: str,
        organizer: str,
        volunteers_count: int,
        before_image_path: Path,
        after_image_path: Path,
        verified_weight_kg: Optional[float] = None,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Runs identical AI computer vision inference on both Before and After images,
        generates side-by-side metrics, and saves the verified record to the database.
        """
        # Run inference on before image
        before_result = self.detector.analyze_image(before_image_path)
        # Run inference on after image
        after_result = self.detector.analyze_image(after_image_path)

        before_total = before_result["total_objects"]
        after_total = after_result["total_objects"]
        abs_reduction = max(0, before_total - after_total)

        if before_total > 0:
            pct_reduction = round((abs_reduction / before_total) * 100.0, 1)
        else:
            pct_reduction = 100.0 if after_total == 0 else 0.0

        if pct_reduction >= 80.0:
            rating = "Exceptional Cleanliness Restored"
        elif pct_reduction >= 50.0:
            rating = "Substantial Debris Reduction"
        elif pct_reduction > 0.0:
            rating = "Moderate Site Improvement"
        else:
            rating = "Residual Debris Remaining"

        activity_id = f"cleanup_{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = get_db_connection()
        conn.execute("""
            INSERT INTO cleanup_activities (
                id, title, location_name, latitude, longitude, event_date,
                organizer, volunteers_count, before_image, after_image,
                before_observation_id, after_observation_id, before_count,
                after_count, reduction_pct, verified_weight_kg, status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity_id,
            title,
            location_name,
            latitude,
            longitude,
            event_date,
            organizer,
            volunteers_count,
            before_image_path.name,
            after_image_path.name,
            before_result["annotated_filename"],
            after_result["annotated_filename"],
            before_total,
            after_total,
            pct_reduction,
            verified_weight_kg or 0.0,
            "completed",
            notes,
            now_iso
        ))
        conn.commit()
        conn.close()

        log_audit(
            action="CLEANUP_ANALYSIS_COMPLETED",
            entity_type="cleanup_activity",
            entity_id=activity_id,
            actor=organizer or "Operations Team",
            details={"pct_reduction": pct_reduction, "abs_reduction": abs_reduction, "weight_kg": verified_weight_kg}
        )

        disclaimer = (
            "Scientific Validation Notice: Count differentials represent automated image-based estimations. "
            "Variation in camera perspective, illumination, tidal shifts, and sand burial may affect visual debris counts. "
            "Reported waste weight (kg) provides the ground-truth physical metric."
        )

        return {
            "activity_id": activity_id,
            "title": title,
            "location_name": location_name,
            "event_date": event_date,
            "organizer": organizer,
            "volunteers_count": volunteers_count,
            "before_image_url": f"/uploads/{before_image_path.name}",
            "after_image_url": f"/uploads/{after_image_path.name}",
            "before_annotated_url": before_result["annotated_url"],
            "after_annotated_url": after_result["annotated_url"],
            "before_counts": before_result["detected_counts"],
            "after_counts": after_result["detected_counts"],
            "before_total": before_total,
            "after_total": after_total,
            "absolute_reduction": abs_reduction,
            "percentage_reduction": pct_reduction,
            "verified_weight_kg": verified_weight_kg,
            "effectiveness_rating": rating,
            "audit_notes": notes,
            "disclaimer": disclaimer,
            "created_at": now_iso
        }
