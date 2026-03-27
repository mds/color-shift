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
  specimenText: string;
  onTransitionComplete: () => void;
  isTransitioning: boolean;
  direction: 'left' | 'right';
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ currentPhoto, nextPhoto, currentBg, currentFg, nextBg, nextFg,
     specimenText, onTransitionComplete, isTransitioning, direction }, ref) => {

    const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
    const tlRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[];
      if (strips.length !== NUM_STRIPS) return;

      // Kill existing timeline — strips stay wherever they are
      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }

      const target = direction === 'left' ? -50 : 0;

      // For backward: if strips are at rest (0), snap to -50 first so the
      // current page is visible (in the right half), then animate to 0.
      // For forward: strips at rest (0) is correct, animate to -50.
      // Mid-animation: just redirect from wherever they are.
      if (direction === 'right') {
        strips.forEach(strip => {
          const current = gsap.getProperty(strip, 'xPercent') as number;
          // If at rest (0) or very close, snap to -50 to set up the backward layout
          if (Math.abs(current) < 1) {
            gsap.set(strip, { xPercent: -50 });
          }
        });
      }

      const tl = gsap.timeline({ onComplete: onTransitionComplete });
      tl.to(strips, {
        xPercent: target,
        duration: DURATION,
        stagger: STAGGER,
        ease: EASE,
        overwrite: true,
      });

      tlRef.current = tl;

      return () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
      };
    }, [isTransitioning, nextPhoto, direction, onTransitionComplete]);

    // Snap strips to resting position when transition completes
    useEffect(() => {
      if (!isTransitioning) {
        const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[];
        // After completion, current page is always in the left position (xPercent: 0)
        gsap.set(strips, { xPercent: 0 });
      }
    }, [isTransitioning]);

    // Determine page order based on direction
    // Left (forward): [current | next]
    // Right (backward): [next | current]
    const leftBg = direction === 'right' && isTransitioning ? nextBg : currentBg;
    const leftFg = direction === 'right' && isTransitioning ? nextFg : currentFg;
    const leftPhoto = direction === 'right' && isTransitioning ? nextPhoto : currentPhoto;

    const rightBg = direction === 'right' && isTransitioning ? currentBg : (isTransitioning ? nextBg : currentBg);
    const rightFg = direction === 'right' && isTransitioning ? currentFg : (isTransitioning ? nextFg : currentFg);
    const rightPhoto = direction === 'right' && isTransitioning ? currentPhoto : (isTransitioning ? nextPhoto : currentPhoto);

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
              {/* Color half */}
              <div className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: leftBg }}>
                {i === Math.floor(NUM_STRIPS / 2) && (
                  <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-none tracking-tight"
                    style={{ color: leftFg, fontFamily: 'var(--font-ghost-byte), monospace' }}>
                    {specimenText}
                  </span>
                )}
              </div>
              {/* Photo half */}
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
              {/* Color half */}
              <div className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: rightBg }}>
                {i === Math.floor(NUM_STRIPS / 2) && (
                  <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-none tracking-tight"
                    style={{ color: rightFg, fontFamily: 'var(--font-ghost-byte), monospace' }}>
                    {specimenText}
                  </span>
                )}
              </div>
              {/* Photo half */}
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
