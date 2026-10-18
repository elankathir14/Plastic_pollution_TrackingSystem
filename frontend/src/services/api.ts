import {
  DetectionRecord,
  HotspotItem,
  DriftPrediction,
  CleanupRecommendation,
  CleanupRoutePlan,
  CleanupActivity,
  CitizenReport,
  AnalyticsSummary
} from '../types';

export const BACKEND_URL = ((import.meta as any).env?.VITE_API_URL as string | undefined) || '';
const API_BASE = `${BACKEND_URL}/api`;

export async function checkHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('System offline');
  return res.json();
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) throw new Error('Failed to load analytics summary');
  return res.json();
}

export async function fetchDetections(
  status?: string,
  category?: string,
  limit = 50,
  offset = 0
): Promise<{ count: number; detections: DetectionRecord[] }> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (category) params.append('category', category);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const res = await fetch(`${API_BASE}/detections?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch detections');
  return res.json();
}

export async function fetchDetectionDetail(obsId: string): Promise<DetectionRecord> {
  const res = await fetch(`${API_BASE}/detections/${obsId}`);
  if (!res.ok) throw new Error('Failed to fetch observation details');
  return res.json();
}

export async function analyzeImage(formData: FormData): Promise<DetectionRecord> {
  const res = await fetch(`${API_BASE}/detections/analyze`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
    throw new Error(err.detail || 'Analysis request failed');
  }
  return res.json();
}

export async function fetchHotspots(): Promise<{ count: number; hotspots: HotspotItem[] }> {
  const res = await fetch(`${API_BASE}/hotspots`);
  if (!res.ok) throw new Error('Failed to fetch hotspots');
  return res.json();
}

export async function refreshHotspots(): Promise<{ message: string; total_hotspots: number; hotspots: HotspotItem[] }> {
  const res = await fetch(`${API_BASE}/hotspots/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to refresh hotspots');
  return res.json();
}

export async function fetchDriftPrediction(obsId: string, horizonHours = 72): Promise<DriftPrediction> {
  const res = await fetch(`${API_BASE}/predictions/${obsId}?horizon_hours=${horizonHours}`);
  if (!res.ok) throw new Error('Failed to generate drift prediction');
  return res.json();
}

export async function fetchCleanupRecommendations(maxTargets = 8): Promise<{ count: number; recommendations: CleanupRecommendation[] }> {
  const res = await fetch(`${API_BASE}/cleanup/recommendations?max_targets=${maxTargets}`);
  if (!res.ok) throw new Error('Failed to fetch cleanup recommendations');
  return res.json();
}

export async function planCleanupRoute(
  baseLat: number,
  baseLon: number,
  baseName = 'Harbor Base',
  selectedIds?: string[]
): Promise<CleanupRoutePlan> {
  const formData = new FormData();
  formData.append('base_lat', baseLat.toString());
  formData.append('base_lon', baseLon.toString());
  formData.append('base_name', baseName);
  if (selectedIds && selectedIds.length > 0) {
    formData.append('selected_ids', JSON.stringify(selectedIds));
  }

  const res = await fetch(`${API_BASE}/cleanup/plan-route`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to compute TSP route plan');
  return res.json();
}

export async function createCleanupActivity(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/cleanup/activities`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to record cleanup' }));
    throw new Error(err.detail || 'Failed to submit cleanup activity');
  }
  return res.json();
}

export async function fetchCleanupActivities(): Promise<{ count: number; activities: CleanupActivity[] }> {
  const res = await fetch(`${API_BASE}/cleanup/activities`);
  if (!res.ok) throw new Error('Failed to fetch cleanup activities');
  return res.json();
}

export async function submitCitizenReport(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Submission failed' }));
    throw new Error(err.detail || 'Failed to submit citizen report');
  }
  return res.json();
}

export async function fetchCitizenReports(status?: string): Promise<{ count: number; reports: CitizenReport[] }> {
  const url = status ? `${API_BASE}/reports?status=${status}` : `${API_BASE}/reports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch citizen reports');
  return res.json();
}

export async function updateReportStatus(reportId: string, status: string, notes = ''): Promise<any> {
  const formData = new FormData();
  formData.append('status', status);
  formData.append('admin_notes', notes);

  const res = await fetch(`${API_BASE}/reports/${reportId}/status`, {
    method: 'PATCH',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to update report status');
  return res.json();
}
