import { motion } from 'framer-motion';

interface LogoProps {
    size?: number;
    className?: string;
}

export function Logo({ size = 36, className = '' }: LogoProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            whileHover={{ scale: 1.1, rotate: 4 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            {/* Glow Effect */}
            <defs>
                <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>
                <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Shield Body */}
            <path
                d="M32 4L8 16V30C8 46 18.5 56.5 32 60C45.5 56.5 56 46 56 30V16L32 4Z"
                fill="url(#shieldFill)"
                stroke="url(#shieldGrad)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                filter="url(#glow)"
            />

            {/* Inner Shield Highlight Line */}
            <path
                d="M32 10L14 20V30C14 42.5 22 51.5 32 55C42 51.5 50 42.5 50 30V20L32 10Z"
                fill="none"
                stroke="url(#shieldGrad)"
                strokeWidth="0.8"
                strokeLinejoin="round"
                opacity="0.3"
            />

            {/* Mail Envelope */}
            <rect
                x="19" y="24" width="26" height="18"
                rx="3"
                fill="none"
                stroke="url(#shieldGrad)"
                strokeWidth="2"
            />
            {/* Envelope flap */}
            <path
                d="M19 27L32 35L45 27"
                fill="none"
                stroke="url(#shieldGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </motion.svg>
    );
}
