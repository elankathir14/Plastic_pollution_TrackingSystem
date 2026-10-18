import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100',
    warning: 'border-amber-500/30 bg-amber-950/40 text-amber-100',
    error: 'border-rose-500/30 bg-rose-950/40 text-rose-100',
    info: 'border-cyan-500/30 bg-cyan-950/40 text-cyan-100'
  };

  return (
    <div
      className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-right ${borders[toast.type]}`}
    >
      <div className="mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold tracking-wide">{toast.title}</h4>
        {toast.message && (
          <p className="text-xs mt-1 text-slate-300 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition-colors p-1"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
