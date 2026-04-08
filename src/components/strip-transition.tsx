'use client';

import { useRef, useEffect, useState, forwardRef, useCallback } from 'react';
import gsap from 'gsap';
import type { PhotoData } from './control-strip';
import { TubeText } from './ui/tube-text';

// DialKit-tuned motion params stored on window by color-shift.tsx
type PhotoStyle = 'fade' | 'zoom-in' | 'zoom-out' | 'blur' | 'pixelate' | 'slide' | 'scale-fade';
type MotionParams = {
  hover: { scale: number; duration: number; ease: string; navPulseScale: number; navPulseDuration: number };
  click: { duration: number; ease: string };
  photo: { style: PhotoStyle; startOpacity: number; startScale: number; duration: number; ease: string };
};

function getMotionParams(): MotionParams {
  const fallback: MotionParams = {
    hover: { scale: 1.05, duration: 1, ease: 'power4.out', navPulseScale: 1.01, navPulseDuration: 0.4 },
    click: { duration: 0.3, ease: 'power4.out' },
    photo: { style: 'fade', startOpacity: 0, startScale: 1.05, duration: 1, ease: 'power4.out' },
  };
  if (typeof window === 'undefined') return fallback;
  return (window as unknown as { __motion?: MotionParams }).__motion ?? fallback;
}

