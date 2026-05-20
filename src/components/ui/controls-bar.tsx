'use client';

// ControlsBar — full toolbar row with animated state transitions
// Figma: "controls" component (33:2263)
// Three containers: [swatches (anchor)] [results] [right]
//
// Right container layout:
//   Default: [arrows] [export-options (hidden at EXPORT position)] [EXPORT]
//   Export:  [arrows (hidden, -x)] [export-options (visible, slid in from -x)] [EXPORT]
//   Score:   entire right container hidden
//
// EXPORT button is the anchor — never moves. It toggles the export state.
//
// Animation principles (Emil Kowalski / design-engineering):
// - Enter/exit → ease-out-quint
// - Only animate transform + opacity (GPU-composited)
// - Duration: 150ms exit, 200ms enter
// - Exits faster than entrances

import { useRef, useLayoutEffect } from 'react';
import { gsap, Flip } from '@/lib/gsap-config';
import { Swatches } from './swatches';
import { Score } from './score';
import { CSButton } from './cs-button';
import { ThresholdButtons } from './threshold-buttons';
import { TubeText } from './tube-text';
import { Arrows, type ArrowsHandle } from './arrows';

type ControlsState = 'default' | 'score' | 'export';


// Read DialKit-tuned control bar motion from window.__motion
function getControlBarMotion(): { duration: number; ease: string } {
  if (typeof window === 'undefined') return { duration: 0.2, ease: 'power2.out' };
  const m = (window as unknown as { __motion?: { controlBar?: { duration: number; ease: string } } }).__motion;
  return m?.controlBar ?? { duration: 0.2, ease: 'power2.out' };
}

interface ControlsBarProps {
  state: ControlsState;
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
  exportFeedback?: 'url' | 'params' | 'markdown' | null;
  onCopyUrl?: () => void;
  onCopyParams?: () => void;
  onDownloadMd?: () => void;
  className?: string;
}

