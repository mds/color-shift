'use client';

import { useState, useRef, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
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

// ── PhotoPanel ────────────────────────────────────────────────────────

interface PhotoPanelProps {
  buffer: PhotoData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function PhotoPanel({ buffer, currentIndex, onIndexChange }: PhotoPanelProps) {
  const isReinitialing = useRef(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: currentIndex,
    loop: false,
    duration: 25,
  });

  // Drag/touch: sync to parent after Embla settles (no interference)
  useEffect(() => {
    if (!emblaApi) return;
    const onSettle = () => {
      if (isReinitialing.current) return;
      const idx = emblaApi.selectedScrollSnap();
      if (idx !== currentIndex) onIndexChange(idx);
    };
    emblaApi.on('settle', onSettle);
    return () => { emblaApi.off('settle', onSettle); };
  }, [emblaApi, currentIndex, onIndexChange]);

  // Reinit when buffer length changes + animate to new index
  const bufferLen = buffer.length;
  const prevBufLen = useRef(bufferLen);
  const prevIdx = useRef(currentIndex);

  useEffect(() => {
    if (!emblaApi) return;

    const bufChanged = bufferLen !== prevBufLen.current;
    const idxChanged = currentIndex !== prevIdx.current;
    prevBufLen.current = bufferLen;
    prevIdx.current = currentIndex;

    if (bufChanged) {
      // Buffer grew (inject or refill) — reinit, snap to previous position, then animate
      isReinitialing.current = true;
      emblaApi.reInit();

      if (idxChanged) {
        // Snap to where we WERE, then animate to the new index
        const oldIdx = Math.max(0, currentIndex - 1);
        emblaApi.scrollTo(oldIdx, true); // instant to old
        requestAnimationFrame(() => {
          isReinitialing.current = false;
          emblaApi.scrollTo(currentIndex); // animate to new
        });
      } else {
        emblaApi.scrollTo(currentIndex, true);
        requestAnimationFrame(() => { isReinitialing.current = false; });
      }
    }
  }, [emblaApi, bufferLen, currentIndex]);

  // Arrow keys: update parent immediately AND scroll Embla
  // This fires the color GSAP animation in parallel with the slide.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!emblaApi) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, buffer.length - 1);
        if (next !== currentIndex) {
          onIndexChange(next); // colors update now
          emblaApi.scrollTo(next); // photo slides in parallel
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        if (prev !== currentIndex) {
          onIndexChange(prev);
          emblaApi.scrollTo(prev);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [emblaApi, currentIndex, buffer.length, onIndexChange]);

  const photo = buffer[currentIndex];

  return (
    <div className="relative h-full overflow-hidden">
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {buffer.map((p, i) => (
            <div key={p.id + '-' + i} className="flex-[0_0_100%] min-w-0 h-full">
              <ProgressiveImage
                tinyUrl={p.tinyUrl} thumbUrl={p.thumbUrl} fullUrl={p.url}
                alt={p.alt} color={p.color}
              />
            </div>
          ))}
        </div>
      </div>

      {photo && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
            <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">
              {photo.photographer}
            </a>
            <span> / </span>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              Unsplash
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
