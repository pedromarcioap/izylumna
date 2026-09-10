import React from 'react';
import { ToastMessage } from '../../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-5 h-5 text-brand-ochre shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          info: <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
        };

        const borderMap = {
          success: 'border-brand-emerald/40 bg-walnut-900/95 text-walnut-100',
          warning: 'border-brand-ochre/40 bg-walnut-900/95 text-walnut-100',
          error: 'border-rose-500/40 bg-walnut-900/95 text-walnut-100',
          info: 'border-brand-primary/40 bg-walnut-900/95 text-walnut-100'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl shadow-black/60 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${borderMap[toast.type]}`}
          >
            {iconMap[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-walnut-100">{toast.title}</h4>
              {toast.description && (
                <p className="text-xs text-walnut-300 mt-1 leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-walnut-400 hover:text-walnut-100 p-1 rounded transition-colors"
              aria-label="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
