'use client';

// ControlContainer — the full bottom panel orchestrator
// Figma: "control container" component (33:2305)
//
// Two render paths — completely isolated:
//   - Desktop (sm+): existing [slider-panel, ControlsBar] stack. Unchanged.
//   - Mobile (<sm):  [photo-nav, slider YPanel, state YPanels] stack.
//
// All mobile animation is y-axis collapse/reveal via CSS grid-rows 0fr↔1fr
// + translateY + opacity. Same mechanic as the desktop slider panel.
// No GSAP on mobile. No x-axis motion.

import type { ReactNode } from 'react';
import { ColorMode } from './color-mode';
import { ColorSliders } from './color-sliders';
import { ControlsBar } from './controls-bar';
import { CSButton } from './cs-button';
import { IconButton } from './icon-button';
import { Score } from './score';
import { TubeText } from './tube-text';
import { LeftArrowIcon, RightArrowIcon, SwapArrowsIcon } from './icons';

type SliderMode = 'OKLCH' | 'HSB' | 'RGB';

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

interface ControlContainerProps {
  // Slider panel
  slidersExpanded: boolean;
  sliderMode: SliderMode;
  sliders: [SliderConfig, SliderConfig, SliderConfig];
  onSliderModeChange?: (mode: SliderMode) => void;
  onSliderChange?: (index: number, value: number) => void;
  onSliderDragStart?: () => void;
  onSliderDragEnd?: () => void;
  onSlidersClose?: () => void;
  onGripClick?: () => void;

  // Controls bar
  controlsState: 'default' | 'score' | 'export';
  bgHex: string;
  fgHex: string;
  bgState?: 'default' | 'hover' | 'selected';
  fgState?: 'default' | 'hover' | 'selected';
  algorithm: 'wcag' | 'apca';
  rating: string;
  contrastValue: string;
  thresholds: number[];
  activeThreshold?: number;
  onBgClick?: () => void;
  onFgClick?: () => void;
  onSwap?: () => void;
  swapSelected?: boolean;
  onResultsToggle?: () => void;
  onAlgorithmToggle?: () => void;
  onThresholdSelect?: (threshold: number) => void;
  onLeftArrow?: () => void;
  onRightArrow?: () => void;
  onExportToggle?: () => void;
  onCopyUrl?: () => void;
  onDownloadMd?: () => void;

  className?: string;
}

