import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedPageProps {
    children: ReactNode;
    className?: string;
}

/**
 * Wrapper that animates page content on mount
 * initial={{ opacity: 0, y: 15 }}
 * animate={{ opacity: 1, y: 0 }}
 */
export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
