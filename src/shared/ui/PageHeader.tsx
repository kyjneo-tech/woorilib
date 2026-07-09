'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Typography } from './Typography';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export const PageHeader = ({ title, showBack = true, rightAction, transparent = false }: PageHeaderProps) => {
  const router = useRouter();

  return (
    <header 
      className={`sticky top-0 z-30 flex items-center justify-between px-4 h-14 transition-all ${
        transparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md border-b border-border'
      }`}
    >
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-secondary active:scale-90 transition-all"
          >
            <span className="text-xl">←</span>
          </button>
        )}
        <Typography variant="h3" className="truncate max-w-[200px]">
          {title}
        </Typography>
      </div>
      
      {rightAction && (
        <div className="flex items-center">
          {rightAction}
        </div>
      )}
    </header>
  );
};
