import React, { useEffect, useState } from 'react';
import {
  Wind,
  Compass,
  AlertTriangle,
  RefreshCw,
  Navigation,
  Activity,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Waves
} from 'lucide-react';
import { DetectionRecord, DriftPrediction } from '../types';
import { fetchDetections, fetchDriftPrediction } from '../services/api';
import { Language, translations } from '../locales/translations';

interface PredictionPageProps {
  language: Language;
  initialObsId?: string;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({
  language,
  initialObsId,
  onToast
}) => {
  const [observations, setObservations] = useState<DetectionRecord[]>([]);
  const [selectedObsId, setSelectedObsId] = useState<string>(initialObsId || '');
  const [horizonHours, setHorizonHours] = useState<number>(72);
  const [prediction, setPrediction] = useState<DriftPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const t = translations[language];

  // Load observations list on mount
  useEffect(() => {
    const fetchObs = async () => {
      try {
        const res = await fetchDetections(undefined, undefined, 50);
        setObservations(res.detections);
        if (!selectedObsId && res.detections.length > 0) {
          setSelectedObsId(res.detections[0].observation_id);
        }
      } catch (err) {
        console.error('Error fetching observations for prediction:', err);
      }
    };
    fetchObs();
  }, []);

  // Compute prediction whenever selected observation or horizon changes
  useEffect(() => {
    if (!selectedObsId) return;

    const runPrediction = async () => {
      try {
        setLoading(true);
        const res = await fetchDriftPrediction(selectedObsId, horizonHours);
        setPrediction(res);
      } catch (err: any) {
        onToast('error', 'Prediction error', err.message);
      } finally {
        setLoading(false);
      }
    };

    runPrediction();
  }, [selectedObsId, horizonHours]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Wind className="w-7 h-7 text-sky-400" />
          <span>{t.prediction.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          {t.prediction.subtitle}
        </p>
      </div>

      {/* Control Ribbon: Select Observation & Horizon Toggle */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Observation Selector */}
        <div className="w-full md:w-1/2 space-y-1">
          <label className="text-xs font-semibold text-slate-300 block">
            {t.prediction.selectObservation}:
          </label>
          <select
            value={selectedObsId}
            onChange={(e) => setSelectedObsId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {observations.map((obs) => (
              <option key={obs.observation_id} value={obs.observation_id}>
                {obs.location_name} ({obs.total_objects} items, {new Date(obs.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>

        {/* Forecast Horizon Toggle */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300 block">
            {t.prediction.horizon}:
          </label>
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setHorizonHours(24)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                horizonHours === 24 ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.prediction.hours24}
            </button>
            <button
              onClick={() => setHorizonHours(72)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                horizonHours === 72 ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.prediction.hours72}
            </button>
            <button
              onClick={() => setHorizonHours(168)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                horizonHours === 168 ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.prediction.days7}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
          <p className="text-xs text-slate-400">
            {language === 'en' ? 'Calculating Lagrangian advection-diffusion trajectories...' : 'நீரோட்ட கணிப்புகள் கணக்கிடப்படுகின்றன...'}
          </p>
        </div>
      ) : prediction ? (
        <div className="space-y-8">
          {/* Key Trajectory Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-sky-900/30">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">{t.prediction.netSpeed}</span>
              <div className="text-2xl font-black text-white mt-1">
                {prediction.summary.net_drift_speed_knots} <span className="text-xs text-slate-500 font-normal">knots</span>
              </div>
              <p className="text-[10px] text-sky-400 mt-1">Current + 3% wind leeway</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-cyan-900/30">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">{t.prediction.netHeading}</span>
              <div className="text-2xl font-black text-cyan-400 mt-1">
                {prediction.summary.net_heading_deg}° <span className="text-xs text-slate-500 font-normal">bearing</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{prediction.summary.drift_classification}</p>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-teal-900/30">
              <span className="text-[11px] text-slate-400 block font-semibold uppercase">{t.prediction.totalDrift}</span>
              <div className="text-2xl font-black text-white mt-1">
                {prediction.summary.total_estimated_drift_km} <span className="text-xs text-slate-500 font-normal">km</span>
              </div>
              <p className="text-[10px] text-teal-400 mt-1">Over {horizonHours}h forecast window</p>
            </div>

            <div className={`glass-panel p-4 rounded-xl border ${
              prediction.summary.final_beaching_risk_pct > 60
                ? 'border-rose-500/40 bg-rose-950/20'
                : 'border-amber-500/30 bg-amber-950/20'
            }`}>
              <span className="text-[11px] text-slate-300 block font-semibold uppercase">{t.prediction.beachingRisk}</span>
              <div className="text-2xl font-black text-white mt-1">
                {prediction.summary.final_beaching_risk_pct}%
              </div>
              <p className="text-[10px] font-bold text-rose-300 mt-1">
                Hazard: {prediction.coastal_impact_risk}
              </p>
            </div>
          </div>

          {/* Environmental Telemetry Feeds */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-900/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Waves className="w-4 h-4" />
                <span>{t.prediction.envConditions}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-mono">
                {prediction.data_source}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Ocean Current Velocity</span>
                <span className="font-bold text-white text-sm">{prediction.environmental_conditions.current_speed_knots} kts</span>
                <span className="text-[10px] text-slate-500 block">Heading: {prediction.environmental_conditions.current_direction_deg}°</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Surface Wind (10m)</span>
                <span className="font-bold text-white text-sm">{prediction.environmental_conditions.wind_speed_knots} kts</span>
                <span className="text-[10px] text-slate-500 block">From: {prediction.environmental_conditions.wind_direction_deg}°</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sea Surface Temp</span>
                <span className="font-bold text-white text-sm">{prediction.environmental_conditions.water_temp_c}°C</span>
                <span className="text-[10px] text-slate-500 block">Tropical Surface Layer</span>
              </div>

              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Data Freshness</span>
                <span className="font-bold text-emerald-400 text-xs">{prediction.data_freshness}</span>
                <span className="text-[10px] text-slate-500 block">Zero-Fabrication Feed</span>
              </div>
            </div>
          </div>

          {/* Trajectory Waypoints Table */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-900/30 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-wide">
              {language === 'en' ? 'Probabilistic Waypoints & Coastal Proximity' : 'கணிக்கப்பட்ட நகர்வு புள்ளிகள்'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase">
                    <th className="pb-2">Interval</th>
                    <th className="pb-2">Timestamp (UTC)</th>
                    <th className="pb-2">Predicted GPS</th>
                    <th className="pb-2">Uncertainty Cone (±km)</th>
                    <th className="pb-2">Shore Distance</th>
                    <th className="pb-2 text-right">Beaching Probability</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {prediction.trajectory.map((pt) => (
                    <tr key={pt.step_hours} className="hover:bg-slate-900/40">
                      <td className="py-2.5 font-bold text-white">+{pt.step_hours}h</td>
                      <td className="py-2.5 text-slate-300 font-mono text-[11px]">{new Date(pt.timestamp).toLocaleTimeString()}</td>
                      <td className="py-2.5 text-cyan-300 font-mono text-[11px]">
                        {pt.latitude.toFixed(4)}°, {pt.longitude.toFixed(4)}°
                      </td>
                      <td className="py-2.5 text-slate-300">±{pt.uncertainty_radius_km} km</td>
                      <td className="py-2.5 text-slate-300">~{pt.nearest_coast_km} km</td>
                      <td className="py-2.5 text-right font-bold text-rose-400">
                        {pt.beaching_probability_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scientific Disclaimer */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{t.prediction.disclaimerTitle}</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {prediction.model_disclaimer}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
