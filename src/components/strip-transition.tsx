'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// 4 panels: [current-color] [current-photo] [next-color] [next-photo]
// Each moves at a different speed for parallax overlap effect.
// At rest: panels 0+1 fill viewport (50% each). Panels 2+3 off-screen right.

const DURATION = 0.6;
const EASE = 'power3.inOut';

// Parallax speed multipliers — higher = moves further/faster
// Panel 0 (current color): fastest exit
// Panel 3 (next photo): slowest entry
const PARALLAX = [1.0, 0.85, 0.7, 0.55];

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

      if (direction === 'left') {
        // Forward: slide all panels left. Each panel moves by a different amount.
        // At rest: panels at [0%, 50%, 100%, 150%] (left positions)
        // Target: panels at [-50%, 0%, 50%, 100%] — but with parallax offsets
        panels.forEach((panel, i) => {
          const shift = -50 * PARALLAX[i]; // percentage of viewport width
          tl.to(panel, {
            x: `${shift}vw`,
            duration: DURATION,
            ease: EASE,
          }, 0); // all start at the same time
        });
      } else {
        // Backward: slide all panels right with parallax
        // Panels start at their "completed" position and slide back
        panels.forEach((panel, i) => {
          // Reverse parallax — panel 3 (rightmost) moves fastest back
          const shift = 50 * PARALLAX[3 - i];
          tl.to(panel, {
            x: `${shift}vw`,
            duration: DURATION,
            ease: EASE,
          }, 0);
        });
      }

      tlRef.current = tl;

      return () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
      };
    }, [isTransitioning, nextPhoto, direction, onTransitionComplete]);

    // Reset panels when transition completes
    useEffect(() => {
      if (!isTransitioning) {
        const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
        panels.forEach(panel => gsap.set(panel, { x: 0 }));
      }
    }, [isTransitioning]);

    // Page order based on direction
    const goingBack = direction === 'right' && isTransitioning;
    const goingFwd = direction === 'left' && isTransitioning;

    // Panel content assignment
    // Forward: [currentColor, currentPhoto, nextColor, nextPhoto]
    // Backward: [nextColor, nextPhoto, currentColor, currentPhoto]
    const p0Bg = goingBack ? nextBg : currentBg;
    const p0Fg = goingBack ? nextFg : currentFg;
    const p0Font = goingBack ? nextFont : currentFont;
    const p0Photo = null; // color panel

    const p1Photo = goingBack ? nextPhoto : currentPhoto;

    const p2Bg = goingBack ? currentBg : (goingFwd ? nextBg : currentBg);
    const p2Fg = goingBack ? currentFg : (goingFwd ? nextFg : currentFg);
    const p2Font = goingBack ? currentFont : (goingFwd ? nextFont : currentFont);

    const p3Photo = goingBack ? currentPhoto : (goingFwd ? nextPhoto : currentPhoto);

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden">
        {/* Panel 0: Color (left) */}
        <div
          ref={el => { panelRefs.current[0] = el; }}
          className="absolute top-0 h-full flex items-center justify-center"
          style={{
            left: '0%',
            width: '50%',
            backgroundColor: p0Bg,
            zIndex: 4,
          }}
        >
          <span
            className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
            style={{
              color: p0Fg,
              fontFamily: p0Font === 'serif' ? 'serif' : `'${p0Font}', serif`,
            }}
          >
            {specimenText}
          </span>
        </div>

        {/* Panel 1: Photo (left-center) */}
        <div
          ref={el => { panelRefs.current[1] = el; }}
          className="absolute top-0 h-full overflow-hidden"
          style={{
            left: '50%',
            width: '50%',
            zIndex: 3,
          }}
        >
          {p1Photo && (
            <>
              <img src={p1Photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={p1Photo.url} alt={p1Photo.alt} className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
          {p1Photo && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
                <a href={p1Photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{p1Photo.photographer}</a>
                <span> / </span>
                <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">Unsplash</a>
              </div>
            </div>
          )}
        </div>

        {/* Panel 2: Next Color (right-center, off-screen at rest) */}
        <div
          ref={el => { panelRefs.current[2] = el; }}
          className="absolute top-0 h-full flex items-center justify-center"
          style={{
            left: '100%',
            width: '50%',
            backgroundColor: p2Bg,
            zIndex: 2,
          }}
        >
          <span
            className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
            style={{
              color: p2Fg,
              fontFamily: p2Font === 'serif' ? 'serif' : `'${p2Font}', serif`,
            }}
          >
            {specimenText}
          </span>
        </div>

        {/* Panel 3: Next Photo (rightmost, off-screen at rest) */}
        <div
          ref={el => { panelRefs.current[3] = el; }}
          className="absolute top-0 h-full overflow-hidden"
          style={{
            left: '150%',
            width: '50%',
            zIndex: 1,
          }}
        >
          {p3Photo && (
            <>
              <img src={p3Photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={p3Photo.url} alt={p3Photo.alt} className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
          {p3Photo && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
                <a href={p3Photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{p3Photo.photographer}</a>
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
