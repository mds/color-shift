// IconButton — icon wrapper with hover background
// Figma: "icon container" component (33:1131) — 2 states: default, hover, selected

import { forwardRef, type ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, selected = false, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`
          flex items-center justify-center px-1 py-0.5 rounded-[4px] shrink-0
          transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white/30
          ${selected ? 'bg-[#212121]' : 'hover:bg-[#212121]'}
          ${className ?? ''}
        `}
        style={selected ? { boxShadow: 'inset 0 0 0 1px #322d2d' } : undefined}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
