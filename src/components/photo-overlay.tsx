'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { gsap } from '@/lib/gsap-config';
import { extractContrastPair } from '@/lib/color-engine';
import type { PhotoData } from './control-strip';
import type { ContrastAlgorithm } from '@/lib/color-engine';

interface PhotoOverlayProps {
  buffer: PhotoData[];
  currentIndex: number;
  contrastAlgorithm: ContrastAlgorithm;
  onColorsExtracted: (bg: string, fg: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onCollapse: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function PhotoOverlay({
  buffer, currentIndex, contrastAlgorithm, onColorsExtracted,
  onPrev, onNext, onCollapse, hasPrev, hasNext,
}: PhotoOverlayProps) {
  const [colorsReady, setColorsReady] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef(currentIndex);

  const photo = buffer[currentIndex];

  // Animate overlay in on mount
  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  // Slide the track when currentIndex changes
  useEffect(() => {
    if (!trackRef.current) return;
    const direction = currentIndex > prevIndexRef.current ? 1 : -1;
    prevIndexRef.current = currentIndex;

    // Position: each slide is 100vw wide, translate to show current
    const targetX = -(currentIndex * 100);
    gsap.fromTo(trackRef.current,
      { xPercent: targetX + (direction * 30) },
      { xPercent: targetX, duration: 0.35, ease: 'power3.out' }
    );

    // Reset extraction state for new photo
    setColorsReady(false);
    setExtracting(false);
  }, [currentIndex]);

  // Extract colors when a slide's image loads
  const handleImageLoad = useCallback(async (imgEl: HTMLImageElement) => {
    if (extracting) return;
    setExtracting(true);

    try {
      const { Vibrant } = await import('node-vibrant/browser');
      const palette = await Vibrant.from(imgEl).getPalette();

      const mapped = {
        Vibrant: palette.Vibrant ? { hex: palette.Vibrant.hex, population: palette.Vibrant.population } : null,
        DarkVibrant: palette.DarkVibrant ? { hex: palette.DarkVibrant.hex, population: palette.DarkVibrant.population } : null,
        LightVibrant: palette.LightVibrant ? { hex: palette.LightVibrant.hex, population: palette.LightVibrant.population } : null,
        Muted: palette.Muted ? { hex: palette.Muted.hex, population: palette.Muted.population } : null,
        DarkMuted: palette.DarkMuted ? { hex: palette.DarkMuted.hex, population: palette.DarkMuted.population } : null,
        LightMuted: palette.LightMuted ? { hex: palette.LightMuted.hex, population: palette.LightMuted.population } : null,
      };

      const pair = extractContrastPair(mapped, contrastAlgorithm);
      if (pair) {
        setColorsReady(true);
        onColorsExtracted(pair.bg, pair.fg);
      }
    } catch (err) {
      console.error('Color extraction failed:', err);
    } finally {
      setExtracting(false);
    }
  }, [extracting, contrastAlgorithm, onColorsExtracted]);

  const handleCollapse = useCallback(() => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: onCollapse,
      });
    }
  }, [onCollapse]);

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        onPrev();
      }
      if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        onNext();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCollapse();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasPrev, hasNext, onPrev, onNext, handleCollapse]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ backgroundColor: photo?.color ?? '#000' }}
    >
      {/* Sliding track — all photos side by side */}
      <div
        ref={trackRef}
        className="flex h-full will-change-transform"
        style={{
          width: `${buffer.length * 100}vw`,
          transform: `translateX(-${currentIndex * 100}vw)`,
        }}
      >
        {buffer.map((p, i) => (
          <div
            key={p.id}
            className="w-screen h-full shrink-0 relative"
            style={{ backgroundColor: p.color }}
          >
            <img
              src={p.url}
              alt={p.alt}
              crossOrigin="anonymous"
              onLoad={i === currentIndex ? (e) => handleImageLoad(e.currentTarget) : undefined}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Arrow buttons */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-black/40 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4L6 10L12 16" />
          </svg>
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-black/40 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4L14 10L8 16" />
          </svg>
        </button>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-end justify-between">
          <div className="text-white/70 text-[11px] font-mono">
            <span>Photo by </span>
            <a href={photo?.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/90 underline underline-offset-2">
              {photo?.photographer}
            </a>
            <span> on </span>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-white/90 underline underline-offset-2">
              Unsplash
            </a>
          </div>

          <div className="flex items-center gap-2">
            {extracting && <span className="text-white/50 text-[11px] font-mono">Extracting...</span>}
            <button
              onClick={handleCollapse}
              disabled={!colorsReady && !extracting}
              className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/90 text-[12px] font-mono hover:bg-white/25 transition-colors disabled:opacity-30"
            >
              Use Colors
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hint + counter */}
      <div className="absolute top-4 right-4 text-white/30 text-[10px] font-mono">
        {currentIndex + 1}/{buffer.length} &middot; ← → navigate &middot; Esc close
      </div>
    </div>
  );
}
