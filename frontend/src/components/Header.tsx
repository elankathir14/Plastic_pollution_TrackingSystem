import React, { useState } from 'react';
import {
  Waves,
  LayoutDashboard,
  Scan,
  MapPin,
  Flame,
  Wind,
  Navigation,
  Compass,
  GitCompare,
  UserCheck,
  ShieldCheck,
  Database,
  Cpu,
  Globe2,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../locales/translations';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isModelOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  language,
  onLanguageChange,
  isModelOnline
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'detection', label: t.nav.detection, icon: Scan },
    { id: 'map', label: t.nav.map, icon: MapPin },
    { id: 'hotspots', label: t.nav.hotspots, icon: Flame },
    { id: 'prediction', label: t.nav.prediction, icon: Wind },
    { id: 'cleanup', label: t.nav.cleanup, icon: Compass },
    { id: 'beforeAfter', label: t.nav.beforeAfter, icon: GitCompare },
    { id: 'citizenReport', label: t.nav.citizenReport, icon: UserCheck },
    { id: 'admin', label: t.nav.admin, icon: ShieldCheck },
    { id: 'analytics', label: t.nav.analytics, icon: Database },
    { id: 'settings', label: t.nav.settings, icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-xl border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onTabChange('landing')}
          >
            <div className="relative p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-300">
              <Waves className="w-6 h-6 text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-300 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent">
                  {t.title}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Controls: Language Switcher, AI Status & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            {/* AI Status Badge */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isModelOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 text-[11px] font-medium">
                {isModelOnline ? 'YOLOv8 Online' : 'AI Initializing'}
              </span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  language === 'en'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ta')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  language === 'ta'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="தமிழுக்கு மாறவும் (Tamil)"
              >
                தமிழ்
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950/95 border-b border-cyan-900/40 px-4 pt-2 pb-6 space-y-1.5 animate-in slide-in-from-top">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                      : 'text-slate-300 bg-slate-900/40 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
