// ColorMode — OKLCH / HSB / RGB toggle row with optional CLOSE button
// Figma: "color mode" (33:2114) + "color mode" full-width (33:2333)

import { CSButton } from './cs-button';

type SliderMode = 'OKLCH' | 'HSB' | 'RGB';

interface ColorModeProps {
  mode: SliderMode;
  onModeChange?: (mode: SliderMode) => void;
  showClose?: boolean;
  onClose?: () => void;
  className?: string;
}

const MODES: SliderMode[] = ['OKLCH', 'HSB', 'RGB'];

export function ColorMode({
  mode,
  onModeChange,
  showClose = false,
  onClose,
  className,
}: ColorModeProps) {
  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      <div className="flex items-start gap-1">
        {MODES.map((m) => (
          <CSButton
            key={m}
            label={m}
            state={mode === m ? 'selected' : 'default'}
            onClick={() => onModeChange?.(m)}
          />
        ))}
      </div>
      {showClose && (
        <CSButton label="CLOSE" onClick={onClose} />
      )}
    </div>
  );
}
