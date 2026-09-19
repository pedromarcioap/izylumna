import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onClose?: (id: string) => void;
  duration?: number;
}

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: (id: string) => void;
  defaultDuration?: number;
}> = ({ toast, onDismiss, defaultDuration = 4000 }) => {
  const dismiss = () => {
    onDismiss(toast.id);
  };

  useEffect(() => {
    const timeout = toast.duration ?? defaultDuration;
    if (timeout > 0) {
      const timer = setTimeout(() => {
        dismiss();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, defaultDuration]);

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    info: <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
  };

  const borderMap = {
    success: 'border-emerald-500/40 bg-[#120E22]/95 text-zinc-100',
    warning: 'border-amber-500/40 bg-[#120E22]/95 text-zinc-100',
    error: 'border-rose-500/40 bg-[#120E22]/95 text-zinc-100',
    info: 'border-purple-500/40 bg-[#120E22]/95 text-zinc-100'
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl shadow-black/60 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${borderMap[toast.type]}`}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="text-zinc-400 hover:text-white p-1 rounded transition-colors shrink-0"
        aria-label="Dispensar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss, onClose, duration }) => {
  if (toasts.length === 0) return null;

  const handleDismiss = (id: string) => {
    if (onDismiss) onDismiss(id);
    if (onClose) onClose(id);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} defaultDuration={duration} />
      ))}
    </div>
  );
};

