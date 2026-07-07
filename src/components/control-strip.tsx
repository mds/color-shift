"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap-config";
import { maxChroma, getThresholds } from "@/lib/color-engine";
import type {
  ColorData,
  ColorFormat,
  SliderMode,
  ContrastAlgorithm,
  ContrastResult,
  HSB,
  OklchValues,
} from "@/lib/color-engine";

// ── Types ─────────────────────────────────────────────────────────────

export interface PhotoData {
  id: string;
  url: string;
  thumbUrl: string;
  tinyUrl: string;
  color: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
  alt: string;
}

type ExpandedPanel = "bg" | "fg" | "score" | null;

interface ControlStripProps {
  bg: ColorData;
  fg: ColorData;
  bgHex: string;
  fgHex: string;
  contrast: ContrastResult;
  activeThreshold: number;
  theme: "dark" | "light";
  sliderMode: SliderMode;
  contrastAlgorithm: ContrastAlgorithm;
  colorFormat: ColorFormat;
  photoThumb: string | null;
  photoThumbRef: React.RefObject<HTMLButtonElement | null>;
  isPhotoLoading: boolean;
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
  onLoadPhoto: () => void;
  onPhotoOpen: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onToggleTheme: () => void;
  onToggleSliderMode: () => void;
  onToggleContrastAlgorithm: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  formatColorValue: (data: ColorData, format: ColorFormat) => string;
}

// ── Icons ─────────────────────────────────────────────────────────────

function ShuffleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 4h3l3 4-3 4H1" />
      <path d="M1 4h3l8 8h3" />
      <path d="M12 4h3M1 12h3l2.5-3.3" />
      <path d="M13 2l2 2-2 2" />
      <path d="M13 10l2 2-2 2" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1" y="2" width="14" height="12" rx="2" />
      <circle cx="5" cy="6" r="1.5" />
      <path d="M15 11l-4-4-3 3-2-2-5 5" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2L4 14M4 14L1 11M4 14L7 11" />
      <path d="M12 14L12 2M12 2L9 5M12 2L15 5" />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8L6 4L10 8" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4L6 8L10 4" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="9" height="9" rx="1.5" />
      <path d="M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5V8.5A1.5 1.5 0 002.5 10H4" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="3" />
      <path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.75 2.75l.7.7M10.55 10.55l.7.7M11.25 2.75l-.7.7M3.45 10.55l-.7.7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 7.5a5.5 5.5 0 01-7.78 5A5.5 5.5 0 019.5 1.22a5.5 5.5 0 003 6.28z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="animate-spin"
    >
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3" strokeLinecap="round" />
    </svg>
  );
}

// ── Main ControlStrip ─────────────────────────────────────────────────

