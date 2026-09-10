import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-walnut-950/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div
        className={`relative z-10 w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col bg-walnut-800 border border-brand-dark/50 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden my-auto`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || description) && (
          <div className="shrink-0 flex items-start justify-between p-5 sm:p-6 border-b border-brand-dark/40 bg-walnut-800 z-10">
            <div className="min-w-0 pr-4">
              {title && <h2 className="text-xl font-semibold text-walnut-100 tracking-tight">{title}</h2>}
              {description && <p className="text-sm text-walnut-400 mt-1">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-walnut-400 hover:text-walnut-100 hover:bg-walnut-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-emerald shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
