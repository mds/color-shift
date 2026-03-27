'use client';

import { useRef, useEffect, forwardRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Draggable } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

gsap.registerPlugin(MorphSVGPlugin);

const COLOR_DURATION = 0.4;
const MORPH_DURATION = 0.5;

const SHAPES = [
  'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0 Z',  // Circle
  'M 5,5 L 95,5 L 95,95 L 5,95 Z',                       // Square
  'M 50,2 L 98,50 L 50,98 L 2,50 Z',                      // Diamond
]; // cycle: circle → square → diamond → circle → ...

interface StripTransitionProps {
  photo: PhotoData | null;
  bgHex: string;
  fgHex: string;
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ photo, bgHex, fgHex }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const svgWrapRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const prevPhotoId = useRef<string | null>(null);
    const shapeIndex = useRef(0);
    const draggableInstance = useRef<Draggable[] | null>(null);

    // Init draggable with inertia
    useEffect(() => {
      if (!svgWrapRef.current || !colorRef.current) return;

      draggableInstance.current = Draggable.create(svgWrapRef.current, {
        type: 'x,y',
        bounds: colorRef.current,
        inertia: true,
        edgeResistance: 0.65,
        cursor: 'grab',
        activeCursor: 'grabbing',
      });

      return () => {
        if (draggableInstance.current) {
          draggableInstance.current.forEach(d => d.kill());
        }
      };
    }, []);

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

    // Morph shape + crossfade photo
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      prevPhotoId.current = photo.id;

      // Morph to next shape
      if (pathRef.current) {
        shapeIndex.current = (shapeIndex.current + 1) % SHAPES.length;
        gsap.to(pathRef.current, {
          morphSVG: SHAPES[shapeIndex.current],
          duration: MORPH_DURATION,
          ease: 'power2.inOut',
        });
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
          className="w-1/2 h-full flex items-center justify-center relative"
          style={{ backgroundColor: bgHex }}
        >
          <div ref={svgWrapRef} className="touch-none">
            <svg viewBox="0 0 100 100" className="w-[20vh] h-[20vh]">
              <path ref={pathRef} d={SHAPES[0]} fill={fgHex} />
            </svg>
          </div>
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