export function ControlStrip(props: ControlStripProps) {
  const {
    bg,
    fg,
    bgHex,
    fgHex,
    contrast,
    activeThreshold,
    theme,
    sliderMode,
    contrastAlgorithm,
    colorFormat,
    photoThumb,
    photoThumbRef,
    isPhotoLoading,
    onBgInput,
    onFgInput,
    onSwap,
    onBumpUp,
    onBumpDown,
    onBumpTo,
    onUpdateBgHsb,
    onUpdateFgHsb,
    onUpdateBgOklch,
    onUpdateFgOklch,
    onCycleFormat,
    onGenerate,
    onLoadPhoto,
    onPhotoOpen,
    onCopy,
    onDownload,
    onToggleTheme,
    onToggleSliderMode,
    onToggleContrastAlgorithm,
    onDragStart,
    onDragEnd,
    formatColorValue,
  } = props;

  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);

  const isDark = theme === "dark";
  const chrome = isDark
    ? "bg-[#181818]/90 backdrop-blur-xl"
    : "bg-[#F0EDE8]/90 backdrop-blur-xl";
  const textMuted = isDark ? "text-white/40" : "text-black/40";
  const hoverBg = isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]";

  const togglePanel = useCallback((panel: ExpandedPanel) => {
    setExpandedPanel((prev) => (prev === panel ? null : panel));
  }, []);

  const { grade, scoreLabel } = contrast;
  const gradeColor =
    grade === "Fail"
      ? isDark
        ? "text-red-400"
        : "text-red-600"
      : grade === "AAA"
        ? isDark
          ? "text-emerald-400"
          : "text-emerald-600"
        : isDark
          ? "text-amber-300"
          : "text-amber-600";

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [onCopy]);

  return (
    <div className="shrink-0 p-3">
      <div className={`${chrome} rounded-2xl overflow-hidden`}>
        {/* Compact strip */}
        <div className="px-4 py-3 flex items-center gap-2">
          {/* BG swatch */}
          <button
            onClick={() => togglePanel("bg")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
              expandedPanel === "bg"
                ? isDark
                  ? "bg-white/10"
                  : "bg-black/8"
                : hoverBg
            }`}
          >
            <div
              className="w-5 h-5 rounded-md shrink-0 ring-1 ring-white/15"
              style={{ backgroundColor: bgHex }}
            />
            <span
              className={`font-mono text-[12px] tabular-nums ${isDark ? "text-white/60" : "text-black/60"}`}
            >
              {bg.hex.toUpperCase()}
            </span>
          </button>

          {/* Swap */}
          <button
            onClick={onSwap}
            className={`p-1 rounded-md ${hoverBg} ${textMuted}`}
            title="Swap (S)"
          >
            <SwapIcon />
          </button>

          {/* FG swatch */}
          <button
            onClick={() => togglePanel("fg")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
              expandedPanel === "fg"
                ? isDark
                  ? "bg-white/10"
                  : "bg-black/8"
                : hoverBg
            }`}
          >
            <div
              className="w-5 h-5 rounded-md shrink-0 ring-1 ring-white/15"
              style={{ backgroundColor: fgHex }}
            />
            <span className="font-mono text-[12px] tabular-nums opacity-60">
              {fg.hex.toUpperCase()}
            </span>
          </button>

          {/* Score */}
          <button
            onClick={() => togglePanel("score")}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors ${
              expandedPanel === "score"
                ? isDark
                  ? "bg-white/10"
                  : "bg-black/8"
                : hoverBg
            }`}
          >
            <span
              className={`font-mono text-[12px] font-semibold ${gradeColor}`}
            >
              {grade}
            </span>
            <span className={`font-mono text-[11px] ${textMuted}`}>
              {scoreLabel}
            </span>
          </button>

          {/* Algorithm toggle — always visible */}
          <button
            onClick={onToggleContrastAlgorithm}
            className={`font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors ${
              isDark
                ? "bg-white/8 text-white/50 hover:text-white/70"
                : "bg-black/5 text-black/50 hover:text-black/70"
            }`}
            title="Toggle contrast algorithm"
          >
            {contrastAlgorithm === "WCAG2" ? "WCAG 2" : "APCA"}
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <button
            onClick={onGenerate}
            className={`p-1.5 rounded-md ${hoverBg} ${textMuted}`}
            title="Generate (Space)"
          >
            <ShuffleIcon />
          </button>
          <button
            ref={photoThumbRef}
            onClick={photoThumb ? onPhotoOpen : onLoadPhoto}
            disabled={isPhotoLoading}
            className={`relative p-1.5 rounded-md ${hoverBg} ${textMuted} disabled:opacity-30 overflow-hidden`}
            title={photoThumb ? "View photo" : "Load photo (P)"}
          >
            {isPhotoLoading ? <SpinnerIcon /> : <PhotoIcon />}
            {photoThumb && (
              <img
                src={photoThumb}
                alt="Source"
                className="absolute inset-0 w-full h-full object-cover rounded-md"
              />
            )}
          </button>
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-md ${hoverBg} ${textMuted}`}
            title="Theme (T)"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-md ${hoverBg} ${textMuted} relative`}
            title="Copy"
          >
            <CopyIcon />
            {copied && (
              <span
                className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono ${isDark ? "text-white/60" : "text-black/60"} whitespace-nowrap`}
              >
                Copied
              </span>
            )}
          </button>
        </div>

        {/* Expandable panels */}
        <SliderPanel
          isOpen={expandedPanel === "bg"}
          label="Background"
          colorData={bg}
          sliderMode={sliderMode}
          onUpdateHsb={onUpdateBgHsb}
          onUpdateOklch={onUpdateBgOklch}
          onInput={onBgInput}
          onToggleSliderMode={onToggleSliderMode}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          isDark={isDark}
          colorFormat={colorFormat}
          formatColorValue={formatColorValue}
          onCycleFormat={onCycleFormat}
        />

        <SliderPanel
          isOpen={expandedPanel === "fg"}
          label="Foreground"
          colorData={fg}
          sliderMode={sliderMode}
          onUpdateHsb={onUpdateFgHsb}
          onUpdateOklch={onUpdateFgOklch}
          onInput={onFgInput}
          onToggleSliderMode={onToggleSliderMode}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          isDark={isDark}
          colorFormat={colorFormat}
          formatColorValue={formatColorValue}
          onCycleFormat={onCycleFormat}
        />

        <ScorePanel
          isOpen={expandedPanel === "score"}
          contrast={contrast}
          activeThreshold={activeThreshold}
          contrastAlgorithm={contrastAlgorithm}
          onBumpUp={onBumpUp}
          onBumpDown={onBumpDown}
          onBumpTo={onBumpTo}
          onToggleContrastAlgorithm={onToggleContrastAlgorithm}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

