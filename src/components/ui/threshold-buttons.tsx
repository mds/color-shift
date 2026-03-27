// ThresholdButtons — row of contrast threshold values (1.5, 3.0, 4.5, 7.0)
// Figma: "scores" component (33:1249) — threshold buttons for score expansion

import { CSButton } from './cs-button';

interface ThresholdButtonsProps {
  thresholds: number[];
  activeThreshold?: number;
  algorithm: 'wcag' | 'apca';
  onSelect?: (threshold: number) => void;
  className?: string;
}

export function ThresholdButtons({
  thresholds,
  activeThreshold,
  algorithm,
  onSelect,
  className,
}: ThresholdButtonsProps) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {thresholds.map((t, i) => (
        <CSButton
          key={i}
          label={String(t)}
          state={activeThreshold === t ? 'selected' : 'default'}
          animated
          onClick={() => onSelect?.(t)}
        />
      ))}
    </div>
  );
}
