'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  type ColorFormat,
  type SliderMode,
  type ContrastAlgorithm,
  type HSB,
  type OklchValues,
} from '@/lib/color-engine';
import { Specimen } from './specimen';
import { ControlStrip, type PhotoData } from './control-strip';
import { PhotoOverlay } from './photo-overlay';

// Store extracted colors per photo so they stay synced
interface PhotoColors {
  bg: string;
  fg: string;
}

export function ColorShift() {
  // Color state — always derived from photos
  const [bgHex, setBgHex] = useState('#1A1A2E');
  const [fgHex, setFgHex] = useState('#E8D5B7');
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [specimenText, setSpecimenText] = useState('Aa');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sliderMode, setSliderMode] = useState<SliderMode>('OKLCH');
  const [contrastAlgorithm, setContrastAlgorithm] = useState<ContrastAlgorithm>('WCAG2');

  // Photo state — photos are the source of truth for colors
  const [photoBuffer, setPhotoBuffer] = useState<PhotoData[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isPhotoFullScreen, setIsPhotoFullScreen] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const isFetchingMore = useRef(false);
  const hasInitialLoad = useRef(false);

  // Cache extracted colors per photo id
  const colorCache = useRef<Map<string, PhotoColors>>(new Map());
  const [extractedIds, setExtractedIds] = useState<Set<string>>(new Set());

  const photoData = photoBuffer.length > 0 ? photoBuffer[photoIndex] ?? null : null;

  // Drag ref
  const isDraggingRef = useRef(false);

  // Refs for GSAP targeting
  const rootRef = useRef<HTMLDivElement>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
  const specimenInputRef = useRef<HTMLInputElement>(null);
  const photoThumbRef = useRef<HTMLButtonElement>(null);

  // Derived values
  const bg = hexToColorData(bgHex);
  const fg = hexToColorData(fgHex);
  const contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm);
  const activeThreshold = nearestThreshold(contrast.score, contrastAlgorithm);

  // GSAP context
  useGSAP(() => {}, { scope: rootRef });

  // Animate colors via GSAP
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
      if (input) {
        gsap.to(input, { color: fgHex, duration: 0.4, ease: 'power2.out' });
      }
    }

    prevBg.current = bgHex;
    prevFg.current = fgHex;
  }, [bgHex, fgHex]);

  // ── Apply colors from a photo (use cache if available, else Unsplash dominant) ──

  const applyPhotoColors = useCallback((photo: PhotoData) => {
    const cached = colorCache.current.get(photo.id);
    if (cached) {
      setBgHex(cached.bg);
      setFgHex(cached.fg);
    } else {
      // Use Unsplash dominant color as bg, derive a contrast-safe fg
      const safeFg = bumpToThreshold(photo.color, '#FFFFFF', 4.5, 'WCAG2');
      setBgHex(photo.color);
      setFgHex(safeFg);
    }
  }, []);

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

  const dedupePhotos = useCallback((existing: PhotoData[], incoming: PhotoData[]): PhotoData[] => {
    const ids = new Set(existing.map(p => p.id));
    return incoming.filter(p => !ids.has(p.id));
  }, []);

  const maybeRefill = useCallback(async (currentIdx: number, buffer: PhotoData[]) => {
    if (isFetchingMore.current) return;
    const remaining = buffer.length - currentIdx - 1;
    if (remaining <= 3) {
      isFetchingMore.current = true;
      const more = await fetchPhotos(10);
      const unique = dedupePhotos(buffer, more);
      if (unique.length > 0) {
        preloadThumbs(unique);
        preloadImages(unique.slice(0, 3));
        setPhotoBuffer(prev => [...prev, ...dedupePhotos(prev, unique)]);
      }
      isFetchingMore.current = false;
    }
  }, [fetchPhotos, preloadImages, preloadThumbs, dedupePhotos]);

  // ── Load photos (initial + generate) ──

  const loadPhotos = useCallback(async (showFullScreen: boolean) => {
    setIsPhotoLoading(true);
    const photos = await fetchPhotos(10);
    if (photos.length === 0) {
      setIsPhotoLoading(false);
      return;
    }
    preloadThumbs(photos);
    preloadImages(photos.slice(0, 3));
    setPhotoBuffer(photos);
    setPhotoIndex(0);
    applyPhotoColors(photos[0]);
    if (showFullScreen) setIsPhotoFullScreen(true);
    setIsPhotoLoading(false);
  }, [fetchPhotos, preloadImages, preloadThumbs, applyPhotoColors]);

  // Auto-load photos on mount
  useEffect(() => {
    if (hasInitialLoad.current) return;
    hasInitialLoad.current = true;
    loadPhotos(false);
  }, [loadPhotos]);

  // ── Navigation ──

  const handlePhotoIndexChange = useCallback((newIndex: number) => {
    setPhotoIndex(newIndex);
    const photo = photoBuffer[newIndex];
    if (photo) applyPhotoColors(photo);
    maybeRefill(newIndex, photoBuffer);
    const ahead = photoBuffer.slice(newIndex + 1, newIndex + 3);
    preloadImages(ahead);
  }, [photoBuffer, applyPhotoColors, maybeRefill, preloadImages]);

  // When vibrant extraction completes, cache the result and apply
  const handlePhotoColorsExtracted = useCallback((newBg: string, newFg: string) => {
    setBgHex(newBg);
    setFgHex(newFg);
    if (photoData) {
      colorCache.current.set(photoData.id, { bg: newBg, fg: newFg });
      setExtractedIds(prev => new Set(prev).add(photoData.id));
    }
  }, [photoData]);

  const handlePhotoCollapse = useCallback(() => {
    setIsPhotoFullScreen(false);
  }, []);

  const handlePhotoOpen = useCallback(() => {
    setIsPhotoFullScreen(true);
  }, []);

  // Generate = load fresh batch of photos
  const generate = useCallback(() => {
    loadPhotos(false);
  }, [loadPhotos]);

  // ── Color manipulation (sliders, input, swap still work on current colors) ──

  const swap = useCallback(() => {
    const tempBg = bgHex;
    const tempFg = fgHex;
    setBgHex(tempFg);
    setFgHex(tempBg);
  }, [bgHex, fgHex]);

  const updateBgHsb = useCallback((hsb: HSB) => setBgHex(hsbToHex(hsb)), []);
  const updateFgHsb = useCallback((hsb: HSB) => setFgHex(hsbToHex(hsb)), []);
  const updateBgOklch = useCallback((oklch: OklchValues) => setBgHex(oklchToHex(oklch)), []);
  const updateFgOklch = useCallback((oklch: OklchValues) => setFgHex(oklchToHex(oklch)), []);

  const toggleSliderMode = useCallback(() => setSliderMode(m => m === 'HSB' ? 'OKLCH' : 'HSB'), []);
  const toggleContrastAlgorithm = useCallback(() => setContrastAlgorithm(a => a === 'WCAG2' ? 'APCA' : 'WCAG2'), []);
  const toggleTheme = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);

  const cycleFormat = useCallback(() => {
    const formats: ColorFormat[] = ['HEX', 'RGB', 'HSL', 'HSB', 'OKLCH'];
    setColorFormat(f => formats[(formats.indexOf(f) + 1) % formats.length]);
  }, []);

  const handleBgInput = useCallback((value: string) => {
    const hex = parseAnyColor(value);
    if (hex) setBgHex(hex);
  }, []);

  const handleFgInput = useCallback((value: string) => {
    const hex = parseAnyColor(value);
    if (hex) setFgHex(hex);
  }, []);

  // Contrast bumping
  const bumpUp = useCallback(() => {
    const target = nextThresholdUp(contrast.score, contrastAlgorithm);
    if (target) setFgHex(bumpToThreshold(bgHex, fgHex, target, contrastAlgorithm));
  }, [bgHex, fgHex, contrast.score, contrastAlgorithm]);

  const bumpDown = useCallback(() => {
    const target = nextThresholdDown(contrast.score, contrastAlgorithm);
    if (target) setFgHex(bumpToThreshold(bgHex, fgHex, target, contrastAlgorithm));
  }, [bgHex, fgHex, contrast.score, contrastAlgorithm]);

  const bumpTo = useCallback((target: number) => {
    setFgHex(bumpToThreshold(bgHex, fgHex, target, contrastAlgorithm));
  }, [bgHex, fgHex, contrastAlgorithm]);

  // ── Export ──

  const photoCredit = photoData ? {
    photographer: photoData.photographer,
    photoUrl: photoData.photoUrl,
  } : undefined;

  const copyExport = useCallback(async () => {
    const md = generateExportMarkdown(bg, fg, contrast, contrastAlgorithm, photoCredit);
    await navigator.clipboard.writeText(md);
  }, [bg, fg, contrast, contrastAlgorithm, photoCredit]);

  const downloadExport = useCallback(() => {
    const md = generateExportMarkdown(bg, fg, contrast, contrastAlgorithm, photoCredit);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-shift-${bg.hex.slice(1)}-${fg.hex.slice(1)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bg, fg, contrast, contrastAlgorithm, photoCredit]);

  // Drag handlers
  const onDragStart = useCallback(() => { isDraggingRef.current = true; }, []);
  const onDragEnd = useCallback(() => { isDraggingRef.current = false; }, []);

  // ── Arrow key navigation — always photo-driven ──

  const navigatePhotos = useCallback((direction: 'prev' | 'next') => {
    if (photoBuffer.length === 0) return;

    const newIndex = direction === 'prev'
      ? Math.max(0, photoIndex - 1)
      : Math.min(photoBuffer.length - 1, photoIndex + 1);

    if (newIndex !== photoIndex) {
      handlePhotoIndexChange(newIndex);
    }
  }, [photoBuffer, photoIndex, handlePhotoIndexChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== specimenInputRef.current) return;
      if (isPhotoFullScreen) return;

      if (e.code === 'Space' && target !== specimenInputRef.current) {
        e.preventDefault();
        generate();
      }
      if (e.key === 'ArrowLeft' && target !== specimenInputRef.current) {
        e.preventDefault();
        navigatePhotos('prev');
      }
      if (e.key === 'ArrowRight' && target !== specimenInputRef.current) {
        e.preventDefault();
        navigatePhotos('next');
      }
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) {
        e.preventDefault();
        swap();
      }
      if ((e.key === 't' || e.key === 'T') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) {
        e.preventDefault();
        toggleTheme();
      }
      if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && target !== specimenInputRef.current) {
        e.preventDefault();
        handlePhotoOpen();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate, swap, toggleTheme, handlePhotoOpen, navigatePhotos, isPhotoFullScreen]);

  return (
    <div
      ref={rootRef}
      className="h-screen flex flex-col"
      data-theme={theme}
      style={{ backgroundColor: bgHex }}
    >
      <Specimen
        ref={specimenRef}
        bgHex={bgHex}
        fgHex={fgHex}
        text={specimenText}
        onTextChange={setSpecimenText}
        inputRef={specimenInputRef}
      />

      {isPhotoFullScreen && photoBuffer.length > 0 && (
        <PhotoOverlay
          buffer={photoBuffer}
          currentIndex={photoIndex}
          contrastAlgorithm={contrastAlgorithm}
          onColorsExtracted={handlePhotoColorsExtracted}
          onIndexChange={handlePhotoIndexChange}
          onCollapse={handlePhotoCollapse}
          thumbRef={photoThumbRef}
          extractedIds={extractedIds}
        />
      )}

      <ControlStrip
        bg={bg}
        fg={fg}
        bgHex={bgHex}
        fgHex={fgHex}
        contrast={contrast}
        activeThreshold={activeThreshold}
        theme={theme}
        sliderMode={sliderMode}
        contrastAlgorithm={contrastAlgorithm}
        colorFormat={colorFormat}
        photoThumb={photoData?.thumbUrl ?? null}
        photoThumbRef={photoThumbRef}
        isPhotoLoading={isPhotoLoading}
        onBgInput={handleBgInput}
        onFgInput={handleFgInput}
        onSwap={swap}
        onBumpUp={bumpUp}
        onBumpDown={bumpDown}
        onBumpTo={bumpTo}
        onUpdateBgHsb={updateBgHsb}
        onUpdateFgHsb={updateFgHsb}
        onUpdateBgOklch={updateBgOklch}
        onUpdateFgOklch={updateFgOklch}
        onCycleFormat={cycleFormat}
        onGenerate={generate}
        onLoadPhoto={() => loadPhotos(true)}
        onPhotoOpen={handlePhotoOpen}
        onCopy={copyExport}
        onDownload={downloadExport}
        onToggleTheme={toggleTheme}
        onToggleSliderMode={toggleSliderMode}
        onToggleContrastAlgorithm={toggleContrastAlgorithm}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        formatColorValue={formatColorValue}
      />
    </div>
  );
}
