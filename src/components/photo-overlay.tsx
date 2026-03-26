'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// ── Progressive Image ─────────────────────────────────────────────────

function ProgressiveImage({
  tinyUrl, thumbUrl, fullUrl, alt, color,
}: {
  tinyUrl: string; thumbUrl: string; fullUrl: string; alt: string; color: string;
}) {
  const [thumbReady, setThumbReady] = useState(false);
  const [fullReady, setFullReady] = useState(false);

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: color }}>
      <img
        src={tinyUrl} alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${thumbReady ? 'opacity-0' : 'opacity-100'}`}
        style={{ imageRendering: 'pixelated' }}
      />
      <img
        src={thumbUrl} alt=""
        onLoad={() => setThumbReady(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          fullReady ? 'opacity-0' : thumbReady ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ filter: 'blur(8px)', transform: 'scale(1.02)' }}
      />
      <img
        src={fullUrl} alt={alt} crossOrigin="anonymous"
        onLoad={() => setFullReady(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${fullReady ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

// ── PhotoOverlay — purely visual, no color extraction ─────────────────

interface PhotoOverlayProps {
  buffer: PhotoData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onCollapse: () => void;
  thumbRef: React.RefObject<HTMLButtonElement | null>;
}

export function PhotoOverlay({
  buffer, currentIndex, onIndexChange, onCollapse, thumbRef,
}: PhotoOverlayProps) {
  const [visibleIndex, setVisibleIndex] = useState(currentIndex);
  const [isAnimatingIn, setIsAnimatingIn] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const isReinitialing = useRef(false);

  const photo = buffer[visibleIndex];

  // Embla
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: currentIndex,
    loop: false,
    duration: 20,
  });

  // Sync Embla → parent. Guard against reinit-triggered events.
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      if (isReinitialing.current) return;
      setVisibleIndex(emblaApi.selectedScrollSnap());
    };

    const onSettle = () => {
      if (isReinitialing.current) return;
      const idx = emblaApi.selectedScrollSnap();
      if (idx !== currentIndex) onIndexChange(idx);
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('settle', onSettle);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('settle', onSettle);
    };
  }, [emblaApi, currentIndex, onIndexChange]);

  // Reinit when buffer grows — guard against settle firing during reinit
  const bufferLen = buffer.length;
  useEffect(() => {
    if (!emblaApi) return;
    isReinitialing.current = true;
    emblaApi.reInit();
    emblaApi.scrollTo(currentIndex, true); // instant jump, no animation
    requestAnimationFrame(() => {
      isReinitialing.current = false;
    });
  }, [emblaApi, bufferLen, currentIndex]);

  // ── Animate IN from thumbnail ──

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const thumbEl = thumbRef.current;
    if (thumbEl) {
      const rect = thumbEl.getBoundingClientRect();
      gsap.set(overlay, {
        position: 'fixed', top: rect.top, left: rect.left,
        width: rect.width, height: rect.height,
        borderRadius: '8px', opacity: 1, zIndex: 50, overflow: 'hidden',
      });
      gsap.to(overlay, {
        top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: '0px',
        duration: 0.5, ease: 'power3.inOut',
        onComplete: () => setIsAnimatingIn(false),
      });
    } else {
      gsap.fromTo(overlay, { opacity: 0 }, {
        opacity: 1, duration: 0.4, ease: 'power2.out',
        onComplete: () => setIsAnimatingIn(false),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Animate OUT to thumbnail ──

  const handleCollapse = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const thumbEl = thumbRef.current;
    if (thumbEl) {
      const rect = thumbEl.getBoundingClientRect();
      gsap.to(overlay, {
        top: rect.top, left: rect.left, width: rect.width, height: rect.height,
        borderRadius: '8px', duration: 0.45, ease: 'power3.inOut',
        onComplete: onCollapse,
      });
    } else {
      gsap.to(overlay, { opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: onCollapse });
    }
  }, [onCollapse, thumbRef]);

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

  const canPrev = visibleIndex > 0;
  const canNext = visibleIndex < buffer.length - 1;

  return (
    <div ref={overlayRef} className="fixed overflow-hidden" style={{ backgroundColor: photo?.color ?? '#000', inset: 0, zIndex: 50 }}>
      {/* Carousel */}
      <div ref={emblaRef} className="h-full overflow-hidden" style={{ opacity: isAnimatingIn ? 0 : 1, transition: 'opacity 0.2s' }}>
        <div className="flex h-full">
          {buffer.map((p, i) => (
            <div key={p.id + '-' + i} data-slide className="flex-[0_0_100%] min-w-0 h-full">
              <ProgressiveImage tinyUrl={p.tinyUrl} thumbUrl={p.thumbUrl} fullUrl={p.url} alt={p.alt} color={p.color} />
            </div>
          ))}
        </div>
      </div>

      {/* Mosaic during grow */}
      {isAnimatingIn && photo && (
        <img src={photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
      )}

      {/* Arrows */}
      {!isAnimatingIn && canPrev && (
        <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-black/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4L6 10L12 16" /></svg>
        </button>
      )}
      {!isAnimatingIn && canNext && (
        <button onClick={() => emblaApi?.scrollNext()} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 backdrop-blur-sm text-white/70 hover:bg-black/40 hover:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4L14 10L8 16" /></svg>
        </button>
      )}

      {/* Bottom controls */}
      {!isAnimatingIn && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end justify-between">
            <div className="text-white/70 text-[11px] font-mono">
              <span>Photo by </span>
              <a href={photo?.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/90 underline underline-offset-2">{photo?.photographer}</a>
              <span> on </span>
              <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-white/90 underline underline-offset-2">Unsplash</a>
            </div>
            <button onClick={handleCollapse} className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/90 text-[12px] font-mono hover:bg-white/25 transition-colors">
              Use Colors
            </button>
          </div>
        </div>
      )}

      {/* Counter */}
      {!isAnimatingIn && (
        <div className="absolute top-4 right-4 text-white/30 text-[10px] font-mono">
          {visibleIndex + 1}/{buffer.length} &middot; ← → slide &middot; Esc close
        </div>
      )}
    </div>
  );
}
