'use client';

import { useRef, useEffect, useLayoutEffect, useState, forwardRef, useImperativeHandle, useCallback, type PointerEvent, type MouseEvent } from 'react';
import gsap from 'gsap';

// useLayoutEffect on the client (runs before paint, so the incoming photo is
// positioned off-screen before it can flash at rest), plain effect on the
// server to avoid the SSR warning.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
import type { PhotoData } from './control-strip';
import { TubeText } from './ui/tube-text';
import { RightArrowIcon, LeftArrowIcon } from './ui/icons';

interface StripTransitionProps {
  photo: PhotoData | null;
  /* The immediate neighbors, rendered flanking the current photo so a drag
     reveals them live (a connected filmstrip). */
  prevPhoto?: PhotoData | null;
  nextPhoto?: PhotoData | null;
  bgHex: string;
  fgHex: string;
  /* Neighbor bg colors, so the color panel can blend from the current bg
     toward the incoming one as the filmstrip slides. */
  prevBgHex?: string;
  nextBgHex?: string;
  /* Editable specimen text shown over the color panel. */
  specimenText: string;
  onSpecimenTextChange: (text: string) => void;
  onPhotoFileSelected?: (file: File) => void;
  embedded?: boolean;
  onPhotoAdvance?: () => void;
  onPhotoPrevious?: () => void;
}

// Imperative handle so sibling controls (the control-panel arrows) can drive
// the exact same filmstrip transition as the photo panel's own arrows / drag.
export interface StripHandle {
  next: () => void;
  prev: () => void;
}

