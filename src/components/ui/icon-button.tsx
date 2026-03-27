// IconButton — icon wrapper with hover background
// Figma: "icon container" component (33:1131) — 2 states: default, hover

import type { ReactNode } from 'react';

interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function IconButton({ children, onClick, className }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center px-1.5 py-0.5 rounded-lg shrink-0
        transition-colors duration-150 hover:bg-[#191919]
        ${className ?? ''}
      `}
    >
      {children}
    </button>
  );
}
