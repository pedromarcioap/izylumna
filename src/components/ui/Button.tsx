import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
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
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none rounded-lg';

  const variantClasses = {
    primary: 'bg-zinc-100 text-zinc-950 hover:bg-white shadow-sm hover:shadow',
    secondary: 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-750',
    outline: 'border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800/80 hover:text-white',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-semibold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500'
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
