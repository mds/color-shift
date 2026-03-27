'use client';

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import gsap from 'gsap';
import type { PhotoData } from './control-strip';

// All motion values exposed as CSS custom properties for DialKit
// --color-duration: background color ease duration
// --photo-duration: photo crossfade duration
// --photo-opacity: photo crossfade start opacity
// --squish-scale: mousedown press scale
// --squish-duration: mousedown press duration
// --pop-scale: release overshoot scale
// --pop-duration: release overshoot duration
// --exit-duration: element exit duration
// --enter-duration: element enter duration
// --enter-overshoot: back.out overshoot amount

function getMotionValue(name: string, fallback: number): number {
  // Read directly from inline style first (set by DialKit), then computed style, then fallback
  if (typeof window === 'undefined') return fallback;
  const inline = document.documentElement.style.getPropertyValue(name).trim();
  if (inline) return parseFloat(inline) || fallback;
  const computed = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (computed) return parseFloat(computed) || fallback;
  return fallback;
}

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

    // Ease background color + text/fill colors
    useEffect(() => {
      const dur = getMotionValue('--color-duration', 0.4);
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: dur, ease: 'power2.out', overwrite: true });
      }
      if (textRef.current) {
        gsap.to(textRef.current, { color: fgHex, duration: dur, ease: 'power2.out', overwrite: 'auto' });
      }
    }, [bgHex, fgHex]);

    // Crossfade photo
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      prevPhotoId.current = photo.id;
      if (photoContainerRef.current) {
        const dur = getMotionValue('--photo-duration', 0.6);
        const startOpacity = getMotionValue('--photo-opacity', 0.3);
        gsap.fromTo(photoContainerRef.current,
          { opacity: startOpacity },
          { opacity: 1, duration: dur, ease: 'power2.out', overwrite: true }
        );
      }
    }, [photo]);

    const handleDown = useCallback(() => {
      const active = showText ? textRef.current : circleRef.current;
      if (active) {
        const scale = getMotionValue('--squish-scale', 0.85);
        const dur = getMotionValue('--squish-duration', 0.15);
        gsap.to(active, { scale, duration: dur, ease: 'power2.out' });
      }
    }, [showText]);

    const handleUp = useCallback(() => {
      const text = textRef.current;
      const circle = circleRef.current;
      if (!text || !circle) return;

      const active = showText ? text : circle;
      const incoming = showText ? circle : text;

      const popScale = getMotionValue('--pop-scale', 1.05);
      const popDur = getMotionValue('--pop-duration', 0.1);
      const exitDur = getMotionValue('--exit-duration', 0.25);
      const enterDur = getMotionValue('--enter-duration', 0.35);
      const overshoot = getMotionValue('--enter-overshoot', 1.4);

      const tl = gsap.timeline();
      tl.to(active, { scale: popScale, duration: popDur, ease: 'power2.out' })
        .to(active, { scale: 0, opacity: 0, duration: exitDur, ease: 'power2.in' })
        .fromTo(incoming,
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: enterDur, ease: `back.out(${overshoot})` },
          '-=0.1'
        );

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

          <div
            ref={circleRef}
            className="absolute"
            style={{ opacity: 0, transform: 'scale(0)' }}
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
