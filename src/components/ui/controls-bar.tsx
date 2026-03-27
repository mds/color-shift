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

import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap-config';
import { Swatches } from './swatches';
import { Score } from './score';
import { CSButton } from './cs-button';
import { ThresholdButtons } from './threshold-buttons';
import { Arrows } from './arrows';

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
const ENTER_DUR = 0.2;
const EXIT_DUR = 0.15;

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
  const initialStateRef = useRef(state); // frozen at mount — never changes

  // Refs for animatable zones
  const resultsCollapsedRef = useRef<HTMLDivElement>(null);
  const resultsExpandedRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<HTMLDivElement>(null);
  const exportOptionsRef = useRef<HTMLDivElement>(null);

  // Initial state — frozen at mount for SSR-safe first render only
  // After mount, GSAP owns all visibility/transform on these refs
  const initScore = initialStateRef.current === 'score';
  const initExport = initialStateRef.current === 'export';

  // The brighter of bg/fg — used for selected state inner glow
  const accent = brighterColor(bgHex, fgHex);

  // Animate transitions — only transform + opacity
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev === state) return;
    prevStateRef.current = state;

    const tl = gsap.timeline();

    // ── default → export ──
    if (prev === 'default' && state === 'export') {
      tl
        // Arrows slide out left + fade, then take out of flow
        .to(arrowsRef.current, { autoAlpha: 0, x: -16, duration: EXIT_DUR, ease: EASE_OUT })
        .set(arrowsRef.current, { position: 'absolute' })
        // Export options enter flow, then slide in from right
        .set(exportOptionsRef.current, { position: 'relative' })
        .fromTo(exportOptionsRef.current,
          { autoAlpha: 0, x: 16 },
          { autoAlpha: 1, x: 0, duration: ENTER_DUR, ease: EASE_OUT },
          '<+0.05'
        );
    }

    // ── export → default ──
    else if (prev === 'export' && state === 'default') {
      tl
        // Export options slide out right + fade, then take out of flow
        .to(exportOptionsRef.current, { autoAlpha: 0, x: 16, duration: EXIT_DUR, ease: EASE_OUT })
        .set(exportOptionsRef.current, { position: 'absolute' })
        // Arrows enter flow, then slide back in from left
        .set(arrowsRef.current, { position: 'relative' })
        .fromTo(arrowsRef.current,
          { autoAlpha: 0, x: -16 },
          { autoAlpha: 1, x: 0, duration: ENTER_DUR, ease: EASE_OUT },
          '<+0.05'
        );
    }

    // ── default → score ──
    else if (prev === 'default' && state === 'score') {
      tl
        // Right container slides out right + fades
        .to(rightContainerRef.current, { autoAlpha: 0, x: 16, duration: EXIT_DUR, ease: EASE_OUT })
        // Collapsed results fades out
        .to(resultsCollapsedRef.current, { autoAlpha: 0, duration: EXIT_DUR, ease: EASE_OUT }, '<')
        // Expanded results slides in from left
        .fromTo(resultsExpandedRef.current,
          { autoAlpha: 0, x: -12, position: 'relative', visibility: 'visible' },
          { autoAlpha: 1, x: 0, duration: ENTER_DUR, ease: EASE_OUT }
        );
    }

    // ── score → default ──
    else if (prev === 'score' && state === 'default') {
      tl
        // Expanded results slides out left
        .to(resultsExpandedRef.current, { autoAlpha: 0, x: -12, duration: EXIT_DUR, ease: EASE_OUT })
        // Reset expanded to hidden
        .set(resultsExpandedRef.current, { position: 'absolute', visibility: 'hidden' })
        // Collapsed results fades in
        .fromTo(resultsCollapsedRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: ENTER_DUR, ease: EASE_OUT }
        )
        // Right container slides in from right
        .fromTo(rightContainerRef.current,
          { autoAlpha: 0, x: 16 },
          { autoAlpha: 1, x: 0, duration: ENTER_DUR, ease: EASE_OUT },
          '<'
        )
        // Reset arrows to visible (in case coming from export→score)
        .set(arrowsRef.current, { autoAlpha: 1, x: 0 })
        .set(exportOptionsRef.current, { autoAlpha: 0, x: 16 });
    }

    // ── score → export ──
    else if (prev === 'score' && state === 'export') {
      tl
        // Expanded results slides out left
        .to(resultsExpandedRef.current, { autoAlpha: 0, x: -12, duration: EXIT_DUR, ease: EASE_OUT })
        .set(resultsExpandedRef.current, { position: 'absolute', visibility: 'hidden' })
        // Collapsed results fades in
        .fromTo(resultsCollapsedRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: ENTER_DUR, ease: EASE_OUT }
        )
        // Right container slides in, with arrows hidden and export options visible
        .set(arrowsRef.current, { autoAlpha: 0, x: -16 })
        .set(exportOptionsRef.current, { autoAlpha: 1, x: 0 })
        .fromTo(rightContainerRef.current,
          { autoAlpha: 0, x: 16 },
          { autoAlpha: 1, x: 0, duration: ENTER_DUR, ease: EASE_OUT },
          '<'
        );
    }

    // ── export → score ──
    else if (prev === 'export' && state === 'score') {
      tl
        // Right container slides out right
        .to(rightContainerRef.current, { autoAlpha: 0, x: 16, duration: EXIT_DUR, ease: EASE_OUT })
        // Collapsed results fades out
        .to(resultsCollapsedRef.current, { autoAlpha: 0, duration: EXIT_DUR, ease: EASE_OUT }, '<')
        // Expanded results slides in from left
        .fromTo(resultsExpandedRef.current,
          { autoAlpha: 0, x: -12, position: 'relative', visibility: 'visible' },
          { autoAlpha: 1, x: 0, duration: ENTER_DUR, ease: EASE_OUT }
        );
    }

    return () => { tl.kill(); };
  }, [state]);

  return (
    <div className={`flex items-center justify-between bg-black w-full ${className ?? ''}`}>
      {/* Left: swatches — anchor, never animates */}
      <Swatches
        bgHex={bgHex}
        fgHex={fgHex}
        bgState={bgState}
        fgState={fgState}
        onBgClick={onBgClick}
        onFgClick={onFgClick}
        onSwap={onSwap}
      />

      {/* Center: results — two layers */}
      <div className="shrink-0 relative">
        <div
          ref={resultsCollapsedRef}
          className="flex items-center gap-1"
          style={initScore ? { opacity: 0, visibility: 'hidden' } : undefined}
        >
          <Score
            type={algorithm}
            state="default"
            rating={rating}
            value={contrastValue}
            onClick={onResultsToggle}
          />
          <CSButton
            label={algorithm === 'wcag' ? 'WCAG' : 'APCA'}
            onClick={onAlgorithmToggle}
          />
        </div>
        <div
          ref={resultsExpandedRef}
          className="flex items-center gap-1"
          style={initScore
            ? undefined
            : { opacity: 0, visibility: 'hidden', position: 'absolute', top: 0, left: 0, transform: 'translateX(-12px)' }
          }
        >
          <ThresholdButtons
            thresholds={thresholds}
            activeThreshold={activeThreshold}
            algorithm={algorithm}
            onSelect={onThresholdSelect}
          />
          <Score
            type={algorithm}
            state="selected"
            rating={rating}
            value={contrastValue}
            accentColor={accent}
            onClick={onResultsToggle}
          />
        </div>
      </div>

      {/* Right: [arrows] [export-options] [EXPORT toggle] */}
      {/* EXPORT is the anchor — always visible, always rightmost */}
      <div
        ref={rightContainerRef}
        className="flex items-center justify-end gap-1 flex-1 min-w-0 relative"
        style={initScore ? { opacity: 0, visibility: 'hidden', transform: 'translateX(16px)' } : undefined}
      >
        {/* Arrows — visible in default, hidden in export */}
        <div
          ref={arrowsRef}
          style={initExport ? { opacity: 0, visibility: 'hidden', transform: 'translateX(-16px)' } : undefined}
        >
          <Arrows onLeft={onLeftArrow} onRight={onRightArrow} />
        </div>

        {/* Export options — hidden in default (at EXPORT's position), visible in export */}
        <div
          ref={exportOptionsRef}
          className="flex items-center gap-1"
          style={initExport
            ? undefined
            : { opacity: 0, visibility: 'hidden', transform: 'translateX(16px)', position: 'absolute', right: 0, top: 0 }
          }
        >
          <CSButton label="COPY URL" onClick={onCopyUrl} />
          <CSButton label="DOWNLOAD .MD" onClick={onDownloadMd} />
        </div>

        {/* EXPORT — always visible, always rightmost, toggles export state */}
        <CSButton
          label={state === 'export' ? 'CLOSE' : 'EXPORT'}
          state={state === 'export' ? 'selected' : 'default'}
          accentColor={accent}
          onClick={onExportToggle}
        />
      </div>
    </div>
  );
}
