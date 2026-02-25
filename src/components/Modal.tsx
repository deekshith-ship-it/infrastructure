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
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
            <div className="mg-card !p-0 overflow-hidden" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
              {/* Header */}
              <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div className="min-w-0 flex-1 mr-3">
                  <h2 className="font-bold text-base sm:text-lg truncate" style={{ color: 'var(--text-primary)' }}>
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                <motion.button
                  onClick={onClose}
                  className="mg-icon-btn p-2 rounded-full flex-shrink-0"
                  aria-label="Close"
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
