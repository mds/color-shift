import { parse, formatHex, converter } from 'culori';

// ── Types ──────────────────────────────────────────────────────────────

export type ColorFormat = 'HEX' | 'RGB' | 'HSL' | 'HSB' | 'OKLCH';
export type SliderMode = 'HSB' | 'OKLCH';

export interface HSB {
  h: number; // 0–360
  s: number; // 0–100
  b: number; // 0–100
}

export interface OklchValues {
  l: number; // 0–100 (percentage)
  c: number; // 0–0.4 (raw chroma)
  h: number; // 0–360
}

export interface ColorData {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  hsb: HSB;
  oklch: { l: number; c: number; h: number };
}

// ── Converters ─────────────────────────────────────────────────────────

const toOklch = converter('oklch');
const toHsv = converter('hsv');
const toRgb = converter('rgb');
const toHsl = converter('hsl');

// ── Hex → ColorData ────────────────────────────────────────────────────

export function hexToColorData(hex: string): ColorData {
  const parsed = parse(hex);
  if (!parsed) {
    return hexToColorData('#000000');
  }

  const rgbC = toRgb(parsed);
  const hslC = toHsl(parsed);
  const hsvC = toHsv(parsed);
  const oklchC = toOklch(parsed);

  return {
    hex: formatHex(parsed) ?? hex,
    rgb: {
      r: Math.round((rgbC?.r ?? 0) * 255),
      g: Math.round((rgbC?.g ?? 0) * 255),
      b: Math.round((rgbC?.b ?? 0) * 255),
    },
    hsl: {
      h: Math.round(hslC?.h ?? 0),
      s: Math.round((hslC?.s ?? 0) * 100),
      l: Math.round((hslC?.l ?? 0) * 100),
    },
    hsb: {
      h: Math.round(hsvC?.h ?? 0),
      s: Math.round((hsvC?.s ?? 0) * 100),
      b: Math.round((hsvC?.v ?? 0) * 100),
    },
    oklch: {
      l: Number(((oklchC?.l ?? 0) * 100).toFixed(1)),
      c: Number((oklchC?.c ?? 0).toFixed(3)),
      h: Math.round(oklchC?.h ?? 0),
    },
  };
}

// ── HSB → Hex ──────────────────────────────────────────────────────────

export function hsbToHex(hsb: HSB): string {
  const color = { mode: 'hsv' as const, h: hsb.h, s: hsb.s / 100, v: hsb.b / 100 };
  return formatHex(color) ?? '#000000';
}

// ── OKLCH → Hex ─────────────────────────────────────────────────────────

export function oklchToHex(oklch: OklchValues): string {
  const color = { mode: 'oklch' as const, l: oklch.l / 100, c: oklch.c, h: oklch.h };
  return formatHex(color) ?? '#000000';
}

// ── Max Chroma (binary search for sRGB gamut boundary) ──────────────────

export function maxChroma(l: number, h: number): number {
  // l is 0-100 percentage, h is 0-360 degrees
  // Binary search: find highest chroma where formatHex still produces a valid color
  // that doesn't clip to a different value
  const lNorm = l / 100;
  let lo = 0;
  let hi = 0.4; // OKLCH chroma theoretical max for sRGB is ~0.37
  let best = 0;

  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    const color = { mode: 'oklch' as const, l: lNorm, c: mid, h };
    const hex = formatHex(color);
    if (!hex) {
      hi = mid;
      continue;
    }

    // Check if the color round-trips cleanly (not clipped)
    const roundtrip = toOklch(parse(hex)!);
    if (!roundtrip) {
      hi = mid;
      continue;
    }

    const chromaDiff = Math.abs((roundtrip.c ?? 0) - mid);
    if (chromaDiff < 0.005) {
      // Color survived round-trip, it's in gamut
      best = mid;
      lo = mid;
    } else {
      // Color was clipped, reduce chroma
      hi = mid;
    }
  }

  return Number(best.toFixed(3));
}

// ── WCAG Contrast ──────────────────────────────────────────────────────

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const parsed = parse(hex);
  if (!parsed) return 0;
  const c = toRgb(parsed);
  return 0.2126 * linearize(c?.r ?? 0) + 0.7152 * linearize(c?.g ?? 0) + 0.0722 * linearize(c?.b ?? 0);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function wcagGrade(ratio: number): 'AAA' | 'AA' | 'AA+' | 'Fail' {
  if (ratio >= 7.0) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3.0) return 'AA+';
  return 'Fail';
}

export function gradeDescription(grade: string): string {
  switch (grade) {
    case 'AAA': return 'Valid for all text sizes';
    case 'AA': return 'Valid for normal text and above';
    case 'AA+': return 'Valid for large text only';
    case 'Fail': return 'Does not meet WCAG requirements';
    default: return '';
  }
}

// ── Random Generation (OKLCH + invisible harmony) ──────────────────────

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'random';

