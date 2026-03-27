'use client';

// TubeText — 3D rotating text transition using GSAP SplitText
// Single span, managed entirely by GSAP. On text change:
// current chars rotate out (0→90°X), new chars rotate in (-90°→0°X)
// with per-character stagger.

import { useRef, useLayoutEffect, useCallback } from 'react';
import { gsap, SplitText } from '@/lib/gsap-config';

interface TubeTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export function TubeText({ text, className, style }: TubeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const prevTextRef = useRef(text);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const mountedRef = useRef(false);

  // Set initial text on mount (not via React children)
  const setRef = useCallback((el: HTMLSpanElement | null) => {
    textRef.current = el;
    if (el && !mountedRef.current) {
      el.textContent = text;
      mountedRef.current = true;
    }
  }, []); // intentionally stable — only runs on mount

  useLayoutEffect(() => {
    const prev = prevTextRef.current;
    if (prev === text) return;
    prevTextRef.current = text;

    const el = textRef.current;
    const container = containerRef.current;
    if (!el || !container) return;

    // Kill any in-progress animation
    if (tlRef.current) {
      tlRef.current.kill();
      tlRef.current = null;
    }

    // Split current text into chars
    const splitOut = new SplitText(el, { type: 'chars' });
    const outChars = [...splitOut.chars];

    const depth = -container.offsetWidth / 6;
    const transformOrigin = `50% 50% ${depth}px`;
    const dur = 0.1;
    const stagger = 0.01;

    gsap.set(container, { perspective: 300 });
    gsap.set(el, { transformStyle: 'preserve-3d' });

    // Capture current width for smooth transition
    const currentWidth = container.offsetWidth;

    const tl = gsap.timeline();
    tlRef.current = tl;

    tl
      // Phase 1: rotate out current chars
      .to(outChars, {
        rotationX: 90,
        autoAlpha: 0,
        stagger,
        duration: dur,
        ease: 'power2.in',
        transformOrigin,
      })
      // Phase 2: swap text, measure new width, animate width + rotate in
      .call(() => {
        splitOut.revert();
        el.textContent = text;

        // Measure new width, then animate from old to new
        const newWidth = container.scrollWidth;
        if (currentWidth !== newWidth) {
          gsap.fromTo(container,
            { width: currentWidth },
            { width: newWidth, duration: dur * 2, ease: 'power2.out', onComplete: () => { gsap.set(container, { width: 'auto' }); } }
          );
        }

        const splitIn = new SplitText(el, { type: 'chars' });
        gsap.set(el, { transformStyle: 'preserve-3d' });
        gsap.set(splitIn.chars, { rotationX: -90, autoAlpha: 0 });

        gsap.to(splitIn.chars, {
          rotationX: 0,
          autoAlpha: 1,
          stagger,
          duration: dur,
          ease: 'power2.out',
          transformOrigin,
          onComplete: () => splitIn.revert(),
        });
      });

    return () => { tl.kill(); };
  }, [text]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className ?? ''}`} style={style}>
      <span ref={setRef} className="inline-block" />
    </div>
  );
}
