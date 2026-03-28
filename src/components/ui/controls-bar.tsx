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

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function brighterColor(a: string, b: string): string {
  return luminance(a) >= luminance(b) ? a : b;
}

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';  // ease-out-quint
const DUR = 0.2;

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
  onResultsToggle?: () => void;
  onAlgorithmToggle?: () => void;
  onThresholdSelect?: (threshold: number) => void;
  onLeftArrow?: () => void;
  onRightArrow?: () => void;
  onExportToggle?: () => void;
  onCopyUrl?: () => void;
  onDownloadMd?: () => void;
  onExport?: () => void;
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
  onResultsToggle,
  onAlgorithmToggle,
  onThresholdSelect,
  onLeftArrow,
  onRightArrow,
  onExportToggle,
  onCopyUrl,
  onDownloadMd,
  onExport,
  className,
}: ControlsBarProps) {
  const prevStateRef = useRef(state);
  const isAnimatingRef = useRef(false);
  const visualStateRef = useRef(state); // tracks what GSAP thinks is the current state

  // Refs for animatable zones
  const resultsExpandedRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const algorithmRef = useRef<HTMLButtonElement>(null);
  const arrowsRef = useRef<ArrowsHandle>(null);
  const exportOptionsRef = useRef<HTMLDivElement>(null);

  // Resting styles for each state — the ground truth GSAP enforces
  // Helper: get both arrow button elements
  const getArrows = () => [arrowsRef.current?.leftEl, arrowsRef.current?.rightEl].filter(Boolean);

  // Arrows ALWAYS stay position:relative (in flow). Only opacity + transform animate.
  // Thresholds and export options swap between absolute/relative.
  const applyRestingState = (s: ControlsState) => {
    if (s === 'default') {
      gsap.set(resultsExpandedRef.current, { position: 'absolute', autoAlpha: 0, x: -16 });
      gsap.set(getArrows(), { autoAlpha: 1, x: 0 });
      gsap.set(exportOptionsRef.current, { position: 'absolute', autoAlpha: 0, x: 16 });
    } else if (s === 'score') {
      gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 1, x: 0 });
      gsap.set(getArrows(), { autoAlpha: 1, x: 0 });
      gsap.set(exportOptionsRef.current, { position: 'absolute', autoAlpha: 0, x: 16 });
    } else if (s === 'export') {
      gsap.set(resultsExpandedRef.current, { position: 'absolute', autoAlpha: 0, x: -16 });
      gsap.set(getArrows(), { autoAlpha: 0, x: -16 });
      gsap.set(exportOptionsRef.current, { position: 'relative', autoAlpha: 1, x: 0 });
    }
  };

  // Re-apply resting state on EVERY render to undo React's style clearing.
  // Skipped during active animations so GSAP's intermediate values aren't overwritten.
  useLayoutEffect(() => {
    if (!isAnimatingRef.current) {
      applyRestingState(visualStateRef.current);
    }
  });

  // The brighter of bg/fg — used for selected state inner glow
  // For EXPORT/CLOSE button: brighter color as bg, darker as text
  const accent = brighterColor(bgHex, fgHex);
  const accentDark = accent === bgHex ? fgHex : bgHex;

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

    const d = { duration: DUR, ease: EASE_OUT };

    // ── default → export ──
    if (prev === 'default' && state === 'export') {
      gsap.to(getArrows(), { autoAlpha: 0, x: -16, stagger: 0.03, ...d });
      gsap.set(exportOptionsRef.current, { position: 'relative' });
      gsap.fromTo(exportOptionsRef.current, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    // ── export → default ──
    else if (prev === 'export' && state === 'default') {
      gsap.to(exportOptionsRef.current, { autoAlpha: 0, x: 16, ...d });
      gsap.fromTo(getArrows(), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, stagger: 0.03, ...d, onComplete: onDone });
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
      gsap.to(getArrows(), { autoAlpha: 0, x: -16, stagger: 0.03, ...d });
      gsap.set(exportOptionsRef.current, { position: 'relative' });
      gsap.fromTo(exportOptionsRef.current, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    // ── export → score ──
    else if (prev === 'export' && state === 'score') {
      gsap.to(exportOptionsRef.current, { autoAlpha: 0, x: 16, ...d });
      gsap.fromTo(getArrows(), { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, stagger: 0.03, ...d });
      const flipState = Flip.getState(algorithmRef.current);
      gsap.set(resultsExpandedRef.current, { position: 'relative', autoAlpha: 0, x: -16 });
      Flip.from(flipState, d);
      gsap.to(resultsExpandedRef.current, { autoAlpha: 1, x: 0, ...d, onComplete: onDone });
    }

    else { onDone(); }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className={`flex items-center bg-black w-full ${className ?? ''}`}>
      {/* ── Left half: swatches ... score (score anchored right) ── */}
      <div className="flex items-center flex-1 min-w-0">
        <Swatches
          bgHex={bgHex}
          fgHex={fgHex}
          bgState={bgState}
          fgState={fgState}
          onBgClick={onBgClick}
          onFgClick={onFgClick}
          onSwap={onSwap}
        />

        {/* Score — anchored to the right of the left half, always visible */}
        <Score
          type={algorithm}
          state={state === 'score' ? 'selected' : 'default'}
          rating={rating}
          value={contrastValue}
          onClick={onResultsToggle}
          className="ml-auto relative z-10"
        />
      </div>

      {/* ── Right half: wcag ... arrows export (wcag anchored left) ── */}
      <div
        ref={rightContainerRef}
        className="flex items-center flex-1 min-w-0 relative"
      >
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

        {/* WCAG/APCA — anchored to the left of the right half */}
        <button
          ref={algorithmRef}
          type="button"
          onClick={onAlgorithmToggle}
          className="no-press flex items-center justify-center p-2 rounded-lg shrink-0 transition-colors duration-150 hover:bg-[#191919]"
        >
          <TubeText
            text={algorithm === 'wcag' ? 'WCAG' : 'APCA'}
            className="font-mono text-xs leading-none whitespace-nowrap"
            style={{ color: '#a39f9f' }}
          />
        </button>

        {/* Arrows — visible in default, hidden in export */}
        <Arrows ref={arrowsRef} onLeft={onLeftArrow} onRight={onRightArrow} className="flex-1 mr-1" />

        {/* Export group — pinned right: [export-options] [EXPORT button] */}
        <div className="flex items-center gap-1 ml-auto shrink-0 relative">
          {/* Export options — hidden in default, visible in export */}
          <div
            ref={exportOptionsRef}
            className="flex items-center gap-1"
          >
            <CSButton label="COPY URL" onClick={onCopyUrl} />
            <CSButton label="DOWNLOAD .MD" onClick={onDownloadMd} />
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
  );
}
