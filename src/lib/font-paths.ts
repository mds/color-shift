'use client';

import fontPathData from './font-path-data.json';

interface FontGlyphs {
  A: string;
  a: string;
  full: string;
}

const pathData = fontPathData as Record<string, FontGlyphs>;

export function getFontGlyphs(fontName: string): FontGlyphs | null {
  return pathData[fontName] ?? null;
}

export function getLetterformPath(fontName: string): string | null {
  return pathData[fontName]?.full ?? null;
}
