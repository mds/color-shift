'use client';

import { useRef, useEffect, useState, forwardRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { getFontContours } from '@/lib/font-paths';
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
    const outerRefs = useRef<(SVGPathElement | null)[]>([]);
    const innerRefs = useRef<(SVGPathElement | null)[]>([]);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const prevPhotoId = useRef<string | null>(null);
    const [ready, setReady] = useState(false);
    const [viewBox, setViewBox] = useState('-10 -10 420 200');
    const [numOuters, setNumOuters] = useState(0);
    const [numInners, setNumInners] = useState(0);

    // Initialize on first font, morph on subsequent
    useEffect(() => {
      if (!font || font === 'serif') return;
      const contours = getFontContours(font);
      if (!contours) return;

      if (!ready) {
        // First font — set all paths directly on DOM
        setNumOuters(contours.outers.length);
        setNumInners(contours.inners.length);

        // Need to wait for refs to be available after render
        requestAnimationFrame(() => {
          contours.outers.forEach((d, i) => {
            if (outerRefs.current[i]) outerRefs.current[i]!.setAttribute('d', d);
          });
          contours.inners.forEach((d, i) => {
            if (innerRefs.current[i]) innerRefs.current[i]!.setAttribute('d', d);
          });
          computeViewBox(contours.full);
          setReady(true);
        });
        return;
      }

      // Subsequent fonts — morph each contour pair
      contours.outers.forEach((d, i) => {
        const el = outerRefs.current[i];
        if (el) {
          gsap.to(el, { morphSVG: d, duration: MORPH_DURATION, ease: 'power2.inOut' });
        }
      });

      contours.inners.forEach((d, i) => {
        const el = innerRefs.current[i];
        if (el) {
          gsap.to(el, { morphSVG: d, duration: MORPH_DURATION, ease: 'power2.inOut' });
        }
      });

      computeViewBox(contours.full);
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

    // Ease background color
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: COLOR_DURATION, ease: 'power2.out', overwrite: true });
      }
    }, [bgHex]);

    // Set fill color directly (no tween conflict with morph)
    useEffect(() => {
      outerRefs.current.forEach(el => { if (el) el.setAttribute('fill', fgHex); });
      innerRefs.current.forEach(el => { if (el) el.setAttribute('fill', fgHex); });
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
            style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.3s' }}
          >
            {/* Outer contours (letter bodies) */}
            {Array.from({ length: numOuters }, (_, i) => (
              <path
                key={`outer-${i}`}
                ref={el => { outerRefs.current[i] = el; }}
                d="M0 0"
                fill={fgHex}
              />
            ))}
            {/* Inner contours (counters/holes) — rendered as cutouts */}
            {Array.from({ length: numInners }, (_, i) => (
              <path
                key={`inner-${i}`}
                ref={el => { innerRefs.current[i] = el; }}
                d="M0 0"
                fill={fgHex}
              />
            ))}
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
