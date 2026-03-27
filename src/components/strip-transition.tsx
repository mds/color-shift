'use client';

import { useRef, useEffect, useState, forwardRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { getLetterformPath } from '@/lib/font-paths';
import type { PhotoData } from './control-strip';

gsap.registerPlugin(MorphSVGPlugin);

const COLOR_DURATION = 0.4;
const MORPH_DURATION = 0.6;

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
    const fontIndexRef = useRef(0);
    const [initialPath, setInitialPath] = useState<string>('');
    const [viewBox, setViewBox] = useState('-10 -10 420 200');

    // Set initial path on first font
    useEffect(() => {
      if (!font || font === 'serif' || initialPath) return;
      const path = getLetterformPath(font);
      if (path) {
        setInitialPath(path);
        computeViewBox(path);
      }
    }, [font, initialPath]);

    // Morph on font change (same pattern as the working test component)
    useEffect(() => {
      if (!font || font === 'serif' || !pathRef.current || !initialPath) return;

      const newPath = getLetterformPath(font);
      if (!newPath) return;

      // Skip the very first render (path is already set via initialPath)
      fontIndexRef.current++;
      if (fontIndexRef.current <= 1) return;

      gsap.to(pathRef.current, {
        morphSVG: newPath,
        duration: MORPH_DURATION,
        ease: 'power2.inOut',
        overwrite: true,
      });

      computeViewBox(newPath);
    }, [font, initialPath]);

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

    // Ease color
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: COLOR_DURATION, ease: 'power2.out', overwrite: true });
      }
    }, [bgHex]);

    // Ease fill color
    useEffect(() => {
      if (pathRef.current) {
        gsap.to(pathRef.current, { attr: { fill: fgHex }, duration: COLOR_DURATION, ease: 'power2.out', overwrite: true });
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
          { opacity: 1, duration: 0.6, ease: 'power2.out', overwrite: true }
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
          {initialPath ? (
            <svg
              viewBox={viewBox}
              className="w-auto h-[30vh] sm:h-[35vh] md:h-[40vh] max-w-[80%]"
              preserveAspectRatio="xMidYMid meet"
            >
              <path ref={pathRef} d={initialPath} fill={fgHex} />
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
              <img src={photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
              <img src={photo.url} alt={photo.alt} className="absolute inset-0 w-full h-full object-cover" />
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
