'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { Controls } from './controls';

export function ColorShift() {
  const [bgHex, setBgHex] = useState('#1A1A2E');
  const [fgHex, setFgHex] = useState('#E8D5B7');
  const [colorFormat, setColorFormat] = useState<ColorFormat>('HEX');
  const [specimenText, setSpecimenText] = useState('Aa');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [sliderMode, setSliderMode] = useState<SliderMode>('HSB');
  const [contrastAlgorithm, setContrastAlgorithm] = useState<ContrastAlgorithm>('WCAG2');
  const [isDragging, setIsDragging] = useState(false);

  const bg = hexToColorData(bgHex);
  const fg = hexToColorData(fgHex);
  const contrast = getContrastResult(bgHex, fgHex, contrastAlgorithm);
  const activeThreshold = nearestThreshold(contrast.score, contrastAlgorithm);

  const generate = useCallback(() => {
    const pair = generateRandomPair();
    setBgHex(pair.bg);
    setFgHex(pair.fg);
  }, []);

  const swap = useCallback(() => {
    const tempBg = bgHex;
    const tempFg = fgHex;
    setBgHex(tempFg);
    setFgHex(tempBg);
  }, [bgHex, fgHex]);

  const updateBgHsb = useCallback((hsb: HSB) => {
    setBgHex(hsbToHex(hsb));
  }, []);

  const updateFgHsb = useCallback((hsb: HSB) => {
    setFgHex(hsbToHex(hsb));
  }, []);

  const updateBgOklch = useCallback((oklch: OklchValues) => {
    setBgHex(oklchToHex(oklch));
  }, []);

  const updateFgOklch = useCallback((oklch: OklchValues) => {
    setFgHex(oklchToHex(oklch));
  }, []);

  const toggleSliderMode = useCallback(() => {
    setSliderMode(m => (m === 'HSB' ? 'OKLCH' : 'HSB'));
  }, []);

  const toggleContrastAlgorithm = useCallback(() => {
    setContrastAlgorithm(a => (a === 'WCAG2' ? 'APCA' : 'WCAG2'));
  }, []);

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

  const cycleFormat = useCallback(() => {
    const formats: ColorFormat[] = ['HEX', 'RGB', 'HSL', 'HSB', 'OKLCH'];
    setColorFormat(f => formats[(formats.indexOf(f) + 1) % formats.length]);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleBgInput = useCallback((value: string) => {
    const hex = parseAnyColor(value);
    if (hex) setBgHex(hex);
  }, []);

  const handleFgInput = useCallback((value: string) => {
    const hex = parseAnyColor(value);
    if (hex) setFgHex(hex);
  }, []);

  const copyExport = useCallback(async () => {
    const md = generateExportMarkdown(bg, fg, contrast, contrastAlgorithm);
    await navigator.clipboard.writeText(md);
  }, [bg, fg, contrast, contrastAlgorithm]);

  const downloadExport = useCallback(() => {
    const md = generateExportMarkdown(bg, fg, contrast, contrastAlgorithm);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-shift-${bg.hex.slice(1)}-${fg.hex.slice(1)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bg, fg, contrast, contrastAlgorithm]);

  // Keyboard shortcuts
  const specimenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && target !== specimenRef.current) return;

      if (e.code === 'Space' && target !== specimenRef.current) {
        e.preventDefault();
        generate();
      }
      if ((e.key === 's' || e.key === 'S') && !e.metaKey && !e.ctrlKey && target !== specimenRef.current) {
        e.preventDefault();
        swap();
      }
      if (e.key === 't' || e.key === 'T') {
        if (!e.metaKey && !e.ctrlKey && target !== specimenRef.current) {
          e.preventDefault();
          toggleTheme();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generate, swap, toggleTheme]);

  const transitionStyle = isDragging
    ? 'none'
    : 'background-color 400ms ease-out, color 400ms ease-out';

  return (
    <div
      className="h-screen flex flex-col"
      data-theme={theme}
      style={{ backgroundColor: bgHex, transition: transitionStyle }}
    >
      <Specimen
        bgHex={bgHex}
        fgHex={fgHex}
        text={specimenText}
        onTextChange={setSpecimenText}
        transition={transitionStyle}
        inputRef={specimenRef}
      />
      <div className="p-4 shrink-0" style={{ transition: transitionStyle }}>
      <Controls
        bg={bg}
        fg={fg}
        bgHex={bgHex}
        fgHex={fgHex}
        colorFormat={colorFormat}
        contrast={contrast}
        activeThreshold={activeThreshold}
        theme={theme}
        sliderMode={sliderMode}
        contrastAlgorithm={contrastAlgorithm}
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
        onCopy={copyExport}
        onDownload={downloadExport}
        onToggleTheme={toggleTheme}
        onToggleSliderMode={toggleSliderMode}
        onToggleContrastAlgorithm={toggleContrastAlgorithm}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        formatColorValue={formatColorValue}
      />
      </div>
    </div>
  );
}
