import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'amber';
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
    default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    secondary: 'bg-zinc-900/80 text-zinc-400 border border-zinc-800',
    outline: 'border border-zinc-700 text-zinc-300',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    info: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    amber: 'bg-amber-400/20 text-amber-200 border border-amber-400/40'
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
