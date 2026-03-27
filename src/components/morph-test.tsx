'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { getLetterformPath } from '@/lib/font-paths';
import { SPECIMEN_FONTS } from '@/lib/fonts';

gsap.registerPlugin(MorphSVGPlugin);

export function MorphTest() {
  const pathRef = useRef<SVGPathElement>(null);
  const [index, setIndex] = useState(0);

  const handleClick = () => {
    if (!pathRef.current) return;
    const nextIndex = (index + 1) % SPECIMEN_FONTS.length;
    const nextPath = getLetterformPath(SPECIMEN_FONTS[nextIndex]);
    if (!nextPath) return;

    gsap.to(pathRef.current, {
      morphSVG: nextPath,
      duration: 0.6,
      ease: 'power2.inOut',
    });

    setIndex(nextIndex);
  };

  const initialPath = getLetterformPath(SPECIMEN_FONTS[0]) ?? 'M0 0';

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer', padding: 20, background: '#222', display: 'inline-block' }}>
      <p style={{ color: '#888', marginBottom: 10, fontFamily: 'monospace', fontSize: 11 }}>
        Click to morph: {SPECIMEN_FONTS[index]}
      </p>
      <svg viewBox="-10 -10 420 200" width="300" height="150">
        <path ref={pathRef} d={initialPath} fill="#ff6b6b" />
      </svg>
    </div>
  );
}
