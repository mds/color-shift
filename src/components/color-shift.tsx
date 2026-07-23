'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useDialKit } from 'dialkit';
import { gsap } from '@/lib/gsap-config';
import {
  hexToColorData,
  hsbToHex,
  oklchToHex,
  rgbToHex,
  maxChroma,
  isHexDark,
  getContrastResult,
  bumpToThreshold,
  nearestThreshold,
  nextThresholdUp,
  nextThresholdDown,
  generateExportMarkdown,
  parseAnyColor,
  extractContrastPair,
  type ColorFormat,
  type SliderMode,
  type ContrastAlgorithm,
  type HSB,
  type OklchValues,
  type VibrantPalette,
} from '@/lib/color-engine';
import type { PhotoData } from './control-strip';
import { StripTransition, type StripHandle } from './strip-transition';
import { getFontForPhoto } from '@/lib/fonts';
import { ControlContainer, MobileTopBar, MobileBottomBar } from './ui/control-container';

interface PhotoColors { bg: string; fg: string; }

const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/color-shift';

function appPath(path: string): string {
  return `${APP_BASE_PATH}${path}`;
}

// ── Pure color-space converters (module scope, no closures) ──

type ColorData = ReturnType<typeof hexToColorData>;
type SliderConfig = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  gradients: { oklch: string; hsb: string; rgb: string };
  trackDark: boolean;
};

function normalizeHexParam(value: string | null): string | null {
  if (!value) return null;
  const parsed = parseAnyColor(value);
  return parsed && /^#[0-9a-f]{6}$/i.test(parsed) ? parsed : null;
}

