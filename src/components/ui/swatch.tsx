// Swatch — 12×12 color chip with subtle inner border
// Figma: "swatch" component (33:415)
// Dark colors get a white/10 inner border, light colors get black/10

interface SwatchProps {
  color: string;
  className?: string;
}

function isColorDark(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance shortcut
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

export function Swatch({ color, className }: SwatchProps) {
  const dark = isColorDark(color);
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
