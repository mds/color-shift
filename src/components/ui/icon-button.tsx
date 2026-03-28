// IconButton — icon wrapper with hover background
// Figma: "icon container" component (33:1131) — 2 states: default, hover

import { forwardRef, type ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`
          flex items-center justify-center px-1 py-0.5 rounded-lg shrink-0
          transition-colors duration-150 hover:bg-[#191919]
          ${className ?? ''}
        `}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
