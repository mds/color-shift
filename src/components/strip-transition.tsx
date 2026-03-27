'use client';

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import gsap from 'gsap';
import type { PhotoData } from './control-strip';

const COLOR_DURATION = 0.4;
const TOGGLE_DURATION = 0.35;

interface StripTransitionProps {
  photo: PhotoData | null;
  bgHex: string;
  fgHex: string;
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ photo, bgHex, fgHex }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const circleRef = useRef<HTMLDivElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const prevPhotoId = useRef<string | null>(null);
    const [showText, setShowText] = useState(true);

    // Ease background color
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: COLOR_DURATION, ease: 'power2.out', overwrite: true });
      }
    }, [bgHex]);

    // Crossfade photo
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      prevPhotoId.current = photo.id;
      if (photoContainerRef.current) {
        gsap.fromTo(photoContainerRef.current,
          { opacity: 0.3 },
          { opacity: 1, duration: 0.6, ease: 'power2.out', overwrite: true }
        );
      }
    }, [photo]);

    const handleDown = useCallback(() => {
      const active = showText ? textRef.current : circleRef.current;
      if (active) {
        gsap.to(active, { scale: 0.85, duration: 0.15, ease: 'power2.out' });
      }
    }, [showText]);

    const handleUp = useCallback(() => {
      const text = textRef.current;
      const circle = circleRef.current;
      if (!text || !circle) return;

      if (showText) {
        gsap.to(text, { scale: 0.5, opacity: 0, duration: TOGGLE_DURATION, ease: 'power2.in' });
        gsap.fromTo(circle,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: TOGGLE_DURATION, ease: 'power2.out', delay: 0.1 }
        );
      } else {
        gsap.to(circle, { scale: 0.5, opacity: 0, duration: TOGGLE_DURATION, ease: 'power2.in' });
        gsap.fromTo(text,
          { scale: 0.5, opacity: 0 },
          { scale: 1, opacity: 1, duration: TOGGLE_DURATION, ease: 'power2.out', delay: 0.1 }
        );
      }

      setShowText(!showText);
    }, [showText]);

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden flex">
        {/* Color panel */}
        <div
          ref={colorRef}
          className="w-1/2 h-full flex items-center justify-center relative cursor-pointer select-none"
          style={{ backgroundColor: bgHex }}
          onMouseDown={handleDown}
          onMouseUp={handleUp}
          onTouchStart={handleDown}
          onTouchEnd={handleUp}
        >
          {/* Text — visible by default */}
          <span
            ref={textRef}
            className="absolute text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] leading-[1] tracking-tight select-none"
            style={{
              color: fgHex,
              fontFamily: "'Instrument Serif', serif",
            }}
          >
            Aa
          </span>

          {/* Circle — hidden by default */}
          <div
            ref={circleRef}
            className="absolute"
            style={{ opacity: 0, transform: 'scale(0.5)' }}
          >
            <svg viewBox="0 0 100 100" className="w-[20vh] h-[20vh]">
              <circle cx="50" cy="50" r="50" fill={fgHex} />
            </svg>
          </div>
        </div>

        {/* Photo panel */}
        <div ref={photoContainerRef} className="w-1/2 h-full relative overflow-hidden">
          {photo && (
            <>
              <img src={photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={photo.url} alt={photo.alt} className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
          {photo && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
                <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{photo.photographer}</a>
                <span> / </span>
                <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">Unsplash</a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

StripTransition.displayName = 'StripTransition';
