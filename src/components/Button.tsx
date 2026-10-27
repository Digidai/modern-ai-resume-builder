import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'success' | 'icon' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: 'bg-ink text-paper hover:bg-ink-hover',
  secondary: 'border border-ink bg-transparent text-ink hover:bg-ink/5',
  ghost: 'text-accent underline decoration-1 underline-offset-4 hover:decoration-2',
  danger: 'bg-danger text-paper hover:opacity-90',
  'danger-ghost': 'text-muted hover:bg-danger/10 hover:text-danger',
  success: 'border border-success/40 text-success hover:bg-success/10',
  icon: 'text-muted hover:bg-ink/5 hover:text-ink',
  dark: 'bg-ink text-paper hover:bg-ink-hover',
};

const sizes = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  type = 'button',
  ...props
}) => {
  // Icon buttons are square unless a size is given explicitly.
  const resolvedSize = variant === 'icon' && size === 'md' ? 'icon' : size;
  const rounded = 'rounded-[2px]';

  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        disabled:pointer-events-none disabled:opacity-50
        ${variants[variant]} ${sizes[resolvedSize]} ${rounded} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon && <span className="flex items-center">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="flex items-center">{rightIcon}</span>}
    </button>
  );
};