// ─── Local helper: Y-axis collapse/reveal panel (mobile only) ───
// Same mechanic as the existing desktop slider panel: grid-rows 0fr↔1fr
// on outer + translateY + opacity on inner, all via CSS vars tuned by DialKit.
function YPanel({
  open,
  className,
  children,
}: {
  open: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid overflow-visible"
      style={{
        gridTemplateRows: open ? '1fr' : '0fr',
        transition:
          'grid-template-rows var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
      }}
    >
      <div className="overflow-hidden">
        <div
          className={className}
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-8px)',
            transition:
              'transform var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1)), opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
            pointerEvents: open ? 'auto' : 'none',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ControlContainer({
  slidersExpanded,
  sliderMode,
  sliders,
  onSliderModeChange,
  onSliderChange,
  onSliderDragStart,
  onSliderDragEnd,
  onSlidersClose,
  onGripClick,
  controlsState,
  bgHex,
  fgHex,
  bgState,
  fgState,
  algorithm,
  rating,
  contrastValue,
  thresholds,
  activeThreshold,
  onBgClick,
  onFgClick,
  onSwap,
  swapSelected,
  onResultsToggle,
  onAlgorithmToggle,
  onThresholdSelect,
  onLeftArrow,
  onRightArrow,
  onExportToggle,
  onCopyUrl,
  onDownloadMd,
  className,
}: ControlContainerProps) {
  // Mobile-only: sliders are mutually exclusive with score/export states.
  const mobileSlidersOpen = slidersExpanded && controlsState === 'default';

  return (
    <div
      className={`bg-black w-full shrink-0 overflow-visible ${className ?? ''}`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ──────────────── DESKTOP (sm+) — unchanged ──────────────── */}
      <div className="hidden sm:flex sm:flex-col sm:p-2 sm:w-full sm:overflow-visible">
        {/* Slider panel — always mounted, animated with CSS grid rows + transform */}
        <div
          className="grid overflow-visible"
          style={{
            gridTemplateRows: slidersExpanded ? '1fr' : '0fr',
            transition:
              'grid-template-rows var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1)), opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
          }}
        >
          <div className="overflow-hidden">
            <div
              className="flex flex-col gap-4 w-full pb-4 overflow-visible"
              style={{
                opacity: slidersExpanded ? 1 : 0,
                transform: slidersExpanded ? 'translateY(0)' : 'translateY(16px)',
                transition:
                  'transform var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1)), opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
              }}
            >
              <ColorMode
                mode={sliderMode}
                onModeChange={onSliderModeChange}
                showClose
                onClose={onSlidersClose}
                className="w-full"
              />
              <ColorSliders
                sliders={sliders}
                activeMode={sliderMode}
                onChange={onSliderChange}
                onDragStart={onSliderDragStart}
                onDragEnd={onSliderDragEnd}
              />
            </div>
          </div>
        </div>

        {/* Controls bar — always visible on desktop */}
        <ControlsBar
          state={controlsState}
          bgHex={bgHex}
          fgHex={fgHex}
          bgState={bgState}
          fgState={fgState}
          algorithm={algorithm}
          rating={rating}
          contrastValue={contrastValue}
          thresholds={thresholds}
          activeThreshold={activeThreshold}
          onBgClick={onBgClick}
          onFgClick={onFgClick}
          onSwap={onSwap}
          swapSelected={swapSelected}
          onResultsToggle={onResultsToggle}
          onAlgorithmToggle={onAlgorithmToggle}
          onThresholdSelect={onThresholdSelect}
          onLeftArrow={onLeftArrow}
          onRightArrow={onRightArrow}
          onExportToggle={onExportToggle}
          onCopyUrl={onCopyUrl}
          onDownloadMd={onDownloadMd}
        />
      </div>

      {/* ──────────────── MOBILE (<sm) — new layout ──────────────── */}
      {/* Dock padding per Figma: 24 / 24 / 24 / 48 (+ safe-area inset) */}
      <div className="flex sm:hidden flex-col w-full overflow-visible px-6 pt-6 pb-12">
        {/* Row 1 — Photo nav: [← arrow] [photo file input] [→ arrow], justify-between */}
        <div className="flex items-center justify-between">
          <IconButton onClick={onLeftArrow}>
            <LeftArrowIcon className="size-6 text-[#a39f9f]" />
          </IconButton>

          {/* Native file input — layout only, upload handler wired later */}
          <label className="flex items-center justify-center px-1 py-0.5 rounded-lg cursor-pointer shrink-0 transition-colors duration-150 hover:bg-[#191919] outline-none focus-visible:ring-1 focus-visible:ring-white/30">
            <input type="file" accept="image/*" className="sr-only" />
            <svg
              className="size-6 text-[#a39f9f]"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="6" width="18" height="14" rx="2" />
              <circle cx="12" cy="13" r="3.5" />
              <path d="M8 6l1.5-2h5L16 6" />
            </svg>
          </label>

          <IconButton onClick={onRightArrow}>
            <RightArrowIcon className="size-6 text-[#a39f9f]" />
          </IconButton>
        </div>

        {/* Slider panel (mobile) — only open when slidersExpanded AND state === 'default' */}
        <YPanel open={mobileSlidersOpen} className="flex flex-col gap-4 w-full pt-3">
          <ColorMode
            mode={sliderMode}
            onModeChange={onSliderModeChange}
            showClose
            onClose={onSlidersClose}
            className="w-full"
          />
          <ColorSliders
            sliders={sliders}
            activeMode={sliderMode}
            onChange={onSliderChange}
            onDragStart={onSliderDragStart}
            onDragEnd={onSliderDragEnd}
          />
        </YPanel>

        {/* State: default — swatches + score/export */}
        <YPanel open={controlsState === 'default'} className="flex flex-col gap-3 pt-3">
          {/* Swatches row: FG | reverse | BG, justify-between */}
          <div className="flex items-center justify-between w-full">
            <CSButton
              label={fgHex.replace('#', '').toUpperCase()}
              swatchColor={fgHex}
              accentColor={fgHex}
              state={fgState ?? 'default'}
              animated
              onClick={onFgClick}
            />
            <IconButton selected={swapSelected} onClick={onSwap}>
              <SwapArrowsIcon
                className={`size-6 ${swapSelected ? 'text-[#e5e0e0]' : 'text-[#a39f9f]'}`}
              />
            </IconButton>
            <CSButton
              label={bgHex.replace('#', '').toUpperCase()}
              swatchColor={bgHex}
              accentColor={bgHex}
              state={bgState ?? 'default'}
              animated
              onClick={onBgClick}
            />
          </div>

          {/* Score + Export row: justify-between */}
          <div className="flex items-center justify-between w-full">
            <Score
              type={algorithm}
              state="default"
              rating={rating}
              value={contrastValue}
              onClick={onResultsToggle}
            />
            <button
              type="button"
              onClick={onExportToggle}
              className="flex items-center justify-center p-2 rounded-lg shrink-0 transition-colors duration-150 hover:bg-[#191919] outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              <TubeText
                text="EXPORT"
                className="font-mono text-xs leading-none whitespace-nowrap"
                style={{ color: '#a39f9f' }}
              />
            </button>
          </div>
        </YPanel>

        {/* State: score — threshold stack + score pill + wcag toggle */}
        <YPanel open={controlsState === 'score'} className="flex flex-col gap-3 pt-3">
          {/* Vertical threshold stack — full-width CSButtons */}
          <div className="flex flex-col gap-3 w-full">
            {thresholds.map((t) => (
              <CSButton
                key={t}
                label={String(t)}
                state={activeThreshold === t ? 'selected' : 'default'}
                animated
                onClick={() => onThresholdSelect?.(t)}
                className="w-full"
              />
            ))}
          </div>

          {/* Score (active) + WCAG/APCA toggle row: justify-between */}
          <div className="flex items-center justify-between w-full">
            <Score
              type={algorithm}
              state="selected"
              rating={rating}
              value={contrastValue}
              onClick={onResultsToggle}
            />
            <button
              type="button"
              onClick={onAlgorithmToggle}
              className="flex items-center justify-center p-2 rounded-lg shrink-0 transition-colors duration-150 hover:bg-[#191919] outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              <TubeText
                text={algorithm === 'wcag' ? 'WCAG' : 'APCA'}
                className="font-mono text-xs leading-none whitespace-nowrap"
                style={{ color: '#a39f9f' }}
              />
            </button>
          </div>
        </YPanel>

        {/* State: export — action stack + EXPORT active pill (bottom-right) */}
        <YPanel open={controlsState === 'export'} className="flex flex-col gap-3 items-end pt-3">
          {/* Export action stack — items-start, hug-width */}
          <div className="flex flex-col gap-3 items-start w-full">
            <CSButton label="COPY URL" animated onClick={onCopyUrl} />
            <CSButton label="COPY PARAMETERS" animated onClick={() => {}} />
            <CSButton label="DOWNLOAD .MD" animated onClick={onDownloadMd} />
          </div>

          {/* EXPORT active pill — anchored bottom-right via items-end on parent */}
          <button
            type="button"
            onClick={onExportToggle}
            className="flex items-center justify-center p-2 rounded-lg shrink-0 transition-colors duration-150 bg-[#191919] outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            style={{ boxShadow: 'inset 0 0 0 1px #332f2f' }}
          >
            <TubeText
              text="EXPORT"
              className="font-mono text-xs leading-none whitespace-nowrap"
              style={{ color: '#e5e0e0' }}
            />
          </button>
        </YPanel>
      </div>
    </div>
  );
}
