import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'accent' | 'dark' | 'outline' | 'ghost' | 'danger';
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
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2 focus-visible:ring-offset-walnut-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none rounded-lg';

  const variantClasses = {
    // Primary CTAs (Turf Green #01743F)
    primary: 'bg-brand-primary text-white hover:bg-[#015c32] shadow-sm hover:shadow-md shadow-[#01743F]/20',
    // Emerald Support & Positive Action (#4CB963)
    emerald: 'bg-brand-emerald text-white hover:bg-[#3ea054] shadow-sm shadow-[#4CB963]/20',
    // Secondary Warm Action (Ochre #D57720)
    secondary: 'bg-brand-ochre text-white hover:bg-[#b86218] border border-brand-ochre/30 shadow-sm',
    // Bright Lemon Highlight (#FEF600 with mandatory #4F3926 Deep Walnut text for WCAG AAA contrast)
    amber: 'bg-brand-accent text-brand-dark font-bold hover:bg-[#e6dd00] shadow-md shadow-[#FEF600]/20 border border-[#4F3926]/20',
    accent: 'bg-brand-accent text-brand-dark font-bold hover:bg-[#e6dd00] shadow-md shadow-[#FEF600]/20 border border-[#4F3926]/20',
    // Deep Walnut Dark (#4F3926)
    dark: 'bg-brand-dark text-white hover:bg-[#3b2a1c] border border-brand-dark/40 shadow-sm',
    // Outline & Ghost
    outline: 'border border-brand-primary/40 bg-transparent text-brand-primary dark:text-walnut-200 hover:bg-brand-primary/10 hover:border-brand-primary',
    ghost: 'text-walnut-400 hover:text-brand-primary dark:hover:text-brand-emerald hover:bg-brand-primary/10',
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
