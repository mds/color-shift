'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// 4-panel parallax slide — GPU-accelerated translateX only.
//
// At rest (forward direction):
//   [nextColor @ -100%] [nextPhoto @ -50%] [currentColor @ 0%] [currentPhoto @ 50%]
//   Off-screen left ←                     → Visible viewport
//
// On transition (forward/left): all slide RIGHT by ~100vw at different speeds.
//   Next panels slide into viewport, current panels slide out right.

const DURATION = 0.55;
const EASE = 'power3.out';
const SPEEDS = [0.7, 0.85, 1.0, 1.15]; // panel 0 slowest, panel 3 fastest

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

    const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
      if (panels.length !== 4) return;

      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }

      const tl = gsap.timeline({ onComplete: onTransitionComplete });

      panels.forEach((panel, i) => {
        const distance = 100 * SPEEDS[i];
        // Forward (left arrow = advance): panels slide RIGHT (positive x)
        // Backward (right arrow = go back): panels slide LEFT (negative x)
        const target = direction === 'left' ? distance : -distance;

        tl.to(panel, {
          x: `${target}vw`,
          duration: DURATION,
          ease: EASE,
          force3D: true,
        }, 0);
      });

      tlRef.current = tl;

      return () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
      };
    }, [isTransitioning, nextPhoto, direction, onTransitionComplete]);

    // Reset after transition
    useEffect(() => {
      if (!isTransitioning) {
        const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
        panels.forEach(panel => gsap.set(panel, { x: 0, force3D: true }));
      }
    }, [isTransitioning]);

    const nextBgVal = isTransitioning && nextPhoto ? nextBg : currentBg;
    const nextFgVal = isTransitioning && nextPhoto ? nextFg : currentFg;
    const nextFontVal = isTransitioning && nextPhoto ? nextFont : currentFont;
    const nextPhotoVal = isTransitioning && nextPhoto ? nextPhoto : currentPhoto;

    // Position panels based on direction:
    // Forward (left): next is LEFT of current, slides right into view
    // Backward (right): next is RIGHT of current, slides left into view
    const nextColorLeft = direction === 'left' ? '-100%' : '100%';
    const nextPhotoLeft = direction === 'left' ? '-50%' : '150%';

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden">
        {/* Panel 0: NEXT color — off-screen */}
        <div
          ref={el => { panelRefs.current[0] = el; }}
          className="absolute top-0 h-full flex items-center justify-center will-change-transform"
          style={{
            width: '50%',
            left: nextColorLeft,
            backgroundColor: nextBgVal,
            zIndex: 2,
          }}
        >
          <span
            className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
            style={{
              color: nextFgVal,
              fontFamily: nextFontVal === 'serif' ? 'serif' : `'${nextFontVal}', serif`,
            }}
          >
            {specimenText}
          </span>
        </div>

        {/* Panel 1: NEXT photo — off-screen, adjacent to panel 0 */}
        <div
          ref={el => { panelRefs.current[1] = el; }}
          className="absolute top-0 h-full overflow-hidden will-change-transform"
          style={{
            width: '50%',
            left: nextPhotoLeft,
            zIndex: 1,
          }}
        >
          {nextPhotoVal && (
            <>
              <img src={nextPhotoVal.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={nextPhotoVal.url} alt={nextPhotoVal.alt} className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
        </div>

        {/* Panel 2: CURRENT color — in viewport, left half */}
        <div
          ref={el => { panelRefs.current[2] = el; }}
          className="absolute top-0 h-full flex items-center justify-center will-change-transform"
          style={{
            width: '50%',
            left: '0%',
            backgroundColor: currentBg,
            zIndex: 4,
          }}
        >
          <span
            className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
            style={{
              color: currentFg,
              fontFamily: currentFont === 'serif' ? 'serif' : `'${currentFont}', serif`,
            }}
          >
            {specimenText}
          </span>
        </div>

        {/* Panel 3: CURRENT photo — in viewport, right half */}
        <div
          ref={el => { panelRefs.current[3] = el; }}
          className="absolute top-0 h-full overflow-hidden will-change-transform"
          style={{
            width: '50%',
            left: '50%',
            zIndex: 3,
          }}
        >
          {currentPhoto && (
            <>
              <img src={currentPhoto.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={currentPhoto.url} alt={currentPhoto.alt} className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
          {currentPhoto && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
                <a href={currentPhoto.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{currentPhoto.photographer}</a>
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
