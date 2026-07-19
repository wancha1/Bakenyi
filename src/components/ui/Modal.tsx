import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  id?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  id,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc key listeners for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sizes = {
    sm: 'max-w-md w-full',
    md: 'max-w-lg w-full',
    lg: 'max-w-2xl w-full',
    xl: 'max-w-4xl w-full',
    full: 'max-w-full w-full h-full rounded-none',
  };

  const modalId = id || `modal-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="fixed inset-0 bg-stone-950/40 dark:bg-black/60 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Panel Container */}
          <motion.div
            ref={panelRef}
            id={modalId}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative bg-white dark:bg-stone-900 shadow-2xl rounded-[28px] border border-heritage-brown/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh] ${sizes[size]}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${modalId}-title` : undefined}
          >
            {/* Modal Header */}
            <div className="p-6 flex items-center justify-between border-b border-heritage-brown/5 dark:border-white/5 shrink-0 bg-heritage-cream/10 dark:bg-black/10">
              {title ? (
                <h3
                  id={`${modalId}-title`}
                  className="text-lg sm:text-xl font-serif font-bold text-heritage-brown dark:text-heritage-cream leading-tight"
                >
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-heritage-brown/30 hover:text-heritage-terracotta hover:bg-heritage-brown/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer shrink-0"
                aria-label="Close Dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-6 sm:p-8 overflow-y-auto text-sm text-heritage-ink/85 leading-relaxed flex-grow">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

Modal.displayName = 'Modal';
