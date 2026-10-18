import json
import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any

from app.database.db import get_db_connection
from app.geospatial.hotspot_engine import haversine_distance_km

logger = logging.getLogger("aquatrace.cleanup")


class CleanupOptimizationService:
    """
    Ranks cleanup target locations and calculates optimal route visit sequences
    using multi-criteria decision analysis (MCDA) and a 2-opt TSP route solver.
    """

    def rank_cleanup_targets(self, max_targets: int = 8) -> List[Dict[str, Any]]:
        """
        Retrieves active hotspots and uncleaned observations to produce prioritized
        cleanup recommendations with transparent justifications.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, location_name, centroid_lat, centroid_lon, observation_count,
                   total_waste_count, hotspot_priority_index, priority_level,
                   dominant_category, explanation
            FROM hotspots
            ORDER BY hotspot_priority_index DESC
            LIMIT ?
        """, (max_targets,))
        hotspots = cursor.fetchall()
        conn.close()

        recommendations = []
        for idx, h in enumerate(hotspots, start=1):
            dom_cat = h["dominant_category"] or "other_marine_litter"

            # Determine equipment recommendations based on debris type
            equipment = ["Heavy-duty puncture-resistant gloves", "High-capacity woven canvas bags", "Safety footwear"]
            if dom_cat == "fishing_gear":
                equipment.extend(["Marine line cutters / shears", "Grappling hooks", "Tackle winches"])
            elif dom_cat in ["food_container", "plastic_fragment"]:
                equipment.extend(["Sieves / sand rakes for micro-fragments", "Dust respirators"])
            elif dom_cat == "plastic_bottle":
                equipment.append("Portable bag compactors")

            recommendations.append({
                "rank": idx,
                "hotspot_id": h["id"],
                "location_name": h["location_name"],
                "latitude": h["centroid_lat"],
                "longitude": h["centroid_lon"],
                "priority_score": h["hotspot_priority_index"],
                "urgency_level": h["priority_level"],
                "total_waste_count": h["total_waste_count"],
                "dominant_waste": dom_cat,
                "hazard_profile": f"Dominant: {dom_cat.replace('_', ' ').title()}",
                "drift_risk_impact": "High coastal dispersion risk" if h["hotspot_priority_index"] > 60 else "Moderate localized retention",
                "estimated_distance_from_base_km": 0.0,
                "suggested_equipment": equipment,
                "justification": h["explanation"]
            })

        return recommendations

    def generate_route_plan(
        self,
        base_lat: float,
        base_lon: float,
        base_name: str = "Regional Cleanup Operations Base",
        selected_hotspot_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculates an efficient visit order starting from base depot using
        a Nearest Neighbor + 2-Opt local search TSP algorithm.
        Distances are computed purely using Great-Circle Haversine calculations.
        """
        all_targets = self.rank_cleanup_targets(max_targets=12)
        if selected_hotspot_ids:
            targets = [t for t in all_targets if t["hotspot_id"] in selected_hotspot_ids]
        else:
            targets = all_targets[:6]

        if not targets:
            return {
                "plan_id": f"plan_{uuid.uuid4().hex[:8]}",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "base_location": {"name": base_name, "latitude": base_lat, "longitude": base_lon},
                "total_stops": 0,
                "total_distance_km": 0.0,
                "ordered_locations": [],
                "route_polyline": [[base_lat, base_lon]],
                "methodology": "No active targets selected."
            }

        # Build list of points: 0 is Base, 1..N are targets
        points = [{"name": base_name, "lat": base_lat, "lon": base_lon, "data": None}]
        for t in targets:
            points.append({
                "name": t["location_name"],
                "lat": t["latitude"],
                "lon": t["longitude"],
                "data": t
            })

        n = len(points)
        # Compute pairwise distance matrix
        dist_matrix = [[0.0] * n for _ in range(n)]
        for i in range(n):
            for j in range(n):
                if i != j:
                    dist_matrix[i][j] = haversine_distance_km(
                        points[i]["lat"], points[i]["lon"],
                        points[j]["lat"], points[j]["lon"]
                    )

        # Nearest Neighbor Heuristic starting from Base (0)
        unvisited = set(range(1, n))
        current = 0
        tour = [0]

        while unvisited:
            next_node = min(unvisited, key=lambda node: dist_matrix[current][node])
            tour.append(next_node)
            unvisited.remove(next_node)
            current = next_node

        # 2-Opt Improvement
        improved = True
        while improved:
            improved = False
            for i in range(1, len(tour) - 1):
                for j in range(i + 1, len(tour)):
                    if j - i == 1:
                        continue
                    old_dist = dist_matrix[tour[i - 1]][tour[i]] + dist_matrix[tour[j]][tour[(j + 1) % len(tour)] if j + 1 < len(tour) else 0]
                    new_dist = dist_matrix[tour[i - 1]][tour[j]] + dist_matrix[tour[i]][tour[(j + 1) % len(tour)] if j + 1 < len(tour) else 0]
                    if new_dist < old_dist - 0.001:
                        tour[i:j + 1] = reversed(tour[i:j + 1])
                        improved = True

        # Calculate final distances and build response
        ordered_stops = []
        total_dist_km = 0.0
        route_polyline = [[base_lat, base_lon]]

        prev_node = 0
        for rank_idx, node_idx in enumerate(tour[1:], start=1):
            leg_km = dist_matrix[prev_node][node_idx]
            total_dist_km += leg_km
            target_data = points[node_idx]["data"]
            target_data["rank"] = rank_idx
            target_data["estimated_distance_from_base_km"] = round(dist_matrix[0][node_idx], 2)
            target_data["leg_distance_km"] = round(leg_km, 2)
            ordered_stops.append(target_data)
            route_polyline.append([points[node_idx]["lat"], points[node_idx]["lon"]])
            prev_node = node_idx

        # Return to base closing leg
        return_leg_km = dist_matrix[prev_node][0]
        total_dist_km += return_leg_km
        route_polyline.append([base_lat, base_lon])

        return {
            "plan_id": f"plan_{uuid.uuid4().hex[:8]}",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "base_location": {
                "name": base_name,
                "latitude": round(base_lat, 6),
                "longitude": round(base_lon, 6)
            },
            "total_stops": len(ordered_stops),
            "total_distance_km": round(total_dist_km, 2),
            "ordered_locations": ordered_stops,
            "route_polyline": route_polyline,
            "methodology": "Geodesic Great-Circle distance matrix solved via Nearest Neighbor + 2-Opt local search algorithm."
        }