export function ControlsBar({
  state,
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
  swapSelected = false,
  onResultsToggle,
  onAlgorithmToggle,
  onThresholdSelect,
  onLeftArrow,
  onRightArrow,
  onExportToggle,
  exportFeedback,
  onCopyUrl,
  onCopyParams,
  onDownloadMd,
  className,
}: ControlsBarProps) {
  const prevStateRef = useRef(state);
  const isAnimatingRef = useRef(false);
  const visualStateRef = useRef(state); // tracks what GSAP thinks is the current state

  // Refs for animatable zones
  const resultsExpandedRef = useRef<HTMLDivElement>(null);
  const algorithmRef = useRef<HTMLButtonElement>(null);
  const arrowsRef = useRef<ArrowsHandle>(null);
  const exportOptionsRef = useRef<HTMLDivElement>(null);
  const copyUrlLabel = exportFeedback === 'url' ? 'COPIED URL' : 'COPY URL';
  const copyParamsLabel = exportFeedback === 'params' ? 'COPIED PARAMS' : 'COPY PARAMETERS';
  const downloadMdLabel = exportFeedback === 'markdown' ? 'DOWNLOADED .MD' : 'DOWNLOAD .MD';

  // Resting styles for each state — the ground truth GSAP enforces
  // Helper: get both arrow button elements
  const getArrows = () => [arrowsRef.current?.leftEl, arrowsRef.current?.rightEl].filter(Boolean);

  // Arrows ALWAYS stay position:relative (in flow). Only opacity + transform animate.
  // Thresholds and export options swap between absolute/relative.
  const applyRestingState = (s: ControlsState) => {
    if (s === 'default') {
      gsap.set(resultsExpandedRef.current, { position: 'absolute', autoAlpha: 0, x: -16 });
      gsap.set(exportOptionsRef.current, { autoAlpha: 0, x: 16, position: 'absolute' });
    } else if (s === 'score') {
      gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 1, x: 0 });
      gsap.set(exportOptionsRef.current, { autoAlpha: 0, x: 16, position: 'absolute' });
    } else if (s === 'export') {
      gsap.set(resultsExpandedRef.current, { position: 'absolute', autoAlpha: 0, x: -16 });
      gsap.set(exportOptionsRef.current, { autoAlpha: 1, x: 0, position: 'relative' });
    }
  };

  // Re-apply resting state on EVERY render to undo React's style clearing.
  // Skipped during active animations so GSAP's intermediate values aren't overwritten.
  useLayoutEffect(() => {
    if (!isAnimatingRef.current) {
      applyRestingState(visualStateRef.current);
    }
  });

  // Animate transitions — only transform + opacity
  // useLayoutEffect so it runs BEFORE paint, undoing React's style clearing
  useLayoutEffect(() => {
    const prev = prevStateRef.current;
    if (prev === state) return;
    prevStateRef.current = state;

    // Restore previous visual state (React just cleared it)
    applyRestingState(prev);

    // Mark animating so the per-render guard doesn't overwrite us
    isAnimatingRef.current = true;
    const onDone = () => {
      isAnimatingRef.current = false;
      visualStateRef.current = state;
      applyRestingState(state); // ensure final resting state is clean
    };

    const cb = getControlBarMotion();
    const DUR = cb.duration;
    const d = { duration: DUR, ease: cb.ease };

    // ── default → export ──
    if (prev === 'default' && state === 'export') {
      // Arrows fade handled by CSS transition on wrapper
      gsap.set(exportOptionsRef.current, { position: 'relative' });
      gsap.fromTo(exportOptionsRef.current, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    // ── export → default ──
    else if (prev === 'export' && state === 'default') {
      gsap.to(exportOptionsRef.current, { autoAlpha: 0, x: 16, ...d, onComplete: onDone });
      gsap.set(exportOptionsRef.current, { position: 'absolute', delay: DUR });
    }

    // ── default → score ──
    else if (prev === 'default' && state === 'score') {
      const flipState = Flip.getState(algorithmRef.current);
      gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 0, x: -16 });
      Flip.from(flipState, d);
      gsap.to(resultsExpandedRef.current, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    // ── score → default ──
    else if (prev === 'score' && state === 'default') {
      const flipState = Flip.getState(algorithmRef.current);
      gsap.set(resultsExpandedRef.current, { position: 'absolute' });
      Flip.from(flipState, d);
      gsap.to(resultsExpandedRef.current, { autoAlpha: 0, x: -16, ...d, onComplete: onDone });
    }

    // ── score → export ──
    else if (prev === 'score' && state === 'export') {
      const flipState = Flip.getState(algorithmRef.current);
      gsap.set(resultsExpandedRef.current, { position: 'absolute' });
      Flip.from(flipState, d);
      gsap.to(resultsExpandedRef.current, { autoAlpha: 0, x: -16, ...d });
      // Arrows fade handled by CSS transition on wrapper
      gsap.set(exportOptionsRef.current, { position: 'relative' });
      gsap.fromTo(exportOptionsRef.current, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    // ── export → score ──
    else if (prev === 'export' && state === 'score') {
      gsap.to(exportOptionsRef.current, { autoAlpha: 0, x: 16, ...d });
      gsap.set(exportOptionsRef.current, { position: 'absolute', delay: DUR });
      const flipState = Flip.getState(algorithmRef.current);
      gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 0, x: -16 });
      Flip.from(flipState, d);
      gsap.to(resultsExpandedRef.current, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    else { onDone(); }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className={`flex flex-wrap sm:flex-nowrap items-center gap-y-2 sm:gap-y-0 bg-black w-full ${className ?? ''}`}>
      {/* ── Row 1: Swatches + Arrows + Export ── */}
      <div className="flex items-center w-full sm:w-auto sm:flex-1 min-w-0">
        <Swatches
          bgHex={bgHex}
          fgHex={fgHex}
          bgState={bgState}
          fgState={fgState}
          swapSelected={swapSelected}
          onBgClick={onBgClick}
          onFgClick={onFgClick}
          onSwap={onSwap}
        />

        {/* Score — desktop only in row 1 */}
        <Score
          type={algorithm}
          state={state === 'score' ? 'selected' : 'default'}
          rating={rating}
          value={contrastValue}
          onClick={onResultsToggle}
          className="ml-auto relative z-10 hidden sm:flex"
        />
      </div>

      {/* ── Right side of row 1 (mobile) / part of single row (desktop) ── */}
      <div className="flex items-center shrink-0 sm:hidden">
        {/* Arrows — visible in default/score, faded in export */}
        <div
          style={{
            opacity: state === 'export' ? 0 : 1,
            pointerEvents: state === 'export' ? 'none' : 'auto',
            transition: 'opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
          }}
          className="mr-1"
        >
          <Arrows ref={arrowsRef} onLeft={onLeftArrow} onRight={onRightArrow} />
        </div>

        {/* Export group */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <div
            className="flex items-center gap-1"
            style={{
              opacity: state === 'export' ? 1 : 0,
              pointerEvents: state === 'export' ? 'auto' : 'none',
              position: state === 'export' ? 'relative' : 'absolute',
              transition: 'opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
            }}
          >
            <CSButton label={copyUrlLabel} animated onClick={onCopyUrl} />
            <CSButton label={copyParamsLabel} animated onClick={onCopyParams} />
            <CSButton label={downloadMdLabel} animated onClick={onDownloadMd} />
          </div>
          <button
            type="button"
            onClick={onExportToggle}
            className={`
              flex items-center justify-center p-2 rounded-lg shrink-0
              transition-colors duration-150 outline-none focus-visible:ring-1 focus-visible:ring-white/30
              ${state === 'export' ? 'bg-[#191919]' : 'hover:bg-[#191919]'}
            `}
            style={state === 'export' ? { boxShadow: 'inset 0 0 0 1px #332f2f' } : undefined}
          >
            <TubeText
              text={state === 'export' ? 'CLOSE' : 'EXPORT'}
              className="font-mono text-xs leading-none whitespace-nowrap"
              style={{ color: state === 'export' ? '#e5e0e0' : '#a39f9f' }}
            />
          </button>
        </div>
      </div>

      {/* ── Row 2: Score + Thresholds + WCAG/APCA + (desktop: Arrows + Export) ── */}
      <div className="flex items-center w-full sm:w-auto sm:flex-1 min-w-0 relative">
        {/* Score — mobile only in row 2 */}
        <Score
          type={algorithm}
          state={state === 'score' ? 'selected' : 'default'}
          rating={rating}
          value={contrastValue}
          onClick={onResultsToggle}
          className="relative z-10 sm:hidden"
        />

        {/* Thresholds — hidden in default, animate in from +x when score expanded */}
        <div
          ref={resultsExpandedRef}
          className="flex items-center gap-1 shrink-0"
        >
          <ThresholdButtons
            thresholds={thresholds}
            activeThreshold={activeThreshold}
            algorithm={algorithm}
            onSelect={onThresholdSelect}
          />
        </div>

        {/* WCAG/APCA */}
        <button
          ref={algorithmRef}
          type="button"
          onClick={onAlgorithmToggle}
          className="no-press flex items-center justify-center p-2 rounded-lg shrink-0 transition-colors duration-150 hover:bg-[#191919] outline-none focus-visible:ring-1 focus-visible:ring-white/30"
        >
          <TubeText
            text={algorithm === 'wcag' ? 'WCAG' : 'APCA'}
            className="font-mono text-xs leading-none whitespace-nowrap"
            style={{ color: '#a39f9f' }}
          />
        </button>

        {/* Arrows + Export — desktop only (mobile version is in row 1) */}
        <div className="hidden sm:flex items-center flex-1 min-w-0">
          <div
            style={{
              opacity: state === 'export' ? 0 : 1,
              pointerEvents: state === 'export' ? 'none' : 'auto',
              transition: 'opacity var(--cb-duration, 0.2s) var(--cb-ease, cubic-bezier(0.33,1,0.68,1))',
            }}
            className="flex-1 mr-1"
          >
            <Arrows onLeft={onLeftArrow} onRight={onRightArrow} />
          </div>

          <div className="flex items-center gap-1 ml-auto shrink-0 relative">
            {/* Export options — hidden in default, visible in export */}
            <div
              ref={exportOptionsRef}
              className="flex items-center gap-1"
            >
              <CSButton label={copyUrlLabel} animated onClick={onCopyUrl} />
              <CSButton label={copyParamsLabel} animated onClick={onCopyParams} />
              <CSButton label={downloadMdLabel} animated onClick={onDownloadMd} />
            </div>

            {/* EXPORT — always visible, always rightmost */}
            <button
              type="button"
              onClick={onExportToggle}
              className={`
                flex items-center justify-center p-2 rounded-lg shrink-0
                transition-colors duration-150
                ${state === 'export' ? 'bg-[#191919]' : 'hover:bg-[#191919]'}
              `}
              style={state === 'export' ? { boxShadow: 'inset 0 0 0 1px #2B2727' } : undefined}
            >
              <TubeText
                text={state === 'export' ? 'CLOSE' : 'EXPORT'}
                className="font-mono text-xs leading-none whitespace-nowrap"
                style={{ color: '#a39f9f' }}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
