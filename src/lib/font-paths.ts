'use client';

import opentype from 'opentype.js';

// Cache loaded fonts and their path data
const fontCache = new Map<string, opentype.Font>();
const pathCache = new Map<string, string>();

// Build Google Fonts URL for a single font (full file, not just Aa)
function getFontFileUrl(fontName: string): string {
  // Google Fonts CSS API returns the woff2 URL in the CSS.
  // We'll use the CSS API to get the actual font file URL.
  const encoded = fontName.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
}

// Fetch the actual woff2 URL from Google Fonts CSS
async function getWoff2Url(fontName: string): Promise<string | null> {
  try {
    const cssUrl = getFontFileUrl(fontName);
    const res = await fetch(cssUrl);
    const css = await res.text();
    // Extract woff2 URL from the CSS
    const match = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Load a font and cache it
async function loadFont(fontName: string): Promise<opentype.Font | null> {
  const cached = fontCache.get(fontName);
  if (cached) return cached;

  const url = await getWoff2Url(fontName);
  if (!url) return null;

  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const font = opentype.parse(buffer);
    fontCache.set(fontName, font);
    return font;
  } catch {
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
