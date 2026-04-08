'use client';

// ColorSlider — single slider with gradient track, custom grip, and label/value
// Three gradient layers always rendered (one per color mode).
// Custom grip: two layers (8px dot + 24px glass) with smooth scale transitions.
// Native range input is invisible on top — handles all interaction.
// Hover detection uses pointermove proximity to the grip position.

import { useState, useRef, useCallback } from 'react';

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
  const pct = ((value - min) / (max - min)) * 100;

  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const expanded = hovered || dragging;

  // Check if pointer is within 16px of the grip center
  const checkGripHover = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const gripX = 4 + (pct / 100) * (rect.width - 8);
    setHovered(Math.abs(pointerX - gripX) < 16);
  }, [pct]);

  const innerStroke = `inset 0 0 0 1px rgba(255,255,255,${trackDark ? 0.1 : 0})`;
  // Gradient crossfade matches the grip `left` transition below so
  // a mode change moves the color and the grip in a single motion.
  const layerClass = 'absolute inset-x-1 inset-y-0 my-auto h-2 rounded-[52px] transition-opacity duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]';

  return (
    <div className={`flex flex-col gap-1 w-full overflow-visible ${className ?? ''}`}>
      {/* Track + grip + input */}
      <div ref={trackRef} className="relative flex items-center h-6 w-full overflow-visible">
        {/* Gradient layers */}
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

        {/* Grip — 24px container, white dot grows from 10px to 24px on hover */}
        <div
          className="absolute top-0 pointer-events-none"
          style={{
            left: `calc(4px + (100% - 8px) * ${pct / 100})`,
            transform: 'translateX(-50%)',
            width: 24,
            height: 24,
            transition: dragging ? 'none' : 'left 0.2s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          <div
            className="absolute inset-0 m-auto rounded-full"
            style={{
              width: expanded ? 24 : 10,
              height: expanded ? 24 : 10,
              backgroundColor: expanded ? 'rgba(255,255,255,0.35)' : 'white',
              backdropFilter: expanded ? 'blur(3px)' : 'none',
              WebkitBackdropFilter: expanded ? 'blur(3px)' : 'none',
              boxShadow: expanded
                ? 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.2)'
                : '0 0 1px 1px rgba(0,0,0,0.2)',
              transition: 'width 0.25s cubic-bezier(0.23, 1, 0.32, 1), height 0.25s cubic-bezier(0.23, 1, 0.32, 1), background-color 0.25s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
        </div>

        {/* Invisible native range — on top, handles all interaction + hover detection */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          onMouseMove={checkGripHover}
          onMouseEnter={checkGripHover}
          onMouseLeave={() => { setHovered(false); setDragging(false); }}
          onMouseDown={() => { setDragging(true); onDragStart?.(); }}
          onMouseUp={() => { setDragging(false); setHovered(true); onDragEnd?.(); }}
          className="absolute inset-0 w-full z-10 opacity-0 cursor-pointer"
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
