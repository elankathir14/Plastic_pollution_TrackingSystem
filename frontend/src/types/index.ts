export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  confidence: number;
  class_id: number;
  class_name: string;
  display_name: string;
  display_name_ta: string;
  hazard_level: string;
  hazard_weight: number;
  decomposition_years: number;
  color_hex: string;
}

export interface ImageQualityMetrics {
  blur_variance: number;
  is_blurry: boolean;
  quality_score: number;
  quality_grade: string;
  resolution: string;
  aspect_ratio: number;
  brightness_mean: number;
  is_dark: boolean;
  is_overexposed: boolean;
  warnings: string[];
}

export interface ExifMetadata {
  has_gps: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  datetime_original: string | null;
  camera_make: string | null;
  camera_model: string | null;
}

export interface ExplainableAIInfo {
  model_name: string;
  model_version: string;
  inference_time_ms: number;
  confidence_threshold_used: number;
  total_candidates_analyzed: number;
  detected_count: number;
  key_factors: string[];
  reliability_assessment: string;
  model_limitations: string[];
}

export interface DetectionRecord {
  observation_id: string;
  image_url: string;
  annotated_image_url: string | null;
  latitude: number;
  longitude: number;
  location_name: string;
  location_source: string;
  total_objects: number;
  detected_counts: Record<string, number>;
  hazard_score: number;
  quality_score?: number;
  is_blurry?: boolean;
  blur_variance?: number;
  detections?: BoundingBox[];
  quality?: ImageQualityMetrics;
  exif?: ExifMetadata;
  explainable_ai?: ExplainableAIInfo;
  verification_status: string;
  created_at: string;
}

export interface HotspotItem {
  id: string;
  cluster_id: number;
  centroid_lat: number;
  centroid_lon: number;
  location_name: string;
  observation_count: number;
  total_waste_count: number;
  hotspot_priority_index: number;
  priority_level: 'critical' | 'high' | 'medium' | 'low';
  dominant_category: string;
  category_distribution: Record<string, number>;
  radius_meters: number;
  explanation: string;
  last_observed_at: string;
  updated_at: string;
}

export interface TrajectoryPoint {
  step_hours: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  current_speed_knots: number;
  current_direction_deg: number;
  wind_speed_knots: number;
  wind_direction_deg: number;
  uncertainty_radius_km: number;
  beaching_probability_pct: number;
  nearest_coast_km: number;
}

export interface DriftPrediction {
  prediction_id: string;
  observation_id: string;
  start_latitude: number;
  start_longitude: number;
  forecast_horizon_hours: number;
  generated_at: string;
  data_source: string;
  data_freshness: string;
  is_demonstration_mode: boolean;
  trajectory: TrajectoryPoint[];
  summary: {
    net_drift_speed_knots: number;
    net_heading_deg: number;
    total_estimated_drift_km: number;
    final_beaching_risk_pct: number;
    drift_classification: string;
  };
  environmental_conditions: Record<string, any>;
  uncertainty_cone_geojson: {
    type: string;
    coordinates: number[][][];
  };
  coastal_impact_risk: string;
  model_disclaimer: string;
}

export interface CleanupRecommendation {
  rank: number;
  hotspot_id?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  priority_score: number;
  urgency_level: string;
  total_waste_count: number;
  dominant_waste: string;
  hazard_profile: string;
  drift_risk_impact: string;
  estimated_distance_from_base_km: number;
  leg_distance_km?: number;
  suggested_equipment: string[];
  justification: string;
}

export interface CleanupRoutePlan {
  plan_id: string;
  created_at: string;
  base_location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  total_stops: number;
  total_distance_km: number;
  ordered_locations: CleanupRecommendation[];
  route_polyline: [number, number][];
  methodology: string;
}

export interface CleanupActivity {
  activity_id: string;
  title: string;
  location_name: string;
  latitude: number;
  longitude: number;
  event_date: string;
  organizer: string;
  volunteers_count: number;
  before_image_url: string;
  after_image_url: string;
  before_annotated_url?: string;
  after_annotated_url?: string;
  before_count: number;
  after_count: number;
  reduction_pct: number;
  verified_weight_kg?: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface CitizenReport {
  id: string;
  reporter_name: string;
  contact_email?: string;
  latitude: number;
  longitude: number;
  location_name: string;
  image_url: string;
  description: string;
  waste_estimate: string;
  observation_id?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_reports: number;
  total_observations: number;
  verified_observations: number;
  total_plastic_items_detected: number;
  verified_plastic_items: number;
  categories_breakdown: Record<string, number>;
  high_priority_hotspots: number;
  total_hotspots: number;
  pollution_trends: { period: string; reports: number; debris_count: number }[];
  recent_detections: any[];
  cleanup_metrics: {
    completed_cleanups: number;
    estimated_debris_removed: number;
    verified_weight_kg: number;
  };
  system_status: {
    model_loaded: boolean;
    model_name: string;
    supported_classes_count: number;
    environmental_data_source: string;
    last_updated: string;
  };
}
