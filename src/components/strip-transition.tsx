'use client';

import { useRef, useEffect, forwardRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import type { PhotoData } from './control-strip';

gsap.registerPlugin(MorphSVGPlugin);

const COLOR_DURATION = 0.4;
const MORPH_DURATION = 0.5;

// All shapes defined in a 100x100 viewBox, centered at 50,50
const SHAPES = [
  // Circle
  'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z',
  // Square
  'M 5,5 L 95,5 L 95,95 L 5,95 Z',
  // Diamond
  'M 50,2 L 98,50 L 50,98 L 2,50 Z',
  // Triangle
  'M 50,5 L 95,90 L 5,90 Z',
  // Hexagon
  'M 50,2 L 93,27 L 93,73 L 50,98 L 7,73 L 7,27 Z',
  // Star
  'M 50,5 L 61,35 L 95,35 L 68,57 L 79,91 L 50,70 L 21,91 L 32,57 L 5,35 L 39,35 Z',
  // Rounded square
  'M 20,5 Q 5,5 5,20 L 5,80 Q 5,95 20,95 L 80,95 Q 95,95 95,80 L 95,20 Q 95,5 80,5 Z',
  // Pentagon
  'M 50,2 L 97,38 L 79,95 L 21,95 L 3,38 Z',
  // Cross
  'M 35,5 L 65,5 L 65,35 L 95,35 L 95,65 L 65,65 L 65,95 L 35,95 L 35,65 L 5,65 L 5,35 L 35,35 Z',
  // Octagon
  'M 30,5 L 70,5 L 95,30 L 95,70 L 70,95 L 30,95 L 5,70 L 5,30 Z',
];

function getShapeForPhoto(photoId: string): string {
  let hash = 0;
  for (let i = 0; i < photoId.length; i++) {
    hash = ((hash << 5) - hash) + photoId.charCodeAt(i);
    hash |= 0;
  }
  return SHAPES[Math.abs(hash) % SHAPES.length];
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

      const targetShape = getShapeForPhoto(photo.id);

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
