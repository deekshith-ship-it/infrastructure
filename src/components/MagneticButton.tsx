import { useRef, type MouseEvent, type ReactNode } from 'react';

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
    style?: React.CSSProperties;
}

/**
 * A subtle magnetic hover effect button.
 * On mouse move inside the button, it shifts slightly toward the cursor (max 6px).
 * On mouse leave, it snaps back to center.
 * Does NOT interfere with onClick logic.
 */
export function MagneticButton({
    children,
    className = '',
    onClick,
    disabled = false,
    type = 'button',
    title,
    style,
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
        if (disabled || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12; // max 6px
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 12;
        ref.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;
        ref.current.style.transform = 'translate(0px, 0px)';
    };

    return (
        <button
            ref={ref}
            type={type}
            className={className}
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                ...style,
                transition: 'transform 0.15s ease-out, box-shadow 0.2s ease, background 0.2s ease',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </button>
    );
}
