'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// Curve wipe transition using CSS clip-path polygon
// GSAP animates the polygon points to create a curved wipe from left to right

const DURATION = 0.7;

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

    const overlayRef = useRef<HTMLDivElement>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const progressRef = useRef({ v: 0 });

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const overlay = overlayRef.current;
      if (!overlay) return;

      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }

      gsap.set(overlay, { visibility: 'visible' });
      progressRef.current.v = 0;

      const tl = gsap.timeline({
        onComplete: () => {
          onTransitionComplete();
          gsap.set(overlay, { visibility: 'hidden', clipPath: 'none' });
        },
      });

      // Animate a progress value 0→1, update clipPath on each frame
      tl.to(progressRef.current, {
        v: 1,
        duration: DURATION,
        ease: 'power2.inOut',
        onUpdate: () => {
          const p = progressRef.current.v;

          if (direction === 'left') {
            // Wipe from left to right with a curve
            // The leading edge has a sine-based curve
            const curve = Math.sin(p * Math.PI) * 15; // max 15% curve at midpoint
            const lead = p * 100;

            // Polygon: left edge → curved leading edge → back to left
            overlay.style.clipPath = `polygon(
              0% 0%,
              ${Math.min(lead + curve, 100)}% 0%,
              ${Math.min(lead + curve * 1.5, 100)}% 25%,
              ${Math.min(lead, 100)}% 50%,
              ${Math.min(lead + curve * 1.5, 100)}% 75%,
              ${Math.min(lead + curve, 100)}% 100%,
              0% 100%
            )`;
          } else {
            // Wipe from right to left
            const curve = Math.sin(p * Math.PI) * 15;
            const lead = 100 - p * 100;

            overlay.style.clipPath = `polygon(
              100% 0%,
              ${Math.max(lead - curve, 0)}% 0%,
              ${Math.max(lead - curve * 1.5, 0)}% 25%,
              ${Math.max(lead, 0)}% 50%,
              ${Math.max(lead - curve * 1.5, 0)}% 75%,
              ${Math.max(lead - curve, 0)}% 100%,
              100% 100%
            )`;
          }
        },
      });

      tlRef.current = tl;

      return () => {
        if (tlRef.current) {
          tlRef.current.kill();
          tlRef.current = null;
        }
      };
    }, [isTransitioning, nextPhoto, direction, onTransitionComplete]);

    // Reset when not transitioning
    useEffect(() => {
      if (!isTransitioning && overlayRef.current) {
        overlayRef.current.style.clipPath = 'none';
        gsap.set(overlayRef.current, { visibility: 'hidden' });
      }
    }, [isTransitioning]);

    const overBg = isTransitioning && nextPhoto ? nextBg : currentBg;
    const overFg = isTransitioning && nextPhoto ? nextFg : currentFg;
    const overFont = isTransitioning && nextPhoto ? nextFont : currentFont;
    const overPhoto = isTransitioning && nextPhoto ? nextPhoto : currentPhoto;

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden">
        {/* Base layer — current */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: currentBg }}>
            <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
              style={{ color: currentFg, fontFamily: currentFont === 'serif' ? 'serif' : `'${currentFont}', serif` }}>
              {specimenText}
            </span>
          </div>
          <div className="w-1/2 h-full relative overflow-hidden">
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

        {/* Overlay layer — next, clipped by animated polygon */}
        <div ref={overlayRef} className="absolute inset-0 flex" style={{ visibility: 'hidden' }}>
          <div className="w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: overBg }}>
            <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
              style={{ color: overFg, fontFamily: overFont === 'serif' ? 'serif' : `'${overFont}', serif` }}>
              {specimenText}
            </span>
          </div>
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
    );
  }
);

StripTransition.displayName = 'StripTransition';
