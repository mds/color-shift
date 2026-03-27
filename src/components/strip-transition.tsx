'use client';

import { useRef, useEffect, useCallback, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

const NUM_STRIPS = 5;
const STAGGER = 0.04;       // seconds between each strip start
const DURATION = 0.5;        // total slide duration per strip
const EASE = 'power3.inOut'; // snappy: fast acceleration, smooth deceleration

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

    // Run strip transition when isTransitioning becomes true
    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[];
      if (strips.length !== NUM_STRIPS) return;

      // Kill any existing timeline
      if (tlRef.current) tlRef.current.kill();

      // Direction: slide left (-100%) to go forward, right (+100%) to go back
      const fromX = direction === 'left' ? '0%' : '0%';
      const toX = direction === 'left' ? '-50%' : '50%';

      // Reset all strips to show current page
      gsap.set(strips, { xPercent: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          onTransitionComplete();
        },
      });

      // Stagger: top-to-bottom cascade
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

    // Reset strips when not transitioning
    useEffect(() => {
      if (!isTransitioning) {
        const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[];
        gsap.set(strips, { xPercent: 0 });
      }
    }, [isTransitioning]);

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
              width: '200%', // holds both current and next page side by side
            }}
          >
            {/* Page 1: Current — color left half + photo right half */}
            <div
              className="absolute top-0 left-0 flex"
              style={{ width: '50%', height: '100%' }}
            >
              {/* Color half */}
              <div
                className="w-1/2 h-full flex items-center justify-center relative"
                style={{ backgroundColor: currentBg }}
              >
                {/* Only show specimen text in the middle strip */}
                {i === Math.floor(NUM_STRIPS / 2) && (
                  <span
                    className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-none tracking-tight"
                    style={{
                      color: currentFg,
                      fontFamily: 'var(--font-ghost-byte), monospace',
                    }}
                  >
                    {specimenText}
                  </span>
                )}
              </div>

              {/* Photo half */}
              <div className="w-1/2 h-full relative overflow-hidden">
                {currentPhoto && (
                  <>
                    <img
                      src={currentPhoto.tinyUrl}
                      alt=""
                      className="absolute inset-0 w-full object-cover"
                      style={{
                        imageRendering: 'pixelated',
                        height: `${NUM_STRIPS * 100}%`,
                        top: `${-i * 100}%`,
                      }}
                    />
                    <img
                      src={currentPhoto.url}
                      alt={currentPhoto.alt}
                      className="absolute inset-0 w-full object-cover"
                      style={{
                        height: `${NUM_STRIPS * 100}%`,
                        top: `${-i * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Page 2: Next — color left half + photo right half */}
            <div
              className="absolute top-0 flex"
              style={{ left: '50%', width: '50%', height: '100%' }}
            >
              {/* Color half */}
              <div
                className="w-1/2 h-full flex items-center justify-center relative"
                style={{ backgroundColor: nextBg }}
              >
                {i === Math.floor(NUM_STRIPS / 2) && (
                  <span
                    className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-none tracking-tight"
                    style={{
                      color: nextFg,
                      fontFamily: 'var(--font-ghost-byte), monospace',
                    }}
                  >
                    {specimenText}
                  </span>
                )}
              </div>

              {/* Photo half */}
              <div className="w-1/2 h-full relative overflow-hidden">
                {nextPhoto && (
                  <>
                    <img
                      src={nextPhoto.tinyUrl}
                      alt=""
                      className="absolute inset-0 w-full object-cover"
                      style={{
                        imageRendering: 'pixelated',
                        height: `${NUM_STRIPS * 100}%`,
                        top: `${-i * 100}%`,
                      }}
                    />
                    <img
                      src={nextPhoto.url}
                      alt={nextPhoto.alt}
                      className="absolute inset-0 w-full object-cover"
                      style={{
                        height: `${NUM_STRIPS * 100}%`,
                        top: `${-i * 100}%`,
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Attribution overlay */}
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
