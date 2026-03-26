'use client';

import { useState, useCallback } from 'react';
import type { ColorData, ColorFormat, SliderMode, ContrastAlgorithm, HSB, OklchValues, ContrastResult } from '@/lib/color-engine';
import { maxChroma, getThresholds } from '@/lib/color-engine';

// ── Icons (inline SVG) ─────────────────────────────────────────────────

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2L4 14M4 14L1 11M4 14L7 11" />
      <path d="M12 14L12 2M12 2L9 5M12 2L15 5" />
    </svg>
  );
}

function ChevronUp({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8L6 4L10 8" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4L6 8L10 4" />
    </svg>
  );
}

function ShuffleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 4h3l3 4-3 4H1" />
      <path d="M1 4h3l8 8h3" />
      <path d="M12 4h3M1 12h3l2.5-3.3" />
      <path d="M13 2l2 2-2 2" />
      <path d="M13 10l2 2-2 2" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="9" height="9" rx="1.5" />
      <path d="M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5V8.5A1.5 1.5 0 002.5 10H4" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1v9M7 10L4 7M7 10l3-3" />
      <path d="M1 11v1.5A1.5 1.5 0 002.5 14h9a1.5 1.5 0 001.5-1.5V11" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3" />
      <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.75 2.75l.7.7M10.55 10.55l.7.7M11.25 2.75l-.7.7M3.45 10.55l-.7.7" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.5 7.5a5.5 5.5 0 01-7.78 5A5.5 5.5 0 019.5 1.22a5.5 5.5 0 003 6.28z" />
    </svg>
  );
}

// ── Props ──────────────────────────────────────────────────────────────

interface ControlsProps {
  bg: ColorData;
  fg: ColorData;
  bgHex: string;
  fgHex: string;
  colorFormat: ColorFormat;
  contrast: ContrastResult;
  activeThreshold: number;
  theme: 'dark' | 'light';
  sliderMode: SliderMode;
  contrastAlgorithm: ContrastAlgorithm;
  onBgInput: (value: string) => void;
  onFgInput: (value: string) => void;
  onSwap: () => void;
  onBumpUp: () => void;
  onBumpDown: () => void;
  onBumpTo: (target: number) => void;
  onUpdateBgHsb: (hsb: HSB) => void;
  onUpdateFgHsb: (hsb: HSB) => void;
  onUpdateBgOklch: (oklch: OklchValues) => void;
  onUpdateFgOklch: (oklch: OklchValues) => void;
  onCycleFormat: () => void;
  onGenerate: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onToggleTheme: () => void;
  onToggleSliderMode: () => void;
  onToggleContrastAlgorithm: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  formatColorValue: (data: ColorData, format: ColorFormat) => string;
}

// ── Controls ───────────────────────────────────────────────────────────

