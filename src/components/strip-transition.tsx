'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

const NUM_STRIPS = 5;
const STAGGER = 0.04;
const DURATION = 0.5;
const EASE = 'power3.inOut';

interface StripTransitionProps {
  currentPhoto: PhotoData | null;
  nextPhoto: PhotoData | null;
  currentBg: string;
  currentFg: string;
  nextBg: string;
  nextFg: string;
  currentFont: string;
  nextFont: string;
  specimenText: string;
  onTransitionComplete: () => void;
  isTransitioning: boolean;
  direction: 'left' | 'right';
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ currentPhoto, nextPhoto, currentBg, currentFg, nextBg, nextFg,
     currentFont, nextFont, specimenText, onTransitionComplete,
     isTransitioning, direction }, ref) => {

    const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[];
      if (strips.length !== NUM_STRIPS) return;

      if (tlRef.current) tlRef.current.kill();

      gsap.set(strips, { xPercent: 0 });

      const tl = gsap.timeline({
        onComplete: onTransitionComplete,
      });

      tl.to(strips, {
        xPercent: direction === 'left' ? -50 : 50,
        duration: DURATION,
        stagger: STAGGER,
        ease: EASE,
      });

      tlRef.current = tl;

      return () => {
        if (tlRef.current) tlRef.current.kill();
      };
    }, [isTransitioning, nextPhoto, direction, onTransitionComplete]);

    useEffect(() => {
      if (!isTransitioning) {
        const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[];
        gsap.set(strips, { xPercent: 0 });
      }
    }, [isTransitioning]);

    // Page order based on direction
    const goingBack = direction === 'right' && isTransitioning;
    const goingFwd = direction === 'left' && isTransitioning;

    const leftBg = goingBack ? nextBg : currentBg;
    const leftFg = goingBack ? nextFg : currentFg;
    const leftFont = goingBack ? nextFont : currentFont;
    const leftPhoto = goingBack ? nextPhoto : currentPhoto;

    const rightBg = goingBack ? currentBg : (goingFwd ? nextBg : currentBg);
    const rightFg = goingBack ? currentFg : (goingFwd ? nextFg : currentFg);
    const rightFont = goingBack ? currentFont : (goingFwd ? nextFont : currentFont);
    const rightPhoto = goingBack ? currentPhoto : (goingFwd ? nextPhoto : currentPhoto);

    const fontStyle = (font: string) =>
      font === 'serif' ? 'serif' : `'${font}', serif`;

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden">
        {Array.from({ length: NUM_STRIPS }, (_, i) => (
          <div
            key={i}
            ref={el => { stripRefs.current[i] = el; }}
            className="absolute left-0 overflow-hidden"
            style={{
              top: `${(i / NUM_STRIPS) * 100}%`,
              height: `${100 / NUM_STRIPS}%`,
              width: '200%',
            }}
          >
            {/* Left page */}
            <div className="absolute top-0 left-0 flex" style={{ width: '50%', height: '100%' }}>
              <div className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: leftBg }}>
                {i === Math.floor(NUM_STRIPS / 2) && (
                  <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
                    style={{ color: leftFg, fontFamily: fontStyle(leftFont) }}>
                    {specimenText}
                  </span>
                )}
              </div>
              <div className="w-1/2 h-full relative overflow-hidden">
                {leftPhoto && (
                  <>
                    <img src={leftPhoto.tinyUrl} alt=""
                      className="absolute inset-0 w-full object-cover"
                      style={{ imageRendering: 'pixelated', height: `${NUM_STRIPS * 100}%`, top: `${-i * 100}%` }} />
                    <img src={leftPhoto.url} alt={leftPhoto.alt}
                      className="absolute inset-0 w-full object-cover"
                      style={{ height: `${NUM_STRIPS * 100}%`, top: `${-i * 100}%` }} />
                  </>
                )}
              </div>
            </div>

            {/* Right page */}
            <div className="absolute top-0 flex" style={{ left: '50%', width: '50%', height: '100%' }}>
              <div className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: rightBg }}>
                {i === Math.floor(NUM_STRIPS / 2) && (
                  <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
                    style={{ color: rightFg, fontFamily: fontStyle(rightFont) }}>
                    {specimenText}
                  </span>
                )}
              </div>
              <div className="w-1/2 h-full relative overflow-hidden">
                {rightPhoto && (
                  <>
                    <img src={rightPhoto.tinyUrl} alt=""
                      className="absolute inset-0 w-full object-cover"
                      style={{ imageRendering: 'pixelated', height: `${NUM_STRIPS * 100}%`, top: `${-i * 100}%` }} />
                    <img src={rightPhoto.url} alt={rightPhoto.alt}
                      className="absolute inset-0 w-full object-cover"
                      style={{ height: `${NUM_STRIPS * 100}%`, top: `${-i * 100}%` }} />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Attribution */}
        {currentPhoto && (
          <div className="absolute bottom-3 right-3 z-30">
            <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
              <a href={currentPhoto.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">
                {currentPhoto.photographer}
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
);

StripTransition.displayName = 'StripTransition';
