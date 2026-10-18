import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DetectionPage } from './pages/DetectionPage';
import { MapPage } from './pages/MapPage';
import { HotspotsPage } from './pages/HotspotsPage';
import { PredictionPage } from './pages/PredictionPage';
import { CleanupPage } from './pages/CleanupPage';
import { BeforeAfterPage } from './pages/BeforeAfterPage';
import { CitizenReportPage } from './pages/CitizenReportPage';
import { AdminPage } from './pages/AdminPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Language } from './locales/translations';
import { checkHealth } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('aquatrace_lang') as Language) || 'en';
  });
  const [isModelOnline, setIsModelOnline] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [predictionTargetObsId, setPredictionTargetObsId] = useState<string | undefined>();

  // Periodically verify backend health
  useEffect(() => {
    const verifySystem = () => {
      checkHealth()
        .then((res) => setIsModelOnline(res.status === 'online'))
        .catch(() => setIsModelOnline(false));
    };
    verifySystem();
    const interval = setInterval(verifySystem, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('aquatrace_lang', lang);
  };

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigateToPrediction = (obsId: string) => {
    setPredictionTargetObsId(obsId);
    setCurrentTab('prediction');
  };

  return (
    <div className="min-h-screen bg-[#030811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Universal Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        language={language}
        onLanguageChange={handleLanguageChange}
        isModelOnline={isModelOnline}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'landing' && (
          <LandingPage language={language} onNavigate={setCurrentTab} />
        )}
        {currentTab === 'dashboard' && (
          <DashboardPage language={language} onNavigate={setCurrentTab} />
        )}
        {currentTab === 'detection' && (
          <DetectionPage
            language={language}
            onToast={addToast}
            onNavigateToPrediction={handleNavigateToPrediction}
          />
        )}
        {currentTab === 'map' && (
          <MapPage
            language={language}
            onNavigateToPrediction={handleNavigateToPrediction}
          />
        )}
        {currentTab === 'hotspots' && (
          <HotspotsPage
            language={language}
            onToast={addToast}
            onNavigateToCleanup={() => setCurrentTab('cleanup')}
          />
        )}
        {currentTab === 'prediction' && (
          <PredictionPage
            language={language}
            initialObsId={predictionTargetObsId}
            onToast={addToast}
          />
        )}
        {currentTab === 'cleanup' && (
          <CleanupPage
            language={language}
            onToast={addToast}
            onNavigateToBeforeAfter={() => setCurrentTab('beforeAfter')}
          />
        )}
        {currentTab === 'beforeAfter' && (
          <BeforeAfterPage language={language} onToast={addToast} />
        )}
        {currentTab === 'citizenReport' && (
          <CitizenReportPage
            language={language}
            onToast={addToast}
            onNavigateToAdmin={() => setCurrentTab('admin')}
          />
        )}
        {currentTab === 'admin' && (
          <AdminPage language={language} onToast={addToast} />
        )}
        {currentTab === 'analytics' && (
          <AnalyticsPage language={language} onToast={addToast} />
        )}
        {currentTab === 'settings' && (
          <SettingsPage language={language} />
        )}
      </main>

      {/* Persistent Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Footer */}
      <footer className="border-t border-cyan-900/30 bg-navy-950/80 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-300">AquaTrace AI</span>
            <span>•</span>
            <span>Detect. Track. Predict. Protect Our Oceans.</span>
          </div>
          <div className="text-slate-400">
            Engineered with Ultralytics YOLOv8, Leaflet GIS, and Lagrangian Environmental Drift.
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
