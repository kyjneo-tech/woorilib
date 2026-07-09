import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body1' | 'body2' | 'caption' | 'tiny';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'default' | 'secondary' | 'muted' | 'white' | 'primary';
  as?: React.ElementType;
}

export const Typography = ({
  className,
  variant = 'body1',
  weight,
  color = 'default',
  as,
  children,
  ...props
}: TypographyProps) => {
  const Component = (as || (['h1', 'h2', 'h3', 'h4'].includes(variant) ? variant : 'p')) as any;

  const variants = {
    h1: 'text-3xl font-bold tracking-tight',
    h2: 'text-2xl font-bold tracking-tight',
    h3: 'text-xl font-bold',
    h4: 'text-lg font-bold',
    body1: 'text-base',
    body2: 'text-sm',
    caption: 'text-xs',
    tiny: 'text-[10px]',
  };

  const colors = {
    default: 'text-text',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    white: 'text-white',
    primary: 'text-primary',
  };

  const weights = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  return (
    <Component
      className={cn(
        variants[variant],
        color && colors[color],
        weight && weights[weight],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
