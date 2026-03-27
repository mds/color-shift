// ColorSliders — group of 3 color channel sliders
// Figma: "color sliders" component (33:2203)
// Wraps 3 ColorSlider instances in a vertical stack with consistent padding

import { ColorSlider } from './color-slider';

interface SliderConfig {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  trackGradient: string;
}

interface ColorSlidersProps {
  sliders: [SliderConfig, SliderConfig, SliderConfig];
  onChange?: (index: number, value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

export function ColorSliders({
  sliders,
  onChange,
  onDragStart,
  onDragEnd,
  className,
}: ColorSlidersProps) {
  return (
    <div className={`flex flex-col w-full ${className ?? ''}`}>
      <div className="flex flex-col gap-3 px-2 w-full">
        {sliders.map((s, i) => (
          <ColorSlider
            key={s.label}
            label={s.label}
            value={s.value}
            min={s.min}
            max={s.max}
            step={s.step}
            displayValue={s.displayValue}
            trackGradient={s.trackGradient}
            onChange={(v) => onChange?.(i, v)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
