import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cyan' | 'emerald' | 'amber' | 'accent' | 'flame' | 'dark' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-walnut-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none rounded-lg';

  const variantClasses = {
    // Primary CTAs (Ultra Violet #8300E9 - Luxury & Creativity)
    primary: 'bg-brand-primary text-white hover:bg-[#6E00C4] shadow-sm hover:shadow-md shadow-[#8300E9]/25',
    // Strong Cyan Support & Positive Action (#46BDC6)
    cyan: 'bg-brand-cyan text-white hover:bg-[#3AA3AC] shadow-sm shadow-[#46BDC6]/25',
    emerald: 'bg-brand-cyan text-white hover:bg-[#3AA3AC] shadow-sm shadow-[#46BDC6]/25',
    // Blazing Flame Dynamic Action (#F94713)
    flame: 'bg-brand-flame text-white hover:bg-[#DF3908] shadow-sm shadow-[#F94713]/25',
    secondary: 'bg-brand-flame text-white hover:bg-[#DF3908] border border-brand-flame/30 shadow-sm',
    // Amber Gold Highlight (#FDBD00 with mandatory #160F29 Midnight Obsidian text for WCAG AAA contrast)
    amber: 'bg-brand-accent text-brand-dark font-bold hover:bg-[#E5AA00] shadow-md shadow-[#FDBD00]/25 border border-[#160F29]/20',
    accent: 'bg-brand-accent text-brand-dark font-bold hover:bg-[#E5AA00] shadow-md shadow-[#FDBD00]/25 border border-[#160F29]/20',
    // Midnight Obsidian Dark (#160F29)
    dark: 'bg-brand-dark text-white hover:bg-[#0F0A1C] border border-brand-dark/40 shadow-sm',
    // Outline & Ghost
    outline: 'border border-brand-primary/40 bg-transparent text-brand-primary dark:text-walnut-200 hover:bg-brand-primary/10 hover:border-brand-primary',
    ghost: 'text-walnut-400 hover:text-brand-primary dark:hover:text-brand-cyan hover:bg-brand-primary/10',
    // Danger
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
    icon: 'h-9 w-9 p-0'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};
