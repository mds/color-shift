'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

const DURATION = 0.6;
const EASE = 'power2.inOut';

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

    const colorRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const nextImgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      // Ease color background
      if (colorRef.current) {
        gsap.to(colorRef.current, {
          backgroundColor: nextBg,
          duration: DURATION,
          ease: EASE,
        });
      }

      // Ease text color
      if (textRef.current) {
        gsap.to(textRef.current, {
          color: nextFg,
          duration: DURATION,
          ease: EASE,
        });
      }

      // Crossfade photo: fade in next photo over current
      if (nextImgRef.current) {
        gsap.fromTo(nextImgRef.current,
          { opacity: 0 },
          {
            opacity: 1,
            duration: DURATION,
            ease: EASE,
            onComplete: onTransitionComplete,
          }
        );
      } else {
        // No next image ref yet, just complete
        setTimeout(onTransitionComplete, DURATION * 1000);
      }
    }, [isTransitioning, nextPhoto, nextBg, nextFg, onTransitionComplete]);

    // After transition completes and base layer re-renders, hide the overlay
    useEffect(() => {
      if (!isTransitioning && nextImgRef.current) {
        gsap.set(nextImgRef.current, { opacity: 0 });
      }
    }, [isTransitioning]);

    const fontStyle = (font: string) =>
      font === 'serif' ? 'serif' : `'${font}', serif`;

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden flex">
        {/* Color panel */}
        <div
          ref={colorRef}
          className="w-1/2 h-full flex items-center justify-center"
          style={{ backgroundColor: currentBg }}
        >
          <span
            ref={textRef}
            className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
            style={{
              color: currentFg,
              fontFamily: fontStyle(currentFont),
            }}
          >
            {specimenText}
          </span>
        </div>

        {/* Photo panel */}
        <div className="w-1/2 h-full relative overflow-hidden">
          {/* Current photo */}
          {currentPhoto && (
            <>
              <img src={currentPhoto.tinyUrl} alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }} />
              <img src={currentPhoto.url} alt={currentPhoto.alt}
                className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}

          {/* Next photo — fades in over current */}
          {isTransitioning && nextPhoto && (
            <div ref={nextImgRef} className="absolute inset-0" style={{ opacity: 0 }}>
              <img src={nextPhoto.tinyUrl} alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }} />
              <img src={nextPhoto.url} alt={nextPhoto.alt}
                className="absolute inset-0 w-full h-full object-cover" />
            </div>
          )}

          {/* Attribution */}
          {currentPhoto && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
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
      </div>
    );
  }
);

StripTransition.displayName = 'StripTransition';
