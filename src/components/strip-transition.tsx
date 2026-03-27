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
    const [ready, setReady] = useState(false);
    const [viewBox, setViewBox] = useState('-10 -10 420 200');

    // Set initial path directly on the DOM element, then let GSAP own it
    useEffect(() => {
      if (!font || font === 'serif') return;
      const path = getLetterformPath(font);
      if (!path || !pathRef.current) return;

      if (!ready) {
        // First font — set path on DOM and mark ready
        pathRef.current.setAttribute('d', path);
        computeViewBox(path);
        setReady(true);
        return;
      }

      // Subsequent fonts — morph via GSAP (DOM element already has previous path)
      gsap.to(pathRef.current, {
        morphSVG: path,
        duration: MORPH_DURATION,
        ease: 'power2.inOut',
      });

      computeViewBox(path);
    }, [font, ready]);

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

    // Ease background color — targets colorRef (different element, safe)
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: COLOR_DURATION, ease: 'power2.out', overwrite: true });
      }
    }, [bgHex]);

    // Ease fill color — use setAttribute directly to avoid overwrite conflict
    useEffect(() => {
      if (pathRef.current) {
        pathRef.current.setAttribute('fill', fgHex);
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
          <svg
            viewBox={viewBox}
            className="w-auto h-[30vh] sm:h-[35vh] md:h-[40vh] max-w-[80%]"
            preserveAspectRatio="xMidYMid meet"
            style={{ opacity: ready ? 1 : 0 }}
          >
            <path ref={pathRef} d="M0 0" fill={fgHex} />
          </svg>
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
