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
    duration: 20,
  });

  // Sync Embla → parent on select (immediate, not settle)
  // This fires the moment a slide starts, so GSAP color animation
  // runs in parallel with Embla's slide animation.
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      if (isReinitialing.current) return;
      const idx = emblaApi.selectedScrollSnap();
      if (idx !== currentIndex) onIndexChange(idx);
    };
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, currentIndex, onIndexChange]);

  // Scroll when parent changes index (keyboard nav)
  useEffect(() => {
    if (!emblaApi || isReinitialing.current) return;
    if (emblaApi.selectedScrollSnap() !== currentIndex) {
      emblaApi.scrollTo(currentIndex);
    }
  }, [emblaApi, currentIndex]);

  // Reinit when buffer grows
  const bufferLen = buffer.length;
  useEffect(() => {
    if (!emblaApi) return;
    isReinitialing.current = true;
    emblaApi.reInit();
    emblaApi.scrollTo(currentIndex, true);
    requestAnimationFrame(() => { isReinitialing.current = false; });
  }, [emblaApi, bufferLen, currentIndex]);

  // Arrow keys for photo navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); emblaApi?.scrollPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); emblaApi?.scrollNext(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [emblaApi]);

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

      {/* Attribution */}
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
