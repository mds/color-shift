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
  const checkGripHover = useCallback((e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const gripX = (pct / 100) * rect.width;
    setHovered(Math.abs(pointerX - gripX) < 16);
  }, [pct]);

  const innerStroke = `inset 0 0 0 1px rgba(255,255,255,${trackDark ? 0.1 : 0})`;
  const layerClass = 'absolute inset-0 my-auto h-2 rounded-[52px] transition-opacity duration-300 linear';

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

        {/* Custom grip — purely visual, pointer-events-none */}
        <div
          className="absolute top-0 pointer-events-none"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            width: 24,
            height: 24,
            transition: dragging ? 'none' : 'left 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {/* Small dot (8px white) — scales down when expanded */}
          <div
            className="absolute inset-0 m-auto rounded-full"
            style={{
              width: 10,
              height: 10,
              backgroundColor: 'white',
              boxShadow: '0 0 1px 1px rgba(0,0,0,0.2)',
              transform: expanded ? 'scale(0)' : 'scale(1)',
              opacity: expanded ? 0 : 1,
              transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
          {/* Glass circle (24px) — scales up when expanded */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              width: 24,
              height: 24,
              backgroundColor: 'rgba(255,255,255,0.35)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.2)',
              transform: expanded ? 'scale(1)' : 'scale(0.33)',
              opacity: expanded ? 1 : 0,
              transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
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
          onPointerMove={checkGripHover}
          onPointerEnter={checkGripHover}
          onPointerLeave={() => { setHovered(false); setDragging(false); }}
          onPointerDown={() => { setDragging(true); onDragStart?.(); }}
          onPointerUp={() => { setDragging(false); setHovered(true); onDragEnd?.(); }}
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
