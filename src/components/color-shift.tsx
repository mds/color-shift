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
import { PhotoPanel } from './photo-panel';

interface PhotoColors { bg: string; fg: string; }

export function ColorShift() {
  // ── UI state ──
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [specimenText, setSpecimenText] = useState('Aa');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sliderMode, setSliderMode] = useState<SliderMode>('OKLCH');
  const [contrastAlgorithm, setContrastAlgorithm] = useState<ContrastAlgorithm>('WCAG2');

  // ── Photo state ──
  const [photoBuffer, setPhotoBuffer] = useState<PhotoData[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const isFetchingMore = useRef(false);
  const hasInitialLoad = useRef(false);

  // ── Color cache ──
  const [colorMap, setColorMap] = useState<Map<string, PhotoColors>>(new Map());
  const [manualColors, setManualColors] = useState<PhotoColors | null>(null);
  const photoData = photoBuffer[photoIndex] ?? null;

  // ── Derive colors ──
  const colors = useMemo((): PhotoColors => {
    if (manualColors) return manualColors;
    if (!photoData) return { bg: '#000000', fg: '#000000' };
    const cached = colorMap.get(photoData.id);
    if (cached) return cached;
    const safeFg = bumpToThreshold(photoData.color, '#FFFFFF', 4.5, 'WCAG2');
    return { bg: photoData.color, fg: safeFg };
  }, [photoData, colorMap, manualColors]);

  const bgHex = colors.bg;
  const fgHex = colors.fg;
  const isReady = photoData !== null;

  useEffect(() => { setManualColors(null); }, [photoIndex]);

  // ── Refs ──
  const isDraggingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
  const specimenInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ──
  const bg = hexToColorData(bgHex);
  const fg = hexToColorData(fgHex);
  const contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm);
  const activeThreshold = nearestThreshold(contrast.score, contrastAlgorithm);

  // ── GSAP color animation ──
  useGSAP(() => {}, { scope: rootRef });
  const prevBg = useRef(bgHex);
  const prevFg = useRef(fgHex);

  useEffect(() => {
    if (isDraggingRef.current) { prevBg.current = bgHex; prevFg.current = fgHex; return; }
    const dur = 0.45; // match Embla slide duration
    const ease = 'power2.inOut';
    if (bgHex !== prevBg.current && specimenRef.current) {
      gsap.to(specimenRef.current, { backgroundColor: bgHex, duration: dur, ease });
    }
    if (fgHex !== prevFg.current && specimenRef.current) {
      const input = specimenRef.current.querySelector('input');
      if (input) gsap.to(input, { color: fgHex, duration: dur, ease });
      // Also animate the score badge text
      const badge = specimenRef.current.querySelector('[data-score-label]');
      if (badge) gsap.to(badge, { color: fgHex, duration: dur, ease });
    }
    prevBg.current = bgHex;
    prevFg.current = fgHex;
  }, [bgHex, fgHex]);

  // ── Photo fetching ──

  const fetchPhotos = useCallback(async (count: number): Promise<PhotoData[]> => {
    const res = await fetch(`/api/photos?count=${count}`);
    const data = await res.json();
    if (!res.ok || data.error) { console.warn('Photo API:', data.error); return []; }
    return data as PhotoData[];
  }, []);

  const preloadImages = useCallback((photos: PhotoData[]) => {
    photos.forEach(p => { const img = new Image(); img.src = p.url; });
  }, []);

  const preloadThumbs = useCallback((photos: PhotoData[]) => {
    photos.forEach(p => {
      const t = new Image(); t.src = p.tinyUrl;
      const th = new Image(); th.src = p.thumbUrl;
    });
  }, []);

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

  const extractBatchColors = useCallback(async (photos: PhotoData[]) => {
    const toExtract = photos.filter(p => !colorMap.has(p.id));
    if (toExtract.length === 0) return;
    const batchSize = 5;
    for (let i = 0; i < toExtract.length; i += batchSize) {
      const batch = toExtract.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => extractColorsFromPhoto(p).then(r => ({ id: p.id, colors: r }))));
      setColorMap(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const { id, colors: c } of results) {
          if (c && !next.has(id)) { next.set(id, c); changed = true; }
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
        extractBatchColors(unique);
      }
      isFetchingMore.current = false;
    }
  }, [fetchPhotos, preloadImages, preloadThumbs, dedupePhotos, extractBatchColors]);

  const loadPhotos = useCallback(async () => {
    setIsPhotoLoading(true);
    const photos = await fetchPhotos(10);
    if (photos.length === 0) { setIsPhotoLoading(false); return; }
    preloadThumbs(photos);
    preloadImages(photos.slice(0, 3));
    setPhotoBuffer(photos);
    setPhotoIndex(0);
    setManualColors(null);
    setIsPhotoLoading(false);
    extractBatchColors(photos);
  }, [fetchPhotos, preloadImages, preloadThumbs, extractBatchColors]);

  useEffect(() => {
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;
    loadPhotos();
  }, [loadPhotos]);

  // ── Navigation ──

  const handlePhotoIndexChange = useCallback((newIndex: number) => {
    setPhotoIndex(newIndex);
    maybeRefill(newIndex, photoBuffer);
    preloadImages(photoBuffer.slice(newIndex + 1, newIndex + 3));
  }, [photoBuffer, maybeRefill, preloadImages]);

  const generate = useCallback(() => loadPhotos(), [loadPhotos]);

  // ── Manual color manipulation ──

  const setManualBg = useCallback((newBg: string) => {
    setManualColors(prev => ({ bg: newBg, fg: prev?.fg ?? fgHex }));
  }, [fgHex]);

  const setManualFg = useCallback((newFg: string) => {
    setManualColors(prev => ({ bg: prev?.bg ?? bgHex, fg: newFg }));
  }, [bgHex]);

  const swap = useCallback(() => { setManualColors({ bg: fgHex, fg: bgHex }); }, [bgHex, fgHex]);
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
    setManualFg(bumpToThreshold(bgHex, fgHex, t, contrastAlgorithm));
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
    await navigator.clipboard.writeText(generateExportMarkdown(bg, fg, contrast, contrastAlgorithm, photoCredit));
  }, [bg, fg, contrast, contrastAlgorithm, photoCredit]);

  const onDragStart = useCallback(() => { isDraggingRef.current = true; }, []);
  const onDragEnd = useCallback(() => { isDraggingRef.current = false; }, []);

  // ── Keyboard — arrows handled by PhotoPanel, Space/S/T here ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== specimenInputRef.current) return;
      if (e.code === 'Space' && target !== specimenInputRef.current) { e.preventDefault(); generate(); }
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); swap(); }
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) { e.preventDefault(); toggleTheme(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate, swap, toggleTheme]);

  return (
    <div
      ref={rootRef}
      className={`h-screen flex flex-col transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      data-theme={theme}
      style={{ backgroundColor: '#000' }}
    >
      {/* Split: color left, photo right (desktop) / color top, photo bottom (mobile) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Color panel */}
        <Specimen
          ref={specimenRef} bgHex={bgHex} fgHex={fgHex}
          text={specimenText} onTextChange={setSpecimenText}
          inputRef={specimenInputRef} contrast={contrast}
        />

        {/* Photo panel */}
        {photoBuffer.length > 0 && (
          <div className="h-[40vh] md:h-auto md:flex-1 min-h-0 shrink-0">
            <PhotoPanel
              buffer={photoBuffer}
              currentIndex={photoIndex}
              onIndexChange={handlePhotoIndexChange}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <ControlStrip
        bg={bg} fg={fg} bgHex={bgHex} fgHex={fgHex}
        contrast={contrast} activeThreshold={activeThreshold}
        theme={theme} sliderMode={sliderMode} contrastAlgorithm={contrastAlgorithm} colorFormat={colorFormat}
        photoThumb={null} photoThumbRef={useRef(null)} isPhotoLoading={isPhotoLoading}
        onBgInput={handleBgInput} onFgInput={handleFgInput} onSwap={swap}
        onBumpUp={bumpUp} onBumpDown={bumpDown} onBumpTo={bumpTo}
        onUpdateBgHsb={updateBgHsb} onUpdateFgHsb={updateFgHsb}
        onUpdateBgOklch={updateBgOklch} onUpdateFgOklch={updateFgOklch}
        onCycleFormat={cycleFormat} onGenerate={generate}
        onLoadPhoto={loadPhotos} onPhotoOpen={() => {}}
        onCopy={copyExport} onDownload={() => {}}
        onToggleTheme={toggleTheme} onToggleSliderMode={toggleSliderMode}
        onToggleContrastAlgorithm={toggleContrastAlgorithm}
        onDragStart={onDragStart} onDragEnd={onDragEnd} formatColorValue={formatColorValue}
      />
    </div>
  );
}
