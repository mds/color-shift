'use client';

import { useRef, useEffect, useState, forwardRef, useCallback, type PointerEvent, type MouseEvent } from 'react';
import gsap from 'gsap';
import type { PhotoData } from './control-strip';
import { TubeText } from './ui/tube-text';
import { PlusIcon } from './ui/icons';

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
  onSpecimenClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const StripTransition = forwardRef<HTMLDivElement, StripTransitionProps>(
  ({ photo, bgHex, fgHex, onPhotoFileSelected, onSpecimenClick, onSwipeLeft, onSwipeRight }, ref) => {

    const colorRef = useRef<HTMLButtonElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const photoContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const prevPhotoId = useRef<string | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number; pointerId: number; didSwipe: boolean } | null>(null);
    const suppressClickRef = useRef(false);

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
      prevPhotoId.current = photo.id;
      const el = photoContainerRef.current;
      if (!el) return;

      const { photo: p } = getMotionParams();
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
    }, [photo]);

    const handleSpecimenClick = useCallback(() => {
      onSpecimenClick?.();
    }, [onSpecimenClick]);

    // Grab-and-slide: the photo layer follows a horizontal drag (damped),
    // then commits past the threshold — RTL advances, LTR goes back — or
    // springs home. Works for mouse, pen, and touch alike.
    const DRAG_DAMPING = 0.35;
    const COMMIT_PX = 48;

    const springHome = useCallback(() => {
      const el = photoContainerRef.current;
      if (el) gsap.to(el, { x: 0, duration: 0.35, ease: 'power3.out', overwrite: true });
    }, []);

    const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        didSwipe: false,
      };
      // Capture happens on drag intent (in move), not here: capturing on
      // down retargets the follow-up click to this root div in Chrome,
      // which would break the photo panel's click-to-upload.
    }, []);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!start.didSwipe && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        start.didSwipe = true;
        event.preventDefault();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        if (event.pointerType === 'mouse') document.body.style.cursor = 'grabbing';
      }
      if (start.didSwipe) {
        const el = photoContainerRef.current;
        if (el) gsap.set(el, { x: dx * DRAG_DAMPING });
      }
    }, []);

    const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      swipeStartRef.current = null;
      document.body.style.cursor = '';

      if (!start.didSwipe) return;
      suppressClickRef.current = true;

      if (Math.abs(dx) >= COMMIT_PX) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
      // Spring home either way; a committed photo change overwrites this
      // with its own enter transition (all styles reset x).
      springHome();
    }, [onSwipeLeft, onSwipeRight, springHome]);

    const handlePointerCancel = useCallback(() => {
      swipeStartRef.current = null;
      document.body.style.cursor = '';
      springHome();
    }, [springHome]);

    const suppressClickAfterSwipe = useCallback((event: MouseEvent<HTMLDivElement>) => {
      if (!suppressClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }, []);

    return (
      <div
        ref={ref}
        className="relative w-full h-full overflow-hidden flex flex-col sm:flex-row select-none"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={suppressClickAfterSwipe}
      >
        {/* Color panel */}
        <button
          type="button"
          ref={colorRef}
          className="color-panel group w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center relative select-none z-10 cursor-pointer border-0 p-0 text-center outline-none focus-visible:ring-2 focus-visible:ring-white/35 focus-visible:ring-inset"
          aria-label="Swap foreground and background colors"
          style={{ backgroundColor: bgHex, containerType: 'size' }}
          onClick={handleSpecimenClick}
        >
          <span
            ref={textRef}
            className="absolute text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] leading-[1] tracking-tight select-none transition-transform duration-100 ease-out will-change-transform group-hover:scale-[1.03] group-active:scale-[0.97]"
            style={{
              color: fgHex,
              fontFamily: "'Instrument Serif', serif",
            }}
          >
            Aa
          </span>
        </button>

        {/* Photo panel — tap to open native file picker (photo library / camera on mobile).
            Also supports drag-and-drop of image files on desktop. */}
        <div
          className="group/photo w-full h-1/2 sm:w-1/2 sm:h-full relative overflow-hidden cursor-pointer"
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
                <img src={photo.tinyUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                <img src={photo.url} alt={photo.alt} draggable={false} className="absolute inset-0 w-full h-full object-cover" />
              </>
            )}
          </div>

          {/* Hover affordance (MDS 2026-07-06): the whole panel has always
              been click-to-upload, but nothing signaled it to a mouse user.
              A centered (+) fades in on hover (hidden mid-drag, where the
              dashed outline + caption take over). pointer-events-none so
              the click still lands on the panel itself. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-10 hidden sm:flex items-center justify-center transition-opacity duration-150 ${isDraggingOver ? 'opacity-0' : 'opacity-0 group-hover/photo:opacity-100'}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f0e0f] text-white/90">
              <PlusIcon className="h-5 w-5" />
            </span>
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