// ── SliderPanel ───────────────────────────────────────────────────────

function SliderPanel({
  isOpen,
  label,
  colorData,
  sliderMode,
  onUpdateHsb,
  onUpdateOklch,
  onInput,
  onToggleSliderMode,
  onDragStart,
  onDragEnd,
  isDark,
  colorFormat,
  formatColorValue,
  onCycleFormat,
}: {
  isOpen: boolean;
  label: string;
  colorData: ColorData;
  sliderMode: SliderMode;
  onUpdateHsb: (hsb: HSB) => void;
  onUpdateOklch: (oklch: OklchValues) => void;
  onInput: (value: string) => void;
  onToggleSliderMode: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDark: boolean;
  colorFormat: ColorFormat;
  formatColorValue: (data: ColorData, format: ColorFormat) => string;
  onCycleFormat: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const textMuted = isDark ? "text-white/40" : "text-black/40";
  const textValue = isDark ? "text-white/65" : "text-black/65";
  const hoverBg = isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const isFirstRender = useRef(true);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Skip animation on first render (panel starts hidden)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOpen) return;
    }

    if (isOpen) {
      gsap.set(panel, { display: "block", opacity: 1 });
      gsap.set(panel, { height: "auto" });
      const h = panel.offsetHeight;
      gsap.fromTo(
        panel,
        { height: 0, opacity: 0 },
        {
          height: h,
          opacity: 1,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(panel, { height: "auto" });
          },
        },
      );
    } else {
      gsap.to(panel, {
        height: 0,
        opacity: 0,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(panel, { display: "none" });
        },
      });
    }
  }, [isOpen]);

  const { hsb, oklch } = colorData;

  return (
    <div
      ref={panelRef}
      className="overflow-hidden"
      style={{ display: "none", height: 0, opacity: 0 }}
    >
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-sans ${textMuted}`}>
              {label}
            </span>
            {/* Editable color value */}
            {editing ? (
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => {
                  onInput(draft);
                  setEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onInput(draft);
                    setEditing(false);
                  }
                  if (e.key === "Escape") setEditing(false);
                }}
                className="font-mono text-[12px] bg-transparent border-none outline-none w-[20ch] tabular-nums"
                style={{
                  color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
                }}
                spellCheck={false}
              />
            ) : (
              <button
                onClick={() => {
                  setDraft(formatColorValue(colorData, colorFormat));
                  setEditing(true);
                }}
                className={`font-mono text-[12px] ${textValue} tabular-nums`}
              >
                {formatColorValue(colorData, colorFormat)}
              </button>
            )}
            <button
              onClick={onCycleFormat}
              className={`font-mono text-[10px] ${textMuted} ${hoverBg} rounded px-1 py-0.5`}
            >
              {colorFormat}
            </button>
          </div>
          <button
            onClick={onToggleSliderMode}
            className={`font-mono text-[10px] ${textMuted} ${hoverBg} rounded px-1.5 py-0.5`}
          >
            {sliderMode}
          </button>
        </div>

        {sliderMode === "OKLCH" ? (
          <OklchSliders
            oklch={oklch}
            onChange={onUpdateOklch}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDark={isDark}
          />
        ) : (
          <HsbSliders
            hsb={hsb}
            onChange={onUpdateHsb}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}

// ── ScorePanel ────────────────────────────────────────────────────────

function ScorePanel({
  isOpen,
  contrast,
  activeThreshold,
  contrastAlgorithm,
  onBumpUp,
  onBumpDown,
  onBumpTo,
  onToggleContrastAlgorithm,
  isDark,
}: {
  isOpen: boolean;
  contrast: ContrastResult;
  activeThreshold: number;
  contrastAlgorithm: ContrastAlgorithm;
  onBumpUp: () => void;
  onBumpDown: () => void;
  onBumpTo: (target: number) => void;
  onToggleContrastAlgorithm: () => void;
  isDark: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const textMuted = isDark ? "text-white/40" : "text-black/40";
  const hoverBg = isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.04]";
  const thresholds = getThresholds(contrastAlgorithm);

  const isFirstRender = useRef(true);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!isOpen) return;
    }

    if (isOpen) {
      gsap.set(panel, { display: "block", opacity: 1 });
      gsap.set(panel, { height: "auto" });
      const h = panel.offsetHeight;
      gsap.fromTo(
        panel,
        { height: 0, opacity: 0 },
        {
          height: h,
          opacity: 1,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.set(panel, { height: "auto" });
          },
        },
      );
    } else {
      gsap.to(panel, {
        height: 0,
        opacity: 0,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(panel, { display: "none" });
        },
      });
    }
  }, [isOpen]);

  const gradeColor =
    contrast.grade === "Fail"
      ? isDark
        ? "text-red-400"
        : "text-red-600"
      : contrast.grade === "AAA"
        ? isDark
          ? "text-emerald-400"
          : "text-emerald-600"
        : isDark
          ? "text-amber-300"
          : "text-amber-600";

  return (
    <div
      ref={panelRef}
      className="overflow-hidden"
      style={{ display: "none", height: 0, opacity: 0 }}
    >
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[13px] font-semibold ${gradeColor}`}
            >
              {contrast.grade}
            </span>
            <span
              className={`font-mono text-[12px] ${isDark ? "text-white/60" : "text-black/60"}`}
            >
              {contrast.scoreLabel}
            </span>
            <span className={`font-mono text-[10px] ${textMuted}`}>
              {contrast.gradeDesc}
            </span>
          </div>
          <button
            onClick={onToggleContrastAlgorithm}
            className={`font-mono text-[10px] ${textMuted} ${hoverBg} rounded px-1.5 py-0.5`}
          >
            {contrastAlgorithm === "WCAG2" ? "WCAG 2" : "APCA"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {thresholds.map((t) => (
            <button
              key={t}
              onClick={() => onBumpTo(t)}
              className={`font-mono text-[12px] px-2 py-1 rounded-md transition-colors ${
                t === activeThreshold
                  ? isDark
                    ? "bg-white/10 text-white/90"
                    : "bg-black/10 text-black/90"
                  : `${textMuted} ${hoverBg}`
              }`}
            >
              {contrastAlgorithm === "APCA" ? t : t.toFixed(1)}
            </button>
          ))}

          <div className="flex-1" />

          <div className="flex flex-col">
            <button
              onClick={onBumpUp}
              className={`${textMuted} ${hoverBg} rounded p-0.5`}
            >
              <ChevronUp />
            </button>
            <button
              onClick={onBumpDown}
              className={`${textMuted} ${hoverBg} rounded p-0.5`}
            >
              <ChevronDown />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── OKLCH Sliders ─────────────────────────────────────────────────────

function OklchSliders({
  oklch,
  onChange,
  onDragStart,
  onDragEnd,
  isDark,
}: {
  oklch: { l: number; c: number; h: number };
  onChange: (v: OklchValues) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDark: boolean;
}) {
  const textMuted = isDark ? "text-white/40" : "text-black/40";
  const textValue = isDark ? "text-white/60" : "text-black/60";
  const maxC = maxChroma(oklch.l, oklch.h);

  const lGrad = `linear-gradient(to right, oklch(0% 0 ${oklch.h}), oklch(50% ${oklch.c} ${oklch.h}), oklch(100% 0 ${oklch.h}))`;
  const cGrad = `linear-gradient(to right, oklch(${oklch.l}% 0 ${oklch.h}), oklch(${oklch.l}% ${maxC} ${oklch.h}))`;

  const hueStops = Array.from({ length: 13 }, (_, i) => {
    const h = i * 30;
    return `oklch(${oklch.l}% ${Math.min(oklch.c, 0.15)} ${h})`;
  }).join(", ");
  const hGrad = `linear-gradient(to right, ${hueStops})`;

  const chromaInt = Math.round(oklch.c * 1000);
  const maxCInt = Math.round(maxC * 1000);

  return (
    <div className="flex flex-col gap-2">
      <SliderRow
        label="L"
        value={Math.round(oklch.l)}
        min={0}
        max={100}
        gradient={lGrad}
        onChange={(v) => onChange({ l: v, c: oklch.c, h: oklch.h })}
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
        gradient={cGrad}
        onChange={(v) => onChange({ l: oklch.l, c: v / 1000, h: oklch.h })}
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
        gradient={hGrad}
        onChange={(v) => onChange({ l: oklch.l, c: oklch.c, h: v })}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        textMuted={textMuted}
        textValue={textValue}
      />
    </div>
  );
}

// ── HSB Sliders ───────────────────────────────────────────────────────

function HsbSliders({
  hsb,
  onChange,
  onDragStart,
  onDragEnd,
  isDark,
}: {
  hsb: HSB;
  onChange: (v: HSB) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDark: boolean;
}) {
  const textMuted = isDark ? "text-white/40" : "text-black/40";
  const textValue = isDark ? "text-white/60" : "text-black/60";

  const hGrad =
    "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)";
  const sGrad = `linear-gradient(to right, hsl(${hsb.h}, 0%, ${hsb.b / 2 + 25}%), hsl(${hsb.h}, 100%, 50%))`;
  const bGrad = `linear-gradient(to right, #000000, hsl(${hsb.h}, ${hsb.s}%, 50%))`;

  return (
    <div className="flex flex-col gap-2">
      <SliderRow
        label="H"
        value={hsb.h}
        min={0}
        max={360}
        gradient={hGrad}
        onChange={(v) => onChange({ ...hsb, h: v })}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        textMuted={textMuted}
        textValue={textValue}
      />
      <SliderRow
        label="S"
        value={hsb.s}
        min={0}
        max={100}
        gradient={sGrad}
        onChange={(v) => onChange({ ...hsb, s: v })}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        textMuted={textMuted}
        textValue={textValue}
      />
      <SliderRow
        label="B"
        value={hsb.b}
        min={0}
        max={100}
        gradient={bGrad}
        onChange={(v) => onChange({ ...hsb, b: v })}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        textMuted={textMuted}
        textValue={textValue}
      />
    </div>
  );
}

// ── SliderRow ─────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  gradient,
  onChange,
  onDragStart,
  onDragEnd,
  textMuted,
  textValue,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  gradient: string;
  onChange: (v: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  textMuted: string;
  textValue: string;
  displayValue?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`font-mono text-[10px] ${textMuted} w-3 text-right`}>
        {label}
      </span>
      <div className="flex-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          onMouseDown={onDragStart}
          onMouseUp={onDragEnd}
          onTouchStart={onDragStart}
          onTouchEnd={onDragEnd}
          style={{ background: gradient, borderRadius: "3px" }}
        />
      </div>
      <span
        className={`font-mono text-[11px] ${textValue} ${displayValue ? "w-[5ch]" : "w-[3ch]"} text-right tabular-nums`}
      >
        {displayValue ?? value}
      </span>
    </div>
  );
}