export const StripTransition = forwardRef<StripHandle, StripTransitionProps>(
  ({ photo, prevPhoto, nextPhoto, bgHex, fgHex, prevBgHex, nextBgHex, specimenText, onSpecimenTextChange, onPhotoFileSelected, embedded = false, onPhotoAdvance, onPhotoPrevious }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLInputElement>(null);
    // The filmstrip track holding [prev, current, next], centered on the
    // middle slide (xPercent -100). Both drag and arrow drive this one el.
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const currentPhotoId = useRef<string | null>(null);
    const swipeStartRef = useRef<{ x: number; y: number; pointerId: number; didSwipe: boolean; width: number } | null>(null);
    const suppressClickRef = useRef(false);
    // True while a commit tween is playing, to reject re-entrant navigation.
    const animatingRef = useRef(false);

    // Ease background color + text/fill colors
    useEffect(() => {
      if (colorRef.current) {
        gsap.to(colorRef.current, { backgroundColor: bgHex, duration: 0.4, ease: 'power2.out', overwrite: true });
      }
      if (textRef.current) {
        gsap.to(textRef.current, { color: fgHex, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
      }
    }, [bgHex, fgHex]);

    // Filmstrip recenter. The track holds [prev, current, next] and rests
    // centered on the middle slide (xPercent -100). Whenever the current
    // photo changes — after a commit tween settles on a neighbor slot, the
    // parent swaps in the new current — this snaps the track back to center
    // BEFORE paint, so the just-revealed photo stays put and the loop reads
    // as one continuous strip. useIsoLayoutEffect (pre-paint) is what makes
    // the snap invisible.
    useIsoLayoutEffect(() => {
      if (!photo) return;
      if (photo.id === currentPhotoId.current) return;
      currentPhotoId.current = photo.id;
      const track = trackRef.current;
      if (track) gsap.set(track, { xPercent: -100, x: 0 });
      animatingRef.current = false;
    }, [photo]);

    // One shared motion path for both the arrow chips and a committed drag:
    // slide the track to the neighbor slot, then hand the change to the
    // parent (the recenter effect snaps back). Guarded on neighbor presence
    // and on an in-flight tween.
    const SLIDE_TWEEN = { duration: 0.5, ease: 'power3.inOut' as const };
    const animateToNeighbor = useCallback((dir: 'next' | 'prev') => {
      const track = trackRef.current;
      if (!track || animatingRef.current) return;
      if (dir === 'next' && !nextPhoto) return;
      if (dir === 'prev' && !prevPhoto) return;
      animatingRef.current = true;
      // Blend the color panel bg toward the incoming photo's bg in lockstep
      // with the slide (same duration/ease), so the color crossfades as the
      // photo travels.
      const targetBg = dir === 'next' ? nextBgHex : prevBgHex;
      if (colorRef.current && targetBg) {
        gsap.to(colorRef.current, { backgroundColor: targetBg, ...SLIDE_TWEEN, overwrite: true });
      }
      gsap.to(track, {
        xPercent: dir === 'next' ? -200 : 0,
        x: 0,
        ...SLIDE_TWEEN,
        overwrite: true,
        onComplete: () => { if (dir === 'next') onPhotoAdvance?.(); else onPhotoPrevious?.(); },
      });
    }, [nextPhoto, prevPhoto, nextBgHex, prevBgHex, onPhotoAdvance, onPhotoPrevious]);

    const snapCenter = useCallback(() => {
      const track = trackRef.current;
      if (track) gsap.to(track, { x: 0, ...SLIDE_TWEEN, overwrite: true });
      // Return the bg to the current photo's color if a partial drag nudged it.
      if (colorRef.current) gsap.to(colorRef.current, { backgroundColor: bgHex, ...SLIDE_TWEEN, overwrite: true });
    }, [bgHex]);

    useImperativeHandle(ref, () => ({
      next: () => animateToNeighbor('next'),
      prev: () => animateToNeighbor('prev'),
    }), [animateToNeighbor]);

    // Grab-and-slide the filmstrip: the track follows the pointer 1:1 (clamped
    // to one neighbor), then past 20% of the panel it commits via the same
    // animateToNeighbor path the arrows use; otherwise it snaps back.
    const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
      if (!event.isPrimary) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (animatingRef.current) return;
      const track = trackRef.current;
      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
        didSwipe: false,
        width: track ? track.offsetWidth : 1,
      };
      // Capture happens on drag intent (in move), not here: capturing on
      // down retargets the follow-up click to this root div in Chrome.
    }, []);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!start.didSwipe && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        start.didSwipe = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        if (event.pointerType === 'mouse') document.body.style.cursor = 'grabbing';
      }
      if (start.didSwipe) {
        event.preventDefault();
        const track = trackRef.current;
        if (!track) return;
        // 1:1 follow, clamped to a single neighbor; block dragging toward an
        // edge with no neighbor so the strip never pulls off into a gap.
        let d = dx;
        if (d < 0 && !nextPhoto) d = 0;
        if (d > 0 && !prevPhoto) d = 0;
        d = Math.max(-start.width, Math.min(start.width, d));
        gsap.set(track, { x: d });
        // Blend the color panel bg toward the neighbor by drag progress, so
        // the color tracks the photo live under the finger.
        const targetBg = d < 0 ? nextBgHex : d > 0 ? prevBgHex : null;
        if (colorRef.current && targetBg) {
          const progress = Math.min(Math.abs(d) / start.width, 1);
          gsap.set(colorRef.current, { backgroundColor: gsap.utils.interpolate(bgHex, targetBg, progress) });
        }
      }
    }, [nextPhoto, prevPhoto, nextBgHex, prevBgHex, bgHex]);

    const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      swipeStartRef.current = null;
      document.body.style.cursor = '';

      if (!start.didSwipe) return;
      suppressClickRef.current = true;

      const threshold = start.width * 0.2;
      if (dx <= -threshold && nextPhoto) animateToNeighbor('next');
      else if (dx >= threshold && prevPhoto) animateToNeighbor('prev');
      else snapCenter();
    }, [nextPhoto, prevPhoto, animateToNeighbor, snapCenter]);

    const handlePointerCancel = useCallback(() => {
      swipeStartRef.current = null;
      document.body.style.cursor = '';
      snapCenter();
    }, [snapCenter]);

    const suppressClickAfterSwipe = useCallback((event: MouseEvent<HTMLDivElement>) => {
      if (!suppressClickRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }, []);

    return (
      <div
        className="relative w-full h-full overflow-hidden flex flex-col sm:flex-row select-none"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={suppressClickAfterSwipe}
      >
        {/* Color panel — editable specimen text over the current bg. Only the
            text scales on press (the panel itself does not). Swap fg/bg lives
            in the control bar and on the "s" key. */}
        <div
          ref={colorRef}
          className="w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center relative z-10"
          style={{ backgroundColor: bgHex, containerType: 'size' }}
        >
          <input
            ref={textRef}
            type="text"
            value={specimenText}
            onChange={(e) => onSpecimenTextChange(e.target.value)}
            placeholder="Aa"
            spellCheck={false}
            autoComplete="off"
            aria-label="Specimen text"
            className="select-text bg-transparent border-none outline-none text-center w-full px-8 text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px] leading-[1] tracking-tight transition-transform duration-100 ease-out will-change-transform active:scale-[0.97]"
            style={{
              color: fgHex,
              caretColor: fgHex,
              fontFamily: "'Instrument Serif', serif",
            }}
          />
        </div>

        {/* Photo panel — the default interaction is navigation: a click (or
            the right chip) advances, the left chip goes back, and a horizontal
            drag scrubs the filmstrip. Standalone also accepts image files via
            drag-and-drop for a custom photo. */}
        <div
          className="group/photo w-full h-1/2 sm:w-1/2 sm:h-full relative overflow-hidden cursor-pointer"
          onClick={() => animateToNeighbor('next')}
          onDragEnter={(e) => {
            if (embedded) return;
            if (e.dataTransfer.types.includes('Files')) {
              e.preventDefault();
              setIsDraggingOver(true);
            }
          }}
          onDragOver={(e) => {
            if (embedded) return;
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
            if (embedded) return;
            e.preventDefault();
            setIsDraggingOver(false);
            const file = Array.from(e.dataTransfer.files).find((f) =>
              f.type.startsWith('image/')
            );
            if (file) onPhotoFileSelected?.(file);
          }}
        >
          {/* Filmstrip track — [prev, current, next] laid out side by side and
              resting centered on the middle slide (xPercent -100, set by the
              recenter effect). A drag moves it 1:1 so the neighbor is already
              in view; the arrows / a committed drag animate it to a neighbor
              slot, then the recenter snaps it back once the parent swaps the
              current photo. Keys are fixed slot names so React updates srcs in
              place rather than remounting, keeping the loop seamless. */}
          <div ref={trackRef} className="absolute inset-0 flex" style={{ willChange: 'transform', transform: 'translateX(-100%)' }}>
            {[
              { p: prevPhoto ?? null, k: 'slot-prev' },
              { p: photo, k: 'slot-cur' },
              { p: nextPhoto ?? null, k: 'slot-next' },
            ].map(({ p, k }) => (
              <div key={k} className="relative w-full h-full shrink-0 overflow-hidden">
                {p && (
                  <>
                    <img src={p.tinyUrl} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                    <img src={p.url} alt={p.alt} draggable={false} className="absolute inset-0 w-full h-full object-cover" />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Drag-over (file upload) affordance — a 1px dashed outline over the
              panel while an image file is dragged in (standalone only). */}
          {isDraggingOver && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10"
              style={{ outline: '1px dashed rgba(255,255,255,0.6)', outlineOffset: '-1px' }}
            />
          )}

          {/* Hover affordance — the default photo interaction is navigation:
              real prev / next chips pinned 16px off each edge (left goes back,
              right advances). Each stops propagation so the panel's own
              next-click does not double-fire. Hidden mid file-drag. */}
          <div
            className={`pointer-events-none absolute inset-0 z-10 hidden sm:block transition-opacity duration-150 ${isDraggingOver ? 'opacity-0' : 'opacity-0 group-hover/photo:opacity-100'}`}
          >
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); animateToNeighbor('prev'); }}
              className="pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-[4px] bg-[var(--cs-canvas)] text-white/90"
            >
              <LeftArrowIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); animateToNeighbor('next'); }}
              className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-[4px] bg-[var(--cs-canvas)] text-white/90"
            >
              <RightArrowIcon className="h-5 w-5" />
            </button>
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
