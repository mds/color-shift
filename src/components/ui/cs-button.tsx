// CSButton — Color Shift button with optional swatch + label
// Figma: "button" component (33:428) — 3 states: default, hover, selected
// Selected state uses inset box-shadow with the brighter of bg/fg colors

import { Swatch } from './swatch';

type CSButtonState = 'default' | 'hover' | 'selected';

interface CSButtonProps {
  label: string;
  state?: CSButtonState;
  swatchColor?: string;
  /** The brighter of bgHex/fgHex — used for the selected state inner glow */
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export function CSButton({
  label,
  state = 'default',
  swatchColor,
  accentColor,
  onClick,
  className,
}: CSButtonProps) {
  const selectedStyle = state === 'selected'
    ? {
        backgroundColor: '#151515',
        boxShadow: `inset 0 0 0 1px ${accentColor ?? 'rgba(255,255,255,0.2)'}`,
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 p-2 rounded-lg shrink-0
        transition-colors duration-150
        ${state === 'hover' ? 'bg-[#151515]' : ''}
        ${state === 'default' ? 'hover:bg-[#151515]' : ''}
        ${className ?? ''}
      `}
      style={selectedStyle}
    >
      {swatchColor && <Swatch color={swatchColor} />}
      <span className="font-mono text-xs text-[#a39f9f] leading-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
