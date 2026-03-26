'use client';

import { type RefObject } from 'react';

interface SpecimenProps {
  bgHex: string;
  fgHex: string;
  text: string;
  onTextChange: (text: string) => void;
  transition: string;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function Specimen({ bgHex, fgHex, text, onTextChange, transition, inputRef }: SpecimenProps) {
  return (
    <div
      className="flex-[7] sm:flex-[6] min-h-0 flex items-center justify-center relative select-none"
      style={{
        backgroundColor: bgHex,
        transition,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={e => onTextChange(e.target.value)}
        className="specimen-input font-specimen bg-transparent border-none outline-none text-center w-full max-w-full px-8
          text-[120px] sm:text-[160px] md:text-[200px] lg:text-[240px] xl:text-[280px]
          leading-none tracking-tight"
        style={{
          color: fgHex,
          transition,
          caretColor: fgHex,
          fontFeatureSettings: '"calt" 1, "liga" 1',
        }}
        placeholder="Aa"
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