export function generateRandomPair(): { bg: string; fg: string } {
  const harmonies: HarmonyType[] = [
    'complementary', 'analogous', 'triadic', 'split-complementary', 'random',
  ];
  const harmony = harmonies[Math.floor(Math.random() * harmonies.length)];
  const baseHue = Math.random() * 360;

  let fgHue: number;
  switch (harmony) {
    case 'complementary':
      fgHue = (baseHue + 180 + (Math.random() * 20 - 10)) % 360;
      break;
    case 'analogous':
      fgHue = (baseHue + 30 + Math.random() * 30) % 360;
      break;
    case 'triadic':
      fgHue = (baseHue + 120 + (Math.random() * 20 - 10)) % 360;
      break;
    case 'split-complementary':
      fgHue = (baseHue + 150 + Math.random() * 60) % 360;
      break;
    default:
      fgHue = Math.random() * 360;
  }

  const bgIsDark = Math.random() > 0.5;

  const bgL = bgIsDark ? 0.1 + Math.random() * 0.3 : 0.7 + Math.random() * 0.25;
  const fgL = bgIsDark ? 0.6 + Math.random() * 0.35 : 0.1 + Math.random() * 0.35;
  const bgC = 0.02 + Math.random() * 0.15;
  const fgC = 0.05 + Math.random() * 0.2;

  const bgHex = formatHex({ mode: 'oklch' as const, l: bgL, c: bgC, h: baseHue });
  const fgHex = formatHex({ mode: 'oklch' as const, l: fgL, c: fgC, h: fgHue });

  return { bg: bgHex || '#1A1A2E', fg: fgHex || '#E8D5B7' };
}

// ── Threshold Bumping ──────────────────────────────────────────────────

const THRESHOLDS: number[] = [1.5, 3.0, 4.5, 7.0];

export function nearestThreshold(ratio: number): number {
  let nearest = THRESHOLDS[0];
  let minDiff = Math.abs(ratio - nearest);
  for (const t of THRESHOLDS) {
    const diff = Math.abs(ratio - t);
    if (diff < minDiff) { minDiff = diff; nearest = t; }
  }
  return nearest;
}

export function nextThresholdUp(ratio: number): number | null {
  return THRESHOLDS.find(t => t > ratio + 0.05) ?? null;
}

export function nextThresholdDown(ratio: number): number | null {
  return [...THRESHOLDS].reverse().find(t => t < ratio - 0.05) ?? null;
}

export function bumpToThreshold(bgHex: string, fgHex: string, targetRatio: number): string {
  const bgLum = relativeLuminance(bgHex);
  const fgParsed = parse(fgHex);
  if (!fgParsed) return fgHex;

  const fgOklch = toOklch(fgParsed);
  if (!fgOklch) return fgHex;

  const fgLum = relativeLuminance(fgHex);
  const fgIsLighter = fgLum >= bgLum;

  let lo = 0;
  let hi = 1;
  let bestHex = fgHex;
  let bestDiff = Infinity;

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const testHex = formatHex({
      mode: 'oklch' as const,
      l: mid,
      c: fgOklch.c ?? 0,
      h: fgOklch.h ?? 0,
    });
    if (!testHex) {
      if (fgIsLighter) hi = mid; else lo = mid;
      continue;
    }

    const ratio = contrastRatio(bgHex, testHex);
    const diff = Math.abs(ratio - targetRatio);
    if (diff < bestDiff) { bestDiff = diff; bestHex = testHex; }
    if (diff < 0.05) break;

    if (fgIsLighter) {
      if (ratio < targetRatio) lo = mid; else hi = mid;
    } else {
      if (ratio < targetRatio) hi = mid; else lo = mid;
    }
  }
  return bestHex;
}

// ── Format Display ─────────────────────────────────────────────────────

export function formatColorValue(data: ColorData, format: ColorFormat): string {
  switch (format) {
    case 'HEX': return data.hex.toUpperCase();
    case 'RGB': return `${data.rgb.r}, ${data.rgb.g}, ${data.rgb.b}`;
    case 'HSL': return `${data.hsl.h}°, ${data.hsl.s}%, ${data.hsl.l}%`;
    case 'HSB': return `${data.hsb.h}°, ${data.hsb.s}%, ${data.hsb.b}%`;
    case 'OKLCH': return `${data.oklch.l}% ${data.oklch.c} ${data.oklch.h}°`;
    default: return data.hex;
  }
}

// ── Export ──────────────────────────────────────────────────────────────

export function generateExportMarkdown(
  bg: ColorData, fg: ColorData, ratio: number, grade: string
): string {
  return `# Color Shift Export

## Background
- HEX: ${bg.hex.toUpperCase()}
- RGB: rgb(${bg.rgb.r}, ${bg.rgb.g}, ${bg.rgb.b})
- HSL: hsl(${bg.hsl.h}, ${bg.hsl.s}%, ${bg.hsl.l}%)
- HSB: hsb(${bg.hsb.h}, ${bg.hsb.s}%, ${bg.hsb.b}%)
- OKLCH: oklch(${bg.oklch.l}% ${bg.oklch.c} ${bg.oklch.h})

## Foreground
- HEX: ${fg.hex.toUpperCase()}
- RGB: rgb(${fg.rgb.r}, ${fg.rgb.g}, ${fg.rgb.b})
- HSL: hsl(${fg.hsl.h}, ${fg.hsl.s}%, ${fg.hsl.l}%)
- HSB: hsb(${fg.hsb.h}, ${fg.hsb.s}%, ${fg.hsb.b}%)
- OKLCH: oklch(${fg.oklch.l}% ${fg.oklch.c} ${fg.oklch.h})

## Contrast
- Ratio: ${ratio}:1
- Grade: ${grade}
- ${gradeDescription(grade)}
`;
}

// ── Parse Any Format ───────────────────────────────────────────────────

export function parseAnyColor(input: string): string | null {
  const hsbMatch = input.match(/hsb\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
  if (hsbMatch) {
    return hsbToHex({
      h: parseInt(hsbMatch[1]),
      s: parseInt(hsbMatch[2]),
      b: parseInt(hsbMatch[3]),
    });
  }

  let normalized = input.trim();
  if (/^[0-9a-fA-F]{3,8}$/.test(normalized)) {
    normalized = '#' + normalized;
  }

  const parsed = parse(normalized);
  return parsed ? (formatHex(parsed) ?? null) : null;
}
