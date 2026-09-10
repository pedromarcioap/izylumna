import React from 'react';

export interface WatermarkProps {
  text?: string;
  enabled?: boolean;
  density?: 'subtle' | 'standard' | 'dense';
  position?: 'grid' | 'center' | 'both' | 'bottom-right';
  opacity?: number;
}

export const Watermark: React.FC<WatermarkProps> = ({
  text = 'PROVA • FOTÓGRAFO',
  enabled = true,
  density = 'standard',
  position = 'both',
  opacity = 0.25
}) => {
  if (!enabled) return null;

  const count = density === 'subtle' ? 8 : density === 'dense' ? 20 : 12;
  const gridOpacity = opacity ?? (density === 'subtle' ? 0.15 : density === 'dense' ? 0.35 : 0.22);

  const showGrid = position === 'grid' || position === 'both';
  const showCenter = position === 'center' || position === 'both';
  const showBottomRight = position === 'bottom-right';

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col items-center justify-center overflow-hidden watermark-overlay"
      aria-hidden="true"
    >
      {/* Repeating Diagonal Watermark Grid */}
      {showGrid && (
        <div
          className="absolute inset-0 flex flex-wrap items-center justify-around rotate-[-25deg] scale-125 select-none pointer-events-none transition-opacity duration-300"
          style={{ opacity: gridOpacity }}
        >
          {Array.from({ length: count }).map((_, i) => (
            <span
              key={i}
              className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-white/90 uppercase px-4 py-2 select-none"
            >
              {text}
            </span>
          ))}
        </div>
      )}

      {/* Elegant Center Proof Stamp */}
      {showCenter && (
        <div
          className="relative px-3 py-1.5 rounded bg-black/50 backdrop-blur-xs border border-white/15 text-white/85 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase select-none shadow-sm transition-all"
          style={{ opacity: Math.min(1, gridOpacity * 2.5 + 0.3) }}
        >
          {text}
        </div>
      )}

      {/* Bottom Right Stamp */}
      {showBottomRight && (
        <div
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-xs border border-white/15 text-white/90 text-[10px] font-semibold tracking-wider uppercase select-none shadow-md"
          style={{ opacity: Math.min(1, gridOpacity * 2.5 + 0.3) }}
        >
          {text}
        </div>
      )}
    </div>
  );
};
