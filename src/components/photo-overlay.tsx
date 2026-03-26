'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { gsap } from '@/lib/gsap-config';
import { extractContrastPair } from '@/lib/color-engine';
import type { PhotoData } from './control-strip';
import type { ContrastAlgorithm } from '@/lib/color-engine';

// ── Progressive Image ─────────────────────────────────────────────────

function ProgressiveImage({
  thumbUrl,
  fullUrl,
  alt,
  color,
  isCurrent,
  onFullLoaded,
}: {
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  color: string;
  isCurrent: boolean;
  onFullLoaded: (img: HTMLImageElement) => void;
}) {
  const [fullReady, setFullReady] = useState(false);
  const fullRef = useRef<HTMLImageElement>(null);

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: color }}>
      {/* Thumb — instant, blurred placeholder */}
      <img
        src={thumbUrl}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          fullReady ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
      />

      {/* Full res — crossfades in */}
      <img
        ref={fullRef}
        src={fullUrl}
        alt={alt}
        crossOrigin="anonymous"
        onLoad={() => {
          setFullReady(true);
          if (isCurrent && fullRef.current) {
            onFullLoaded(fullRef.current);
          }
        }}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          fullReady ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

// ── PhotoOverlay ──────────────────────────────────────────────────────

interface PhotoOverlayProps {
  buffer: PhotoData[];
  currentIndex: number;
  contrastAlgorithm: ContrastAlgorithm;
  onColorsExtracted: (bg: string, fg: string) => void;
  onIndexChange: (index: number) => void;
  onCollapse: () => void;
}

export function PhotoOverlay({
  buffer, currentIndex, contrastAlgorithm,
  onColorsExtracted, onIndexChange, onCollapse,
}: PhotoOverlayProps) {
  const [colorsReady, setColorsReady] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const extractedForIndex = useRef(-1);

  const photo = buffer[currentIndex];

  // Embla — single source of truth for slide position
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: currentIndex,
    loop: false,
    duration: 20, // fast snapping (lower = faster, in ms-ish)
  });

  // When Embla settles on a slide, tell the parent
  useEffect(() => {
    if (!emblaApi) return;

    const onSettle = () => {
      const idx = emblaApi.selectedScrollSnap();
      if (idx !== currentIndex) {
        onIndexChange(idx);
      }
    };

    emblaApi.on('settle', onSettle);
    return () => { emblaApi.off('settle', onSettle); };
  }, [emblaApi, currentIndex, onIndexChange]);

  // When buffer grows, reinit Embla to pick up new slides
  const bufferLen = buffer.length;
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, bufferLen]);

  // Animate overlay in
  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  // Extract colors from full-res image
  const runExtraction = useCallback(async (imgEl: HTMLImageElement, idx: number) => {
    if (extractedForIndex.current === idx) return;
    extractedForIndex.current = idx;
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
  }, [contrastAlgorithm, onColorsExtracted]);

  // Handle full-res image load — called from ProgressiveImage onLoad
  const handleFullLoaded = useCallback((imgEl: HTMLImageElement) => {
    runExtraction(imgEl, currentIndex);
  }, [runExtraction, currentIndex]);

  // Reset on photo change + re-extract if image already cached
  useEffect(() => {
    setColorsReady(false);
    setExtracting(false);
    extractedForIndex.current = -1;

    // Check if the current slide's full-res is already loaded (cached)
    const timer = setTimeout(() => {
      const slides = overlayRef.current?.querySelectorAll('[data-slide]');
      if (!slides) return;
      const currentSlide = slides[currentIndex];
      if (!currentSlide) return;
      const fullImg = currentSlide.querySelector('img[crossorigin]') as HTMLImageElement | null;
      if (fullImg?.complete && fullImg.naturalWidth > 0) {
        runExtraction(fullImg, currentIndex);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentIndex, runExtraction]);

  const handleCollapse = useCallback(() => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: onCollapse,
      });
    }
  }, [onCollapse]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); emblaApi?.scrollPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); emblaApi?.scrollNext(); }
      if (e.key === 'Escape') { e.preventDefault(); handleCollapse(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [emblaApi, handleCollapse]);

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < buffer.length - 1;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ backgroundColor: photo?.color ?? '#000' }}
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {buffer.map((p, i) => (
            <div key={p.id + '-' + i} data-slide className="flex-[0_0_100%] min-w-0 h-full">
              <ProgressiveImage
                thumbUrl={p.thumbUrl}
                fullUrl={p.url}
                alt={p.alt}
                color={p.color}
                isCurrent={i === currentIndex}
                onFullLoaded={handleFullLoaded}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Arrow buttons */}
      {canPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-black/40 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4L6 10L12 16" />
          </svg>
        </button>
      )}
      {canNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
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
            <button
              onClick={handleCollapse}
              className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/90 text-[12px] font-mono hover:bg-white/25 transition-colors"
            >
              {colorsReady ? 'Use Colors' : extracting ? 'Extracting...' : 'Close'}
            </button>
          </div>
        </div>
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 text-white/30 text-[10px] font-mono">
        {currentIndex + 1}/{buffer.length} &middot; ← → slide &middot; Esc close
      </div>
    </div>
  );
}
