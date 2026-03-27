// Swatch — 12×12 color chip with subtle border
// Figma: "swatch" component (33:415)

interface SwatchProps {
  color: string;
  className?: string;
}

export function Swatch({ color, className }: SwatchProps) {
  return (
    <div
      className={`size-3 rounded-[2px] border border-black/10 shrink-0 ${className ?? ''}`}
      style={{ backgroundColor: color }}
    />
  );
}
