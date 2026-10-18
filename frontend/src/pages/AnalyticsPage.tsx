import React, { useEffect, useState } from 'react';
import {
  Database,
  Download,
  Search,
  Filter,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { DetectionRecord } from '../types';
import { fetchDetections } from '../services/api';
import { Language, translations } from '../locales/translations';

interface AnalyticsPageProps {
  language: Language;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ language, onToast }) => {
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [loading, setLoading] = useState(true);

  const t = translations[language];

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDetections(undefined, selectedCat === 'all' ? undefined : selectedCat, 100);
      setDetections(res.detections);
    } catch (err: any) {
      onToast('error', 'Failed to load records', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCat]);

  const filtered = detections.filter((d) =>
    searchTerm ? d.location_name.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <Database className="w-7 h-7 text-cyan-400" />
            <span>{t.analytics.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t.analytics.subtitle}
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/analytics/export?dataset=observations"
            download="observations_export.csv"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-sm shadow-cyan-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.analytics.exportObservations}</span>
          </a>

          <a
            href="/api/analytics/export?dataset=hotspots"
            download="hotspots_export.csv"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-sm shadow-amber-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.analytics.exportHotspots}</span>
          </a>

          <a
            href="/api/analytics/export?dataset=cleanups"
            download="cleanups_export.csv"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-sm shadow-teal-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.analytics.exportCleanups}</span>
          </a>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-900/30 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder={t.analytics.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full text-xs"
          />
        </div>

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">{t.analytics.filterAll}</option>
          <option value="plastic_bottle">Plastic Bottles</option>
          <option value="plastic_bag">Plastic Bags</option>
          <option value="food_container">Food Containers</option>
          <option value="fishing_gear">Fishing Gear / Ghost Nets</option>
          <option value="plastic_fragment">Plastic Fragments</option>
        </select>
      </div>

      {/* Observation Table */}
      <div className="glass-panel rounded-2xl border border-cyan-900/30 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-navy-950/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Observation ID</th>
                  <th className="py-3 px-4">Location Name</th>
                  <th className="py-3 px-4">Coordinates</th>
                  <th className="py-3 px-4">Total Debris</th>
                  <th className="py-3 px-4">Hazard Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((d) => (
                  <tr key={d.observation_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-300">{d.observation_id}</td>
                    <td className="py-3 px-4 font-bold text-white max-w-xs truncate">{d.location_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {d.latitude.toFixed(4)}°, {d.longitude.toFixed(4)}°
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-[11px]">
                        {d.total_objects} items
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${d.hazard_score > 70 ? 'text-rose-400' : 'text-amber-400'}`}>
                        {d.hazard_score}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        d.verification_status === 'verified'
                          ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                          : 'bg-amber-950 border-amber-500/40 text-amber-300'
                      }`}>
                        {d.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            No observations matching your query.
          </div>
        )}
      </div>
    </div>
  );
};
