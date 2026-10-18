import React, { useState } from 'react';
import {
  UserCheck,
  Upload,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Send
} from 'lucide-react';
import { submitCitizenReport } from '../services/api';
import { Language, translations } from '../locales/translations';

interface CitizenReportPageProps {
  language: Language;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToAdmin?: () => void;
}

export const CitizenReportPage: React.FC<CitizenReportPageProps> = ({
  language,
  onToast,
  onNavigateToAdmin
}) => {
  const [reporterName, setReporterName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('13.0500');
  const [longitude, setLongitude] = useState('80.2824');
  const [description, setDescription] = useState('');
  const [wasteEstimate, setWasteEstimate] = useState('moderate');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const t = translations[language];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSubmissionResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      onToast('warning', language === 'en' ? 'Photo required' : 'புகைப்படம் தேவை');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('reporter_name', reporterName || 'Anonymous Citizen');
      if (contactEmail) formData.append('contact_email', contactEmail);
      formData.append('location_name', locationName || 'Coastal Shoreline');
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('description', description);
      formData.append('waste_estimate', wasteEstimate);

      const res = await submitCitizenReport(formData);
      setSubmissionResult(res);

      if (res.is_duplicate) {
        onToast(
          'warning',
          language === 'en' ? 'Duplicate Report Flagged' : 'நகல் அறிக்கை எச்சரிக்கை',
          t.citizen.duplicateWarning
        );
      } else {
        onToast(
          'success',
          language === 'en' ? 'Report Received' : 'அறிக்கை சமர்ப்பிக்கப்பட்டது',
          language === 'en'
            ? `AI pre-screened ${res.total_objects_prescreened} debris objects.`
            : `AI ${res.total_objects_prescreened} கழிவுப் பொருட்களைக் கண்டறிந்தது.`
        );
      }
    } catch (err: any) {
      onToast('error', 'Submission error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <UserCheck className="w-7 h-7 text-cyan-400" />
          <span>{t.citizen.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t.citizen.subtitle}
        </p>
      </div>

      {/* Submission Card */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyan-900/30 space-y-6">
        {/* Photo Upload Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 block">
            {t.citizen.photo} *
          </label>
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 text-center space-y-3">
            {imagePreview ? (
              <div className="space-y-2">
                <img src={imagePreview} alt="Upload preview" className="max-h-56 mx-auto rounded-lg object-contain" />
                <p className="text-[11px] text-slate-400">{imageFile?.name}</p>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <Camera className="w-10 h-10 text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Take or upload a clear photo of shoreline waste</p>
                <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP up to 15MB</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleImageChange}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
            />
          </div>
        </div>

        {/* Reporter Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">{t.citizen.reporterName}</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">{t.citizen.contactEmail}</label>
            <input
              type="email"
              placeholder="e.g. volunteer@ocean.org"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Location & GPS */}
        <div className="space-y-2 text-xs">
          <label className="text-slate-300 font-semibold block">{t.citizen.location} *</label>
          <input
            type="text"
            required
            placeholder="e.g. Marina Beach Near Light House"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
          />

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Latitude (GPS)</span>
              <input
                type="text"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">Longitude (GPS)</span>
              <input
                type="text"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Severity & Description */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Estimated Waste Severity</label>
            <select
              value={wasteEstimate}
              onChange={(e) => setWasteEstimate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="light">Light Litter (1-5 scattered items)</option>
              <option value="moderate">Moderate Accumulation (6-20 items)</option>
              <option value="heavy">Heavy Dumping (20-50 items)</option>
              <option value="critical">Critical Hazard / Ghost Fishing Gear / Dead Wildlife</option>
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">{t.citizen.description}</label>
            <textarea
              rows={3}
              placeholder="Describe debris type, proximity to waterline, or hazards..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
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
              <span>{t.citizen.submitting}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t.citizen.submitBtn}</span>
            </>
          )}
        </button>
      </form>

      {/* Confirmation Card */}
      {submissionResult && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-slate-900 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>{submissionResult.message}</span>
          </div>
          <div className="text-xs text-slate-300">
            Report ID: <strong className="text-white font-mono">{submissionResult.report_id}</strong> • AI Pre-screened Items: <strong className="text-cyan-300 font-bold">{submissionResult.total_objects_prescreened}</strong> • Quality: <span className="capitalize text-emerald-400 font-bold">{submissionResult.quality_grade}</span>
          </div>
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="text-xs font-semibold text-cyan-400 hover:underline pt-1 block"
            >
              View in Field Officer Verification Queue →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
