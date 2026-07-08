'use client';

// CSButton — Color Shift button with optional swatch + label
// Figma: "button" component (33:428) — 3 states: default, hover, selected
// Selected state: brighter color as bg, darker color as text
// Supports TubeText for animated label transitions

import { Swatch } from './swatch';
import { TubeText } from './tube-text';

type CSButtonState = 'default' | 'hover' | 'selected';

interface CSButtonProps {
  label: string;
  state?: CSButtonState;
  swatchColor?: string;
  /** Brighter of bg/fg — used as selected background */
  accentColor?: string;
  /** Darker of bg/fg — used as selected text color */
  accentTextColor?: string;
  /** Use TubeText for animated label transitions */
  animated?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CSButton({
  label,
  state = 'default',
  swatchColor,
  accentColor,
  accentTextColor,
  animated = false,
  onClick,
  className,
}: CSButtonProps) {
  const isSelected = state === 'selected';
  const defaultTextColor = isSelected ? '#e5e0e0' : '#a39f9f';
  const textColor = isSelected && accentTextColor ? accentTextColor : defaultTextColor;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 p-2 rounded-[4px] shrink-0
        transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white/30
        ${isSelected ? 'bg-[#212121]' : ''}
        ${state === 'hover' ? 'bg-[#212121]' : ''}
        ${state === 'default' ? 'hover:bg-[#212121]' : ''}
        ${className ?? ''}
      `}
      style={isSelected ? { boxShadow: 'inset 0 0 0 1px #322d2d' } : undefined}
    >
      {swatchColor && <Swatch color={swatchColor} />}
      {animated ? (
        <TubeText
          text={label}
          className="font-mono text-xs leading-none whitespace-nowrap"
          style={{ color: textColor }}
        />
      ) : (
        <span
          className="font-mono text-xs leading-none whitespace-nowrap"
          style={{ color: textColor }}
        >
          {label}
        </span>
      )}
    </button>
  );
}
