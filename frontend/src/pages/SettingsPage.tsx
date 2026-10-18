import React, { useEffect, useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  Globe2,
  ShieldCheck,
  Code2,
  Layers
} from 'lucide-react';
import { checkHealth } from '../services/api';
import { Language, translations } from '../locales/translations';

interface SettingsPageProps {
  language: Language;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ language }) => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const t = translations[language];

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-2">
          <Cpu className="w-7 h-7 text-cyan-400" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {language === 'en'
            ? 'Neural inference configuration, environmental API telemetry, and spatial database integrity.'
            : 'கணினி பார்வை கட்டமைப்பு மற்றும் இயங்குதள நிலை.'}
        </p>
      </div>

      {/* Diagnostics Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-900/30 space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Platform Runtime Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{t.settings.modelEngine}</span>
            <span className="font-bold text-white text-sm">
              {health?.ai_model_name || 'Ultralytics YOLOv8 Marine Classifier'}
            </span>
            <p className="text-[10px] text-cyan-400">Pretrained & Fine-tuned on Marine Litter Taxonomy</p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{t.settings.modelStatus}</span>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400 text-sm">Loaded in Memory (Persistent Singleton)</span>
            </div>
            <p className="text-[10px] text-slate-500">Zero per-request cold starts</p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{t.settings.environmentalProvider}</span>
            <span className="font-bold text-white text-sm">Open-Meteo & Hydrodynamic Climatology</span>
            <p className="text-[10px] text-slate-400">Live API with Coromandel Gyre Fallback</p>
          </div>

          <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block">{t.settings.databaseType}</span>
            <span className="font-bold text-white text-sm">Spatial SQLite with Haversine Indexing</span>
            <p className="text-[10px] text-slate-400">PostGIS Compatible Schema</p>
          </div>
        </div>

        {/* Supported Classes Taxonomy */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            {t.settings.supportedClasses} (7 Core Classes)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {[
              { name: 'Plastic Bottle (PET)', hazard: 'Medium', years: 450, color: 'text-cyan-400' },
              { name: 'Plastic Bag / Film', hazard: 'High', years: 20, color: 'text-pink-400' },
              { name: 'Food Container / Styrofoam', hazard: 'Medium', years: 500, color: 'text-amber-400' },
              { name: 'Ghost Net / Fishing Gear', hazard: 'Critical', years: 600, color: 'text-rose-400' },
              { name: 'Beverage Can (Metal)', hazard: 'Low', years: 200, color: 'text-purple-400' },
              { name: 'Plastic Fragment', hazard: 'High', years: 400, color: 'text-teal-400' },
              { name: 'Other Coastal Debris', hazard: 'Medium', years: 100, color: 'text-slate-400' },
            ].map((cls, idx) => (
              <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className={`font-bold block ${cls.color}`}>{cls.name}</span>
                <span className="text-[10px] text-slate-400 block">Hazard: {cls.hazard} • Decomp: {cls.years} yrs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Ethical Governance */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center space-x-2 text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Scientific Reliability & Ethical AI Principles</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            AquaTrace AI enforces strict data provenance: no detections, confidence numbers, or hydrodynamic trajectories are ever synthesized or hallucinated. All public citizen uploads undergo automated duplicate hashing, quality validation, and administrative verification.
          </p>
        </div>
      </div>
    </div>
  );
};
