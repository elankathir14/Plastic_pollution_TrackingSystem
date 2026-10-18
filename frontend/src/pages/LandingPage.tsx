import React from 'react';
import {
  Waves,
  Scan,
  MapPin,
  Flame,
  Wind,
  Compass,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../locales/translations';

interface LandingPageProps {
  language: Language;
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ language, onNavigate }) => {
  const t = translations[language];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with Marine Radial Glow */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-teal-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm shadow-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Next-Generation Marine Environmental Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15]">
            Detect. Track. Predict.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Protect Our Oceans.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'An autonomous platform uniting computer vision, DBSCAN hotspot clustering, Lagrangian drift prediction, and TSP route optimization to eradicate shoreline plastic pollution.'
              : 'கடற்கரை நெகிழி கழிவுகளைக் கண்டறிந்து, ஹாட்ஸ்பாட்களை பகுப்பாய்வு செய்து, நீரோட்டத்தின் அடிப்படையில் கழிவு நகர்வை முன்கூட்டியே கணித்து தூய்மைப்படுத்த உதவும் முழுமையான தளம்.'}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('detection')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-sm hover:from-cyan-400 hover:to-teal-400 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105"
            >
              <Scan className="w-4 h-4" />
              <span>{language === 'en' ? 'Launch AI Image Analyzer' : 'AI பட சோதனையைத் தொடங்கு'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('map')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-200 font-semibold text-sm hover:bg-slate-800 hover:border-cyan-500/50 hover:text-white transition-all backdrop-blur-md"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{language === 'en' ? 'Explore Pollution Map' : 'வரைபடத்தை ஆராய்க'}</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-navy-900/60 border border-cyan-800/40 text-cyan-300 font-semibold text-sm hover:bg-navy-800 hover:text-cyan-200 transition-all backdrop-blur-md"
            >
              <Activity className="w-4 h-4" />
              <span>{language === 'en' ? 'View Live Dashboard' : 'டாஷ்போர்டைப் பார்'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Pillars Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {language === 'en' ? 'Core Environmental Intelligence Architecture' : 'முக்கிய கட்டமைப்பு அம்சங்கள்'}
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl mx-auto">
            {language === 'en'
              ? 'End-to-end scientific workflows engineered for marine biologists, conservation fleets, and coastal civic authorities.'
              : 'கடல்சார் ஆராய்ச்சியாளர்கள் மற்றும் தூய்மைப் பணியாளர்களுக்கான முழுமையான அறிவியல் தளம்.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30 hover:border-cyan-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform">
              <Scan className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {language === 'en' ? 'Computer Vision YOLOv8' : 'கணினி பார்வை YOLOv8'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {language === 'en'
                ? 'High-speed object detection for PET bottles, ghost nets, bags, and fragments with Laplacian focal blur checks and explainability.'
                : 'நெகிழி பாட்டில்கள், மீன்பிடி வலைகள் மற்றும் உடைந்த துண்டுகளைத் துல்லியமாக கண்டறியும் கணினி பார்வை.'}
            </p>
            <div className="text-[11px] font-semibold text-cyan-400 flex items-center space-x-1">
              <span>{language === 'en' ? 'Laplacian Blur & EXIF' : 'தெளிவின்மை & EXIF ஆய்வு'}</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30 hover:border-cyan-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {language === 'en' ? 'Hotspot Priority (HPI)' : 'ஹாட்ஸ்பாட் முன்னுரிமை'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {language === 'en'
                ? 'DBSCAN density clustering with mathematical scoring across volume, recency decay (14-day half-life), and polymer hazard weighting.'
                : 'DBSCAN கிளஸ்டரிங் மற்றும் கழிவின் அபாயம், காலம் அடிப்படையிலான HPI முன்னுரிமை கணக்கீடு.'}
            </p>
            <div className="text-[11px] font-semibold text-amber-400 flex items-center space-x-1">
              <span>{language === 'en' ? 'Transparent HPI Formula' : 'தெளிவான கணித சூத்திரம்'}</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30 hover:border-cyan-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 transition-transform">
              <Wind className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {language === 'en' ? 'Lagrangian Drift Physics' : 'நீரோட்ட நகர்வு கணிப்பு'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {language === 'en'
                ? 'Dynamic 24h, 72h, and 7-day drift trajectories powered by surface oceanic currents and a 3% wind leeway advection model.'
                : 'கடல் நீரோட்டம் மற்றும் காற்று வீச்சு அடிப்படையில் நெகிழி கழிவு மிதக்கும் பாதையை கணிக்கும் முறை.'}
            </p>
            <div className="text-[11px] font-semibold text-sky-400 flex items-center space-x-1">
              <span>{language === 'en' ? 'Uncertainty Cone GeoJSON' : 'நிச்சயமற்ற எல்லை வரைபடம்'}</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30 hover:border-cyan-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-5 group-hover:scale-110 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {language === 'en' ? 'TSP Route Planner' : 'உகந்த பயண பாதை'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {language === 'en'
                ? 'Solves shortest visit sequence for cleanup vessels and field teams using 2-opt heuristic TSP and Great-Circle distance matrices.'
                : 'குறைந்த தூரத்தில் அனைத்து இடங்களையும் சுத்தம் செய்ய 2-opt TSP மூலம் மிகக் குறுகிய வழியை உருவாக்குகிறது.'}
            </p>
            <div className="text-[11px] font-semibold text-teal-400 flex items-center space-x-1">
              <span>{language === 'en' ? '2-Opt Local Search' : '2-Opt பாதை உகப்பாக்கம்'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Scientific Integrity Banner */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="glass-panel p-8 rounded-3xl border border-cyan-500/25 bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 text-emerald-400 font-semibold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>{language === 'en' ? 'Scientific Integrity Guarantee' : 'அறிவியல் துல்லியம் உத்தரவாதம்'}</span>
              </div>
              <h3 className="text-xl font-bold text-white">
                {language === 'en' ? 'Zero Fabricated Detections or Made-Up Metrics' : 'உண்மையான AI மற்றும் வெளிப்படையான அளவீடுகள்'}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                {language === 'en'
                  ? 'All detection outputs, bounding coordinates, confidence metrics, and drift forecasts originate directly from genuine neural inference or mathematical hydrodynamic formulations.'
                  : 'அனைத்து அளவீடுகளும் உண்மையான நியூரல் நெட்வொர்க் முடிவுகள் மற்றும் இயற்பியல் நீரோட்ட சமன்பாடுகளிலிருந்து பெறப்படுகின்றன.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shrink-0 shadow-lg shadow-cyan-600/30"
            >
              {language === 'en' ? 'Access Executive Dashboard' : 'டாஷ்போர்டை அணுகவும்'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
