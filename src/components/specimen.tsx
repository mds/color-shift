'use client';

import { forwardRef, type RefObject } from 'react';
import type { ContrastResult } from '@/lib/color-engine';

interface SpecimenProps {
  bgHex: string;
  fgHex: string;
  text: string;
  onTextChange: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  contrast: ContrastResult;
  onScoreClick?: () => void;
}

export const Specimen = forwardRef<HTMLDivElement, SpecimenProps>(
  ({ bgHex, fgHex, text, onTextChange, inputRef, contrast, onScoreClick }, ref) => {
    const gradeColor = contrast.grade === 'Fail'
      ? 'rgba(248,113,113,0.8)' // red-400
      : contrast.grade === 'AAA'
        ? 'rgba(52,211,153,0.8)' // emerald-400
        : 'rgba(252,211,77,0.8)'; // amber-300

    return (
      <div
        ref={ref}
        className="flex-1 min-h-0 flex flex-col items-center justify-center relative select-none"
        style={{ backgroundColor: bgHex }}
      >
        {/* Specimen text */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => onTextChange(e.target.value)}
          className="specimen-input font-specimen bg-transparent border-none outline-none text-center w-full max-w-full px-8
            text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px]
            leading-none tracking-tight"
          style={{
            color: fgHex,
            caretColor: fgHex,
            fontFeatureSettings: '"calt" 1, "liga" 1',
          }}
          placeholder="Aa"
          spellCheck={false}
          autoComplete="off"
        />

        {/* Score badge */}
        <button
          onClick={onScoreClick}
          className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors"
          style={{ backgroundColor: `${fgHex}15` }}
        >
          <span
            className="font-mono text-[13px] font-semibold"
            style={{ color: gradeColor }}
          >
            {contrast.grade}
          </span>
          <span
            data-score-label=""
            className="font-mono text-[12px] opacity-50"
            style={{ color: fgHex }}
          >
            {contrast.scoreLabel}
          </span>
        </button>
      </div>
    );
  }
);

Specimen.displayName = 'Specimen';