function normalizeAlgorithmParam(value: string | null): ContrastAlgorithm {
  return value?.toLowerCase() === 'apca' ? 'APCA' : 'WCAG2';
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Copy text to the clipboard. Tries the async Clipboard API first, then falls
// back to a temporary textarea + execCommand('copy') — the async API is
// blocked in cross-origin iframes without allow="clipboard-write", whereas
// the legacy path works as long as it runs in a user gesture.
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function colorToPercent(cd: ColorData, mode: SliderMode): [number, number, number] {
  if (mode === 'OKLCH') {
    const mc = Math.max(maxChroma(cd.oklch.l, cd.oklch.h), cd.oklch.c, 0.001);
    return [cd.oklch.l, (cd.oklch.c / mc) * 100, (cd.oklch.h / 360) * 100];
  }
  if (mode === 'HSB') return [(cd.hsb.h / 360) * 100, cd.hsb.s, cd.hsb.b];
  return [(cd.rgb.r / 255) * 100, (cd.rgb.g / 255) * 100, (cd.rgb.b / 255) * 100];
}

function percentToActual(pct: [number, number, number], mode: SliderMode, cd: ColorData) {
  if (mode === 'OKLCH') {
    const l = pct[0];
    const mc = Math.max(maxChroma(l, cd.oklch.h), cd.oklch.c, 0.001);
    const c = (pct[1] / 100) * mc;
    const h = (pct[2] / 100) * 360;
    return { values: [l, c, h] as [number, number, number], labels: ['L', 'C', 'H'], display: [l.toFixed(1), c.toFixed(3), Math.round(h).toString()] };
  }
  if (mode === 'HSB') {
    const h = (pct[0] / 100) * 360;
    const s = pct[1];
    const b = pct[2];
    return { values: [h, s, b] as [number, number, number], labels: ['H', 'S', 'B'], display: [Math.round(h).toString(), Math.round(s).toString(), Math.round(b).toString()] };
  }
  const r = (pct[0] / 100) * 255;
  const g = (pct[1] / 100) * 255;
  const b = (pct[2] / 100) * 255;
  return { values: [r, g, b] as [number, number, number], labels: ['R', 'G', 'B'], display: [Math.round(r).toString(), Math.round(g).toString(), Math.round(b).toString()] };
}

function actualToHex(values: [number, number, number], mode: SliderMode): string {
  if (mode === 'OKLCH') return oklchToHex({ l: values[0], c: values[1], h: values[2] });
  if (mode === 'HSB') return hsbToHex({ h: values[0], s: values[1], b: values[2] });
  return rgbToHex(Math.round(values[0]), Math.round(values[1]), Math.round(values[2]));
}

// Apply polarity preference: if lighterAsBg, put lighter color in bg slot
function applyPolarity(pair: PhotoColors, lighterAsBg: boolean): PhotoColors {
  const bgIsDark = isHexDark(pair.bg, 128);
  const fgIsDark = isHexDark(pair.fg, 128);
  // Only flip if the current arrangement doesn't match the preference
  if (lighterAsBg && bgIsDark && !fgIsDark) return { bg: pair.fg, fg: pair.bg };
  if (!lighterAsBg && !bgIsDark && fgIsDark) return { bg: pair.fg, fg: pair.bg };
  return pair;
}

function isTrackDark(start: string, end: string): boolean {
  return isHexDark(start, 40) || isHexDark(end, 40);
}

export function ColorShift() {
  // ── UI state ──
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sliderMode, setSliderMode] = useState<SliderMode>('OKLCH');
  const [contrastAlgorithm, setContrastAlgorithm] = useState<ContrastAlgorithm>('WCAG2');
  const [controlsState, setControlsState] = useState<'default' | 'score' | 'export'>('default');
  const [slidersExpanded, setSlidersExpanded] = useState(false);
  const [sliderTarget, setSliderTarget] = useState<'bg' | 'fg'>('bg');
  const [exportFeedback, setExportFeedback] = useState<'url' | 'params' | 'markdown' | null>(null);

  // ── Specimen text (editable "Aa" over the color panel) ──
  const [specimenText, setSpecimenText] = useState('Aa');
  // Fixed specimen font-size in px from ?size=NN (embed param); null = auto-fit.
  const [fixedFontSize, setFixedFontSize] = useState<number | null>(null);
  // Stacked card from ?layout=stacked (embed param): pins the color/photo
  // card to the vertical mobile arrangement at every viewport width.
  const [stackedLayout, setStackedLayout] = useState(false);

  // ── Photo state ──
  const [photoBuffer, setPhotoBuffer] = useState<PhotoData[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const isFetchingMore = useRef(false);
  const hasInitialLoad = useRef(false);

  // ── Navigation direction (for transition component) ──
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right'>('left');
  const prevIndexRef = useRef(0);

  // ── Color cache ──
  const [colorMap, setColorMap] = useState<Map<string, PhotoColors>>(new Map());
  const [manualColors, setManualColors] = useState<PhotoColors | null>(null);
  // Polarity preference: false = darker goes to bg (default), true = lighter goes to bg
  const [lighterAsBg, setLighterAsBg] = useState(false);
  const photoData = photoBuffer[photoIndex] ?? null;
  // Neighbors for the filmstrip — wrap around the buffer; null when there is
  // no distinct neighbor (buffer of one) so the strip clamps at that edge.
  const len = photoBuffer.length;
  const prevPhotoData = len > 1 ? photoBuffer[((photoIndex - 1) % len + len) % len] ?? null : null;
  const nextPhotoData = len > 1 ? photoBuffer[(photoIndex + 1) % len] ?? null : null;

  // ── Derive colors for current photo ──
  const getColorsForPhoto = useCallback((photo: PhotoData | null): PhotoColors => {
    if (!photo) return { bg: '#000000', fg: '#000000' };
    const cached = colorMap.get(photo.id);
    if (cached) return cached;
    const safeFg = bumpToThreshold(photo.color, '#FFFFFF', 4.5, 'WCAG2');
    return { bg: photo.color, fg: safeFg };
  }, [colorMap]);

  const colors = useMemo((): PhotoColors => {
    const base = manualColors ?? getColorsForPhoto(photoData);
    return applyPolarity(base, lighterAsBg);
  }, [photoData, manualColors, getColorsForPhoto, lighterAsBg]);

  // Neighbor bg colors so the color panel can blend toward the incoming photo
  // during a slide. Derived (no manual override) since only the current photo
  // carries manual color edits.
  const prevColors = useMemo(
    () => (prevPhotoData ? applyPolarity(getColorsForPhoto(prevPhotoData), lighterAsBg) : null),
    [prevPhotoData, getColorsForPhoto, lighterAsBg],
  );
  const nextColors = useMemo(
    () => (nextPhotoData ? applyPolarity(getColorsForPhoto(nextPhotoData), lighterAsBg) : null),
    [nextPhotoData, getColorsForPhoto, lighterAsBg],
  );

  const bgHex = colors.bg;
  const fgHex = colors.fg;
  const isReady = photoData !== null;

  const currentFont = photoData ? getFontForPhoto(photoData.id) : 'serif';

  useEffect(() => { setManualColors(null); }, [photoIndex]);

  // Sync Mobile Safari top chrome to bgHex via <meta name="theme-color">.
  // Safari ignores setAttribute updates on an existing theme-color meta,
  // so we remove and re-create the element on each change. The bottom tab
  // bar is translucent and blurs the dock — no meta needed there.
  useEffect(() => {
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.remove());
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('content', bgHex);
    document.head.appendChild(meta);
  }, [bgHex]);

  // ── Refs ──
  const isDraggingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // ── DialKit: Aa ↔ circle transition tuning ──
  const easeOptions = ['power1.out', 'power2.out', 'power3.out', 'power4.out', 'sine.out', 'expo.out', 'circ.out', 'back.out', 'elastic.out', 'bounce.out', 'linear'];

  // GSAP ease name → CSS cubic-bezier() for transition/animation properties
  const EASE_TO_CB: Record<string, string> = {
    'power1.out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    'power2.out': 'cubic-bezier(0.33, 1, 0.68, 1)',
    'power3.out': 'cubic-bezier(0.16, 1, 0.3, 1)',
    'power4.out': 'cubic-bezier(0.07, 1, 0.33, 1)',
    'sine.out':   'cubic-bezier(0.39, 0.575, 0.565, 1)',
    'expo.out':   'cubic-bezier(0.19, 1, 0.22, 1)',
    'circ.out':   'cubic-bezier(0.075, 0.82, 0.165, 1)',
    'back.out':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
    'linear':     'linear',
    'elastic.out': 'cubic-bezier(0.5, 1.5, 0.5, 1)',
    'bounce.out': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  const motionParams = useDialKit('Motion', {
    'color hover': {
      scale: [1.05, 1, 1.5, 0.01],
      duration: [1, 0, 1, 0.01],
      ease: { type: 'select' as const, options: easeOptions, default: 'power4.out' },
      navPulseScale: [1.01, 1, 1.5, 0.01],
      navPulseDuration: [0.4, 0, 1, 0.01],
    },
    'color click': {
      duration: [0.3, 0, 1, 0.01],
      ease: { type: 'select' as const, options: easeOptions, default: 'power4.out' },
    },
    'photo transition': {
      style: {
        type: 'select' as const,
        options: ['fade', 'zoom-in', 'zoom-out', 'blur', 'pixelate', 'slide', 'scale-fade'],
        default: 'fade',
      },
      startOpacity: [0, 0, 1, 0.01],
      startScale: [1.05, 0.5, 1.5, 0.01],
      duration: [1, 0, 2, 0.01],
      ease: { type: 'select' as const, options: easeOptions, default: 'power4.out' },
    },
    'control bar': {
      duration: [0.3, 0, 1, 0.01],
      ease: { type: 'select' as const, options: easeOptions, default: 'power4.out' },
    },
  });

  // Mirror DialKit values to a global object consumed by strip-transition
  useEffect(() => {
    const hover = motionParams['color hover'] as { scale: number; duration: number; ease: string; navPulseScale: number; navPulseDuration: number };
    const click = motionParams['color click'] as { duration: number; ease: string };
    const photo = motionParams['photo transition'] as { style: string; startOpacity: number; startScale: number; duration: number; ease: string };
    const controlBar = motionParams['control bar'] as { duration: number; ease: string };

    (window as unknown as { __motion?: unknown }).__motion = {
      hover: { scale: hover.scale, duration: hover.duration, ease: hover.ease, navPulseScale: hover.navPulseScale, navPulseDuration: hover.navPulseDuration },
      click: { duration: click.duration, ease: click.ease },
      photo: { style: photo.style, startOpacity: photo.startOpacity, startScale: photo.startScale, duration: photo.duration, ease: photo.ease },
      controlBar: { duration: controlBar.duration, ease: controlBar.ease },
    };

    // CSS vars for the control bar — used by Tailwind transition styles
    const root = document.documentElement;
    root.style.setProperty('--cb-duration', `${controlBar.duration}s`);
    root.style.setProperty('--cb-ease', EASE_TO_CB[controlBar.ease] ?? 'cubic-bezier(0.33, 1, 0.68, 1)');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motionParams]);
  const stripRef = useRef<StripHandle>(null);
  const preloadedImages = useRef<Set<HTMLImageElement>>(new Set());

  // ── Derived ──
  const bg = hexToColorData(bgHex);
  const fg = hexToColorData(fgHex);
  const contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm);
  const activeThreshold = nearestThreshold(contrast.score, contrastAlgorithm);

  // ── Photo fetching ──

  const fetchPhotos = useCallback(async (count: number): Promise<PhotoData[]> => {
    const res = await fetch(appPath(`/api/photos?count=${count}`));
    const data = await res.json();
    if (!res.ok || data.error) { console.warn('Photo API:', data.error); return []; }
    return data as PhotoData[];
  }, []);

  const fetchPhotoById = useCallback(async (id: string): Promise<PhotoData | null> => {
    const res = await fetch(appPath(`/api/photos?id=${encodeURIComponent(id)}`));
    const data = await res.json();
    if (!res.ok || data.error) { console.warn('Photo API:', data.error); return null; }
    return data as PhotoData;
  }, []);

  const MAX_PRELOADED = 20;
  const trackImage = useCallback((img: HTMLImageElement) => {
    preloadedImages.current.add(img);
    // Evict oldest when over limit
    if (preloadedImages.current.size > MAX_PRELOADED) {
      const first = preloadedImages.current.values().next().value;
      if (first) { first.src = ''; preloadedImages.current.delete(first); }
    }
  }, []);

  const preloadImages = useCallback((photos: PhotoData[]) => {
    photos.forEach(p => { const img = new Image(); img.src = p.url; trackImage(img); });
  }, [trackImage]);

  const preloadThumbs = useCallback((photos: PhotoData[]) => {
    photos.forEach(p => {
      const t = new Image(); t.src = p.tinyUrl; trackImage(t);
      const th = new Image(); th.src = p.thumbUrl; trackImage(th);
    });
  }, [trackImage]);

  const extractColorsFromPhoto = useCallback(async (
    photo: PhotoData,
    algorithm = contrastAlgorithm
  ): Promise<PhotoColors | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = photo.url;
      img.onload = async () => {
        try {
          const { Vibrant } = await import('node-vibrant/browser');
          const palette = await Vibrant.from(img).getPalette();
          const mapped: VibrantPalette = {
            Vibrant: palette.Vibrant ? { hex: palette.Vibrant.hex, population: palette.Vibrant.population } : null,
            DarkVibrant: palette.DarkVibrant ? { hex: palette.DarkVibrant.hex, population: palette.DarkVibrant.population } : null,
            LightVibrant: palette.LightVibrant ? { hex: palette.LightVibrant.hex, population: palette.LightVibrant.population } : null,
            Muted: palette.Muted ? { hex: palette.Muted.hex, population: palette.Muted.population } : null,
            DarkMuted: palette.DarkMuted ? { hex: palette.DarkMuted.hex, population: palette.DarkMuted.population } : null,
            LightMuted: palette.LightMuted ? { hex: palette.LightMuted.hex, population: palette.LightMuted.population } : null,
          };
          resolve(extractContrastPair(mapped, algorithm));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
    });
  }, [contrastAlgorithm]);

  const extractBatchColors = useCallback(async (photos: PhotoData[], algorithm = contrastAlgorithm) => {
    const toExtract = photos.filter(p => !colorMap.has(p.id));
    if (toExtract.length === 0) return;
    const batchSize = 5;
    for (let i = 0; i < toExtract.length; i += batchSize) {
      const batch = toExtract.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => extractColorsFromPhoto(p, algorithm).then(r => ({ id: p.id, colors: r }))));
      setColorMap(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const { id, colors: c } of results) {
          if (c && !next.has(id)) { next.set(id, c); changed = true; }
        }
        return changed ? next : prev;
      });
    }
  }, [colorMap, contrastAlgorithm, extractColorsFromPhoto]);

  const dedupePhotos = useCallback((existing: PhotoData[], incoming: PhotoData[]): PhotoData[] => {
    const ids = new Set(existing.map(p => p.id));
    return incoming.filter(p => !ids.has(p.id));
  }, []);

  const maybeRefill = useCallback(async (currentIdx: number, buffer: PhotoData[]) => {
    if (isFetchingMore.current) return;
    if (buffer.length - currentIdx - 1 <= 3) {
      isFetchingMore.current = true;
      const more = await fetchPhotos(10);
      const unique = dedupePhotos(buffer, more);
      if (unique.length > 0) {
        preloadThumbs(unique);
        preloadImages(unique.slice(0, 3));
        setPhotoBuffer(prev => [...prev, ...dedupePhotos(prev, unique)]);
        extractBatchColors(unique);
      }
      isFetchingMore.current = false;
    }
  }, [fetchPhotos, preloadImages, preloadThumbs, dedupePhotos, extractBatchColors]);

  const loadPhotos = useCallback(async () => {
    setIsPhotoLoading(true);
    const params = new URLSearchParams(window.location.search);
    const linkedPhotoId = params.get('photo')?.trim() || null;
    const linkedBg = normalizeHexParam(params.get('bg'));
    const linkedFg = normalizeHexParam(params.get('fg'));
    const linkedAlgorithm = normalizeAlgorithmParam(params.get('algo'));
    const linkedText = params.get('text');
    if (linkedText) setSpecimenText(linkedText);
    const linkedSize = Number.parseInt(params.get('size') ?? '', 10);
    if (Number.isFinite(linkedSize) && linkedSize > 0) setFixedFontSize(linkedSize);
    setLighterAsBg(params.get('swap') === '1');
    const linkedPhoto = linkedPhotoId ? await fetchPhotoById(linkedPhotoId) : null;
    const randomPhotos = await fetchPhotos(linkedPhoto ? 9 : 10);
    const photos = linkedPhoto
      ? [linkedPhoto, ...dedupePhotos([linkedPhoto], randomPhotos)]
      : randomPhotos;
    if (photos.length === 0) { setIsPhotoLoading(false); return; }
    preloadThumbs(photos);
    preloadImages(photos.slice(0, 3));
    setContrastAlgorithm(linkedAlgorithm);
    setPhotoBuffer(photos);
    setPhotoIndex(0);
    setManualColors(linkedBg && linkedFg ? { bg: linkedBg, fg: linkedFg } : null);
    setIsPhotoLoading(false);
    extractBatchColors(photos, linkedAlgorithm);
  }, [fetchPhotoById, fetchPhotos, preloadImages, preloadThumbs, extractBatchColors, dedupePhotos]);

  useEffect(() => {
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;
    loadPhotos();
  }, [loadPhotos]);

  // ── Navigation — triggers strip transition ──

  const navigateTo = useCallback((newIndex: number) => {
    if (photoBuffer.length === 0) return;
    // Wrap around at either end: -1 → last, length → 0
    const wrapped = ((newIndex % photoBuffer.length) + photoBuffer.length) % photoBuffer.length;
    if (wrapped === photoIndex) return;
    setTransitionDirection(wrapped > photoIndex ? 'left' : 'right');
    prevIndexRef.current = photoIndex;
    setPhotoIndex(wrapped);
    maybeRefill(wrapped, photoBuffer);
    preloadImages(photoBuffer.slice(wrapped + 1, wrapped + 3));
  }, [photoIndex, photoBuffer, maybeRefill, preloadImages]);

  // Inject photo
  const injectPhoto = useCallback(async () => {
    const photos = await fetchPhotos(1);
    if (photos.length === 0) return;
    const newPhoto = photos[0];
    preloadThumbs([newPhoto]);
    preloadImages([newPhoto]);
    extractBatchColors([newPhoto]);
    const insertAt = photoIndex + 1;
    setPhotoBuffer(prev => {
      const next = [...prev];
      next.splice(insertAt, 0, newPhoto);
      return next;
    });
    // Navigate to the injected photo
    setPhotoIndex(insertAt);
  }, [fetchPhotos, preloadThumbs, preloadImages, extractBatchColors, photoIndex]);

  // Inject a user-uploaded photo (from file picker or camera capture)
  const injectPhotoFromFile = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const newPhoto: PhotoData = {
      id: `upload-${Date.now()}-${file.name}`,
      url: objectUrl,
      thumbUrl: objectUrl,
      tinyUrl: objectUrl,
      color: '#000000',
      photographer: 'You',
      photographerUrl: '#',
      photoUrl: '#',
      alt: file.name,
    };
    preloadImages([newPhoto]);
    extractBatchColors([newPhoto]);
    const insertAt = photoIndex + 1;
    setPhotoBuffer(prev => {
      const next = [...prev];
      next.splice(insertAt, 0, newPhoto);
      return next;
    });
    setPhotoIndex(insertAt);
  }, [preloadImages, extractBatchColors, photoIndex]);

  // ── Manual color manipulation ──

  const setManualBg = useCallback((newBg: string) => {
    setManualColors(prev => ({ bg: newBg, fg: prev?.fg ?? fgHex }));
  }, [fgHex]);

  const setManualFg = useCallback((newFg: string) => {
    setManualColors(prev => ({ bg: prev?.bg ?? bgHex, fg: newFg }));
  }, [bgHex]);

  const swap = useCallback(() => {
    // Directly swap the currently-rendered colors as a manual override.
    // This guarantees a visible flip even when both extracted colors
    // are similarly toned (e.g., user-uploaded photos where polarity
    // alone wouldn't trigger a swap in applyPolarity).
    setManualColors({ bg: fgHex, fg: bgHex });
    setLighterAsBg(v => !v);
  }, [bgHex, fgHex]);
  const updateBgHsb = useCallback((hsb: HSB) => setManualBg(hsbToHex(hsb)), [setManualBg]);
  const updateFgHsb = useCallback((hsb: HSB) => setManualFg(hsbToHex(hsb)), [setManualFg]);
  const updateBgOklch = useCallback((oklch: OklchValues) => setManualBg(oklchToHex(oklch)), [setManualBg]);
  const updateFgOklch = useCallback((oklch: OklchValues) => setManualFg(oklchToHex(oklch)), [setManualFg]);
  const handleBgInput = useCallback((v: string) => { const h = parseAnyColor(v); if (h) setManualBg(h); }, [setManualBg]);
  const handleFgInput = useCallback((v: string) => { const h = parseAnyColor(v); if (h) setManualFg(h); }, [setManualFg]);

  const bumpUp = useCallback(() => {
    const t = nextThresholdUp(contrast.score, contrastAlgorithm);
    if (t) setManualFg(bumpToThreshold(bgHex, fgHex, t, contrastAlgorithm));
  }, [bgHex, fgHex, contrast.score, contrastAlgorithm, setManualFg]);

  const bumpDown = useCallback(() => {
    const t = nextThresholdDown(contrast.score, contrastAlgorithm);
    if (t) setManualFg(bumpToThreshold(bgHex, fgHex, t, contrastAlgorithm));
  }, [bgHex, fgHex, contrast.score, contrastAlgorithm, setManualFg]);

  const bumpTo = useCallback((t: number) => {
    const target = slidersExpanded ? sliderTarget : 'fg';
    if (target === 'bg') {
      setManualBg(bumpToThreshold(fgHex, bgHex, t, contrastAlgorithm));
    } else {
      setManualFg(bumpToThreshold(bgHex, fgHex, t, contrastAlgorithm));
    }
  }, [bgHex, fgHex, contrastAlgorithm, setManualBg, setManualFg, slidersExpanded, sliderTarget]);

  const toggleSliderMode = useCallback(() => setSliderMode(m => m === 'HSB' ? 'OKLCH' : 'HSB'), []);
  const toggleContrastAlgorithm = useCallback(() => setContrastAlgorithm(a => a === 'WCAG2' ? 'APCA' : 'WCAG2'), []);
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  const cycleFormat = useCallback(() => {
    const formats: ColorFormat[] = ['HEX', 'RGB', 'HSL', 'HSB', 'OKLCH'];
    setColorFormat(f => formats[(formats.indexOf(f) + 1) % formats.length]);
  }, []);

  // ── Export ──
  const buildShareParams = useCallback(() => {
    const params = new URLSearchParams();
    if (photoData && !photoData.id.startsWith('upload-')) params.set('photo', photoData.id);
    params.set('bg', bg.hex.replace('#', '').toUpperCase());
    params.set('fg', fg.hex.replace('#', '').toUpperCase());
    params.set('algo', contrastAlgorithm === 'APCA' ? 'apca' : 'wcag');
    // Carry the swap/polarity state, else applyPolarity re-normalizes the
    // loaded pair and can flip a swapped link back on open.
    if (lighterAsBg) params.set('swap', '1');
    // Carry the custom specimen text (skip the default "Aa" to keep links clean).
    if (specimenText && specimenText !== 'Aa') params.set('text', specimenText);
    // Carry a fixed embed font size so shared links keep the pinned size.
    if (fixedFontSize && fixedFontSize > 0) params.set('size', String(fixedFontSize));
    // Carry the stacked embed layout so shared links keep the arrangement.
    if (stackedLayout) params.set('layout', 'stacked');
    return params;
  }, [bg.hex, fg.hex, contrastAlgorithm, photoData, specimenText, lighterAsBg, fixedFontSize, stackedLayout]);

  const getShareUrl = useCallback(() => {
    const params = buildShareParams();
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [buildShareParams]);

  const getExportMarkdown = useCallback(() => {
    const photoCredit = photoData
      ? { photographer: photoData.photographer, photoUrl: photoData.photoUrl }
      : undefined;
    return generateExportMarkdown(bg, fg, contrast, contrastAlgorithm, photoCredit, getShareUrl());
  }, [bg, fg, contrast, contrastAlgorithm, photoData, getShareUrl]);

  const copyShareUrl = useCallback(async () => {
    if (await copyText(getShareUrl())) setExportFeedback('url');
  }, [getShareUrl]);

  const copyParameters = useCallback(async () => {
    if (await copyText(buildShareParams().toString())) setExportFeedback('params');
  }, [buildShareParams]);

  const downloadMarkdown = useCallback(() => {
    const bgName = bg.hex.replace('#', '').toLowerCase();
    const fgName = fg.hex.replace('#', '').toLowerCase();
    downloadTextFile(`color-shift-${bgName}-${fgName}.md`, getExportMarkdown());
    setExportFeedback('markdown');
  }, [bg.hex, fg.hex, getExportMarkdown]);

  useEffect(() => {
    if (!exportFeedback) return;
    const timeout = window.setTimeout(() => setExportFeedback(null), 1400);
    return () => window.clearTimeout(timeout);
  }, [exportFeedback]);

  const onDragStart = useCallback(() => { isDraggingRef.current = true; }, []);
  const onDragEnd = useCallback(() => { isDraggingRef.current = false; }, []);

  // ── Global slider positions [0-100, 0-100, 0-100] ──
  // ALWAYS normalized percentages. Every color space maps into this range.
  // All animations operate on these percentages — no raw color values ever.
  const [sliderPos, setSliderPos] = useState<[number, number, number]>([50, 50, 50]);
  const sliderPosRef = useRef<[number, number, number]>([50, 50, 50]);
  const sliderTweenRef = useRef<gsap.core.Tween | null>(null);
  sliderPosRef.current = sliderPos;

  // Cleanup on unmount
  useEffect(() => () => {
    sliderTweenRef.current?.kill();
    preloadedImages.current.forEach(img => { img.src = ''; });
    preloadedImages.current.clear();
  }, []);

  // Animate slider percentages from current to target.
  // Duration + ease match the gradient crossfade in color-slider.tsx so
  // the grip and the color gradient move as one unified motion.
  const animateSlidersTo = useCallback((target: [number, number, number], duration = 0.2) => {
    if (sliderTweenRef.current) sliderTweenRef.current.kill();
    const cur = sliderPosRef.current;
    const proxy = { v0: cur[0], v1: cur[1], v2: cur[2] };
    sliderTweenRef.current = gsap.to(proxy, {
      v0: target[0], v1: target[1], v2: target[2],
      duration, ease: 'power4.out',
      onUpdate: () => {
        const pos: [number, number, number] = [proxy.v0, proxy.v1, proxy.v2];
        sliderPosRef.current = pos;
        setSliderPos(pos);
      },
    });
  }, []);

  // Set slider percentages instantly
  const setSlidersInstant = useCallback((target: [number, number, number]) => {
    if (sliderTweenRef.current) sliderTweenRef.current.kill();
    sliderPosRef.current = target;
    setSliderPos(target);
  }, []);

  // Sync sliders when target, mode, or colors change
  const prevSyncKey = useRef('');
  useEffect(() => {
    const cd = sliderTarget === 'bg' ? bg : fg;
    const target = colorToPercent(cd, sliderMode);
    const syncKey = `${sliderTarget}-${sliderMode}-${cd.hex}`;

    if (syncKey === prevSyncKey.current) return;
    const wasFirstSync = prevSyncKey.current === '';
    prevSyncKey.current = syncKey;

    if (isDraggingRef.current || wasFirstSync) {
      setSlidersInstant(target);
    } else {
      animateSlidersTo(target);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderTarget, sliderMode, bgHex, fgHex]);

  // ── Memoized slider configs (avoids 21+ oklchToHex calls per render) ──
  const sliderConfigs = useMemo(() => {
    const cd = sliderTarget === 'bg' ? bg : fg;
    const { labels, display } = percentToActual(sliderPos, sliderMode, cd);

    const oV = percentToActual(sliderPos, 'OKLCH', cd).values;
    const hV = percentToActual(sliderPos, 'HSB', cd).values;
    const rV = percentToActual(sliderPos, 'RGB', cd).values;

    const oMc = Math.max(maxChroma(oV[0], oV[2]), oV[1], 0.001);
    const oG = [
      `linear-gradient(90deg, ${oklchToHex({ l: 0, c: oV[1], h: oV[2] })}, ${oklchToHex({ l: 50, c: oV[1], h: oV[2] })}, ${oklchToHex({ l: 100, c: oV[1], h: oV[2] })})`,
      `linear-gradient(90deg, ${oklchToHex({ l: oV[0], c: 0, h: oV[2] })}, ${oklchToHex({ l: oV[0], c: oMc, h: oV[2] })})`,
      `linear-gradient(90deg, ${oklchToHex({ l: oV[0], c: oV[1], h: 0 })}, ${oklchToHex({ l: oV[0], c: oV[1], h: 60 })}, ${oklchToHex({ l: oV[0], c: oV[1], h: 120 })}, ${oklchToHex({ l: oV[0], c: oV[1], h: 180 })}, ${oklchToHex({ l: oV[0], c: oV[1], h: 240 })}, ${oklchToHex({ l: oV[0], c: oV[1], h: 300 })}, ${oklchToHex({ l: oV[0], c: oV[1], h: 360 })})`,
    ];
    const hG = [
      `linear-gradient(90deg, ${hsbToHex({ h: 0, s: hV[1], b: hV[2] })}, ${hsbToHex({ h: 60, s: hV[1], b: hV[2] })}, ${hsbToHex({ h: 120, s: hV[1], b: hV[2] })}, ${hsbToHex({ h: 180, s: hV[1], b: hV[2] })}, ${hsbToHex({ h: 240, s: hV[1], b: hV[2] })}, ${hsbToHex({ h: 300, s: hV[1], b: hV[2] })}, ${hsbToHex({ h: 360, s: hV[1], b: hV[2] })})`,
      `linear-gradient(90deg, ${hsbToHex({ h: hV[0], s: 0, b: hV[2] })}, ${hsbToHex({ h: hV[0], s: 100, b: hV[2] })})`,
      `linear-gradient(90deg, ${hsbToHex({ h: hV[0], s: hV[1], b: 0 })}, ${hsbToHex({ h: hV[0], s: hV[1], b: 100 })})`,
    ];
    const rG = [
      `linear-gradient(90deg, ${rgbToHex(0, Math.round(rV[1]), Math.round(rV[2]))}, ${rgbToHex(255, Math.round(rV[1]), Math.round(rV[2]))})`,
      `linear-gradient(90deg, ${rgbToHex(Math.round(rV[0]), 0, Math.round(rV[2]))}, ${rgbToHex(Math.round(rV[0]), 255, Math.round(rV[2]))})`,
      `linear-gradient(90deg, ${rgbToHex(Math.round(rV[0]), Math.round(rV[1]), 0)}, ${rgbToHex(Math.round(rV[0]), Math.round(rV[1]), 255)})`,
    ];

    return [0, 1, 2].map((i): SliderConfig => ({
      label: labels[i],
      value: sliderPos[i],
      min: 0,
      max: 100,
      step: 0.1,
      displayValue: display[i],
      trackDark: isTrackDark(
        sliderMode === 'OKLCH' ? oklchToHex({ l: i === 0 ? 0 : oV[0], c: i === 1 ? 0 : oV[1], h: i === 2 ? 0 : oV[2] }) :
        sliderMode === 'HSB' ? hsbToHex({ h: i === 0 ? 0 : hV[0], s: i === 1 ? 0 : hV[1], b: i === 2 ? 0 : hV[2] }) :
        rgbToHex(i === 0 ? 0 : Math.round(rV[0]), i === 1 ? 0 : Math.round(rV[1]), i === 2 ? 0 : Math.round(rV[2])),
        sliderMode === 'OKLCH' ? oklchToHex({ l: i === 0 ? 100 : oV[0], c: i === 1 ? oMc : oV[1], h: i === 2 ? 360 : oV[2] }) :
        sliderMode === 'HSB' ? hsbToHex({ h: i === 0 ? 360 : hV[0], s: i === 1 ? 100 : hV[1], b: i === 2 ? 100 : hV[2] }) :
        rgbToHex(i === 0 ? 255 : Math.round(rV[0]), i === 1 ? 255 : Math.round(rV[1]), i === 2 ? 255 : Math.round(rV[2]))
      ),
      gradients: { oklch: oG[i], hsb: hG[i], rgb: rG[i] },
    })) as [SliderConfig, SliderConfig, SliderConfig];
  }, [sliderPos, sliderMode, sliderTarget, bg, fg]);

  // ── Display mode (?display=1) — a locked, controls-free showcase: the
  // shared photo + color pair + text with no dock, no arrows, no editing or
  // navigation. Read once on mount (behind the load fade, so no flash). ──
  const [displayMode, setDisplayMode] = useState(false);
  useEffect(() => {
    setDisplayMode(new URLSearchParams(window.location.search).get('display') === '1');
  }, []);

  // ── Stacked layout (?layout=stacked) — read once on mount, same as
  // display mode. ──
  useEffect(() => {
    setStackedLayout(new URLSearchParams(window.location.search).get('layout') === 'stacked');
  }, []);

  // ── Keyboard — use ref for index so handler always reads latest ──
  const photoIndexRef = useRef(photoIndex);
  photoIndexRef.current = photoIndex;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (displayMode) return; // locked showcase: no keyboard nav
      const target = e.target as HTMLElement;
      // Ignore keys while typing in a field or the editable specimen.
      if (target.tagName === 'INPUT' || target.isContentEditable) return;
      // Arrows drive the one filmstrip transition (via the strip handle), the
      // same path the on-photo arrows, drag, and control-bar arrows use.
      if (e.key === 'ArrowRight') { e.preventDefault(); stripRef.current?.next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stripRef.current?.prev(); }
      if (e.code === 'Space') { e.preventDefault(); injectPhoto(); }
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleTheme(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [injectPhoto, toggleTheme, displayMode]);

  // ── Embedded (iframe) mode — the photo panel drops its upload surface
  // and click advances the photo instead. Detected once on mount. ──
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(window.parent !== window);
  }, []);

  // ── Embed API — the shiftnudge.com /claude embed posts a message when
  // the reader activates the module; advancing one photo makes the app
  // visibly come alive the moment the click-shield drops. Origin-gated
  // to the shiftnudge surfaces only. ──
  useEffect(() => {
    const allowed = (origin: string) =>
      origin === 'https://shiftnudge.com' ||
      origin === 'https://www.shiftnudge.com' ||
      origin === 'https://labs.shiftnudge.com' ||
      origin === 'https://shiftnudge-web.vercel.app' ||
      origin.startsWith('http://localhost');
    const onMessage = (e: MessageEvent) => {
      if (!allowed(e.origin)) return;
      if (e.data && e.data.type === 'colorshift:next') {
        stripRef.current?.next();
      }
      if (e.data && e.data.type === 'colorshift:expand-controls') {
        setSlidersExpanded(true);
        setSliderTarget(e.data.target === 'bg' ? 'bg' : 'fg');
      }
      // Parent toggles user input on/off at runtime: enabled=false locks the
      // embed into the controls-free display (no nav/edit/swap/drag/keyboard),
      // enabled=true restores the interactive app.
      if (e.data && e.data.type === 'colorshift:set-interactive') {
        setDisplayMode(!e.data.enabled);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // ── Embed API, outbound — when embedded, report the FIRST real user
  // interaction to the parent so it can stop any ambient choreography
  // (the /claude band cycles photos on a timer until the reader takes
  // over). Fire-and-forget notification, no payload beyond the type. ──
  useEffect(() => {
    if (window.parent === window) return;
    let sent = false;
    const send = () => {
      if (sent) return;
      sent = true;
      window.parent.postMessage({ type: 'colorshift:interacted' }, '*');
    };
    window.addEventListener('pointerdown', send, true);
    window.addEventListener('keydown', send, true);
    window.addEventListener('touchstart', send, true);
    return () => {
      window.removeEventListener('pointerdown', send, true);
      window.removeEventListener('keydown', send, true);
      window.removeEventListener('touchstart', send, true);
    };
  }, []);

  // Shared control handlers, used by both the desktop dock (ControlContainer)
  // and the mobile split bars (MobileTopBar / MobileBottomBar).
  const handleSliderChange = (index: number, value: number) => {
    if (sliderTweenRef.current) sliderTweenRef.current.kill();
    const newPos = [...sliderPosRef.current] as [number, number, number];
    newPos[index] = value;
    sliderPosRef.current = newPos;
    setSliderPos(newPos);
    const cd = sliderTarget === 'bg' ? bg : fg;
    const { values } = percentToActual(newPos, sliderMode, cd);
    const setter = sliderTarget === 'bg' ? setManualBg : setManualFg;
    setter(actualToHex(values, sliderMode));
  };
  const handleBgClick = () => {
    if (!slidersExpanded) { setSlidersExpanded(true); setSliderTarget('bg'); }
    else if (sliderTarget === 'bg') { setSlidersExpanded(false); }
    else { setSliderTarget('bg'); }
  };
  const handleFgClick = () => {
    if (!slidersExpanded) { setSlidersExpanded(true); setSliderTarget('fg'); }
    else if (sliderTarget === 'fg') { setSlidersExpanded(false); }
    else { setSliderTarget('fg'); }
  };
  const handleControlSwap = () => {
    swap();
    if (slidersExpanded) setSliderTarget(t => t === 'bg' ? 'fg' : 'bg');
  };
  const algorithmLabel = contrastAlgorithm === 'WCAG2' ? 'wcag' : 'apca';
  const thresholdList = contrastAlgorithm === 'WCAG2' ? [1.5, 3.0, 4.5, 7.0] : [30, 45, 60, 75, 90];
  const bgSwatchState = slidersExpanded && sliderTarget === 'bg' ? 'selected' : 'default';
  const fgSwatchState = slidersExpanded && sliderTarget === 'fg' ? 'selected' : 'default';
  const toggleScore = () => setControlsState(s => s === 'score' ? 'default' : 'score');
  const toggleExport = () => setControlsState(s => s === 'export' ? 'default' : 'export');

  return (
    <div
      ref={rootRef}
      className={`h-screen flex flex-col transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      data-theme={theme}
      style={{ backgroundColor: 'var(--cs-canvas)' }}
    >
      {/* MOBILE top bar — score / export (sandwiches the strip; sm:hidden). */}
      {!displayMode && (
        <MobileTopBar
          stacked={stackedLayout}
          controlsState={controlsState}
          algorithm={algorithmLabel}
          rating={contrast.grade}
          contrastValue={contrast.scoreLabel}
          thresholds={thresholdList}
          activeThreshold={activeThreshold}
          onThresholdSelect={bumpTo}
          onResultsToggle={toggleScore}
          onAlgorithmToggle={toggleContrastAlgorithm}
          onExportToggle={toggleExport}
          exportFeedback={exportFeedback}
          onCopyUrl={copyShareUrl}
          onCopyParams={copyParameters}
          onDownloadMd={downloadMarkdown}
        />
      )}

      {/* Color + Photo display */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <StripTransition
          ref={stripRef}
          photo={photoData}
          prevPhoto={prevPhotoData}
          nextPhoto={nextPhotoData}
          bgHex={bgHex}
          fgHex={fgHex}
          prevBgHex={prevColors?.bg}
          nextBgHex={nextColors?.bg}
          prevFgHex={prevColors?.fg}
          nextFgHex={nextColors?.fg}
          specimenText={specimenText}
          onSpecimenTextChange={setSpecimenText}
          fontSizePx={fixedFontSize ?? undefined}
          onSwap={swap}
          onPhotoFileSelected={injectPhotoFromFile}
          embedded={embedded}
          displayMode={displayMode}
          stacked={stackedLayout}
          onPhotoAdvance={() => navigateTo(photoIndex + 1)}
          onPhotoPrevious={() => navigateTo(photoIndex - 1)}
        />
      </div>

      {/* MOBILE bottom bar — fg / swap / bg (sm:hidden). */}
      {!displayMode && (
        <MobileBottomBar
          stacked={stackedLayout}
          slidersExpanded={slidersExpanded}
          controlsState={controlsState}
          sliderMode={sliderMode}
          sliders={sliderConfigs}
          onSliderChange={handleSliderChange}
          onSliderModeChange={(m) => setSliderMode(m)}
          onSliderDragStart={onDragStart}
          onSliderDragEnd={onDragEnd}
          fgHex={fgHex}
          bgHex={bgHex}
          fgState={fgSwatchState}
          bgState={bgSwatchState}
          onFgClick={handleFgClick}
          onBgClick={handleBgClick}
          onSwap={handleControlSwap}
          swapSelected={lighterAsBg}
        />
      )}

      {/* DESKTOP dock — hidden on mobile; the locked display hides it too. */}
      {!displayMode && (
      <ControlContainer
        stacked={stackedLayout}
        slidersExpanded={slidersExpanded}
        sliderMode={sliderMode}
        sliders={sliderConfigs}
        onSliderChange={handleSliderChange}
        onSliderDragStart={onDragStart}
        onSliderDragEnd={onDragEnd}
        onSliderModeChange={(m) => setSliderMode(m)}
        onSlidersClose={() => setSlidersExpanded(false)}
        onGripClick={() => setSlidersExpanded(prev => !prev)}
        controlsState={controlsState}
        bgHex={bgHex}
        fgHex={fgHex}
        algorithm={algorithmLabel}
        rating={contrast.grade}
        contrastValue={contrast.scoreLabel}
        thresholds={thresholdList}
        activeThreshold={activeThreshold}
        bgState={bgSwatchState}
        fgState={fgSwatchState}
        onBgClick={handleBgClick}
        onFgClick={handleFgClick}
        onSwap={handleControlSwap}
        swapSelected={lighterAsBg}
        onResultsToggle={toggleScore}
        onAlgorithmToggle={toggleContrastAlgorithm}
        onThresholdSelect={bumpTo}
        onLeftArrow={() => stripRef.current?.prev()}
        onRightArrow={() => stripRef.current?.next()}
        onExportToggle={toggleExport}
        exportFeedback={exportFeedback}
        onCopyUrl={copyShareUrl}
        onCopyParams={copyParameters}
        onDownloadMd={downloadMarkdown}
      />
      )}
    </div>
  );
}
