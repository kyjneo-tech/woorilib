import React from 'react';

export const LoadingSpinner = ({ size = 'md', color = 'primary' }: { size?: 'sm' | 'md' | 'lg', color?: 'primary' | 'white' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const colorClasses = {
    primary: 'border-primary-light border-t-primary',
    white: 'border-white/30 border-t-white',
  };

  return (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} />
  );
};

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-surface-secondary rounded-xl ${className}`} />
);

export const FullPageLoading = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
    <LoadingSpinner size="lg" />
    <p className="mt-4 font-bold text-primary animate-bounce">우리아이 도서관 로딩 중...</p>
  </div>
);
