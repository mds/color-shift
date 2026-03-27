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
  const textColor = isSelected && accentTextColor ? accentTextColor : '#a39f9f';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 p-2 rounded-lg shrink-0
        transition-colors duration-150
        ${state === 'hover' ? 'bg-[#191919]' : ''}
        ${state === 'default' ? 'hover:bg-[#191919]' : ''}
        ${className ?? ''}
      `}
      style={isSelected ? { backgroundColor: accentColor } : undefined}
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
