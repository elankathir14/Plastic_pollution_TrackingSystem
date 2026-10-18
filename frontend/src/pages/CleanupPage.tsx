import React, { useEffect, useState } from 'react';
import {
  Compass,
  MapPin,
  RefreshCw,
  Navigation,
  ShieldAlert,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { CleanupRecommendation, CleanupRoutePlan } from '../types';
import { fetchCleanupRecommendations, planCleanupRoute } from '../services/api';
import { Language, translations } from '../locales/translations';

interface CleanupPageProps {
  language: Language;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToBeforeAfter?: () => void;
}

export const CleanupPage: React.FC<CleanupPageProps> = ({
  language,
  onToast,
  onNavigateToBeforeAfter
}) => {
  const [recommendations, setRecommendations] = useState<CleanupRecommendation[]>([]);
  const [routePlan, setRoutePlan] = useState<CleanupRoutePlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  // Base Harbor coordinates (e.g. Marina Harbor / Operations Depot)
  const [baseLat, setBaseLat] = useState<number>(13.0827);
  const [baseLon, setBaseLon] = useState<number>(80.2707);
  const [baseName, setBaseName] = useState<string>('Chennai Coastal Harbor Operations Base');

  const t = translations[language];

  const loadTargets = async () => {
    try {
      setLoading(true);
      const res = await fetchCleanupRecommendations(8);
      setRecommendations(res.recommendations);
    } catch (err: any) {
      onToast('error', 'Failed to load recommendations', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTargets();
  }, []);

  const handleGenerateRoute = async () => {
    try {
      setIsPlanning(true);
      const plan = await planCleanupRoute(baseLat, baseLon, baseName);
      setRoutePlan(plan);
      onToast(
        'success',
        language === 'en' ? 'Route Solved' : 'பயணப் பாதை கணக்கிடப்பட்டது',
        `2-Opt TSP solved ${plan.total_stops} stops over ${plan.total_distance_km} km.`
      );
    } catch (err: any) {
      onToast('error', 'Route planning failed', err.message);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Compass className="w-7 h-7 text-teal-400" />
            <span>{t.cleanup.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            {t.cleanup.subtitle}
          </p>
        </div>

        <button
          onClick={handleGenerateRoute}
          disabled={isPlanning || recommendations.length === 0}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all"
        >
          {isPlanning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span>{t.cleanup.planRouteBtn}</span>
        </button>
      </div>

      {/* Base Depot Configuration */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-900/30 space-y-3">
        <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
          <MapPin className="w-4 h-4" />
          <span>{t.cleanup.baseDepot}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="text-[10px] text-slate-400 block mb-1">Base Name</label>
            <input
              type="text"
              value={baseName}
              onChange={(e) => setBaseName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Base Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={baseLat}
              onChange={(e) => setBaseLat(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Base Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={baseLon}
              onChange={(e) => setBaseLon(parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      </div>

      {/* Optimized Route Solution Banner (if solved) */}
      {routePlan && (
        <div className="glass-panel p-6 rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-950/30 via-slate-900 to-navy-950 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>2-Opt TSP Heuristic Solution Computed</span>
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {routePlan.total_stops} Target Stops • {routePlan.total_distance_km} km Geodesic Circuit
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Base: {routePlan.base_location.name}
            </span>
          </div>

          {/* Ordered Tour Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {t.cleanup.routeOrder}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {routePlan.ordered_locations.map((loc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-lg bg-teal-950 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Leg: ~{loc.leg_distance_km} km
                    </span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{loc.location_name}</h5>
                    <p className="text-[10px] text-slate-400">
                      {loc.total_waste_count} items • Dominant: {loc.dominant_waste.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prioritized Target Recommendations List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wide">
          {language === 'en' ? 'Ranked Shoreline Cleanup Priorities' : 'வரிசைப்படுத்தப்பட்ட தூய்மை இலக்குகள்'}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.rank}
                className="glass-panel p-5 rounded-2xl border border-cyan-900/30 hover:border-teal-500/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-950 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                      #{rec.rank}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{rec.location_name}</h4>
                      <p className="text-[11px] text-slate-400">
                        ({rec.latitude.toFixed(4)}°, {rec.longitude.toFixed(4)}°) • {rec.hazard_profile}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-teal-400">
                      Score: {rec.priority_score}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Urgency: {rec.urgency_level}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <strong className="text-white">Justification: </strong>
                  {rec.justification}
                </p>

                {/* Equipment Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    {t.cleanup.equipmentNeeded}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.suggested_equipment.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-[11px] text-slate-300"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl border border-dashed border-slate-800 text-center text-slate-400 text-xs">
            {language === 'en' ? 'No active cleanup targets cataloged.' : 'இலக்குகள் எதுவும் இல்லை.'}
          </div>
        )}
      </div>
    </div>
  );
};
