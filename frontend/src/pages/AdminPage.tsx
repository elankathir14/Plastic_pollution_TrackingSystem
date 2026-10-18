import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Clock,
  Filter,
  Check,
  X
} from 'lucide-react';
import { CitizenReport } from '../types';
import { fetchCitizenReports, updateReportStatus } from '../services/api';
import { Language, translations } from '../locales/translations';

interface AdminPageProps {
  language: Language;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ language, onToast }) => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const t = translations[language];

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetchCitizenReports(filterStatus === 'all' ? undefined : filterStatus);
      setReports(res.reports);
    } catch (err: any) {
      onToast('error', 'Failed to load reports', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      setActionLoading(reportId);
      await updateReportStatus(reportId, newStatus, `Action taken by field administrator at ${new Date().toLocaleTimeString()}`);
      onToast(
        'success',
        language === 'en' ? 'Status Updated' : 'நிலை புதுப்பிக்கப்பட்டது',
        `Report marked as ${newStatus}.`
      );
      loadReports();
    } catch (err: any) {
      onToast('error', 'Update error', err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            <span>{t.admin.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            {t.admin.subtitle}
          </p>
        </div>

        <button
          onClick={loadReports}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'en' ? 'Refresh Queue' : 'வரிசையை புதுப்பி'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {['all', 'submitted', 'verified', 'flagged_duplicate', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
              filterStatus === st
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reports Queue List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((rep) => {
              const statusColors: Record<string, string> = {
                submitted: 'bg-sky-950 border-sky-500/40 text-sky-300',
                verified: 'bg-emerald-950 border-emerald-500/40 text-emerald-300',
                flagged_duplicate: 'bg-amber-950 border-amber-500/40 text-amber-300',
                rejected: 'bg-rose-950 border-rose-500/40 text-rose-300',
                investigating: 'bg-purple-950 border-purple-500/40 text-purple-300'
              };

              return (
                <div
                  key={rep.id}
                  className="glass-panel p-5 rounded-2xl border border-cyan-900/30 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColors[rep.status] || 'bg-slate-900 text-slate-400'}`}>
                          {rep.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">ID: {rep.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-slate-400">{new Date(rep.created_at).toLocaleString()}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white tracking-wide">{rep.location_name}</h3>
                      <p className="text-xs text-slate-400">
                        Submitted by: <strong className="text-slate-200">{rep.reporter_name}</strong> {rep.contact_email ? `(${rep.contact_email})` : ''}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleStatusChange(rep.id, 'verified')}
                        disabled={actionLoading === rep.id || rep.status === 'verified'}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.admin.approveBtn}</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(rep.id, 'rejected')}
                        disabled={actionLoading === rep.id || rep.status === 'rejected'}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-900 hover:bg-rose-800 border border-rose-700/50 disabled:opacity-50 text-rose-200 font-bold text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{t.admin.rejectBtn}</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(rep.id, 'investigating')}
                        disabled={actionLoading === rep.id || rep.status === 'investigating'}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold text-xs"
                      >
                        {t.admin.investigateBtn}
                      </button>
                    </div>
                  </div>

                  {/* Body Content & Image Thumbnail */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-slate-800">
                    <img
                      src={rep.image_url}
                      alt="Citizen submission"
                      className="w-32 h-24 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0"
                    />

                    <div className="space-y-2 text-xs flex-1">
                      <p className="text-slate-300 leading-relaxed">
                        <strong className="text-slate-400">Description: </strong>
                        {rep.description || 'No additional commentary provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                        <span>GPS: <strong className="text-cyan-300 font-mono">{rep.latitude.toFixed(4)}°, {rep.longitude.toFixed(4)}°</strong></span>
                        <span>•</span>
                        <span>Waste Severity: <strong className="text-amber-400 capitalize">{rep.waste_estimate}</strong></span>
                      </div>

                      {rep.admin_notes && (
                        <p className="text-[11px] text-amber-300 bg-amber-950/20 px-2 py-1 rounded border border-amber-900/40">
                          Audit Note: {rep.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel p-12 rounded-2xl border border-dashed border-slate-800 text-center text-slate-400 text-xs">
            {language === 'en' ? 'No reports found matching selected criteria.' : 'அறிக்கைகள் எதுவும் இல்லை.'}
          </div>
        )}
      </div>
    </div>
  );
};
