import json
import logging
import math
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any

import numpy as np
from sklearn.cluster import DBSCAN

from app.core.config import settings
from app.database.db import get_db_connection

logger = logging.getLogger("aquatrace.hotspot")


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two GPS coordinates in kilometers."""
    R = 6371.0  # Earth's radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


class HotspotIntelligenceEngine:
    """
    Geospatial Hotspot Analysis Engine using DBSCAN clustering,
    recency decay, debris hazard weighting, and transparent HPI scoring.
    """

    def __init__(self, eps_km: float = 2.5, min_samples: int = 2):
        self.eps_km = eps_km
        self.min_samples = min_samples

    def calculate_hpi_score(
        self,
        total_waste_count: int,
        observation_count: int,
        days_since_last_obs: float,
        dominant_hazard_weight: float
    ) -> Tuple[float, str, str]:
        """
        Calculates the Hotspot Priority Index (HPI) on a 0-100 scale:
        - Waste Volume Component (35% max): log-scaled waste count
        - Recency Factor (25% max): exponential decay with 14-day half-life
        - Toxicity/Hazard Component (25% max): hazardous debris weight
        - Observation Density (15% max): confidence from multiple independent sightings
        """
        # Volume term: 0 to 35
        volume_term = min(35.0, math.log1p(total_waste_count) * 7.5)

        # Recency term: 0 to 25
        # Exponential half-life of 14 days
        recency_factor = math.exp(-0.693 * (max(0.0, days_since_last_obs) / 14.0))
        recency_term = 25.0 * recency_factor

        # Hazard term: 0 to 25 (scaled by hazard_weight which ranges from 0.8 to 2.0)
        hazard_norm = min(1.0, dominant_hazard_weight / 2.0)
        hazard_term = 25.0 * hazard_norm

        # Observation confidence term: 0 to 15
        obs_term = min(15.0, observation_count * 3.5)

        hpi = round(min(100.0, max(5.0, volume_term + recency_term + hazard_term + obs_term)), 1)

        if hpi >= 70.0:
            level = "critical"
        elif hpi >= 50.0:
            level = "high"
        elif hpi >= 30.0:
            level = "medium"
        else:
            level = "low"

        explanation = (
            f"HPI {hpi}/100 ({level.upper()}): Volume Contribution={volume_term:.1f}pts ({total_waste_count} items), "
            f"Recency Contribution={recency_term:.1f}pts ({days_since_last_obs:.1f} days ago), "
            f"Hazard Severity={hazard_term:.1f}pts, Sightings Evidence={obs_term:.1f}pts ({observation_count} reports)."
        )

        return hpi, level, explanation

    def compute_hotspots(self) -> List[Dict[str, Any]]:
        """
        Loads all verified and pending observations from the database,
        runs DBSCAN clustering, computes cluster centroids, HPI scores,
        and saves updated hotspots to the database.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, latitude, longitude, location_name, total_objects,
                   detected_classes_json, hazard_score, created_at
            FROM observations
            WHERE total_objects > 0
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()

        if not rows:
            conn.close()
            return []

        # Convert to numpy coordinate array (in radians for haversine metric)
        coords = np.array([[row["latitude"], row["longitude"]] for row in rows])
        coords_rad = np.radians(coords)

        # 6371.0 km Earth radius
        eps_rad = self.eps_km / 6371.0

        db = DBSCAN(eps=eps_rad, min_samples=self.min_samples, metric='haversine')
        cluster_labels = db.fit_predict(coords_rad)

        now = datetime.now(timezone.utc)
        clusters_dict: Dict[int, List[Dict[str, Any]]] = {}

        # Group rows by cluster label
        for idx, label in enumerate(cluster_labels):
            if label not in clusters_dict:
                clusters_dict[label] = []
            clusters_dict[label].append(rows[idx])

        # Delete existing hotspots and refresh
        cursor.execute("DELETE FROM hotspots")

        hotspots_result = []

        for cluster_id, cluster_rows in clusters_dict.items():
            lats = [r["latitude"] for r in cluster_rows]
            lons = [r["longitude"] for r in cluster_rows]
            centroid_lat = float(np.mean(lats))
            centroid_lon = float(np.mean(lons))

            # Calculate cluster radius (maximum distance to centroid)
            max_dist_m = 150.0
            for r in cluster_rows:
                dist_km = haversine_distance_km(centroid_lat, centroid_lon, r["latitude"], r["longitude"])
                max_dist_m = max(max_dist_m, dist_km * 1000.0)

            # Aggregate waste categories
            cat_counts: Dict[str, int] = {}
            total_waste = 0
            supporting_ids = []
            latest_dt = None

            for r in cluster_rows:
                supporting_ids.append(r["id"])
                total_waste += r["total_objects"]

                try:
                    c_dict = json.loads(r["detected_classes_json"] or "{}")
                    for k, v in c_dict.items():
                        cat_counts[k] = cat_counts.get(k, 0) + v
                except Exception:
                    pass

                try:
                    dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
                    if latest_dt is None or dt > latest_dt:
                        latest_dt = dt
                except Exception:
                    pass

            dominant_cat = max(cat_counts.items(), key=lambda x: x[1])[0] if cat_counts else "other_marine_litter"

            # Determine days since last observation
            if latest_dt:
                days_diff = (now - latest_dt.astimezone(timezone.utc)).total_seconds() / 86400.0
            else:
                days_diff = 1.0

            hazard_weight = 1.5 if dominant_cat in ["fishing_gear", "plastic_bag"] else 1.2
            hpi, level, explanation = self.calculate_hpi_score(
                total_waste_count=total_waste,
                observation_count=len(cluster_rows),
                days_since_last_obs=days_diff,
                dominant_hazard_weight=hazard_weight
            )

            # Location naming from nearest report
            loc_name = cluster_rows[0]["location_name"] or f"Hotspot Zone ({centroid_lat:.3f}, {centroid_lon:.3f})"
            hotspot_id = f"hotspot_{cluster_id}_{int(centroid_lat*100)}_{int(centroid_lon*100)}"

            cursor.execute("""
                INSERT INTO hotspots (
                    id, cluster_id, centroid_lat, centroid_lon, location_name,
                    observation_count, total_waste_count, hotspot_priority_index,
                    priority_level, dominant_category, category_distribution_json,
                    radius_meters, explanation, last_observed_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                hotspot_id,
                int(cluster_id),
                round(centroid_lat, 6),
                round(centroid_lon, 6),
                loc_name,
                len(cluster_rows),
                total_waste,
                hpi,
                level,
                dominant_cat,
                json.dumps(cat_counts),
                round(max_dist_m, 1),
                explanation,
                latest_dt.isoformat() if latest_dt else now.isoformat(),
                now.isoformat()
            ))

            hotspots_result.append({
                "id": hotspot_id,
                "cluster_id": int(cluster_id),
                "centroid_lat": round(centroid_lat, 6),
                "centroid_lon": round(centroid_lon, 6),
                "location_name": loc_name,
                "observation_count": len(cluster_rows),
                "total_waste_count": total_waste,
                "hotspot_priority_index": hpi,
                "priority_level": level,
                "dominant_category": dominant_cat,
                "category_distribution": cat_counts,
                "radius_meters": round(max_dist_m, 1),
                "explanation": explanation,
                "supporting_observations": supporting_ids,
                "last_observed_at": latest_dt.isoformat() if latest_dt else now.isoformat(),
                "updated_at": now.isoformat()
            })

        conn.commit()
        conn.close()

        # Sort descending by priority index
        hotspots_result.sort(key=lambda x: x["hotspot_priority_index"], reverse=True)
        return hotspots_result