export function Controls(props: ControlsProps) {
  const {
    bg, fg, bgHex, fgHex, colorFormat,
    contrast, activeThreshold, theme, sliderMode, contrastAlgorithm,
    onBgInput, onFgInput, onSwap, onBumpUp, onBumpDown, onBumpTo,
    onUpdateBgHsb, onUpdateFgHsb, onUpdateBgOklch, onUpdateFgOklch,
    onCycleFormat, onGenerate, onCopy, onDownload, onToggleTheme,
    onToggleSliderMode, onToggleContrastAlgorithm, onDragStart, onDragEnd, formatColorValue,
  } = props;

  const { grade, scoreLabel, gradeDesc } = contrast;

  const isDark = theme === 'dark';
  const chrome = isDark ? 'bg-[#0D0D0D]' : 'bg-[#F0EDE8]';
  const textMuted = isDark ? 'text-white/45' : 'text-black/45';
  const textValue = isDark ? 'text-white/70' : 'text-black/70';
  const hoverBg = isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]';

  const thresholds = getThresholds(contrastAlgorithm);

  const gradeColor = grade === 'Fail'
    ? (isDark ? 'text-red-400' : 'text-red-600')
    : grade === 'AAA'
      ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
      : (isDark ? 'text-amber-300' : 'text-amber-600');

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [onCopy]);

  // Consistent font size for ALL values in the strip
  const valueCls = 'font-mono text-[13px] tabular-nums';

  return (
    <div className={`flex-[3] sm:flex-[4] min-h-0 ${chrome} flex flex-col overflow-y-auto rounded-xl`}>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 flex flex-col gap-5 lg:gap-6 w-full">

        {/* ── Row 1: Colors left, Scores right, baseline aligned ── */}
        <div className="flex flex-wrap items-baseline gap-y-3 gap-x-4">

          {/* Left: swatches + swap + format toggle */}
          <div className="flex items-baseline gap-2 shrink-0">
            {/* BG swatch + value */}
            <div
              className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/10 self-center"
              style={{ backgroundColor: bgHex }}
            />
            <ColorValue
              value={formatColorValue(bg, colorFormat)}
              onInput={onBgInput}
              isDark={isDark}
              valueCls={valueCls}
            />

            {/* Swap */}
            <button
              onClick={onSwap}
              className={`p-1.5 rounded-md ${hoverBg} ${textMuted} transition-colors shrink-0 self-center`}
              title="Swap colors (S)"
            >
              <SwapIcon className="w-3.5 h-3.5" />
            </button>

            {/* FG swatch + value */}
            <div
              className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/10 self-center"
              style={{ backgroundColor: fgHex }}
            />
            <ColorValue
              value={formatColorValue(fg, colorFormat)}
              onInput={onFgInput}
              isDark={isDark}
              valueCls={valueCls}
            />

            {/* Single format toggle */}
            <button
              onClick={onCycleFormat}
              className={`${valueCls} ${textMuted} ${hoverBg} rounded px-1.5 py-0.5 transition-colors shrink-0`}
            >
              {colorFormat}
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-w-4" />

          {/* Right: algorithm toggle + grade + score + thresholds + bump */}
          <div className="flex items-baseline gap-2 shrink-0">
            <button
              onClick={onToggleContrastAlgorithm}
              className={`${valueCls} ${textMuted} ${hoverBg} rounded px-1.5 py-0.5 transition-colors`}
              title="Toggle contrast algorithm"
            >
              {contrastAlgorithm === 'WCAG2' ? 'WCAG 2' : 'APCA'}
            </button>
            <span className={`${valueCls} font-semibold ${gradeColor}`}>
              {grade}
            </span>
            <span className={`${valueCls} ${textValue}`}>
              {scoreLabel}
            </span>

            {/* Threshold markers */}
            {thresholds.map(t => (
              <button
                key={t}
                onClick={() => onBumpTo(t)}
                className={`${valueCls} px-1 py-0.5 rounded transition-colors ${
                  t === activeThreshold
                    ? (isDark ? 'bg-white/10 text-white/90' : 'bg-black/10 text-black/90')
                    : `${textMuted} ${hoverBg}`
                }`}
              >
                {contrastAlgorithm === 'APCA' ? t : t.toFixed(1)}
              </button>
            ))}

            {/* Bump chevrons */}
            <div className="flex flex-col self-center">
              <button
                onClick={onBumpUp}
                className={`${textMuted} ${hoverBg} rounded p-0.5 transition-colors`}
                title="Bump to next threshold"
              >
                <ChevronUp />
              </button>
              <button
                onClick={onBumpDown}
                className={`${textMuted} ${hoverBg} rounded p-0.5 transition-colors`}
                title="Bump to previous threshold"
              >
                <ChevronDown />
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Sliders (HSB or OKLCH) ──────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleSliderMode}
              className={`font-mono text-[11px] px-2 py-0.5 rounded transition-colors ${
                isDark ? 'bg-white/8 text-white/50 hover:text-white/70' : 'bg-black/5 text-black/50 hover:text-black/70'
              }`}
            >
              {sliderMode}
            </button>
            <span className={`text-[10px] font-mono ${textMuted} opacity-60`}>
              {sliderMode === 'OKLCH' ? 'perceptually uniform' : 'hue / saturation / brightness'}
            </span>
          </div>
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
            {sliderMode === 'HSB' ? (
              <>
                <HsbSliderGroup
                  label="Background"
                  hsb={bg.hsb}
                  onChange={onUpdateBgHsb}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDark={isDark}
                />
                <HsbSliderGroup
                  label="Foreground"
                  hsb={fg.hsb}
                  onChange={onUpdateFgHsb}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDark={isDark}
                />
              </>
            ) : (
              <>
                <OklchSliderGroup
                  label="Background"
                  oklch={bg.oklch}
                  onChange={onUpdateBgOklch}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDark={isDark}
                />
                <OklchSliderGroup
                  label="Foreground"
                  oklch={fg.oklch}
                  onChange={onUpdateFgOklch}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  isDark={isDark}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Row 3: Actions ────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerate}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono ${textMuted} ${hoverBg} border border-current/10 transition-colors`}
            title="Generate (Spacebar)"
          >
            <ShuffleIcon className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>

          <div className="flex-1" />

          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-md ${hoverBg} ${textMuted} transition-colors`}
            title="Toggle theme (T)"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            onClick={handleCopy}
            className={`p-2 rounded-md ${hoverBg} ${textMuted} transition-colors relative`}
            title="Copy all color data"
          >
            <CopyIcon />
            {copied && (
              <span className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono ${isDark ? 'text-white/60' : 'text-black/60'} whitespace-nowrap`}>
                Copied
              </span>
            )}
          </button>
          <button
            onClick={onDownload}
            className={`p-2 rounded-md ${hoverBg} ${textMuted} transition-colors`}
            title="Download markdown"
          >
            <DownloadIcon />
          </button>
        </div>

        {/* ── Hint ──────────────────────────────────────────────── */}
        <p className={`text-[10px] font-mono ${textMuted} text-center pb-2 opacity-60`}>
          Spacebar to generate &middot; S to swap &middot; T to toggle theme
        </p>
      </div>
    </div>
  );
}

// ── Color Value (editable on click, fixed width) ───────────────────────

function ColorValue({
  value,
  onInput,
  isDark,
  valueCls,
}: {
  value: string;
  onInput: (v: string) => void;
  isDark: boolean;
  valueCls: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const textValue = isDark ? 'text-white/70' : 'text-black/70';

  return editing ? (
    <input
      autoFocus
      type="text"
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onInput(draft); setEditing(false); }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onInput(draft); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
      className={`${valueCls} bg-transparent border-none outline-none ${textValue} w-[18ch]`}
      spellCheck={false}
    />
  ) : (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`${valueCls} ${textValue} cursor-text text-left w-[18ch] truncate`}
    >
      {value}
    </button>
  );
}

// ── HSB Slider Group ──────────────────────────────────────────────────

function HsbSliderGroup({
  label,
  hsb,
  onChange,
  onDragStart,
  onDragEnd,
  isDark,
}: {
  label: string;
  hsb: HSB;
  onChange: (hsb: HSB) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDark: boolean;
}) {
  const textMuted = isDark ? 'text-white/45' : 'text-black/45';
  const textValue = isDark ? 'text-white/65' : 'text-black/65';

  const hueGradient = 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)';
  const satStart = `hsl(${hsb.h}, 0%, ${hsb.b / 2 + 25}%)`;
  const satEnd = `hsl(${hsb.h}, 100%, 50%)`;
  const satGradient = `linear-gradient(to right, ${satStart}, ${satEnd})`;
  const briEnd = `hsl(${hsb.h}, ${hsb.s}%, 50%)`;
  const briGradient = `linear-gradient(to right, #000000, ${briEnd})`;

  const handleChange = (key: keyof HSB, val: number) => {
    onChange({ ...hsb, [key]: val });
  };

  return (
    <div className="flex-1 min-w-0">
      <span className={`text-xs font-sans ${textMuted} block mb-2`}>{label}</span>
      <div className="flex flex-col gap-2">
        <SliderRow label="H" value={hsb.h} min={0} max={360} gradient={hueGradient} onChange={v => handleChange('h', v)} onDragStart={onDragStart} onDragEnd={onDragEnd} textMuted={textMuted} textValue={textValue} />
        <SliderRow label="S" value={hsb.s} min={0} max={100} gradient={satGradient} onChange={v => handleChange('s', v)} onDragStart={onDragStart} onDragEnd={onDragEnd} textMuted={textMuted} textValue={textValue} />
        <SliderRow label="B" value={hsb.b} min={0} max={100} gradient={briGradient} onChange={v => handleChange('b', v)} onDragStart={onDragStart} onDragEnd={onDragEnd} textMuted={textMuted} textValue={textValue} />
      </div>
    </div>
  );
}

// ── OKLCH Slider Group ────────────────────────────────────────────────

function OklchSliderGroup({
  label,
  oklch,
  onChange,
  onDragStart,
  onDragEnd,
  isDark,
}: {
  label: string;
  oklch: { l: number; c: number; h: number };
  onChange: (oklch: OklchValues) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDark: boolean;
}) {
  const textMuted = isDark ? 'text-white/45' : 'text-black/45';
  const textValue = isDark ? 'text-white/65' : 'text-black/65';

  // Dynamic max chroma for current L + H
  const maxC = maxChroma(oklch.l, oklch.h);

  // Lightness: black to white
  const lGradient = `linear-gradient(to right, oklch(0% 0 ${oklch.h}), oklch(50% ${oklch.c} ${oklch.h}), oklch(100% 0 ${oklch.h}))`;

  // Chroma: gray to saturated (at current L + H)
  const cGradient = `linear-gradient(to right, oklch(${oklch.l}% 0 ${oklch.h}), oklch(${oklch.l}% ${maxC} ${oklch.h}))`;

  // Hue: full hue wheel at current L + C
  const hueStops = Array.from({ length: 13 }, (_, i) => {
    const h = i * 30;
    return `oklch(${oklch.l}% ${Math.min(oklch.c, 0.15)} ${h})`;
  }).join(', ');
  const hGradient = `linear-gradient(to right, ${hueStops})`;

  // Convert chroma to 0-1000 int for slider (0.001 precision)
  const chromaInt = Math.round(oklch.c * 1000);
  const maxCInt = Math.round(maxC * 1000);

  return (
    <div className="flex-1 min-w-0">
      <span className={`text-xs font-sans ${textMuted} block mb-2`}>{label}</span>
      <div className="flex flex-col gap-2">
        <SliderRow
          label="L"
          value={Math.round(oklch.l)}
          min={0}
          max={100}
          gradient={lGradient}
          onChange={v => onChange({ l: v, c: oklch.c, h: oklch.h })}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          textMuted={textMuted}
          textValue={textValue}
        />
        <SliderRow
          label="C"
          value={chromaInt}
          min={0}
          max={Math.max(maxCInt, 1)}
          gradient={cGradient}
          onChange={v => onChange({ l: oklch.l, c: v / 1000, h: oklch.h })}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          textMuted={textMuted}
          textValue={textValue}
          displayValue={oklch.c.toFixed(3)}
        />
        <SliderRow
          label="H"
          value={oklch.h}
          min={0}
          max={360}
          gradient={hGradient}
          onChange={v => onChange({ l: oklch.l, c: oklch.c, h: v })}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          textMuted={textMuted}
          textValue={textValue}
        />
      </div>
    </div>
  );
}

// ── Single Slider Row ──────────────────────────────────────────────────

function SliderRow({
  label, value, min, max, gradient, onChange, onDragStart, onDragEnd, textMuted, textValue, displayValue,
}: {
  label: string; value: number; min: number; max: number; gradient: string;
  onChange: (v: number) => void; onDragStart: () => void; onDragEnd: () => void;
  textMuted: string; textValue: string; displayValue?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-[10px] ${textMuted} w-3 text-right`}>{label}</span>
      <div className="flex-1 relative">
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          onMouseDown={onDragStart} onMouseUp={onDragEnd}
          onTouchStart={onDragStart} onTouchEnd={onDragEnd}
          style={{ background: gradient, borderRadius: '3px' }}
        />
      </div>
      <span className={`font-mono text-[11px] ${textValue} ${displayValue ? 'w-[5ch]' : 'w-[3ch]'} text-right tabular-nums`}>
        {displayValue ?? value}
      </span>
    </div>
  );
}
