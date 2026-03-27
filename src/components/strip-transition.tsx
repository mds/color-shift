'use client';

import { useRef, useEffect, forwardRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import type { PhotoData } from './control-strip';

gsap.registerPlugin(MorphSVGPlugin);

const COLOR_DURATION = 0.4;
const MORPH_DURATION = 0.5;

const SHAPES = [
  // Circle
  'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z',
  // Square
  'M 5,5 L 95,5 L 95,95 L 5,95 Z',
  // Diamond
  'M 50,2 L 98,50 L 50,98 L 2,50 Z',
  // Triangle
  'M 50,5 L 95,90 L 5,90 Z',
];

let shapeIndex = 0;
function getNextShape(): string {
  const shape = SHAPES[shapeIndex % SHAPES.length];
  shapeIndex++;
  return shape;
}

interface StripTransitionProps {
  photo: PhotoData | null;
  bgHex: string;
  fgHex: string;
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ photo, bgHex, fgHex }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const prevPhotoId = useRef<string | null>(null);
    const hasInitShape = useRef(false);

    // Ease background color
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: COLOR_DURATION, ease: 'power2.out', overwrite: true });
      }
    }, [bgHex]);

    // Set fill color
    useEffect(() => {
      if (pathRef.current) pathRef.current.setAttribute('fill', fgHex);
    }, [fgHex]);

    // Morph shape + crossfade photo on photo change
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      prevPhotoId.current = photo.id;

      const targetShape = getNextShape();

      // Morph shape
      if (pathRef.current) {
        if (!hasInitShape.current) {
          // First photo — set shape directly
          pathRef.current.setAttribute('d', targetShape);
          hasInitShape.current = true;
        } else {
          gsap.to(pathRef.current, {
            morphSVG: targetShape,
            duration: MORPH_DURATION,
            ease: 'power2.inOut',
          });
        }
      }

      // Crossfade photo
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
          <svg viewBox="0 0 100 100" className="w-[20vh] h-[20vh]">
            <path ref={pathRef} d={SHAPES[0]} fill={fgHex} />
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
