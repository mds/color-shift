'use client';

import { useRef, useEffect, forwardRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import type { PhotoData } from './control-strip';

gsap.registerPlugin(MorphSVGPlugin);

const COLOR_DURATION = 0.4;
const MORPH_DURATION = 0.5;

// All shapes: soft, rounded, organic — no hard edges, no stars
const SHAPES = [
  // Circle
  'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z',
  // Ellipse (wide)
  'M 50,15 A 45,35 0 1,1 50,85 A 45,35 0 1,1 50,15 Z',
  // Ellipse (tall)
  'M 50,2 A 30,48 0 1,1 50,98 A 30,48 0 1,1 50,2 Z',
  // Squircle (rounded square)
  'M 50,2 C 85,2 98,15 98,50 C 98,85 85,98 50,98 C 15,98 2,85 2,50 C 2,15 15,2 50,2 Z',
  // Soft diamond
  'M 50,2 C 65,2 98,35 98,50 C 98,65 65,98 50,98 C 35,98 2,65 2,50 C 2,35 35,2 50,2 Z',
  // Blob 1
  'M 50,5 C 75,0 100,20 95,50 C 100,80 75,100 50,95 C 25,100 0,80 5,50 C 0,20 25,0 50,5 Z',
  // Blob 2 (organic)
  'M 45,3 C 70,0 95,15 97,45 C 99,75 80,98 50,97 C 20,96 3,78 2,48 C 1,18 20,6 45,3 Z',
  // Egg
  'M 50,5 C 80,5 95,30 95,55 C 95,80 75,98 50,98 C 25,98 5,80 5,55 C 5,30 20,5 50,5 Z',
  // Pill (horizontal)
  'M 30,20 A 30,30 0 0,1 30,80 L 70,80 A 30,30 0 0,1 70,20 Z',
  // Soft triangle
  'M 50,8 C 60,8 90,75 85,85 C 80,95 20,95 15,85 C 10,75 40,8 50,8 Z',
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
