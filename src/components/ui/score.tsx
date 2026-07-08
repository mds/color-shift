'use client';

// Score — contrast score pill showing rating + value
// Figma: "score" component (33:1445) — 6 variants
// Uses TubeText for animated transitions between WCAG ↔ APCA values

import { TubeText } from './tube-text';

type ScoreType = 'wcag' | 'apca';
type ScoreState = 'default' | 'hovered' | 'selected';

interface ScoreProps {
  type: ScoreType;
  state?: ScoreState;
  rating: string;   // e.g. "AAA", "AA", "Fail"
  value: string;    // e.g. "10.59:1" (WCAG) or "Lc 44.7" (APCA)
  onClick?: () => void;
  className?: string;
}

export function Score({
  type,
  state = 'default',
  rating,
  value,
  onClick,
  className,
}: ScoreProps) {
  const isSelected = state === 'selected';
  const textColor = isSelected ? '#e5e0e0' : '#a39f9f';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center p-2 rounded-[4px] shrink-0
        transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white/30
        ${state === 'selected' ? 'bg-[var(--cs-surface-raised)]' : ''}
        ${state === 'hovered' ? 'bg-[var(--cs-surface-raised)]' : ''}
        ${state === 'default' ? 'hover:bg-[var(--cs-surface-raised)]' : ''}
        ${className ?? ''}
      `}
      style={isSelected ? { boxShadow: 'inset 0 0 0 1px var(--cs-stroke)' } : undefined}
    >
      <div className="flex items-center justify-center gap-2.5">
        <TubeText
          text={rating}
          className="font-mono text-xs leading-none whitespace-nowrap text-right"
          style={{ color: textColor }}
        />
        <TubeText
          text={value}
          className="font-mono text-xs leading-none whitespace-nowrap text-right"
          style={{ color: textColor, fontVariantNumeric: 'tabular-nums' }}
        />
      </div>
    </button>
  );
}
