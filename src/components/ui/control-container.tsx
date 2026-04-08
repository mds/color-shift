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
                // showClose
                // onClose={onSlidersClose}
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
      {/* Mobile font-size: all control text forced to 18px per Figma spec. */}
      {/* [&_*]:text-[16px] has higher specificity than primitives' text-xs. */}
      <div
        className="flex sm:hidden flex-col gap-1 w-full overflow-visible px-6 pt-6 [&_*]:text-[16px]"
        style={{
          paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* Row 1 — Photo nav: [← arrow] [→ arrow].
            File picker moved onto the photo itself (strip-transition.tsx).
            Visible in every state except export. */}
        <YPanel open={controlsState !== 'export'}>
          <div className="flex items-center justify-between">
            <IconButton onClick={onLeftArrow}>
              <LeftArrowIcon className="size-[30px] text-[#a39f9f]" />
            </IconButton>
            <IconButton onClick={onRightArrow}>
              <RightArrowIcon className="size-[30px] text-[#a39f9f]" />
            </IconButton>
          </div>
        </YPanel>

        {/* Slider panel (mobile) — only open when slidersExpanded AND state === 'default' */}
        <YPanel open={mobileSlidersOpen} className="flex flex-col gap-4 w-full pt-3">
          <ColorMode
            mode={sliderMode}
            onModeChange={onSliderModeChange}
            // showClose
            // onClose={onSlidersClose}
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

        {/* Score panel — threshold stack. Opens ABOVE the always-visible score/export row.
            (The WCAG/APCA toggle replaces the EXPORT button in the bottom row when this panel is open.) */}
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
        </YPanel>

        {/* Export panel — action stack. Opens ABOVE the always-visible score/export row. */}
        <YPanel open={controlsState === 'export'} className="flex flex-col gap-3 items-start pt-3">
          <CSButton label="COPY URL" animated onClick={onCopyUrl} />
          <CSButton label="COPY PARAMETERS" animated onClick={() => {}} />
          <CSButton label="DOWNLOAD .MD" animated onClick={onDownloadMd} />
        </YPanel>

        {/* Swatches row — Y-collapses when a panel is open (score or export). */}
        <YPanel open={controlsState === 'default'} className="pt-3">
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
                className={`size-[30px] ${swapSelected ? 'text-[#e5e0e0]' : 'text-[#a39f9f]'}`}
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
        </YPanel>

        {/* Always-visible score + export row. Buttons stay put; tapping toggles panels above. */}
        <div className="flex flex-col pt-3">
          {/* Score + Export row: justify-between. Both get 'selected' styling when their panel is open. */}
          <div className="flex items-center justify-between w-full">
            {/* Score collapses (Y-axis) when export is open; same mechanic as
                every other mobile panel so it lands back in exactly the same
                position with no TubeText interference. */}
            <YPanel open={controlsState !== 'export'}>
              <Score
                type={algorithm}
                state={controlsState === 'score' ? 'selected' : 'default'}
                rating={rating}
                value={contrastValue}
                onClick={onResultsToggle}
              />
            </YPanel>
            {/* Right-side button: in score state, swaps to WCAG/APCA toggle via TubeText's text change animation. */}
            <button
              type="button"
              onClick={controlsState === 'score' ? onAlgorithmToggle : onExportToggle}
              className={`flex items-center justify-center p-2 rounded-lg shrink-0 transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
                controlsState === 'export' ? 'bg-[#191919]' : 'hover:bg-[#191919]'
              }`}
              style={
                controlsState === 'export'
                  ? { boxShadow: 'inset 0 0 0 1px #332f2f' }
                  : undefined
              }
            >
              <TubeText
                text={
                  controlsState === 'score'
                    ? (algorithm === 'wcag' ? 'WCAG' : 'APCA')
                    : 'EXPORT'
                }
                className="font-mono text-xs leading-none whitespace-nowrap"
                style={{ color: controlsState === 'export' ? '#e5e0e0' : '#a39f9f' }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
