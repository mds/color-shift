'use client';

import opentype from 'opentype.js';

// Cache loaded fonts and their path data
const fontCache = new Map<string, opentype.Font>();
const pathCache = new Map<string, string>();

// Get TTF URL via our API route (server-side fetch with IE User-Agent to get TTF, not woff2)
async function getTtfUrl(fontName: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/font?family=${encodeURIComponent(fontName)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

// Load a font and cache it
async function loadFont(fontName: string): Promise<opentype.Font | null> {
  const cached = fontCache.get(fontName);
  if (cached) return cached;

  const url = await getTtfUrl(fontName);
  if (!url) return null;

  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn(`Font fetch failed for ${fontName}:`, res.status); return null; }
    const buffer = await res.arrayBuffer();
    const font = opentype.parse(buffer);
    fontCache.set(fontName, font);
    return font;
  } catch (err) {
    console.warn(`Font parse failed for ${fontName}:`, err);
    return null;
  }
}

// Get SVG path data for "Aa" in a given font
export async function getLetterformPath(
  fontName: string,
  text: string = 'Aa',
  fontSize: number = 200,
): Promise<string | null> {
  const cacheKey = `${fontName}:${text}:${fontSize}`;
  const cached = pathCache.get(cacheKey);
  if (cached) return cached;

  const font = await loadFont(fontName);
  if (!font) return null;

  // Get the path — y position is the baseline
  const path = font.getPath(text, 0, fontSize * 0.8, fontSize);
  const pathData = path.toPathData(2); // 2 decimal precision

  pathCache.set(cacheKey, pathData);
  return pathData;
}

// Preload paths for multiple fonts
export async function preloadFontPaths(fontNames: string[], text: string = 'Aa', fontSize: number = 200): Promise<void> {
  await Promise.all(fontNames.map(name => getLetterformPath(name, text, fontSize)));
}
