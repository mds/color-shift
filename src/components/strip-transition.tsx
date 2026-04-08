'use client';

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import gsap from 'gsap';
import type { PhotoData } from './control-strip';

// DialKit-tuned motion params stored on window by color-shift.tsx
type PhotoStyle = 'fade' | 'zoom-in' | 'zoom-out' | 'blur' | 'pixelate' | 'slide' | 'scale-fade';
type MotionParams = {
  hover: { scale: number; duration: number; ease: string; navPulseScale: number; navPulseDuration: number };
  click: { duration: number; ease: string };
  photo: { style: PhotoStyle; startOpacity: number; startScale: number; duration: number; ease: string };
};

function getMotionParams(): MotionParams {
  const fallback: MotionParams = {
    hover: { scale: 1.05, duration: 1, ease: 'power4.out', navPulseScale: 1.01, navPulseDuration: 0.4 },
    click: { duration: 0.3, ease: 'power4.out' },
    photo: { style: 'fade', startOpacity: 0, startScale: 1.05, duration: 1, ease: 'power4.out' },
  };
  if (typeof window === 'undefined') return fallback;
  return (window as unknown as { __motion?: MotionParams }).__motion ?? fallback;
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
    const isHoveringRef = useRef(false);

    // Ease background color + text/fill colors
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: 0.4, ease: 'power2.out', overwrite: true });
      }
      if (textRef.current) {
        gsap.to(textRef.current, { color: fgHex, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      }
    }, [bgHex, fgHex]);

    // Photo transition — multiple styles selectable via DialKit
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      const isFirstLoad = prevPhotoId.current === null;
      prevPhotoId.current = photo.id;
      const el = photoContainerRef.current;
      if (!el) return;

      const { photo: p, hover } = getMotionParams();
      const t = { duration: p.duration, ease: p.ease, overwrite: true as const };

      switch (p.style) {
        case 'fade':
        case 'zoom-in':
        case 'zoom-out':
        case 'scale-fade':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'none', x: 0 }, { opacity: 1, scale: 1, ...t });
          break;
        case 'blur':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'blur(20px)', x: 0 }, { opacity: 1, scale: 1, filter: 'blur(0px)', ...t });
          break;
        case 'pixelate':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'contrast(1.5) blur(8px) saturate(1.3)', x: 0 }, { opacity: 1, scale: 1, filter: 'contrast(1) blur(0px) saturate(1)', ...t });
          break;
        case 'slide':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'none', x: '30%' }, { opacity: 1, scale: 1, x: '0%', ...t });
          break;
      }

      // Simulate a hover pulse on the color panel's active element
      // Skip on first load, and skip entirely if the color panel is already hovered
      if (!isFirstLoad && !isHoveringRef.current) {
        const active = showText ? textRef.current : circleRef.current;
        if (active) {
          const pulseHalf = hover.navPulseDuration / 2;
          gsap.timeline()
            .to(active, { scale: hover.navPulseScale, duration: pulseHalf, ease: hover.ease, overwrite: true })
            .to(active, { scale: 1, duration: pulseHalf, ease: hover.ease });
        }
      }
    }, [photo, showText]);

    const handleEnter = useCallback(() => {
      isHoveringRef.current = true;
      const active = showText ? textRef.current : circleRef.current;
      if (!active) return;
      const { hover } = getMotionParams();
      gsap.to(active, { scale: hover.scale, duration: hover.duration, ease: hover.ease, overwrite: true });
    }, [showText]);

    const handleLeave = useCallback(() => {
      isHoveringRef.current = false;
      const active = showText ? textRef.current : circleRef.current;
      if (!active) return;
      const { hover } = getMotionParams();
      gsap.to(active, { scale: 1, duration: hover.duration, ease: hover.ease, overwrite: true });
    }, [showText]);

    const handleClick = useCallback(() => {
      const text = textRef.current;
      const circle = circleRef.current;
      if (!text || !circle) return;

      const active = showText ? text : circle;
      const incoming = showText ? circle : text;
      const { hover, click } = getMotionParams();
      // If the mouse is still over the panel, land in the hovered state
      const incomingScale = isHoveringRef.current ? hover.scale : 1;

      gsap.to(active, { scale: 0, opacity: 0, duration: click.duration, ease: click.ease, overwrite: true });
      gsap.fromTo(incoming,
        { scale: 0, opacity: 0 },
        { scale: incomingScale, opacity: 1, duration: click.duration, ease: click.ease, overwrite: true }
      );

      setShowText(!showText);
    }, [showText]);

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden flex flex-col sm:flex-row">
        {/* Color panel */}
        <div
          ref={colorRef}
          className="w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center relative cursor-pointer select-none z-10"
          style={{ backgroundColor: bgHex }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onClick={handleClick}
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
        <div ref={photoContainerRef} className="w-full h-1/2 sm:w-1/2 sm:h-full relative overflow-hidden">
          {photo && (
            <>
              <img src={photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={photo.url} alt={photo.alt} className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
          {photo && (
            <div className="absolute bottom-3 left-4 right-3 z-10">
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
