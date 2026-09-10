import React, { useState } from 'react';
import { PhotoMetadata } from '../../types';
import { getEffectiveExif } from '../../lib/exif';
import { Info, Camera, Aperture, Clock, Zap, X, Sliders } from 'lucide-react';

export interface PhotoTechnicalDetailsProps {
  metadata?: PhotoMetadata | null;
  photoSeed?: string;
  className?: string;
  /**
   * Mode:
   * - 'badge': Compact frosted overlay badge with basic camera info + popover expansion on click
   * - 'popover': Button trigger opening rich floating EXIF card
   * - 'banner': Full horizontal frosted line (ideal for Lightbox footer/header)
   */
  variant?: 'popover' | 'badge' | 'banner';
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
  photoSeed = 'exif-default',
  className = '',
  variant = 'popover'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Get effective metadata (uses real EXIF if available, or deterministic plausible fallback)
  const exif = getEffectiveExif(metadata, photoSeed);

  const cameraModel = exif.camera?.trim();
  const lensModel = exif.lens?.trim();

  let cameraLensText = 'Câmera & Lente';
  if (cameraModel && lensModel) {
    cameraLensText = `${cameraModel} • ${lensModel}`;
  } else if (cameraModel) {
    cameraLensText = cameraModel;
  } else if (lensModel) {
    cameraLensText = lensModel;
  }

  const shootingValues = [
    exif.focal_length,
    exif.f_stop,
    exif.shutter_speed,
    exif.iso
  ].filter(Boolean);

  const formattedDate = exif.taken_at
    ? new Date(exif.taken_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Render Horizontal Banner (Used in Lightbox header or footer)
  if (variant === 'banner') {
    return (
      <div
        className={`flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full bg-walnut-950/80 backdrop-blur-md border border-walnut-800/80 text-xs text-walnut-200 select-none shadow-md ${className}`}
      >
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[180px] sm:max-w-[240px] font-semibold">
            {cameraModel || 'Câmera'}
          </span>
        </div>

        {shootingValues.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-walnut-300 border-l border-walnut-800 pl-2">
            {shootingValues.map((val, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-walnut-600 font-normal">•</span>}
                <span className="font-semibold text-amber-300/90">{val}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Compact Overlay Badge (Used on Photo Cards in Grid)
  if (variant === 'badge') {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-walnut-950/85 hover:bg-walnut-900 text-walnut-200 border border-walnut-800/80 hover:border-amber-500/40 backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md active:scale-95 group"
          title="Ver Metadados EXIF da Foto"
        >
          <Camera className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-walnut-200 font-semibold truncate max-w-[120px] hidden sm:inline">
            {cameraModel?.split(' ')[0] || 'EXIF'}
          </span>
          <span className="text-amber-300/90 font-medium">
            {exif.f_stop || exif.shutter_speed || 'EXIF'}
          </span>
        </button>

        {isOpen && (
          <div
            className="absolute bottom-full mb-2 left-0 z-50 w-72 p-3.5 bg-walnut-950/95 backdrop-blur-xl border border-walnut-800 rounded-xl shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 border-b border-walnut-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-walnut-100 truncate max-w-[180px]">
                    {cameraLensText}
                  </h4>
                  {formattedDate && (
                    <span className="text-[10px] text-walnut-400 block">{formattedDate}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-walnut-500 hover:text-walnut-300 p-1 rounded-md hover:bg-walnut-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {shootingValues.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-walnut-900/90 border border-walnut-800 text-[11px] font-mono text-amber-300">
                {shootingValues.map((val, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-walnut-600 font-normal">•</span>}
                    <span className="font-semibold">{val}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default Popover Mode
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Subtle Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setIsOpen(true)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 select-none ${
          isOpen
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'bg-walnut-950/80 hover:bg-walnut-900 text-walnut-200 border-walnut-800 hover:border-walnut-700'
        }`}
        title="Ver Detalhes do Disparo (Dados EXIF)"
        aria-expanded={isOpen}
      >
        <Camera className={`w-3.5 h-3.5 ${isOpen ? 'text-amber-400' : 'text-amber-400/80'}`} />
        <span>EXIF</span>
      </button>

      {/* Floating Card & Mobile Bottom Sheet */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 sm:hidden bg-black/50 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="hidden sm:block absolute bottom-full mb-3 right-0 z-50 w-80 p-4 bg-walnut-950/95 backdrop-blur-xl border border-walnut-800 rounded-2xl shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
            onMouseLeave={() => setIsOpen(false)}
          >
            {/* Header: Camera & Lens */}
            <div className="flex items-start justify-between gap-2 border-b border-walnut-800/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-walnut-100 leading-snug truncate max-w-[200px]">
                    {cameraLensText}
                  </h4>
                  {formattedDate && (
                    <span className="text-[10px] text-walnut-400 block mt-0.5">
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-walnut-500 hover:text-walnut-300 p-1 rounded-lg hover:bg-walnut-900 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Shooting Line: Organized values */}
            {shootingValues.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-walnut-400 uppercase tracking-wider block">
                  Configuração do Disparo
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-walnut-900/90 border border-walnut-800 text-xs font-mono text-amber-300">
                  {shootingValues.map((val, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-walnut-600 font-normal">|</span>}
                      <span className="font-semibold">{val}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile Sheet */}
          <div className="sm:hidden fixed inset-x-4 bottom-24 z-50 p-4 bg-walnut-950/95 backdrop-blur-2xl border border-walnut-800 rounded-2xl shadow-2xl space-y-3 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between border-b border-walnut-800/80 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-walnut-100">{cameraLensText}</h4>
                  {formattedDate && (
                    <span className="text-[10px] text-walnut-400 block">{formattedDate}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-walnut-400 hover:text-walnut-200 p-1 rounded-lg bg-walnut-900 border border-walnut-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shootingValues.length > 0 && (
              <div className="flex items-center justify-around p-2.5 rounded-xl bg-walnut-900 border border-walnut-800 text-xs font-mono text-amber-300">
                {shootingValues.map((val, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-walnut-700 font-normal">|</span>}
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
