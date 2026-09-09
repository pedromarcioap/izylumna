import React from 'react';

export interface WatermarkProps {
  text?: string;
  enabled?: boolean;
  density?: 'subtle' | 'standard';
}

export const Watermark: React.FC<WatermarkProps> = ({
  text = 'PROVA • FOTÓGRAFO',
  enabled = true,
  density = 'standard'
}) => {
  if (!enabled) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col items-center justify-center overflow-hidden watermark-overlay"
      aria-hidden="true"
    >
      {/* Repeating Diagonal Watermark Grid */}
      <div className="absolute inset-0 flex flex-wrap items-center justify-around opacity-[0.22] rotate-[-25deg] scale-125 select-none pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-white/90 uppercase px-4 py-2 select-none"
          >
            {text}
          </span>
        ))}
      </div>

      {/* Elegant Center Proof Stamp */}
      <div className="relative px-3 py-1.5 rounded bg-black/40 backdrop-blur-xs border border-white/10 text-white/70 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase select-none shadow-sm">
        {text}
      </div>
    </div>
  );
};
