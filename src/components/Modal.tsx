import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', subtitle }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const maxWidths = { sm: '440px', md: '520px', lg: '680px' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="w-full relative my-4 sm:my-8"
            style={{ maxWidth: maxWidths[size] }}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              {/* Header */}
              <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="min-w-0 flex-1 mr-3">
                  <h2 className="font-bold text-base sm:text-lg truncate text-gray-900 dark:text-gray-100">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs sm:text-sm mt-1 truncate text-gray-500 dark:text-gray-400">
                      {subtitle}
                    </p>
                  )}
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-full flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto text-gray-700 dark:text-gray-300" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
