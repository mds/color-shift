'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap-config';
import {
  hexToColorData,
  hsbToHex,
  oklchToHex,
  getContrastResult,
  generateRandomPair,
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

export function ColorShift() {
  // Color state
  const [bgHex, setBgHex] = useState('#1A1A2E');
  const [fgHex, setFgHex] = useState('#E8D5B7');
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [specimenText, setSpecimenText] = useState('Aa');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sliderMode, setSliderMode] = useState<SliderMode>('OKLCH');
  const [contrastAlgorithm, setContrastAlgorithm] = useState<ContrastAlgorithm>('WCAG2');

  // Photo state
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [isPhotoFullScreen, setIsPhotoFullScreen] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  // Drag ref (not state — avoids re-renders)
  const isDraggingRef = useRef(false);

  // Refs for GSAP targeting
  const rootRef = useRef<HTMLDivElement>(null);
  const specimenRef = useRef<HTMLDivElement>(null);
  const specimenInputRef = useRef<HTMLInputElement>(null);

  // Derived values
  const bg = hexToColorData(bgHex);
  const fg = hexToColorData(fgHex);
  const contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm);
  const activeThreshold = nearestThreshold(contrast.score, contrastAlgorithm);

  // GSAP context
  useGSAP(() => {}, { scope: rootRef });

  // Animate colors via GSAP instead of CSS transitions
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

  // Color handlers
  const generate = useCallback(() => {
    const pair = generateRandomPair();
    setBgHex(pair.bg);
    setFgHex(pair.fg);
  }, []);

  const swap = useCallback(() => {
    setBgHex(prev => {
      setFgHex(bgHex);
      return fgHex;
    });
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

  // Photo handlers
  const handleLoadPhoto = useCallback(async () => {
    setIsPhotoLoading(true);
    try {
      const res = await fetch('/api/photos');
      if (!res.ok) throw new Error('Failed to fetch photo');
      const data = await res.json();
      setPhotoData(data);
      setIsPhotoFullScreen(true);
    } catch (err) {
      console.error('Photo load failed:', err);
    } finally {
      setIsPhotoLoading(false);
    }
  }, []);

  const handlePhotoColorsExtracted = useCallback((newBg: string, newFg: string) => {
    setBgHex(newBg);
    setFgHex(newFg);
  }, []);

  const handlePhotoCollapse = useCallback(() => {
    setIsPhotoFullScreen(false);
  }, []);

  const handlePhotoOpen = useCallback(() => {
    setIsPhotoFullScreen(true);
  }, []);

  // Export
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== specimenInputRef.current) return;

      if (e.code === 'Space' && target !== specimenInputRef.current) {
        e.preventDefault();
        generate();
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
        handleLoadPhoto();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate, swap, toggleTheme, handleLoadPhoto]);

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

      {isPhotoFullScreen && photoData && (
        <PhotoOverlay
          photoData={photoData}
          contrastAlgorithm={contrastAlgorithm}
          onColorsExtracted={handlePhotoColorsExtracted}
          onNewPhoto={handleLoadPhoto}
          onCollapse={handlePhotoCollapse}
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
        onLoadPhoto={handleLoadPhoto}
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
