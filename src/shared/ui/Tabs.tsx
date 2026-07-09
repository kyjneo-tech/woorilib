import React from 'react';
import { Typography } from './Typography';

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline';
}

export const Tabs = ({ tabs, activeTab, onChange, variant = 'underline' }: TabsProps) => {
  return (
    <div className={`flex gap-1 ${variant === 'underline' ? 'border-b border-border w-full' : ''}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-surface text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {tab.label}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-bold transition-all relative ${
              isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
