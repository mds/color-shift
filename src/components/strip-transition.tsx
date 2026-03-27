'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// 4-panel curved wipe: each panel (color1, photo1, color2, photo2)
// wipes with its own smooth curved edge, staggered left to right.

const DURATION = 0.6;
const STAGGER = 0.08;  // delay between each panel's wipe start
const CURVE_POINTS = 30; // polygon points for smooth curve
const CURVE_AMPLITUDE = 8; // max curve depth in percentage

// Generate a smooth curved clip-path polygon for a left-to-right wipe
function buildCurveClip(progress: number, panelLeft: number, panelRight: number, direction: 'left' | 'right'): string {
  if (progress <= 0) return 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
  if (progress >= 1) return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)';

  const amplitude = Math.sin(progress * Math.PI) * CURVE_AMPLITUDE;

  if (direction === 'left') {
    // Wipe from left: leading edge moves rightward
    const lead = progress * 100;
    const points: string[] = [];

    // Left edge (straight)
    points.push('0% 0%');

    // Right edge (curved) — top to bottom
    for (let i = 0; i <= CURVE_POINTS; i++) {
      const y = (i / CURVE_POINTS) * 100;
      const t = i / CURVE_POINTS;
      // Smooth sine curve — bulges right at center
      const curveOffset = Math.sin(t * Math.PI) * amplitude;
      const x = Math.min(lead + curveOffset, 100);
      points.push(`${x}% ${y}%`);
    }

    // Back along left edge (bottom)
    points.push('0% 100%');

    return `polygon(${points.join(', ')})`;
  } else {
    // Wipe from right: leading edge moves leftward
    const lead = 100 - progress * 100;
    const points: string[] = [];

    // Right edge (straight)
    points.push('100% 0%');

    // Left edge (curved) — top to bottom
    for (let i = 0; i <= CURVE_POINTS; i++) {
      const y = (i / CURVE_POINTS) * 100;
      const t = i / CURVE_POINTS;
      const curveOffset = Math.sin(t * Math.PI) * amplitude;
      const x = Math.max(lead - curveOffset, 0);
      points.push(`${x}% ${y}%`);
    }

    // Back along right edge (bottom)
    points.push('100% 100%');

    return `polygon(${points.join(', ')})`;
  }
}

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

    const panel0Ref = useRef<HTMLDivElement>(null); // next color left
    const panel1Ref = useRef<HTMLDivElement>(null); // next photo left
    const panel2Ref = useRef<HTMLDivElement>(null); // next color right (if needed)
    const panel3Ref = useRef<HTMLDivElement>(null); // next photo right (if needed)
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const progress = useRef([{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }]);

    useEffect(() => {
      if (!isTransitioning || !nextPhoto) return;

      const panels = [panel0Ref.current, panel1Ref.current, panel2Ref.current, panel3Ref.current];
      if (panels.some(p => !p)) return;

      if (tlRef.current) {
        tlRef.current.kill();
        tlRef.current = null;
      }

      // Reset progress
      progress.current.forEach(p => { p.v = 0; });

      // Show all panels
      panels.forEach(p => { if (p) gsap.set(p, { visibility: 'visible' }); });

      const tl = gsap.timeline({
        onComplete: () => {
          onTransitionComplete();
          panels.forEach(p => {
            if (p) {
              p.style.clipPath = 'none';
              gsap.set(p, { visibility: 'hidden' });
            }
          });
        },
      });

      // Animate each panel's progress with stagger
      panels.forEach((panel, i) => {
        if (!panel) return;

        tl.to(progress.current[i], {
          v: 1,
          duration: DURATION,
          ease: 'power2.inOut',
          onUpdate: () => {
            panel.style.clipPath = buildCurveClip(progress.current[i].v, 0, 100, direction);
          },
        }, i * STAGGER); // staggered start
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
      if (!isTransitioning) {
        [panel0Ref, panel1Ref, panel2Ref, panel3Ref].forEach(r => {
          if (r.current) {
            r.current.style.clipPath = 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)';
            gsap.set(r.current, { visibility: 'hidden' });
          }
        });
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

        {/* Overlay panels — 4 layers, each clips a quarter of the next content */}
        {/* Panel 0: Next color (left quarter) */}
        <div ref={panel0Ref} className="absolute inset-0" style={{ visibility: 'hidden', clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }}>
          <div className="absolute top-0 left-0 w-1/2 h-full flex items-center justify-center" style={{ backgroundColor: overBg }}>
            <span className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
              style={{ color: overFg, fontFamily: overFont === 'serif' ? 'serif' : `'${overFont}', serif` }}>
              {specimenText}
            </span>
          </div>
        </div>

        {/* Panel 1: Next photo (right quarter of left half + left quarter of right half) */}
        <div ref={panel1Ref} className="absolute inset-0" style={{ visibility: 'hidden', clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }}>
          <div className="absolute top-0 left-1/2 w-1/2 h-full relative overflow-hidden">
            {overPhoto && (
              <>
                <img src={overPhoto.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                <img src={overPhoto.url} alt={overPhoto.alt} className="absolute inset-0 w-full h-full object-cover" />
              </>
            )}
          </div>
        </div>

        {/* Panel 2: Full next content — color + photo combined */}
        <div ref={panel2Ref} className="absolute inset-0 flex" style={{ visibility: 'hidden', clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }}>
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
          </div>
        </div>

        {/* Panel 3: Full next content — final resolve layer */}
        <div ref={panel3Ref} className="absolute inset-0 flex" style={{ visibility: 'hidden', clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }}>
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
