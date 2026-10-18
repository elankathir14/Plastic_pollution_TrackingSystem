import React, { useEffect, useState } from 'react';
import {
  Flame,
  RefreshCw,
  Info,
  Sliders,
  Clock,
  Layers,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Compass
} from 'lucide-react';
import { HotspotItem } from '../types';
import { fetchHotspots, refreshHotspots } from '../services/api';
import { Language, translations } from '../locales/translations';

interface HotspotsPageProps {
  language: Language;
  onNavigateToCleanup?: () => void;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const HotspotsPage: React.FC<HotspotsPageProps> = ({
  language,
  onNavigateToCleanup,
  onToast
}) => {
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const t = translations[language];

  const loadHotspots = async () => {
    try {
      setLoading(true);
      const res = await fetchHotspots();
      setHotspots(res.hotspots);
    } catch (err: any) {
      onToast('error', 'Failed to load hotspots', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotspots();
  }, []);

  const handleRecompute = async () => {
    try {
      setRefreshing(true);
      const res = await refreshHotspots();
      setHotspots(res.hotspots);
      onToast(
        'success',
        language === 'en' ? 'Hotspots Recomputed' : 'ஹாட்ஸ்பாட்கள் புதுப்பிக்கப்பட்டன',
        `Synchronized ${res.total_hotspots} active DBSCAN clusters.`
      );
    } catch (err: any) {
      onToast('error', 'Recomputation failed', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Flame className="w-7 h-7 text-amber-400" />
            <span>{t.hotspots.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t.hotspots.subtitle}
          </p>
        </div>

        <button
          onClick={handleRecompute}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t.hotspots.refreshBtn}</span>
        </button>
      </div>

      {/* Transparent HPI Scoring Formula Callout */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/20 via-navy-950 to-navy-950 space-y-3">
        <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>{t.hotspots.formulaTitle}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {t.hotspots.formulaDesc}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">1. Debris Volume (35%)</span>
            <span className="font-mono text-cyan-300 text-xs">min(35, 7.5 × ln(1 + N))</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">2. Recency Decay (25%)</span>
            <span className="font-mono text-emerald-300 text-xs">25 × e^(-0.693 × Δt/14)</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">3. Toxicity Hazard (25%)</span>
            <span className="font-mono text-rose-300 text-xs">25 × (W_hazard / 2.0)</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-semibold">4. Sightings Density (15%)</span>
            <span className="font-mono text-amber-300 text-xs">min(15, 3.5 × Obs_count)</span>
          </div>
        </div>
      </div>

      {/* Hotspots Ranking List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : hotspots.length > 0 ? (
          <div className="space-y-3">
            {hotspots.map((h, idx) => {
              const badgeColors = {
                critical: 'bg-rose-950 border-rose-500/50 text-rose-300',
                high: 'bg-amber-950 border-amber-500/50 text-amber-300',
                medium: 'bg-cyan-950 border-cyan-500/50 text-cyan-300',
                low: 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
              };

              return (
                <div
                  key={h.id}
                  className="glass-panel p-5 rounded-2xl border border-cyan-900/30 hover:border-amber-500/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          {h.location_name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Centroid: ({h.centroid_lat.toFixed(4)}°, {h.centroid_lon.toFixed(4)}°) • Radius ~ {Math.round(h.radius_meters)}m
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-400">
                          {h.hotspot_priority_index}
                          <span className="text-xs font-normal text-slate-500">/100</span>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeColors[h.priority_level]}`}>
                          {h.priority_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                    {h.explanation}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                    <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
                      <span>Confirmed Waste: <strong className="text-white">{h.total_waste_count}</strong></span>
                      <span>•</span>
                      <span>Dominant: <strong className="text-amber-400 capitalize">{h.dominant_category.replace('_', ' ')}</strong></span>
                      <span>•</span>
                      <span>Reports: <strong className="text-white">{h.observation_count}</strong></span>
                    </div>

                    {onNavigateToCleanup && (
                      <button
                        onClick={onNavigateToCleanup}
                        className="flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span>{language === 'en' ? 'Plan Cleanup Action' : 'தூய்மை திட்டமிடு'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl border border-dashed border-slate-800 text-center text-slate-400 text-xs">
            {language === 'en' ? 'No active pollution clusters identified.' : 'செயலில் உள்ள ஹாட்ஸ்பாட்கள் எதுவும் இல்லை.'}
          </div>
        )}
      </div>
    </div>
  );
};
