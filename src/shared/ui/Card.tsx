import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'outline' | 'primary';
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverable = true, children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface shadow-sm',
      flat: 'bg-surface-secondary',
      outline: 'bg-surface border border-border',
      primary: 'gradient-primary text-white',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl p-4 transition-all duration-200',
          variants[variant],
          hoverable && variant !== 'primary' && 'hover:shadow-md hover:-translate-y-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
