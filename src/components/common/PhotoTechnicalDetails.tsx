import React, { useState } from 'react';
import { PhotoMetadata } from '../../types';
import { Info, Camera, Sliders, X, Aperture, Clock, Zap, Maximize2 } from 'lucide-react';

export interface PhotoTechnicalDetailsProps {
  metadata?: PhotoMetadata | null;
  className?: string;
}

/**
 * Checks whether metadata contains at least one non-null technical detail.
 */
export function hasExifData(metadata?: PhotoMetadata | null): boolean {
  if (!metadata) return false;
  return Boolean(
    metadata.camera ||
    metadata.lens ||
    metadata.f_stop ||
    metadata.shutter_speed ||
    metadata.iso ||
    metadata.focal_length
  );
}

export const PhotoTechnicalDetails: React.FC<PhotoTechnicalDetailsProps> = ({
  metadata,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Defensive check: Hide completely if no EXIF data available
  if (!hasExifData(metadata)) {
    return null;
  }

  const cameraModel = metadata?.camera?.trim();
  const lensModel = metadata?.lens?.trim();

  let cameraLensText = 'Câmera & Lente';
  if (cameraModel && lensModel) {
    cameraLensText = `${cameraModel} - ${lensModel}`;
  } else if (cameraModel) {
    cameraLensText = cameraModel;
  } else if (lensModel) {
    cameraLensText = lensModel;
  }

  const shootingValues = [
    metadata?.focal_length,
    metadata?.f_stop,
    metadata?.shutter_speed,
    metadata?.iso
  ].filter(Boolean);

  const formattedDate = metadata?.taken_at
    ? new Date(metadata.taken_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Subtle Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 select-none ${
          isOpen
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-300 border-zinc-750 hover:border-zinc-600'
        }`}
        title="Ver Detalhes do Disparo (Dados EXIF)"
        aria-expanded={isOpen}
      >
        <Info className={`w-3.5 h-3.5 ${isOpen ? 'text-amber-400' : 'text-zinc-400'}`} />
        <span>Detalhes do Disparo</span>
      </button>

      {/* Popover Card & Mobile Bottom-Sheet */}
      {isOpen && (
        <>
          {/* Backdrop click listener on mobile */}
          <div
            className="fixed inset-0 z-40 sm:hidden bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          {/* Desktop Floating Card (positioned floating above/beside button) */}
          <div
            className="hidden sm:block absolute bottom-full mb-3 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 z-50 w-80 p-4 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
            onMouseLeave={() => setIsOpen(false)}
          >
            {/* Header: Camera & Lens */}
            <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100 leading-snug truncate max-w-[200px]">
                    {cameraLensText}
                  </h4>
                  {formattedDate && (
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shooting Line: Organized side-by-side values */}
            {shootingValues.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                  Configuração de Captura
                </span>
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-amber-300">
                  {shootingValues.map((val, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-zinc-600 font-normal">|</span>}
                      <span className="font-semibold">{val}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Bottom-Sheet Drawer (Subtle, non-intrusive) */}
          <div className="sm:hidden fixed inset-x-4 bottom-24 z-50 p-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-2xl shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">{cameraLensText}</h4>
                  {formattedDate && (
                    <span className="text-[10px] text-zinc-400 block">{formattedDate}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shootingValues.length > 0 && (
              <div className="flex items-center justify-around p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-300">
                {shootingValues.map((val, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-zinc-700 font-normal">|</span>}
                    <span className="font-semibold">{val}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
