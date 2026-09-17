import React from 'react';

export interface ProgressProps {
  value: number; // e.g. current selected count
  max: number; // quota limit
  color?: 'default' | 'amber' | 'cyan' | 'rose' | 'primary';
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
      <div className="h-2 w-full rounded-full overflow-hidden flex bg-walnut-800/80 border border-brand-dark/40">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isExcess
              ? 'bg-gradient-to-r from-brand-flame to-brand-accent'
              : percentage === 100
              ? 'bg-brand-cyan shadow-sm shadow-[#46BDC6]/30'
              : 'bg-gradient-to-r from-brand-primary to-brand-cyan'
          }`}
          style={{ width: `${percentage}%` }}
        />
        {showExcessIndicator && isExcess && (
          <div
            className="h-full bg-brand-accent animate-pulse transition-all duration-300"
            style={{ width: `${Math.min(100, ((value - max) / max) * 100)}%` }}
          />
        )}
      </div>
    </div>
  );
};
