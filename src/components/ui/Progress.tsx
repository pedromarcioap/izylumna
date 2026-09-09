import React from 'react';

export interface ProgressProps {
  value: number; // e.g. current selected count
  max: number; // quota limit
  color?: 'default' | 'amber' | 'emerald' | 'rose';
  className?: string;
  showExcessIndicator?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max,
  className = '',
  showExcessIndicator = true
}) => {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const isExcess = value > max;

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 w-full bg-zinc-850 rounded-full overflow-hidden flex bg-zinc-800/80 border border-zinc-700/50">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isExcess
              ? 'bg-gradient-to-r from-amber-500 to-amber-400'
              : percentage === 100
              ? 'bg-emerald-500'
              : 'bg-gradient-to-r from-zinc-300 to-amber-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
        {showExcessIndicator && isExcess && (
          <div
            className="h-full bg-amber-400/90 animate-pulse transition-all duration-300"
            style={{ width: `${Math.min(100, ((value - max) / max) * 100)}%` }}
          />
        )}
      </div>
    </div>
  );
};
