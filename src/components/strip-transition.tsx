'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

const DURATION = 0.4;
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
    const textRef = useRef<HTMLSpanElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const prevPhotoId = useRef<string | null>(null);

    // Ease color + text on every change
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: DURATION, ease: EASE, overwrite: true });
      }
      if (textRef.current) {
        gsap.to(textRef.current, { color: fgHex, duration: DURATION, ease: EASE, overwrite: true });
      }
    }, [bgHex, fgHex]);

    // Crossfade photo when it changes
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      prevPhotoId.current = photo.id;

      if (photoContainerRef.current) {
        // Quick fade: out then in
        gsap.fromTo(photoContainerRef.current,
          { opacity: 0.3 },
          { opacity: 1, duration: DURATION * 1.5, ease: EASE, overwrite: true }
        );
      }
    }, [photo]);

    const fontStyle = font === 'serif' ? 'serif' : `'${font}', serif`;

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden flex">
        {/* Color panel */}
        <div
          ref={colorRef}
          className="w-1/2 h-full flex items-center justify-center"
          style={{ backgroundColor: bgHex }}
        >
          <span
            ref={textRef}
            className="text-[60px] sm:text-[80px] md:text-[120px] lg:text-[160px] tracking-tight"
            style={{
              color: fgHex,
              fontFamily: fontStyle,
              lineHeight: 1,
              display: 'inline-block',
              verticalAlign: 'baseline',
            }}
          >
            {specimenText}
          </span>
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
