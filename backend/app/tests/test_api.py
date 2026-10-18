import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from main import app
from app.ai.detector import MarinePlasticDetector
from app.geospatial.hotspot_engine import HotspotIntelligenceEngine, haversine_distance_km
from app.geospatial.drift_predictor import PlasticDriftPredictor
from app.services.cleanup_optimizer import CleanupOptimizationService

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "AquaTrace" in data["app_name"]


def test_analytics_summary_endpoint():
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_observations" in data
    assert "total_hotspots" in data
    assert "categories_breakdown" in data
    assert data["total_observations"] >= 6


def test_hotspots_list_endpoint():
    response = client.get("/api/hotspots")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert len(data["hotspots"]) >= 1
    first_hotspot = data["hotspots"][0]
    assert "centroid_lat" in first_hotspot
    assert "hotspot_priority_index" in first_hotspot
    assert first_hotspot["hotspot_priority_index"] >= 0.0


def test_detections_list_endpoint():
    response = client.get("/api/detections")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    first_det = data["detections"][0]
    assert "latitude" in first_det
    assert "total_objects" in first_det


def test_haversine_distance():
    # Marina Beach (13.0500, 80.2824) to Besant Nagar (12.9982, 80.2721) ~ 5.8 km
    dist = haversine_distance_km(13.0500, 80.2824, 12.9982, 80.2721)
    assert 5.0 <= dist <= 7.0


def test_hpi_scoring():
    engine = HotspotIntelligenceEngine()
    # High volume, recent sighting, critical hazard (fishing gear)
    hpi, level, explanation = engine.calculate_hpi_score(
        total_waste_count=25,
        observation_count=3,
        days_since_last_obs=1.0,
        dominant_hazard_weight=2.0
    )
    assert 60.0 <= hpi <= 100.0
    assert level in ["high", "critical"]
    assert "HPI" in explanation


def test_drift_predictor():
    predictor = PlasticDriftPredictor()
    result = predictor.predict_drift(
        observation_id="test_obs_001",
        start_lat=13.0500,
        start_lon=80.2824,
        horizon_hours=24
    )
    assert result["observation_id"] == "test_obs_001"
    assert len(result["trajectory"]) >= 4
    assert "uncertainty_cone_geojson" in result
    assert result["summary"]["final_beaching_risk_pct"] >= 0.0


def test_cleanup_route_planner():
    service = CleanupOptimizationService()
    plan = service.generate_route_plan(
        base_lat=13.0827,
        base_lon=80.2707,
        base_name="Chennai Operations Base"
    )
    assert plan["total_stops"] >= 1
    assert plan["total_distance_km"] > 0.0
    assert len(plan["ordered_locations"]) == plan["total_stops"]
    assert len(plan["route_polyline"]) >= plan["total_stops"] + 1


def test_csv_export():
    response = client.get("/api/analytics/export?dataset=observations")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "latitude,longitude" in response.text
