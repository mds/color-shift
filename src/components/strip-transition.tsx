'use client';

import { useRef, useEffect, useState, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import { getLetterformPath } from '@/lib/font-paths';
import type { PhotoData } from './control-strip';

const COLOR_DURATION = 0.4;
const MORPH_DURATION = 0.5;
const EASE = 'power2.out';

interface StripTransitionProps {
  photo: PhotoData | null;
  bgHex: string;
  fgHex: string;
  font: string;
  specimenText: string;
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ photo, bgHex, fgHex, font, specimenText }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const prevPhotoId = useRef<string | null>(null);
    const prevFont = useRef<string>('');
    const [pathD, setPathD] = useState<string>('');
    const [viewBox, setViewBox] = useState('0 0 400 200');
    const hasInitialPath = useRef(false);

    // Font change → set initial path or morph
    useEffect(() => {
      if (!font || font === 'serif') return;
      if (font === prevFont.current) return;
      prevFont.current = font;

      const newPath = getLetterformPath(font);
      if (!newPath) return;

      if (!hasInitialPath.current) {
        // First font — set directly, no morph
        hasInitialPath.current = true;
        setPathD(newPath);
        computeViewBox(newPath);
        return;
      }

      // Subsequent fonts — morph via GSAP
      // pathRef.current has the OLD path in the DOM.
      // GSAP reads it, interpolates to newPath.
      if (pathRef.current) {
        gsap.to(pathRef.current, {
          morphSVG: { shape: newPath, shapeIndex: 'auto' },
          duration: MORPH_DURATION,
          ease: 'power2.inOut',
          overwrite: true,
          onComplete: () => {
            // After morph, commit the new path to React state
            // so it matches the DOM
            setPathD(newPath);
            computeViewBox(newPath);
          },
        });
        // Update viewBox immediately for smooth sizing
        computeViewBox(newPath);
      }
    }, [font]);

    function computeViewBox(pathData: string) {
      if (typeof document === 'undefined') return;
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', pathData);
      tempSvg.appendChild(tempPath);
      tempSvg.style.position = 'absolute';
      tempSvg.style.visibility = 'hidden';
      document.body.appendChild(tempSvg);
      const bbox = tempPath.getBBox();
      document.body.removeChild(tempSvg);
      const pad = 10;
      setViewBox(`${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`);
    }

    // Ease color background
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: COLOR_DURATION, ease: EASE, overwrite: true });
      }
    }, [bgHex]);

    // Ease text fill color
    useEffect(() => {
      if (pathRef.current) {
        gsap.to(pathRef.current, { attr: { fill: fgHex }, duration: COLOR_DURATION, ease: EASE, overwrite: true });
      }
    }, [fgHex]);

    // Crossfade photo
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      prevPhotoId.current = photo.id;
      if (photoContainerRef.current) {
        gsap.fromTo(photoContainerRef.current,
          { opacity: 0.3 },
          { opacity: 1, duration: COLOR_DURATION * 1.5, ease: EASE, overwrite: true }
        );
      }
    }, [photo]);

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden flex">
        {/* Color panel */}
        <div
          ref={colorRef}
          className="w-1/2 h-full flex items-center justify-center"
          style={{ backgroundColor: bgHex }}
        >
          {pathD ? (
            <svg
              viewBox={viewBox}
              className="w-auto h-[30vh] sm:h-[35vh] md:h-[40vh] max-w-[80%]"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                ref={pathRef}
                d={pathD}
                fill={fgHex}
              />
            </svg>
          ) : (
            <span
              className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] leading-[1] tracking-tight"
              style={{ color: fgHex, fontFamily: 'serif' }}
            >
              {specimenText}
            </span>
          )}
        </div>

        {/* Photo panel */}
        <div ref={photoContainerRef} className="w-1/2 h-full relative overflow-hidden">
          {photo && (
            <>
              <img src={photo.tinyUrl} alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }} />
              <img src={photo.url} alt={photo.alt}
                className="absolute inset-0 w-full h-full object-cover" />
            </>
          )}
          {photo && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
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
