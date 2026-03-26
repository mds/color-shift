'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { gsap, useGSAP } from '@/lib/gsap-config';
import {
  hexToColorData,
  hsbToHex,
  oklchToHex,
  getContrastResult,
  bumpToThreshold,
  nearestThreshold,
  nextThresholdUp,
  nextThresholdDown,
  formatColorValue,
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
import { Specimen } from './specimen';
import { ControlStrip, type PhotoData } from './control-strip';
import { PhotoOverlay } from './photo-overlay';

interface PhotoColors { bg: string; fg: string; }

export function ColorShift() {
  // ── UI state ──
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [specimenText, setSpecimenText] = useState('Aa');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sliderMode, setSliderMode] = useState<SliderMode>('OKLCH');
  const [contrastAlgorithm, setContrastAlgorithm] = useState<ContrastAlgorithm>('WCAG2');

  // ── Photo state — THE source of truth ──
  const [photoBuffer, setPhotoBuffer] = useState<PhotoData[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPhotoFullScreen, setIsPhotoFullScreen] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const isFetchingMore = useRef(false);
  const hasInitialLoad = useRef(false);

  // ── Color cache: photoId → {bg, fg} ──
  // This is the ONLY place colors are stored per-photo.
  // bgHex/fgHex are derived from this cache + current photoIndex.
  const [colorMap, setColorMap] = useState<Map<string, PhotoColors>>(new Map());

  // ── Manual color overrides (from sliders, swap, bump) ──
  // These override the photo colors temporarily until the photo changes.
  const [manualColors, setManualColors] = useState<PhotoColors | null>(null);

  const photoData = photoBuffer[photoIndex] ?? null;

  // ── Derive bg/fg from photo + cache + manual override ──
  const colors = useMemo((): PhotoColors => {
    if (manualColors) return manualColors;
    if (!photoData) return { bg: '#000000', fg: '#000000' }; // invisible until loaded
    const cached = colorMap.get(photoData.id);
    if (cached) return cached;
    const safeFg = bumpToThreshold(photoData.color, '#FFFFFF', 4.5, 'WCAG2');
    return { bg: photoData.color, fg: safeFg };
  }, [photoData, colorMap, manualColors]);

  const bgHex = colors.bg;
  const fgHex = colors.fg;

  // App is ready once we have a photo with colors
  const isReady = photoData !== null;

  // Clear manual override when photo changes
  useEffect(() => {
    setManualColors(null);
  }, [photoIndex]);

  // ── Refs ──
  const isDraggingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
  const specimenInputRef = useRef<HTMLInputElement>(null);
  const photoThumbRef = useRef<HTMLButtonElement>(null);

  // ── Derived values ──
  const bg = hexToColorData(bgHex);
  const fg = hexToColorData(fgHex);
  const contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm);
  const activeThreshold = nearestThreshold(contrast.score, contrastAlgorithm);

  // ── GSAP ──
  useGSAP(() => {}, { scope: rootRef });

  const prevBg = useRef(bgHex);
  const prevFg = useRef(fgHex);

  useEffect(() => {
    if (isDraggingRef.current) {
      prevBg.current = bgHex;
      prevFg.current = fgHex;
      return;
    }
    if (bgHex !== prevBg.current && rootRef.current && specimenRef.current) {
      gsap.to(rootRef.current, { backgroundColor: bgHex, duration: 0.4, ease: 'power2.out' });
      gsap.to(specimenRef.current, { backgroundColor: bgHex, duration: 0.4, ease: 'power2.out' });
    }
    if (fgHex !== prevFg.current && specimenRef.current) {
      const input = specimenRef.current.querySelector('input');
      if (input) gsap.to(input, { color: fgHex, duration: 0.4, ease: 'power2.out' });
    }
    prevBg.current = bgHex;
    prevFg.current = fgHex;
  }, [bgHex, fgHex]);

  // ── Photo fetching ──

  const fetchPhotos = useCallback(async (count: number): Promise<PhotoData[]> => {
    const res = await fetch(`/api/photos?count=${count}`);
    const data = await res.json();
    if (!res.ok || data.error) {
      console.warn('Photo API:', data.error ?? 'Add UNSPLASH_ACCESS_KEY to .env.local');
      return [];
    }
    return data as PhotoData[];
  }, []);

  const preloadImages = useCallback((photos: PhotoData[]) => {
    photos.forEach(p => { const img = new Image(); img.src = p.url; });
  }, []);

  const preloadThumbs = useCallback((photos: PhotoData[]) => {
    photos.forEach(p => {
      const tiny = new Image(); tiny.src = p.tinyUrl;
      const thumb = new Image(); thumb.src = p.thumbUrl;
    });
  }, []);

  // Extract colors from a single photo's image — returns the pair or null
  const extractColorsFromPhoto = useCallback(async (photo: PhotoData): Promise<PhotoColors | null> => {
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
          resolve(extractContrastPair(mapped, contrastAlgorithm));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
    });
  }, [contrastAlgorithm]);

  // Extract colors for an entire batch and write to colorMap
  const extractBatchColors = useCallback(async (photos: PhotoData[]) => {
    const toExtract = photos.filter(p => !colorMap.has(p.id));
    if (toExtract.length === 0) return;

    // Extract in parallel, up to 5 at a time
    const batchSize = 5;
    for (let i = 0; i < toExtract.length; i += batchSize) {
      const batch = toExtract.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => extractColorsFromPhoto(p).then(r => ({ id: p.id, colors: r }))));

      setColorMap(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const { id, colors } of results) {
          if (colors && !next.has(id)) {
            next.set(id, colors);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [colorMap, extractColorsFromPhoto]);

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
        // Extract colors in background — ready before user arrives
        extractBatchColors(unique);
      }
      isFetchingMore.current = false;
    }
  }, [fetchPhotos, preloadImages, preloadThumbs, dedupePhotos, extractBatchColors]);

  // ── Load fresh batch ──

  const loadPhotos = useCallback(async (showFullScreen: boolean) => {
    setIsPhotoLoading(true);
    const photos = await fetchPhotos(10);
    if (photos.length === 0) { setIsPhotoLoading(false); return; }
    preloadThumbs(photos);
    preloadImages(photos.slice(0, 3));
    setPhotoBuffer(photos);
    setPhotoIndex(0);
    setManualColors(null);
    if (showFullScreen) setIsPhotoFullScreen(true);
    setIsPhotoLoading(false);
    // Extract colors for all photos in background
    extractBatchColors(photos);
  }, [fetchPhotos, preloadImages, preloadThumbs, extractBatchColors]);

  // Auto-load on mount
  useEffect(() => {
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;
    loadPhotos(false);
  }, [loadPhotos]);

  // ── Navigation — only thing that changes the photo ──

  const handlePhotoIndexChange = useCallback((newIndex: number) => {
    setPhotoIndex(newIndex);
    // manualColors cleared by the useEffect above
    maybeRefill(newIndex, photoBuffer);
    preloadImages(photoBuffer.slice(newIndex + 1, newIndex + 3));
  }, [photoBuffer, maybeRefill, preloadImages]);

  // ── Open/close overlay — does NOT change colors ──

  const handlePhotoOpen = useCallback(() => setIsPhotoFullScreen(true), []);
  const handlePhotoCollapse = useCallback(() => setIsPhotoFullScreen(false), []);

  // ── Generate = fresh batch ──
  const generate = useCallback(() => loadPhotos(false), [loadPhotos]);

  // ── Manual color manipulation (sliders, input, swap, bump) ──
  // These set manualColors which overrides photo-derived colors
  // until the photo changes.

  const setManualBg = useCallback((newBg: string) => {
    setManualColors(prev => ({ bg: newBg, fg: prev?.fg ?? fgHex }));
  }, [fgHex]);

  const setManualFg = useCallback((newFg: string) => {
    setManualColors(prev => ({ bg: prev?.bg ?? bgHex, fg: newFg }));
  }, [bgHex]);

  const swap = useCallback(() => {
    setManualColors({ bg: fgHex, fg: bgHex });
  }, [bgHex, fgHex]);

  const updateBgHsb = useCallback((hsb: HSB) => setManualBg(hsbToHex(hsb)), [setManualBg]);
  const updateFgHsb = useCallback((hsb: HSB) => setManualFg(hsbToHex(hsb)), [setManualFg]);
  const updateBgOklch = useCallback((oklch: OklchValues) => setManualBg(oklchToHex(oklch)), [setManualBg]);
  const updateFgOklch = useCallback((oklch: OklchValues) => setManualFg(oklchToHex(oklch)), [setManualFg]);

  const handleBgInput = useCallback((value: string) => {
    const hex = parseAnyColor(value);
    if (hex) setManualBg(hex);
  }, [setManualBg]);

  const handleFgInput = useCallback((value: string) => {
    const hex = parseAnyColor(value);
    if (hex) setManualFg(hex);
  }, [setManualFg]);

  const bumpUp = useCallback(() => {
    const target = nextThresholdUp(contrast.score, contrastAlgorithm);
    if (target) setManualFg(bumpToThreshold(bgHex, fgHex, target, contrastAlgorithm));
  }, [bgHex, fgHex, contrast.score, contrastAlgorithm, setManualFg]);

  const bumpDown = useCallback(() => {
    const target = nextThresholdDown(contrast.score, contrastAlgorithm);
    if (target) setManualFg(bumpToThreshold(bgHex, fgHex, target, contrastAlgorithm));
  }, [bgHex, fgHex, contrast.score, contrastAlgorithm, setManualFg]);

  const bumpTo = useCallback((target: number) => {
    setManualFg(bumpToThreshold(bgHex, fgHex, target, contrastAlgorithm));
  }, [bgHex, fgHex, contrastAlgorithm, setManualFg]);

  const toggleSliderMode = useCallback(() => setSliderMode(m => m === 'HSB' ? 'OKLCH' : 'HSB'), []);
  const toggleContrastAlgorithm = useCallback(() => setContrastAlgorithm(a => a === 'WCAG2' ? 'APCA' : 'WCAG2'), []);
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  const cycleFormat = useCallback(() => {
    const formats: ColorFormat[] = ['HEX', 'RGB', 'HSL', 'HSB', 'OKLCH'];
    setColorFormat(f => formats[(formats.indexOf(f) + 1) % formats.length]);
  }, []);

  // ── Export ──

  const photoCredit = photoData ? { photographer: photoData.photographer, photoUrl: photoData.photoUrl } : undefined;

  const copyExport = useCallback(async () => {
    const md = generateExportMarkdown(bg, fg, contrast, contrastAlgorithm, photoCredit);
    await navigator.clipboard.writeText(md);
  }, [bg, fg, contrast, contrastAlgorithm, photoCredit]);

  const downloadExport = useCallback(() => {
    const md = generateExportMarkdown(bg, fg, contrast, contrastAlgorithm, photoCredit);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `color-shift-${bg.hex.slice(1)}-${fg.hex.slice(1)}.md`;
    a.click(); URL.revokeObjectURL(url);
  }, [bg, fg, contrast, contrastAlgorithm, photoCredit]);

  // ── Drag ──
  const onDragStart = useCallback(() => { isDraggingRef.current = true; }, []);
  const onDragEnd = useCallback(() => { isDraggingRef.current = false; }, []);

  // ── Arrow keys — only change photoIndex ──

  const navigatePhotos = useCallback((direction: 'prev' | 'next') => {
    if (photoBuffer.length === 0) return;
    const newIndex = direction === 'prev'
      ? Math.max(0, photoIndex - 1)
      : Math.min(photoBuffer.length - 1, photoIndex + 1);
    if (newIndex !== photoIndex) handlePhotoIndexChange(newIndex);
  }, [photoBuffer, photoIndex, handlePhotoIndexChange]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== specimenInputRef.current) return;
      if (isPhotoFullScreen) return;

      if (e.code === 'Space' && target !== specimenInputRef.current) { e.preventDefault(); generate(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigatePhotos('prev'); }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigatePhotos('next'); }
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); swap(); }
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); toggleTheme(); }
      if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); handlePhotoOpen(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate, swap, toggleTheme, handlePhotoOpen, navigatePhotos, isPhotoFullScreen]);

  return (
    <div
      ref={rootRef}
      className={`h-screen flex flex-col transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      data-theme={theme}
      style={{ backgroundColor: bgHex }}
    >
      <Specimen
        ref={specimenRef} bgHex={bgHex} fgHex={fgHex}
        text={specimenText} onTextChange={setSpecimenText} inputRef={specimenInputRef}
      />

      {isPhotoFullScreen && photoBuffer.length > 0 && (
        <PhotoOverlay
          buffer={photoBuffer} currentIndex={photoIndex}
          onIndexChange={handlePhotoIndexChange}
          onCollapse={handlePhotoCollapse} thumbRef={photoThumbRef}
        />
      )}

      <ControlStrip
        bg={bg} fg={fg} bgHex={bgHex} fgHex={fgHex}
        contrast={contrast} activeThreshold={activeThreshold}
        theme={theme} sliderMode={sliderMode} contrastAlgorithm={contrastAlgorithm} colorFormat={colorFormat}
        photoThumb={photoData?.thumbUrl ?? null} photoThumbRef={photoThumbRef} isPhotoLoading={isPhotoLoading}
        onBgInput={handleBgInput} onFgInput={handleFgInput} onSwap={swap}
        onBumpUp={bumpUp} onBumpDown={bumpDown} onBumpTo={bumpTo}
        onUpdateBgHsb={updateBgHsb} onUpdateFgHsb={updateFgHsb}
        onUpdateBgOklch={updateBgOklch} onUpdateFgOklch={updateFgOklch}
        onCycleFormat={cycleFormat} onGenerate={generate}
        onLoadPhoto={() => loadPhotos(true)} onPhotoOpen={handlePhotoOpen}
        onCopy={copyExport} onDownload={downloadExport}
        onToggleTheme={toggleTheme} onToggleSliderMode={toggleSliderMode}
        onToggleContrastAlgorithm={toggleContrastAlgorithm}
        onDragStart={onDragStart} onDragEnd={onDragEnd} formatColorValue={formatColorValue}
      />
    </div>
  );
}
