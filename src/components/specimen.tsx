'use client';

import { forwardRef, type RefObject } from 'react';

interface SpecimenProps {
  bgHex: string;
  fgHex: string;
  text: string;
  onTextChange: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export const Specimen = forwardRef<HTMLDivElement, SpecimenProps>(
  ({ bgHex, fgHex, text, onTextChange, inputRef }, ref) => {
    return (
      <div
        ref={ref}
        className="flex-1 min-h-0 flex items-center justify-center relative select-none"
        style={{ backgroundColor: bgHex }}
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => onTextChange(e.target.value)}
          className="specimen-input bg-transparent border-none outline-none text-center w-full max-w-full px-8
            text-[80px] sm:text-[120px] md:text-[160px] lg:text-[200px]
            leading-none tracking-tight"
          style={{
            color: fgHex,
            caretColor: fgHex,
            fontFamily: 'var(--font-departure-mono), monospace',
          }}
          placeholder="Aa"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    );
  }
);

Specimen.displayName = 'Specimen';
