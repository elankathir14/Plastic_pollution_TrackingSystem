import React, { useState, useRef } from 'react';
import {
  Upload,
  Scan,
  AlertTriangle,
  CheckCircle2,
  Download,
  Info,
  Sliders,
  MapPin,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Eye,
  Camera
} from 'lucide-react';
import { DetectionRecord } from '../types';
import { analyzeImage } from '../services/api';
import { Language, translations } from '../locales/translations';

interface DetectionPageProps {
  language: Language;
  onToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
  onNavigateToPrediction?: (obsId: string) => void;
}

export const DetectionPage: React.FC<DetectionPageProps> = ({
  language,
  onToast,
  onNavigateToPrediction
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState<number>(0.28);
  const [customLat, setCustomLat] = useState<string>('');
  const [customLon, setCustomLon] = useState<string>('');
  const [customLocName, setCustomLocName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<DetectionRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) {
      onToast('warning', language === 'en' ? 'No image selected' : 'படம் தேர்ந்தெடுக்கப்படவில்லை');
      return;
    }

    try {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('confidence_threshold', confThreshold.toString());

      if (customLat && customLon) {
        formData.append('latitude', customLat);
        formData.append('longitude', customLon);
      }
      if (customLocName) {
        formData.append('location_name', customLocName);
      }

      const res = await analyzeImage(formData);
      setResult(res);

      if (res.quality && res.quality.is_blurry) {
        onToast(
          'warning',
          language === 'en' ? 'Image Blur Detected' : 'படம் மங்கலாக உள்ளது',
          res.quality.warnings[0] || 'Low focal clarity might obscure small debris.'
        );
      } else {
        onToast(
          'success',
          language === 'en' ? 'Analysis Complete' : 'ஆய்வு முடிந்தது',
          language === 'en'
            ? `Identified ${res.total_objects} marine litter items.`
            : `${res.total_objects} கழிவுகள் கண்டறியப்பட்டன.`
        );
      }
    } catch (err: any) {
      onToast(
        'error',
        language === 'en' ? 'Analysis Failed' : 'ஆய்வு தோல்வி',
        err.message || 'Error executing AI model inference.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadReportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquatrace_forensic_report_${result.observation_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {t.detection.uploadTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
          {t.detection.uploadDesc}
        </p>
      </div>

      {/* Main Grid: Upload & Controls (Left), Visual Results & Explainability (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel p-6 rounded-2xl border-2 border-dashed border-cyan-700/40 hover:border-cyan-400 cursor-pointer transition-all text-center group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Selected upload"
                  className="max-h-60 mx-auto rounded-lg object-contain shadow-md"
                />
                <p className="text-xs text-slate-400">
                  {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
                <p className="text-[11px] text-cyan-400 font-semibold group-hover:underline">
                  {language === 'en' ? 'Click or drop another image to replace' : 'வேறு படத்தை மாற்ற கிளிக் செய்யவும்'}
                </p>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white">{t.detection.dropzoneText}</h4>
                <p className="text-xs text-slate-400">{t.detection.formatsSupported}</p>
              </div>
            )}
          </div>

          {/* Configurable Parameters */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-900/30 space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>{language === 'en' ? 'Inference Configuration' : 'AI அளவுருக்கள்'}</span>
            </div>

            {/* Confidence Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">{t.detection.confidenceThreshold}</span>
                <span className="font-bold text-cyan-400">{Math.round(confThreshold * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.15"
                max="0.85"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {language === 'en'
                  ? 'Lower threshold (20-30%) captures faint partially buried plastics; higher (45%+) minimizes false positives.'
                  : 'குறைந்த வரம்பு சிறிய கழிவுகளை கண்டறியும்; அதிக வரம்பு தவறான கண்டறிதல்களை தவிர்க்கும்.'}
              </p>
            </div>

            {/* Optional Geotag Override */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">
                {language === 'en' ? 'Location Coordinates (Optional GPS Override)' : 'ஜி.பி.எஸ் ஆயத்தொலைவுகள் (விருப்பத்திற்குரியது)'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Latitude (e.g. 13.0500)"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Longitude (e.g. 80.2824)"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <input
                type="text"
                placeholder="Beach / Shoreline Name (e.g. Marina Beach, Chennai)"
                value={customLocName}
                onChange={(e) => setCustomLocName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={runAnalysis}
              disabled={!selectedFile || isAnalyzing}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
                !selectedFile || isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.detection.analyzing}</span>
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  <span>{t.detection.analyzeBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Results (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Annotated Image Box */}
              <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">{t.detection.annotatedResult}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-xs font-bold text-cyan-300">
                    {result.total_objects} {language === 'en' ? 'Objects Detected' : 'பொருட்கள்'}
                  </span>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={result.annotated_image_url || result.image_url}
                    alt="AI Annotated Output"
                    className="w-full max-h-[460px] object-contain mx-auto"
                  />
                </div>

                {/* Object Category Pills */}
                {Object.keys(result.detected_counts).length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Object.entries(result.detected_counts).map(([cat, count]) => (
                      <div
                        key={cat}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                      >
                        <span className="font-semibold text-white capitalize">
                          {cat.replace('_', ' ')}:
                        </span>
                        <span className="font-bold text-cyan-400">{count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {language === 'en'
                      ? 'No supported marine plastic debris was identified above the configured confidence threshold.'
                      : 'தேர்ந்தெடுக்கப்பட்ட வரம்பில் நெகிழி குப்பைகள் எதுவும் கண்டறியப்படவில்லை.'}
                  </p>
                )}

                {/* Quality & Warnings Alert */}
                {result.quality && (
                  <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                    result.quality.is_blurry
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}>
                    <div className="flex items-center space-x-2 font-semibold">
                      {result.quality.is_blurry ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>
                        {language === 'en' ? 'Quality Score' : 'படத்தின் தரம்'}:{' '}
                        <strong>{Math.round(result.quality.quality_score * 100)}% ({result.quality.quality_grade})</strong>
                      </span>
                      <span className="text-slate-500">•</span>
                      <span>Laplacian: {result.quality.blur_variance}</span>
                    </div>
                    {result.quality.warnings.map((w, idx) => (
                      <p key={idx} className="text-[11px] text-amber-300/90 pl-6">
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Download Annotated & Forensic Report */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={result.annotated_image_url || result.image_url}
                    download={`annotated_${result.observation_id}.jpg`}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.detection.downloadAnnotated}</span>
                  </a>

                  <button
                    onClick={downloadReportJson}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.detection.downloadReport}</span>
                  </button>

                  {onNavigateToPrediction && (
                    <button
                      onClick={() => onNavigateToPrediction(result.observation_id)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-xs font-semibold transition-all ml-auto"
                    >
                      <span>{language === 'en' ? 'Forecast Drift Path' : 'நகர்வை கணி'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Explainable AI (XAI) Insight Panel */}
              {result.explainable_ai && (
                <div className="glass-panel p-5 rounded-2xl border border-cyan-900/30 space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider">
                    <Info className="w-4 h-4" />
                    <span>{t.detection.explainableTitle}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Model</span>
                      <span className="font-bold text-white">{result.explainable_ai.model_name}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Inference Latency</span>
                      <span className="font-bold text-white">{result.explainable_ai.inference_time_ms} ms</span>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Reliability</span>
                      <span className="font-bold text-emerald-400">{result.explainable_ai.reliability_assessment}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-300 block">Key Decision Factors:</span>
                    <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                      {result.explainable_ai.key_factors.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Model Limitation Disclosure: </strong>
                    {result.explainable_ai.model_limitations.join(' ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">
                {language === 'en' ? 'Awaiting Coastal Imagery' : 'பட பதிவேற்றத்திற்கு காத்திருக்கிறது'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'en'
                  ? 'Select or drop a photograph above to execute neural computer vision and inspect bounding coordinates.'
                  : 'புகைப்படத்தை பதிவேற்றி AI ஆய்வை தொடங்கவும்.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
