import React from 'react';
import { motion } from 'motion/react';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number | React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: 'underline' | 'pill' | 'editorial';
  className?: string;
  id?: string;
}

export const Tabs = <T extends string>({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
  id,
}: TabsProps<T>) => {
  const containerStyles = {
    underline: 'flex gap-2 border-b border-heritage-brown/10 dark:border-white/10 overflow-x-auto scrollbar-none py-1 sticky top-0 z-10 bg-heritage-cream/10 backdrop-blur-xs',
    pill: 'inline-flex p-1.5 bg-heritage-brown/[0.04] dark:bg-white/[0.04] rounded-2xl border border-heritage-brown/5 dark:border-white/5 overflow-x-auto scrollbar-none max-w-full',
    editorial: 'flex flex-wrap gap-4 md:gap-8 border-b border-heritage-brown/10 py-2',
  };

  const layoutGroupId = id || `tabs-layout-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`w-full ${className}`}>
      <div className={`${containerStyles[variant]}`} role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          const baseBtnStyle = 'relative flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-colors duration-300 select-none cursor-pointer outline-none focus:ring-4 focus:ring-heritage-terracotta/10 rounded-xl';

          const activeColors = {
            underline: 'text-heritage-terracotta',
            pill: 'text-white dark:text-stone-900',
            editorial: 'text-heritage-terracotta font-serif normal-case text-lg font-bold tracking-normal',
          };

          const inactiveColors = {
            underline: 'text-heritage-brown/50 dark:text-white/40 hover:text-heritage-brown dark:hover:text-white',
            pill: 'text-heritage-brown/65 dark:text-white/50 hover:bg-heritage-brown/5 dark:hover:bg-white/5 hover:text-heritage-brown dark:hover:text-white',
            editorial: 'text-heritage-brown/40 hover:text-heritage-brown font-serif normal-case text-lg font-medium tracking-normal',
          };

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`${baseBtnStyle} ${isActive ? activeColors[variant] : inactiveColors[variant]}`}
            >
              {/* Background slide for Pills or Underline line for Underlines */}
              {isActive && variant === 'pill' && (
                <motion.span
                  layoutId={`${layoutGroupId}-bg`}
                  className="absolute inset-0 bg-heritage-terracotta dark:bg-heritage-cream rounded-xl -z-10"
                  transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                />
              )}

              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span className={variant === 'editorial' ? 'font-serif' : 'font-sans'}>{tab.label}</span>

              {/* Badge support */}
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black font-mono tracking-normal leading-none shrink-0 ${
                  isActive 
                    ? variant === 'pill' ? 'bg-white text-heritage-terracotta dark:bg-stone-900 dark:text-heritage-cream' : 'bg-heritage-terracotta text-white'
                    : 'bg-heritage-brown/10 dark:bg-white/10 text-heritage-brown/60 dark:text-white/50'
                }`}>
                  {tab.badge}
                </span>
              )}

              {isActive && variant === 'underline' && (
                <motion.span
                  layoutId={`${layoutGroupId}-line`}
                  className="absolute bottom-[-5px] left-2 right-2 h-[3px] bg-heritage-terracotta rounded-full"
                  transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
