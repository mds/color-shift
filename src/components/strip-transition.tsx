'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// SVG curve wipe transition — left to right
// An SVG path morphs from flat (left edge) → curved bulge → flat (covers screen)
// The SVG is filled with the NEXT photo's content, wiping over the current.

const DURATION = 0.8;

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

    const pathRef = useRef<SVGPathElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // SVG path definitions for left-to-right wipe
    // Path draws a shape from left edge. Morphs: flat left → curved bulge → covers all
    const PATH_START = 'M 0 0 H 0 Q 0 50 0 100 H 0 z';           // flat at left edge (invisible)
    const PATH_MID   = 'M 0 0 H 50 Q 0 50 50 100 H 0 z';         // curved bulge emerging from left
    const PATH_END   = 'M 0 0 H 100 Q 100 50 100 100 H 0 z';     // covers entire viewport

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const path = pathRef.current;
      const overlay = overlayRef.current;
      if (!path || !overlay) return;

      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }

      // Show the overlay
      gsap.set(overlay, { visibility: 'visible' });

      // Reset path to start
      gsap.set(path, { attr: { d: PATH_START } });

      const tl = gsap.timeline({
        onComplete: () => {
          onTransitionComplete();
          // Hide overlay after completion
          gsap.set(overlay, { visibility: 'hidden' });
          gsap.set(path, { attr: { d: PATH_START } });
        },
      });

      if (direction === 'left') {
        // Forward: wipe from left to right
        tl.to(path, {
          attr: { d: PATH_MID },
          duration: DURATION * 0.5,
          ease: 'power2.in',
        })
        .to(path, {
          attr: { d: PATH_END },
          duration: DURATION * 0.5,
          ease: 'power2.out',
        });
      } else {
        // Backward: wipe from right to left (reverse the path directions)
        const REV_START = 'M 100 0 H 100 Q 100 50 100 100 H 100 z';
        const REV_MID   = 'M 100 0 H 50 Q 100 50 50 100 H 100 z';
        const REV_END   = 'M 100 0 H 0 Q 0 50 0 100 H 100 z';

        gsap.set(path, { attr: { d: REV_START } });

        tl.to(path, {
          attr: { d: REV_MID },
          duration: DURATION * 0.5,
          ease: 'power2.in',
        })
        .to(path, {
          attr: { d: REV_END },
          duration: DURATION * 0.5,
          ease: 'power2.out',
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

    // Determine what's shown as "current" (base layer) and "next" (overlay)
    const baseBg = currentBg;
    const baseFg = currentFg;
    const baseFont = currentFont;
    const basePhoto = currentPhoto;

    const overBg = isTransitioning && nextPhoto ? nextBg : currentBg;
    const overFg = isTransitioning && nextPhoto ? nextFg : currentFg;
    const overFont = isTransitioning && nextPhoto ? nextFont : currentFont;
    const overPhoto = isTransitioning && nextPhoto ? nextPhoto : currentPhoto;

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden">
        {/* Base layer — current photo + color */}
        <div className="absolute inset-0 flex">
          {/* Color half */}
          <div
            className="w-1/2 h-full flex items-center justify-center"
            style={{ backgroundColor: baseBg }}
          >
            <span
              className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
              style={{
                color: baseFg,
                fontFamily: baseFont === 'serif' ? 'serif' : `'${baseFont}', serif`,
              }}
            >
              {specimenText}
            </span>
          </div>

          {/* Photo half */}
          <div className="w-1/2 h-full relative overflow-hidden">
            {basePhoto && (
              <>
                <img src={basePhoto.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                <img src={basePhoto.url} alt={basePhoto.alt} className="absolute inset-0 w-full h-full object-cover" />
              </>
            )}
            {basePhoto && (
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
                  <a href={basePhoto.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{basePhoto.photographer}</a>
                  <span> / </span>
                  <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">Unsplash</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Overlay layer — next photo + color, masked by SVG path */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ visibility: 'hidden' }}
        >
          {/* SVG mask/clip */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <clipPath id="wipe-clip">
                <path ref={pathRef} d={PATH_START} />
              </clipPath>
            </defs>
          </svg>

          {/* Content clipped by the SVG path */}
          <div
            className="absolute inset-0 flex"
            style={{ clipPath: 'url(#wipe-clip)' }}
          >
            {/* Color half */}
            <div
              className="w-1/2 h-full flex items-center justify-center"
              style={{ backgroundColor: overBg }}
            >
              <span
                className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
                style={{
                  color: overFg,
                  fontFamily: overFont === 'serif' ? 'serif' : `'${overFont}', serif`,
                }}
              >
                {specimenText}
              </span>
            </div>

            {/* Photo half */}
            <div className="w-1/2 h-full relative overflow-hidden">
              {overPhoto && (
                <>
                  <img src={overPhoto.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                  <img src={overPhoto.url} alt={overPhoto.alt} className="absolute inset-0 w-full h-full object-cover" />
                </>
              )}
              {overPhoto && (
                <div className="absolute bottom-3 left-3 right-3 z-10">
                  <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
                    <a href={overPhoto.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{overPhoto.photographer}</a>
                    <span> / </span>
                    <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">Unsplash</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StripTransition.displayName = 'StripTransition';
