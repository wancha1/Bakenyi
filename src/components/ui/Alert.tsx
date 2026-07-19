import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className = '',
  variant = 'info',
  title,
  onDismiss,
  id,
  ...props
}) => {
  const styles = {
    info: 'bg-indigo-50/45 dark:bg-indigo-950/10 border-indigo-200/55 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-300',
    success: 'bg-emerald-50/45 dark:bg-emerald-950/10 border-emerald-200/55 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-50/45 dark:bg-amber-950/10 border-amber-200/55 dark:border-amber-900/30 text-amber-800 dark:text-amber-300',
    error: 'bg-rose-50/45 dark:bg-rose-950/10 border-rose-200/55 dark:border-rose-900/30 text-rose-800 dark:text-rose-300',
  };

  const icons = {
    info: <Info className="w-5 h-5 text-indigo-500 shrink-0" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  const alertId = id || `alert-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div
      id={alertId}
      className={`flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl border ${styles[variant]} ${className}`}
      role="alert"
      {...props}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-serif font-bold text-sm leading-tight mb-1">{title}</h4>
        )}
        <div className="text-xs font-medium leading-relaxed opacity-90">{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss Alert"
        >
          <X className="w-4 h-4 opacity-60 hover:opacity-100" />
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';
