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
      {/* Thumb — loads instantly, shown blurred until full loads */}
      <img
        src={thumbUrl}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          fullReady ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
      />

      {/* Full res — fades in over the thumb */}
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

  const photo = buffer[currentIndex];

  // Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: currentIndex,
    loop: false,
    dragFree: false,
    watchDrag: true,
  });

  // Sync Embla's selected index with parent state
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      if (idx < currentIndex && hasPrev) onPrev();
      if (idx > currentIndex && hasNext) onNext();
    };

    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, currentIndex, hasPrev, hasNext, onPrev, onNext]);

  // Scroll Embla when currentIndex changes from parent (keyboard nav)
  useEffect(() => {
    if (emblaApi && emblaApi.selectedScrollSnap() !== currentIndex) {
      emblaApi.scrollTo(currentIndex);
    }
  }, [emblaApi, currentIndex]);

  // Reindex Embla when buffer grows (new photos fetched)
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
      // After reinit, scroll back to current position
      emblaApi.scrollTo(currentIndex, true);
    }
  }, [emblaApi, buffer.length, currentIndex]);

  // Animate overlay in
  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, []);

  // Reset extraction on photo change
  useEffect(() => {
    setColorsReady(false);
    setExtracting(false);
  }, [currentIndex]);

  // Extract colors from loaded full-res image
  const handleFullLoaded = useCallback(async (imgEl: HTMLImageElement) => {
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

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        emblaApi?.scrollPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        emblaApi?.scrollNext();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCollapse();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [emblaApi, handleCollapse]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ backgroundColor: photo?.color ?? '#000' }}
    >
      {/* Embla carousel */}
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {buffer.map((p, i) => (
            <div key={p.id} className="flex-[0_0_100%] min-w-0 h-full">
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
      {hasPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-black/40 hover:text-white transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4L6 10L12 16" />
          </svg>
        </button>
      )}
      {hasNext && (
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

      {/* Counter + keyboard hint */}
      <div className="absolute top-4 right-4 text-white/30 text-[10px] font-mono">
        {currentIndex + 1}/{buffer.length} &middot; ← → slide &middot; Esc close
      </div>
    </div>
  );
}
