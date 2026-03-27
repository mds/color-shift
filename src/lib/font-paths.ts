'use client';

import fontPathData from './font-path-data.json';

interface FontContours {
  outers: string[];
  inners: string[];
  full: string;
}

const pathData = fontPathData as Record<string, FontContours>;

export function getFontContours(fontName: string): FontContours | null {
  return pathData[fontName] ?? null;
}

// Legacy — returns the full combined path
export function getLetterformPath(fontName: string): string | null {
  return pathData[fontName]?.full ?? null;
}
