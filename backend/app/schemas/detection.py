from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_id: int
    class_name: str
    display_name: str
    display_name_ta: str
    hazard_level: str
    hazard_weight: float
    decomposition_years: int
    color_hex: str


class ImageQualityMetrics(BaseModel):
    blur_variance: float
    is_blurry: bool
    quality_score: float  # 0.0 to 1.0
    quality_grade: str   # 'optimal', 'acceptable', 'degraded'
    resolution: str
    aspect_ratio: float
    brightness_mean: float
    is_dark: bool
    is_overexposed: bool
    warnings: List[str] = []


class ExifMetadata(BaseModel):
    has_gps: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    datetime_original: Optional[str] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None


class ExplainableAIInfo(BaseModel):
    model_name: str
    model_version: str
    inference_time_ms: float
    confidence_threshold_used: float
    total_candidates_analyzed: int
    detected_count: int
    key_factors: List[str]
    reliability_assessment: str
    model_limitations: List[str]


class DetectionResult(BaseModel):
    observation_id: str
    image_url: str
    annotated_image_url: str
    latitude: float
    longitude: float
    location_name: str
    location_source: str
    total_objects: int
    detected_counts: Dict[str, int]
    hazard_score: float
    detections: List[BoundingBox]
    quality: ImageQualityMetrics
    exif: ExifMetadata
    explainable_ai: ExplainableAIInfo
    verification_status: str
    created_at: str


class HotspotCluster(BaseModel):
    id: str
    cluster_id: int
    centroid_lat: float
    centroid_lon: float
    location_name: str
    observation_count: int
    total_waste_count: int
    hotspot_priority_index: float  # 0.0 to 100.0
    priority_level: str           # 'critical', 'high', 'medium', 'low'
    dominant_category: str
    dominant_category_name: str
    category_distribution: Dict[str, int]
    radius_meters: float
    explanation: str
    supporting_observations: List[str] = []
    last_observed_at: str
    updated_at: str


class TrajectoryPoint(BaseModel):
    step_hours: int
    timestamp: str
    latitude: float
    longitude: float
    current_speed_knots: float
    current_direction_deg: float
    wind_speed_knots: float
    wind_direction_deg: float
    uncertainty_radius_km: float
    beaching_probability_pct: float
    nearest_coast_km: float


class DriftPredictionResult(BaseModel):
    prediction_id: str
    observation_id: str
    start_latitude: float
    start_longitude: float
    forecast_horizon_hours: int
    generated_at: str
    data_source: str
    data_freshness: str
    is_demonstration_mode: bool
    trajectory: List[TrajectoryPoint]
    summary: Dict[str, Any]
    environmental_conditions: Dict[str, Any]
    uncertainty_cone_geojson: Dict[str, Any]
    coastal_impact_risk: str
    model_disclaimer: str


class CleanupRecommendation(BaseModel):
    rank: int
    location_name: str
    latitude: float
    longitude: float
    priority_score: float
    urgency_level: str
    total_waste_count: int
    dominant_waste: str
    hazard_profile: str
    drift_risk_impact: str
    estimated_distance_from_base_km: float
    suggested_equipment: List[str]
    justification: str


class CleanupRoutePlan(BaseModel):
    plan_id: str
    created_at: str
    base_location: Dict[str, Any]
    total_stops: int
    total_distance_km: float
    ordered_locations: List[CleanupRecommendation]
    route_polyline: List[List[float]]
    methodology: str


class BeforeAfterAnalysisResult(BaseModel):
    activity_id: str
    title: str
    location_name: str
    event_date: str
    before_image_url: str
    after_image_url: str
    before_annotated_url: str
    after_annotated_url: str
    before_counts: Dict[str, int]
    after_counts: Dict[str, int]
    before_total: int
    after_total: int
    absolute_reduction: int
    percentage_reduction: float
    verified_weight_kg: Optional[float] = None
    effectiveness_rating: str
    audit_notes: str
    disclaimer: str


class CitizenReportSubmission(BaseModel):
    reporter_name: Optional[str] = "Anonymous Citizen"
    contact_email: Optional[str] = None
    latitude: float
    longitude: float
    location_name: Optional[str] = "Coastal Zone"
    description: Optional[str] = None
    waste_estimate: Optional[str] = "moderate"
