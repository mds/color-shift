'use client';

import fontPathData from './font-path-data.json';

const pathData = fontPathData as Record<string, string>;

// Get precomputed SVG path for "Aa" in a given font — instant, no fetching
export function getLetterformPath(fontName: string): string | null {
  return pathData[fontName] ?? null;
}

// No-op — paths are precomputed, nothing to preload
export function preloadFontPaths(): void {}
