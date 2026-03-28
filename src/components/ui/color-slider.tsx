'use client';

// ColorSlider — single slider with gradient track, grip, and label/value
// Three gradient layers always rendered (one per color mode).
// Active mode at opacity 1, others at 0. CSS transition handles the fade.

interface ColorSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  gradients: {
    oklch: string;
    hsb: string;
    rgb: string;
  };
  activeMode: 'OKLCH' | 'HSB' | 'RGB';
  trackDark?: boolean;
  onChange?: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
}

export function ColorSlider({
  label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  gradients,
  activeMode,
  trackDark = false,
  onChange,
  onDragStart,
  onDragEnd,
  className,
}: ColorSliderProps) {
  const innerStroke = `inset 0 0 0 1px rgba(255,255,255,${trackDark ? 0.1 : 0})`;
  const layerClass = 'absolute inset-0 my-auto h-2 rounded-[52px] transition-opacity duration-300 linear';

  return (
    <div className={`flex flex-col gap-1 w-full ${className ?? ''}`}>
      {/* Track: three gradient layers, only active mode is opaque */}
      <div className="relative flex items-center h-3 w-full">
        <div
          className={layerClass}
          style={{
            background: gradients.oklch,
            opacity: activeMode === 'OKLCH' ? 1 : 0,
            boxShadow: innerStroke,
          }}
        />
        <div
          className={layerClass}
          style={{
            background: gradients.hsb,
            opacity: activeMode === 'HSB' ? 1 : 0,
            boxShadow: innerStroke,
          }}
        />
        <div
          className={layerClass}
          style={{
            background: gradients.rgb,
            opacity: activeMode === 'RGB' ? 1 : 0,
            boxShadow: innerStroke,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          onPointerDown={() => onDragStart?.()}
          onPointerUp={() => onDragEnd?.()}
          className="relative w-full z-10"
        />
      </div>

      {/* Label + Value */}
      <div className="flex items-center justify-between w-full">
        <span className="font-mono text-xs text-[#a39f9f] leading-none">
          {label}
        </span>
        <span className="font-mono text-xs text-[#a39f9f] leading-none text-right tabular-nums">
          {displayValue}
        </span>
      </div>
    </div>
  );
}
