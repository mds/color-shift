'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import fontPaths from '@/lib/font-path-data.json';

gsap.registerPlugin(MorphSVGPlugin);

const fonts = Object.keys(fontPaths) as (keyof typeof fontPaths)[];

export function MorphTest() {
  const pathRef = useRef<SVGPathElement>(null);
  const [index, setIndex] = useState(0);

  const handleClick = () => {
    if (!pathRef.current) return;
    const nextIndex = (index + 1) % fonts.length;
    const nextPath = fontPaths[fonts[nextIndex]];

    gsap.to(pathRef.current, {
      morphSVG: nextPath,
      duration: 0.6,
      ease: 'power2.inOut',
    });

    setIndex(nextIndex);
  };

  const currentFont = fonts[index];

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer', padding: 20, background: '#222', display: 'inline-block' }}>
      <p style={{ color: '#888', marginBottom: 10, fontFamily: 'monospace', fontSize: 11 }}>
        Click to morph: {currentFont}
      </p>
      <svg viewBox="-10 -10 420 200" width="300" height="150">
        <path ref={pathRef} d={fontPaths[fonts[0]]} fill="#ff6b6b" />
      </svg>
    </div>
  );
}
