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
  /* Neighbor bg + fg colors, so the color panel and specimen text can blend
     from the current pair toward the incoming one as the filmstrip slides. */
  prevBgHex?: string;
  nextBgHex?: string;
  prevFgHex?: string;
  nextFgHex?: string;
  /* Editable specimen text shown over the color panel. */
  specimenText: string;
  onSpecimenTextChange: (text: string) => void;
  /* Fixed specimen font-size in px (embed param). When set, overrides the
     auto-fit and pins the text to this size. */
  fontSizePx?: number;
  /* Swap fg/bg — the color panel's click action (double-click edits text). */
  onSwap?: () => void;
  onPhotoFileSelected?: (file: File) => void;
  embedded?: boolean;
  /* Locked showcase: no editing, swapping, dragging, or nav arrows. */
  displayMode?: boolean;
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
  ({ photo, prevPhoto, nextPhoto, bgHex, fgHex, prevBgHex, nextBgHex, prevFgHex, nextFgHex, specimenText, onSpecimenTextChange, fontSizePx, onSwap, onPhotoFileSelected, embedded = false, displayMode = false, onPhotoAdvance, onPhotoPrevious }, ref) => {

    const colorRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    // The filmstrip track holding [prev, current, next], centered on the
    // middle slide (xPercent -100). Both drag and arrow drive this one el.
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    // Press feedback for the specimen text, set ONLY by a press on the color
    // panel background (the text stops propagation, so pressing the text
    // itself never triggers it).
    const [panelPressed, setPanelPressed] = useState(false);
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

    // Fit the specimen so wrapped text always stays inside the color panel:
    // the field is the panel width minus a 24px inner padding on each side,
    // lines wrap, and the font-size binary-searches down as the text grows
    // (and back up as it shrinks) to fit the panel's width and height.
    const fitText = useCallback(() => {
      const el = textRef.current;
      const panel = colorRef.current;
      if (!el || !panel) return;
      const availW = Math.max(0, panel.clientWidth - 48);
      el.style.width = `${availW}px`;
      // Embed override: pin to a fixed px size and skip the auto-fit.
      if (fontSizePx && fontSizePx > 0) { el.style.fontSize = `${fontSizePx}px`; return; }
      const availH = Math.max(0, panel.clientHeight - 48);
      let lo = 16, hi = 200, best = 16;
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (el.scrollWidth <= availW + 1 && el.scrollHeight <= availH) { best = mid; lo = mid; }
        else { hi = mid; }
      }
      el.style.fontSize = `${best}px`;
    }, [fontSizePx]);

    // Keep the contentEditable specimen in sync with state, but only write to
    // the DOM when it actually differs (e.g. restored from a URL) so typing
    // never fights React and the caret never jumps. Refit after any change.
    useEffect(() => {
      const el = textRef.current;
      if (el && el.textContent !== specimenText) el.textContent = specimenText;
      fitText();
    }, [specimenText, fitText]);

    // Refit when the panel resizes (viewport change, layout shift).
    useEffect(() => {
      const panel = colorRef.current;
      if (!panel) return;
      const ro = new ResizeObserver(() => fitText());
      ro.observe(panel);
      return () => ro.disconnect();
    }, [fitText]);

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
      // Blend the color panel bg and the specimen fg toward the incoming
      // photo's pair in lockstep with the slide (same duration/ease), so the
      // whole color pair crossfades as the photo travels.
      const targetBg = dir === 'next' ? nextBgHex : prevBgHex;
      const targetFg = dir === 'next' ? nextFgHex : prevFgHex;
      if (colorRef.current && targetBg) {
        gsap.to(colorRef.current, { backgroundColor: targetBg, ...SLIDE_TWEEN, overwrite: true });
      }
      if (textRef.current && targetFg) {
        gsap.to(textRef.current, { color: targetFg, ...SLIDE_TWEEN, overwrite: true });
      }
      gsap.to(track, {
        xPercent: dir === 'next' ? -200 : 0,
        x: 0,
        ...SLIDE_TWEEN,
        overwrite: true,
        onComplete: () => { if (dir === 'next') onPhotoAdvance?.(); else onPhotoPrevious?.(); },
      });
    }, [nextPhoto, prevPhoto, nextBgHex, prevBgHex, nextFgHex, prevFgHex, onPhotoAdvance, onPhotoPrevious]);

    const snapCenter = useCallback(() => {
      const track = trackRef.current;
      if (track) gsap.to(track, { x: 0, ...SLIDE_TWEEN, overwrite: true });
      // Return the pair to the current photo's colors if a partial drag nudged them.
      if (colorRef.current) gsap.to(colorRef.current, { backgroundColor: bgHex, ...SLIDE_TWEEN, overwrite: true });
      if (textRef.current) gsap.to(textRef.current, { color: fgHex, ...SLIDE_TWEEN, overwrite: true });
    }, [bgHex, fgHex]);

    useImperativeHandle(ref, () => ({
      next: () => animateToNeighbor('next'),
      prev: () => animateToNeighbor('prev'),
    }), [animateToNeighbor]);

    // Grab-and-slide the filmstrip: the track follows the pointer 1:1 (clamped
    // to one neighbor), then past 20% of the panel it commits via the same
    // animateToNeighbor path the arrows use; otherwise it snaps back.
    const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
      if (displayMode) return; // locked showcase: no drag navigation
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
    }, [displayMode]);

    const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
      const start = swipeStartRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!start.didSwipe && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        start.didSwipe = true;
        setPanelPressed(false); // a drag isn't a press
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
        // Blend the color panel bg and specimen fg toward the neighbor by drag
        // progress, so the whole pair tracks the photo live under the finger.
        const progress = Math.min(Math.abs(d) / start.width, 1);
        const targetBg = d < 0 ? nextBgHex : d > 0 ? prevBgHex : null;
        const targetFg = d < 0 ? nextFgHex : d > 0 ? prevFgHex : null;
        if (colorRef.current && targetBg) {
          gsap.set(colorRef.current, { backgroundColor: gsap.utils.interpolate(bgHex, targetBg, progress) });
        }
        if (textRef.current && targetFg) {
          gsap.set(textRef.current, { color: gsap.utils.interpolate(fgHex, targetFg, progress) });
        }
      }
    }, [nextPhoto, prevPhoto, nextBgHex, prevBgHex, nextFgHex, prevFgHex, bgHex, fgHex]);

    const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
      setPanelPressed(false);
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
      setPanelPressed(false);
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
        className="group/strip relative w-full h-full overflow-hidden flex flex-col sm:flex-row select-none"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={suppressClickAfterSwipe}
      >
        {/* Color panel — click the panel BACKGROUND to swap fg/bg; click the
            text itself to edit it (a contentEditable specimen sized to its own
            content, so there is always panel around it to click for a swap).
            The text scales on a panel press (group-active). */}
        <div
          ref={colorRef}
          className={`w-full h-1/2 sm:w-1/2 sm:h-full flex items-center justify-center relative z-10 ${displayMode ? '' : 'cursor-pointer'}`}
          style={{ backgroundColor: bgHex, containerType: 'size' }}
          onClick={() => { if (!displayMode) onSwap?.(); }}
          onPointerDown={() => { if (!displayMode) setPanelPressed(true); }}
          onPointerUp={() => setPanelPressed(false)}
          onPointerLeave={() => setPanelPressed(false)}
        >
          <span
            ref={textRef}
            contentEditable={!displayMode}
            suppressContentEditableWarning
            role="textbox"
            aria-label="Specimen text"
            spellCheck={false}
            onInput={(e) => onSpecimenTextChange(e.currentTarget.textContent ?? '')}
            onBlur={() => { if (!(textRef.current?.textContent ?? '').trim()) onSpecimenTextChange('Aa'); }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
            className={`block outline-none text-center break-words leading-[1.05] tracking-tight transition-transform duration-100 ease-out will-change-transform ${displayMode ? 'select-none pointer-events-none' : 'select-text cursor-text'} ${panelPressed ? 'scale-[0.97]' : ''}`}
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

        {/* Prev / next chips. On mobile they sit near the TOP of the photo (the
            bottom panel): 16px below its top edge, at the far left and right,
            always visible. On desktop (side-by-side) they stay within the photo
            panel as before: the left chip at the photo panel's left edge (strip
            midpoint + 16px), the right at the far right, vertically centered and
            hover-revealed. Each stops propagation so the click drives
            navigation, not the panel underneath. Hidden in the locked showcase. */}
        {!displayMode && (
        <div
          className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-150 ${isDraggingOver ? 'opacity-0' : 'opacity-100 sm:opacity-0 sm:group-hover/strip:opacity-100'}`}
        >
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => { e.stopPropagation(); animateToNeighbor('prev'); }}
            className="pointer-events-auto absolute left-4 sm:left-[calc(50%+1rem)] top-[calc(50%+1rem)] translate-y-0 sm:top-1/2 sm:-translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-[4px] bg-[var(--cs-canvas)] text-white/90"
          >
            <LeftArrowIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => { e.stopPropagation(); animateToNeighbor('next'); }}
            className="pointer-events-auto absolute right-4 top-[calc(50%+1rem)] translate-y-0 sm:top-1/2 sm:-translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-[4px] bg-[var(--cs-canvas)] text-white/90"
          >
            <RightArrowIcon className="h-5 w-5" />
          </button>
        </div>
        )}
      </div>
    );
  }
);

StripTransition.displayName = 'StripTransition';
