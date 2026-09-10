import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'amber' | 'accent' | 'ochre' | 'dark';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full tracking-wide transition-colors whitespace-nowrap';

  const variantClasses = {
    // Default & Institutional Turf Green (#01743F)
    default: 'bg-brand-primary/15 text-brand-primary dark:text-emerald-300 border border-brand-primary/30',
    primary: 'bg-brand-primary text-white border border-brand-primary/40 shadow-xs',
    secondary: 'bg-walnut-800 text-walnut-300 border border-walnut-700',
    outline: 'border border-brand-primary/40 text-brand-primary dark:text-walnut-200',
    // Emerald Positive Status (#4CB963)
    success: 'bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30',
    // Bright Lemon Highlight / Warning / Favorite (#FEF600) -> STRICT WCAG AAA: ALWAYS #4F3926 Deep Walnut text
    warning: 'bg-brand-accent text-brand-dark font-bold border border-[#4F3926]/30 shadow-xs',
    amber: 'bg-brand-accent text-brand-dark font-bold border border-[#4F3926]/30 shadow-xs',
    accent: 'bg-brand-accent text-brand-dark font-bold border border-[#4F3926]/30 shadow-xs',
    // Warm Ochre (#D57720)
    info: 'bg-brand-ochre/15 text-brand-ochre border border-brand-ochre/30',
    ochre: 'bg-brand-ochre text-white border border-brand-ochre/30',
    // Deep Walnut (#4F3926)
    dark: 'bg-brand-dark text-walnut-100 border border-brand-dark/50'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] leading-tight',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
      {children}
    </div>
  );
};
