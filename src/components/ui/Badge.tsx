import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'olive' | 'sand';
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'neutral',
  size = 'md',
  pulse = false,
  id,
  ...props
}) => {
  // Styles based on variants
  const variants = {
    neutral: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700/50',
    success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
    warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
    danger: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
    info: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
    olive: 'bg-heritage-olive/10 text-heritage-olive dark:text-heritage-olive border-heritage-olive/20',
    sand: 'bg-heritage-sand/10 text-heritage-terracotta border-heritage-sand/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px]',
    md: 'px-3 py-1.5 text-[10px]',
  };

  const badgeId = id || `badge-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <span
      id={badgeId}
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-widest font-mono border rounded-full select-none shadow-xs ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            variant === 'success' ? 'bg-emerald-400' :
            variant === 'danger' ? 'bg-rose-400' :
            variant === 'warning' ? 'bg-amber-400' :
            variant === 'info' ? 'bg-indigo-400' : 'bg-heritage-terracotta'
          }`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
            variant === 'success' ? 'bg-emerald-500' :
            variant === 'danger' ? 'bg-rose-500' :
            variant === 'warning' ? 'bg-amber-500' :
            variant === 'info' ? 'bg-indigo-500' : 'bg-heritage-terracotta'
          }`} />
        </span>
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