interface StripTransitionProps {
  photo: PhotoData | null;
  bgHex: string;
  fgHex: string;
  onPhotoFileSelected?: (file: File) => void;
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ photo, bgHex, fgHex, onPhotoFileSelected }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const circleRef = useRef<HTMLDivElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const prevPhotoId = useRef<string | null>(null);
    const [showText, setShowText] = useState(true);
    const isHoveringRef = useRef(false);

    // Ease background color + text/fill colors
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: 0.4, ease: 'power2.out', overwrite: true });
      }
      if (textRef.current) {
        gsap.to(textRef.current, { color: fgHex, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      }
    }, [bgHex, fgHex]);

    // Photo transition — multiple styles selectable via DialKit
    useEffect(() => {
      if (!photo) return;
      if (photo.id === prevPhotoId.current) return;
      const isFirstLoad = prevPhotoId.current === null;
      prevPhotoId.current = photo.id;
      const el = photoContainerRef.current;
      if (!el) return;

      const { photo: p, hover } = getMotionParams();
      const t = { duration: p.duration, ease: p.ease, overwrite: true as const };

      switch (p.style) {
        case 'fade':
        case 'zoom-in':
        case 'zoom-out':
        case 'scale-fade':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'none', x: 0 }, { opacity: 1, scale: 1, ...t });
          break;
        case 'blur':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'blur(20px)', x: 0 }, { opacity: 1, scale: 1, filter: 'blur(0px)', ...t });
          break;
        case 'pixelate':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'contrast(1.5) blur(8px) saturate(1.3)', x: 0 }, { opacity: 1, scale: 1, filter: 'contrast(1) blur(0px) saturate(1)', ...t });
          break;
        case 'slide':
          gsap.fromTo(el, { opacity: p.startOpacity, scale: p.startScale, filter: 'none', x: '30%' }, { opacity: 1, scale: 1, x: '0%', ...t });
          break;
      }

      // Simulate a hover pulse on the color panel's active element
      // Skip on first load, and skip entirely if the color panel is already hovered
      if (!isFirstLoad && !isHoveringRef.current) {
        const active = showText ? textRef.current : circleRef.current;
        if (active) {
          const pulseHalf = hover.navPulseDuration / 2;
          gsap.timeline()
            .to(active, { scale: hover.navPulseScale, duration: pulseHalf, ease: hover.ease, overwrite: true })
            .to(active, { scale: 1, duration: pulseHalf, ease: hover.ease });
        }
      }
    }, [photo, showText]);

    const handleEnter = useCallback(() => {
      isHoveringRef.current = true;
      const active = showText ? textRef.current : circleRef.current;
      if (!active) return;
      const { hover } = getMotionParams();
      gsap.to(active, { scale: hover.scale, duration: hover.duration, ease: hover.ease, overwrite: true });
    }, [showText]);

    const handleLeave = useCallback(() => {
      isHoveringRef.current = false;
      const active = showText ? textRef.current : circleRef.current;
      if (!active) return;
      const { hover } = getMotionParams();
      gsap.to(active, { scale: 1, duration: hover.duration, ease: hover.ease, overwrite: true });
    }, [showText]);

    const handleClick = useCallback(() => {
      const text = textRef.current;
      const circle = circleRef.current;
      if (!text || !circle) return;

      const active = showText ? text : circle;
      const incoming = showText ? circle : text;
      const { hover, click } = getMotionParams();
      // If the mouse is still over the panel, land in the hovered state
      const incomingScale = isHoveringRef.current ? hover.scale : 1;

      gsap.to(active, { scale: 0, opacity: 0, duration: click.duration, ease: click.ease, overwrite: true });
      gsap.fromTo(incoming,
        { scale: 0, opacity: 0 },
        { scale: incomingScale, opacity: 1, duration: click.duration, ease: click.ease, overwrite: true }
      );

      setShowText(!showText);
    }, [showText]);

    return (
      <div ref={ref} className="relative w-full h-full overflow-hidden flex flex-col sm:flex-row">
        {/* Color panel */}
        <div
          ref={colorRef}
          className="w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center relative cursor-pointer select-none z-10"
          style={{ backgroundColor: bgHex, containerType: 'size' }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onClick={handleClick}
        >
          <span
            ref={textRef}
            className="absolute text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] leading-[1] tracking-tight select-none"
            style={{
              color: fgHex,
              fontFamily: "'Instrument Serif', serif",
            }}
          >
            Aa
          </span>

          <div
            ref={circleRef}
            className="absolute"
            style={{ opacity: 0, transform: 'scale(0)' }}
          >
            <svg viewBox="0 0 100 100" className="w-[50cqh] h-[50cqh] sm:w-[20vh] sm:h-[20vh]">
              <circle cx="50" cy="50" r="50" fill={fgHex} />
            </svg>
          </div>
        </div>

        {/* Photo panel — tap to open native file picker (photo library / camera on mobile).
            Also supports drag-and-drop of image files on desktop. */}
        <div
          className="w-full h-1/2 sm:w-1/2 sm:h-full relative overflow-hidden cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              setIsDraggingOver(true);
            }
          }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDragLeave={(e) => {
            // Only clear if leaving the panel entirely (not crossing children)
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDraggingOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            const file = Array.from(e.dataTransfer.files).find((f) =>
              f.type.startsWith('image/')
            );
            if (file) onPhotoFileSelected?.(file);
          }}
        >
          {/* Hidden file input — iOS shows Photo Library / Take Photo / Choose File */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhotoFileSelected?.(file);
              e.target.value = '';
            }}
          />

          {/* Transitioning image layer (scale/blur/etc. happens here).
              On drag-over: scales down to 0.75 and picks up a 1px dashed
              border that shrinks with it. */}
          <div
            ref={photoContainerRef}
            className="absolute inset-0"
            style={{
              transform: isDraggingOver ? 'scale(0.9)' : 'scale(1)',
              transformOrigin: 'center center',
              transition:
                'transform 150ms cubic-bezier(0.33,1,0.68,1), outline-color 150ms linear',
              outline: '1px dashed rgba(255,255,255,0.6)',
              outlineOffset: '-1px',
              outlineColor: isDraggingOver
                ? 'rgba(255,255,255,0.6)'
                : 'rgba(255,255,255,0)',
            }}
          >
            {photo && (
              <>
                <img src={photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                <img src={photo.url} alt={photo.alt} className="absolute inset-0 w-full h-full object-cover" />
              </>
            )}
          </div>

          {/* Bottom-left text — three discrete states stacked in the same slot.
              Each is its own persistent TubeText. Only the active state holds
              its real string; the inactive ones hold '', so state transitions
              trigger each TubeText's char rotate-out / rotate-in naturally. */}
          {photo && (() => {
            const isUpload = photo.id.startsWith('upload-');
            const state: 'credit' | 'filename' | 'drag' = isDraggingOver
              ? 'drag'
              : isUpload
                ? 'filename'
                : 'credit';
            const rowBase =
              'text-white/70 text-[10px] font-mono drop-shadow-sm';
            return (
              <div
                className="absolute bottom-3 left-4 right-3 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <div className={rowBase}>
                    <TubeText
                      text={state === 'credit' ? `Unsplash / ${photo.photographer}` : ''}
                    />
                  </div>
                  <div className={`${rowBase} absolute inset-0`}>
                    <TubeText text={state === 'filename' ? photo.alt : ''} />
                  </div>
                  <div className={`${rowBase} absolute inset-0`}>
                    <TubeText text={state === 'drag' ? 'DRAG AND DROP TO ADD PHOTO' : ''} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }
);

StripTransition.displayName = 'StripTransition';
