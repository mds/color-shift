// ColorSlider — single slider with gradient track, grip, and label/value
// Figma: "slider" component (33:2138)
// Composed of: track (gradient bg + thumb), slider values (label + value)

interface ColorSliderProps {
  label: string;          // e.g. "L", "C", "H"
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;   // formatted display string e.g. "44", "0.060", "183"
  trackGradient: string;  // CSS gradient string for the track
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
  trackGradient,
  onChange,
  onDragStart,
  onDragEnd,
  className,
}: ColorSliderProps) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className ?? ''}`}>
      {/* Track with gradient and range input */}
      <div className="relative flex items-center h-3 w-full">
        <div
          className="absolute inset-0 my-auto h-2 rounded-[52px]"
          style={{ background: trackGradient }}
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
        <span className="font-mono text-xs text-[#a39f9f] leading-none text-right">
          {displayValue}
        </span>
      </div>
    </div>
  );
}
