import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  Trash2, 
  Archive, 
  Lock, 
  FileX, 
  X, 
  Loader2,
  ShieldAlert,
  Skull
} from 'lucide-react';

export type DangerLevel = 'medium' | 'high' | 'critical';
export type DangerActionType = 'delete' | 'unpublish' | 'archive' | 'purge' | 'reject' | 'suspend' | 'custom';

export interface DangerActionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  actionType?: DangerActionType;
  dangerLevel?: DangerLevel;
  requireConfirmWord?: string; // Optional: If provided, user must type this exact string to unlock confirm button
  placeholderConfirmWord?: string; // Optional: Custom placeholder for the confirmation input
}

export default function DangerAction({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  actionType = 'delete',
  dangerLevel = 'high',
  requireConfirmWord,
  placeholderConfirmWord
}: DangerActionProps) {
  const [typedWord, setTypedWord] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset inputs when opened/closed
  useEffect(() => {
    if (isOpen) {
      setTypedWord('');
      setIsExecuting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (requireConfirmWord && typedWord.trim().toLowerCase() !== requireConfirmWord.trim().toLowerCase()) {
      setError(`Please type "${requireConfirmWord}" exactly to confirm.`);
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('DangerAction execution error:', err);
      setError(err?.message || 'Action execution failed. Please try again.');
      setIsExecuting(false);
    }
  };

  // Select icon based on action type
  const getIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case 'unpublish':
        return <FileX className="w-6 h-6 text-amber-500" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-blue-500" />;
      case 'purge':
        return <Skull className="w-6 h-6 text-rose-600" />;
      case 'reject':
      case 'suspend':
        return <Lock className="w-6 h-6 text-orange-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  // Determine colors based on danger level
  const getDangerThemeColors = () => {
    switch (dangerLevel) {
      case 'medium':
        return {
          accentBg: 'bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20',
          accentText: 'text-amber-700 dark:text-amber-400',
          buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/15 focus:ring-amber-500/20',
          indicatorBg: 'bg-amber-100 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/30',
        };
      case 'critical':
        return {
          accentBg: 'bg-rose-600/10 dark:bg-rose-600/5 border-rose-600/20',
          accentText: 'text-rose-700 dark:text-rose-400',
          buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/15 focus:ring-rose-600/20',
          indicatorBg: 'bg-rose-100 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/30',
        };
      case 'high':
      default:
        return {
          accentBg: 'bg-red-500/10 dark:bg-red-500/5 border-red-500/20',
          accentText: 'text-red-700 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/15 focus:ring-red-500/20',
          indicatorBg: 'bg-red-100 dark:bg-red-950/40 border-red-200 dark:border-red-900/30',
        };
    }
  };

  const colors = getDangerThemeColors();
  const defaultConfirmText = confirmText || (actionType === 'delete' ? 'Delete' : actionType === 'archive' ? 'Archive' : 'Confirm');

  // Check if typed confirmation is valid
  const isConfirmDisabled = isExecuting || (!!requireConfirmWord && typedWord.trim().toLowerCase() !== requireConfirmWord.trim().toLowerCase());

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isExecuting) onClose();
            }}
            className="absolute inset-0 bg-stone-950/70 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 20, stiffness: 220 }}
            className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 z-10"
          >
            {/* Top decorative hazard pattern */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${
              dangerLevel === 'critical' ? 'from-rose-500 via-stone-950 to-rose-600' : 
              dangerLevel === 'medium' ? 'from-amber-400 via-stone-800 to-amber-500' :
              'from-red-500 via-stone-900 to-red-600'
            }`} />

            <div className="p-6">
              {/* Close button */}
              {!isExecuting && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  aria-label="Close dialogue"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Header Icon and Title */}
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl border shrink-0 ${colors.indicatorBg}`}>
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-white leading-snug tracking-tight">
                    {title}
                  </h3>
                  {dangerLevel === 'critical' && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded border border-rose-500/10">
                      <ShieldAlert className="w-3 h-3" />
                      Critical Action
                    </span>
                  )}
                </div>
              </div>

              {/* Description Body */}
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-4 leading-relaxed">
                {description}
              </p>

              {/* Type to Confirm security input */}
              {requireConfirmWord && (
                <div className="mt-5 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-100 dark:border-stone-800/60">
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    Security Verification Required
                  </label>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-3">
                    Please type <span className="font-mono font-bold bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded text-rose-600 dark:text-rose-400 select-all">
                      {requireConfirmWord}
                    </span> to unlock the option:
                  </p>
                  <input
                    type="text"
                    disabled={isExecuting}
                    value={typedWord}
                    onChange={(e) => {
                      setTypedWord(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={placeholderConfirmWord || `Type "${requireConfirmWord}"`}
                    className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:outline-none transition-all font-medium text-stone-900 dark:text-white"
                  />
                </div>
              )}

              {/* Error messages */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-550/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Buttons Action Bar */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl border border-transparent dark:border-stone-750 transition-colors focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {cancelText}
                </button>

                <button
                  type="button"
                  disabled={isConfirmDisabled}
                  onClick={handleConfirm}
                  className={`flex-1 py-2.5 px-4 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 ${colors.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      {defaultConfirmText}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
