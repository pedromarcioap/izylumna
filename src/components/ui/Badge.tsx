import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'cyan' | 'amber' | 'accent' | 'flame' | 'ochre' | 'dark';
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
    // Default & Institutional Ultra Violet (#8300E9)
    default: 'bg-brand-primary/15 text-brand-primary dark:text-purple-300 border border-brand-primary/30',
    primary: 'bg-brand-primary text-white border border-brand-primary/40 shadow-xs',
    secondary: 'bg-walnut-800 text-walnut-300 border border-walnut-700',
    outline: 'border border-brand-primary/40 text-brand-primary dark:text-walnut-200',
    // Strong Cyan Positive Status (#46BDC6)
    success: 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30',
    cyan: 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30',
    // Amber Gold Highlight / Favorite (#FDBD00) -> WCAG AAA: ALWAYS #160F29 text
    warning: 'bg-brand-accent text-brand-dark font-bold border border-[#160F29]/30 shadow-xs',
    amber: 'bg-brand-accent text-brand-dark font-bold border border-[#160F29]/30 shadow-xs',
    accent: 'bg-brand-accent text-brand-dark font-bold border border-[#160F29]/30 shadow-xs',
    // Blazing Flame Warm Alert (#F94713)
    info: 'bg-brand-flame/15 text-brand-flame border border-brand-flame/30',
    flame: 'bg-brand-flame text-white border border-brand-flame/30',
    ochre: 'bg-brand-flame text-white border border-brand-flame/30',
    // Midnight Obsidian (#160F29)
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
