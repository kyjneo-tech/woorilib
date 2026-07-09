import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge = ({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    primary: 'bg-primary-soft text-primary',
    secondary: 'bg-secondary-light text-secondary-dark',
    accent: 'bg-accent-soft text-accent',
    outline: 'border border-border text-text-secondary',
    neutral: 'bg-surface-secondary text-text-muted',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-lg font-medium transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
