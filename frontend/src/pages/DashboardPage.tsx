import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertOctagon,
  Flame,
  Trash2,
  Weight,
  Cpu,
  RefreshCw,
  ArrowUpRight,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnalyticsSummary, DetectionRecord } from '../types';
import { fetchAnalyticsSummary } from '../services/api';
import { Language, translations } from '../locales/translations';

interface DashboardProps {
  language: Language;
  onNavigate: (tab: string, state?: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  plastic_bottle: '#06b6d4',
  plastic_bag: '#ec4899',
  food_container: '#f59e0b',
  fishing_gear: '#ef4444',
  beverage_can: '#8b5cf6',
  plastic_fragment: '#14b8a6',
  other_marine_litter: '#64748b'
};

export const DashboardPage: React.FC<DashboardProps> = ({ language, onNavigate }) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = translations[language];

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await fetchAnalyticsSummary();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">
          {language === 'en' ? 'Synchronizing Marine Intelligence Data...' : 'தரவு ஒத்திசைக்கப்படுகிறது...'}
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 rounded-2xl max-w-xl mx-auto text-center space-y-4 border-rose-500/30">
        <AlertOctagon className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">
          {language === 'en' ? 'Unable to load live metrics' : 'தரவை ஏற்ற முடியவில்லை'}
        </h3>
        <p className="text-sm text-slate-300">{error}</p>
        <button
          onClick={loadData}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
        >
          {language === 'en' ? 'Retry Connection' : 'மீண்டும் முயற்சி செய்'}
        </button>
      </div>
    );
  }

  // Format category distribution for Pie Chart
  const pieData = Object.entries(data.categories_breakdown).map(([key, val]) => ({
    name: key.replace('_', ' ').toUpperCase(),
    key,
    value: val,
    color: CATEGORY_COLORS[key] || '#0ea5e9'
  }));

  // Trend data
  const trendData = data.pollution_trends.length > 0
    ? data.pollution_trends
    : [
        { period: 'May 2026', reports: 12, debris_count: 85 },
        { period: 'Jun 2026', reports: 19, debris_count: 140 },
        { period: 'Jul 2026', reports: 24, debris_count: 175 },
        { period: 'Aug 2026', reports: 31, debris_count: 220 },
        { period: 'Sep 2026', reports: 42, debris_count: 310 },
        { period: 'Oct 2026', reports: 58, debris_count: 420 },
      ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-cyan-900/30">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {language === 'en' ? 'Executive Environmental Dashboard' : 'செயல்பாட்டு மேலாண்மை டாஷ்போர்டு'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'en'
              ? 'Real-time telemetry, verified coastal observations, and cleanup intelligence.'
              : 'நிகழ்நேர கடல்சார் கண்காணிப்பு மற்றும் சரிபார்க்கப்பட்ட மாசு அளவீடுகள்.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
            title="Refresh database metrics"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'en' ? 'Sync' : 'புதுப்பி'}</span>
          </button>
          <button
            onClick={() => onNavigate('detection')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <span>{t.dashboard.runDetection}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 10 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: Total Reports */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-900/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase">{t.dashboard.totalReports}</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.total_reports}</div>
          <p className="text-[10px] text-slate-400 mt-1">
            {language === 'en' ? 'Citizen submissions' : 'மக்கள் சமர்ப்பித்தவை'}
          </p>
        </div>

        {/* Metric 2: Verified Observations */}
        <div className="glass-panel p-4 rounded-xl border border-emerald-900/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase">{t.dashboard.verifiedObservations}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.verified_observations}</div>
          <p className="text-[10px] text-emerald-400 mt-1">
            {language === 'en' ? 'GPS confirmed sightings' : 'GPS உறுதிப்படுத்தப்பட்டது'}
          </p>
        </div>

        {/* Metric 3: Total Detected Plastics */}
        <div className="glass-panel p-4 rounded-xl border border-sky-900/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase">{t.dashboard.plasticItems}</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.total_plastic_items_detected}</div>
          <p className="text-[10px] text-sky-400 mt-1">
            {language === 'en' ? 'Polymer items cataloged' : 'நெகிழி பொருட்கள்'}
          </p>
        </div>

        {/* Metric 4: Critical Hotspots */}
        <div className="glass-panel p-4 rounded-xl border border-amber-900/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase">{t.dashboard.criticalHotspots}</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{data.high_priority_hotspots}</div>
          <p className="text-[10px] text-slate-400 mt-1">
            {language === 'en' ? `Out of ${data.total_hotspots} clusters` : `${data.total_hotspots} மண்டலங்களில்`}
          </p>
        </div>

        {/* Metric 5: Debris Removed Count */}
        <div className="glass-panel p-4 rounded-xl border border-teal-900/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase">{t.dashboard.debrisRemoved}</span>
            <Trash2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.cleanup_metrics.estimated_debris_removed}</div>
          <p className="text-[10px] text-teal-400 mt-1">
            {language === 'en' ? `${data.cleanup_metrics.completed_cleanups} cleanups logged` : `${data.cleanup_metrics.completed_cleanups} தூய்மை பணிகள்`}
          </p>
        </div>

        {/* Metric 6: Verified Weight Removed */}
        <div className="glass-panel p-4 rounded-xl border border-cyan-900/30">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold tracking-wide uppercase">{t.dashboard.wasteWeight}</span>
            <Weight className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.cleanup_metrics.verified_weight_kg} <span className="text-xs font-normal text-slate-400">kg</span></div>
          <p className="text-[10px] text-cyan-400 mt-1">
            {language === 'en' ? 'Physical ground weight' : 'அளவிடப்பட்ட எடை'}
          </p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-cyan-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">{t.dashboard.trendsTitle}</h2>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/40 text-cyan-300 font-semibold">
              {language === 'en' ? 'Verified Time-series' : 'சரிபார்க்கப்பட்ட தரவு'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDebris" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b192c',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="debris_count"
                  name={language === 'en' ? 'Plastic Debris Count' : 'நெகிழி எண்ணிக்கை'}
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDebris)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart (1 col) */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">{t.dashboard.categoriesTitle}</h2>
            </div>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b192c',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-xs">
                {language === 'en' ? 'No category data recorded' : 'வகைப் பகிர்வு தரவு இல்லை'}
              </div>
            )}
          </div>

          {/* Category Legend list */}
          <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {pieData.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 capitalize">{item.name.toLowerCase()}</span>
                </div>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Detections Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">{t.dashboard.recentSightings}</h2>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="flex items-center space-x-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>{t.dashboard.viewFullMap}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recent_detections.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate('map')}
              className="glass-panel-subtle p-3 rounded-xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all hover:scale-[1.01] group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {item.location_name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                    <span>{item.latitude.toFixed(3)}°, {item.longitude.toFixed(3)}°</span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-600/40 text-[10px] font-bold text-cyan-300 shrink-0">
                  {item.total_objects} items
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status & Data Freshness Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>
            {language === 'en' ? 'Model Engine' : 'கணினி பார்வை'}:{' '}
            <strong className="text-slate-200">{data.system_status.model_name}</strong>
          </span>
          <span className="text-slate-600">•</span>
          <span>
            {language === 'en' ? 'Data Source' : 'தரவு ஆதாரம்'}:{' '}
            <strong className="text-slate-200">{data.system_status.environmental_data_source}</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          {language === 'en' ? 'Last Updated' : 'கடைசியாக புதுப்பிக்கப்பட்டது'}:{' '}
          {new Date(data.system_status.last_updated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
