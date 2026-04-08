// ColorSliders — group of 3 color channel sliders
// Figma: "color sliders" component (33:2203)

import { ColorSlider } from './color-slider';

interface SliderConfig {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  gradients: { oklch: string; hsb: string; rgb: string };
  trackDark?: boolean;
}

interface ColorSlidersProps {
  sliders: [SliderConfig, SliderConfig, SliderConfig];
  activeMode: 'OKLCH' | 'HSB' | 'RGB';
  onChange?: (index: number, value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

export function ColorSliders({
  sliders,
  activeMode,
  onChange,
  onDragStart,
  onDragEnd,
  className,
}: ColorSlidersProps) {
  return (
    <div className={`flex flex-col w-full overflow-visible ${className ?? ''}`}>
      <div className="flex flex-col gap-3 px-2 w-full overflow-visible">
        {sliders.map((s, i) => (
          <ColorSlider
            key={i}
            label={s.label}
            value={s.value}
            min={s.min}
            max={s.max}
            step={s.step}
            displayValue={s.displayValue}
            gradients={s.gradients}
            activeMode={activeMode}
            trackDark={s.trackDark}
            onChange={(v) => onChange?.(i, v)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
