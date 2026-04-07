// Swatch — 12×12 color chip with subtle inner border
// Figma: "swatch" component (33:415)
// Dark colors get a white/10 inner border, light colors get black/10

import { isHexDark } from '@/lib/color-engine';

interface SwatchProps {
  color: string;
  className?: string;
}

export function Swatch({ color, className }: SwatchProps) {
  const dark = isHexDark(color);
  return (
    <div
      className={`size-3 rounded-[2px] shrink-0 ${className ?? ''}`}
      style={{
        backgroundColor: color,
        boxShadow: dark
          ? 'inset 0 0 0 1px rgba(255,255,255,0.1)'
          : 'inset 0 0 0 1px rgba(0,0,0,0.1)',
      }}
    />
  );
}
