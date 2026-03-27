// CSButton — Color Shift button with optional swatch + label
// Figma: "button" component (33:428) — 3 states: default, hover, selected
// Used for color hex values, threshold values, algorithm labels, export actions

import { Swatch } from './swatch';

type CSButtonState = 'default' | 'hover' | 'selected';

interface CSButtonProps {
  label: string;
  state?: CSButtonState;
  swatchColor?: string;
  onClick?: () => void;
  className?: string;
}

export function CSButton({
  label,
  state = 'default',
  swatchColor,
  onClick,
  className,
}: CSButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 p-2 rounded-lg shrink-0
        transition-colors duration-150
        ${state === 'selected' ? 'bg-[#151515] border border-[#c9a7ff]' : ''}
        ${state === 'hover' ? 'bg-[#151515]' : ''}
        ${state === 'default' ? 'hover:bg-[#151515]' : ''}
        ${className ?? ''}
      `}
    >
      {swatchColor && <Swatch color={swatchColor} />}
      <span className="font-mono text-xs text-[#a39f9f] leading-none whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
