import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  GitCompare,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Weight,
  Sparkles,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { CleanupActivity } from '../types';
import { createCleanupActivity, fetchCleanupActivities } from '../services/api';
import { Language, translations } from '../locales/translations';

interface BeforeAfterProps {
  language: Language;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const BeforeAfterPage: React.FC<BeforeAfterProps> = ({ language, onToast }) => {
  const [activities, setActivities] = useState<CleanupActivity[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('13.0500');
  const [longitude, setLongitude] = useState('80.2824');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [organizer, setOrganizer] = useState('');
  const [volunteersCount, setVolunteersCount] = useState('15');
  const [verifiedWeight, setVerifiedWeight] = useState('');
  const [notes, setNotes] = useState('');

  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);

  const t = translations[language];

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetchCleanupActivities();
      setActivities(res.activities);
    } catch (err) {
      console.error('Error loading cleanup history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBeforeFile(file);
      setBeforePreview(URL.createObjectURL(file));
    }
  };

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterFile(file);
      setAfterPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beforeFile || !afterFile) {
      onToast('warning', language === 'en' ? 'Both images required' : 'இரண்டு படங்களும் தேவை');
      return;
    }
    if (!title || !locationName) {
      onToast('warning', language === 'en' ? 'Missing details' : 'விவரங்கள் பூர்த்தி செய்யப்படவில்லை');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('location_name', locationName);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('event_date', eventDate);
      formData.append('organizer', organizer || 'Conservation Volunteers');
      formData.append('volunteers_count', volunteersCount);
      formData.append('before_image', beforeFile);
      formData.append('after_image', afterFile);
      if (verifiedWeight) formData.append('verified_weight_kg', verifiedWeight);
      if (notes) formData.append('notes', notes);

      const res = await createCleanupActivity(formData);
      setLatestResult(res);

      if (res.percentage_reduction >= 70) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      }

      onToast(
        'success',
        language === 'en' ? 'Impact Analysis Complete' : 'தாக்க ஆய்வு முடிந்தது',
        `Achieved ${res.percentage_reduction}% debris reduction.`
      );
      loadHistory();
    } catch (err: any) {
      onToast('error', 'Analysis failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <GitCompare className="w-7 h-7 text-cyan-400" />
          <span>{t.beforeAfter.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          {t.beforeAfter.subtitle}
        </p>
      </div>

      {/* Upload & Submission Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-cyan-900/30 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          {language === 'en' ? 'Log New Shoreline Remediation Project' : 'புதிய தூய்மைப் பணியைப் பதிவு செய்க'}
        </h3>

        {/* Text Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">{t.beforeAfter.projectTitle} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Marina Beach Youth Cleanathon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Location / Beach *</label>
            <input
              type="text"
              required
              placeholder="e.g. Marina Beach, Chennai"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">{t.beforeAfter.eventDate} *</label>
            <input
              type="date"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">{t.beforeAfter.verifiedWeight}</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 145.5"
              value={verifiedWeight}
              onChange={(e) => setVerifiedWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Dual Image Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Before Image */}
          <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-center space-y-2">
            <span className="text-xs font-bold text-amber-300 block">{t.beforeAfter.beforeImage} *</span>
            {beforePreview ? (
              <img src={beforePreview} alt="Before preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="py-6">
                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Select pre-cleanup shoreline photograph</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleBeforeChange}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-950 file:text-amber-300 hover:file:bg-amber-900"
            />
          </div>

          {/* After Image */}
          <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-center space-y-2">
            <span className="text-xs font-bold text-teal-300 block">{t.beforeAfter.afterImage} *</span>
            {afterPreview ? (
              <img src={afterPreview} alt="After preview" className="max-h-48 mx-auto rounded-lg object-contain" />
            ) : (
              <div className="py-6">
                <Upload className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Select post-cleanup restored shoreline photograph</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleAfterChange}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-950 file:text-teal-300 hover:file:bg-teal-900"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{t.beforeAfter.comparing}</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>{t.beforeAfter.runComparisonBtn}</span>
            </>
          )}
        </button>
      </form>

      {/* Latest Result Card */}
      {latestResult && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-navy-950 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4" />
                <span>{latestResult.effectiveness_rating}</span>
              </span>
              <h3 className="text-xl font-black text-white mt-1">{latestResult.title}</h3>
              <p className="text-xs text-slate-400">{latestResult.location_name} • {latestResult.event_date}</p>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-emerald-400">
                {latestResult.percentage_reduction}%
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Absolute Debris Reduction
              </span>
            </div>
          </div>

          {/* Side by side annotated images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-amber-300">Pre-Cleanup AI Annotation</span>
                <span className="font-bold text-white">{latestResult.before_total} items</span>
              </div>
              <img
                src={latestResult.before_annotated_url || latestResult.before_image_url}
                alt="Before annotated"
                className="w-full h-56 object-contain rounded-xl bg-slate-950 border border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-teal-300">Post-Cleanup AI Annotation</span>
                <span className="font-bold text-white">{latestResult.after_total} items</span>
              </div>
              <img
                src={latestResult.after_annotated_url || latestResult.after_image_url}
                alt="After annotated"
                className="w-full h-56 object-contain rounded-xl bg-slate-950 border border-slate-800"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-800/80">
            {latestResult.disclaimer}
          </div>
        </div>
      )}

      {/* Historical Cleanup Impact Records */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide">
          {language === 'en' ? 'Remediation Milestones & Audit History' : 'முந்தைய தூய்மைப் பணிகள் விவரம்'}
        </h3>

        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((act) => (
              <div
                key={act.activity_id}
                className="glass-panel p-4 rounded-xl border border-cyan-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{act.title}</h4>
                  <p className="text-xs text-slate-400">
                    {act.location_name} • {act.event_date} • Organized by <strong className="text-slate-300">{act.organizer}</strong>
                  </p>
                  {act.notes && <p className="text-[11px] text-slate-400 mt-1">{act.notes}</p>}
                </div>

                <div className="flex items-center space-x-4 shrink-0 text-right">
                  {act.verified_weight_kg ? (
                    <div>
                      <span className="text-sm font-bold text-white">{act.verified_weight_kg} kg</span>
                      <span className="text-[10px] text-slate-400 block">Verified Weight</span>
                    </div>
                  ) : null}

                  <div className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40">
                    <span className="text-sm font-black text-emerald-400">{act.reduction_pct}%</span>
                    <span className="text-[10px] text-emerald-300 block">Reduced</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
            {language === 'en' ? 'No historical remediation activities recorded.' : 'பதிவுகள் எதுவும் இல்லை.'}
          </div>
        )}
      </div>
    </div>
  );
};
