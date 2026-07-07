'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { PhotoData } from './control-strip';

// ── Helpers ───────────────────────────────────────────────────────────

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function coverRect(img: HTMLImageElement, destW: number, destH: number) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const destRatio = destW / destH;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > destRatio) { sw = img.naturalHeight * destRatio; sx = (img.naturalWidth - sw) / 2; }
  else { sh = img.naturalWidth / destRatio; sy = (img.naturalHeight - sh) / 2; }
  return { sx, sy, sw, sh };
}

// ── PhotoPanel ────────────────────────────────────────────────────────

interface PhotoPanelProps {
  buffer: PhotoData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function PhotoPanel({ buffer, currentIndex, onIndexChange }: PhotoPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const prevIndexRef = useRef(currentIndex);
  const [displayedIndex, setDisplayedIndex] = useState(currentIndex);
  const rafRef = useRef<number>(0);
  const isAnimating = useRef(false);

  const PIXEL_SIZE = 24;
  const photo = buffer[currentIndex];
  const displayedPhoto = buffer[displayedIndex];

  // Load + cache images
  const loadImage = useCallback((p: PhotoData): Promise<HTMLImageElement> => {
    const cached = imageCache.current.get(p.id);
    if (cached?.complete) return Promise.resolve(cached);
    return new Promise(resolve => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { imageCache.current.set(p.id, img); resolve(img); };
      img.onerror = () => resolve(img);
      img.src = p.url;
    });
  }, []);

  // Preload nearby
  useEffect(() => {
    buffer.slice(0, Math.min(buffer.length, currentIndex + 3)).forEach(p => loadImage(p));
  }, [buffer, currentIndex, loadImage]);

  // Sync canvas pixel dimensions
  const syncCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.round(rect.width * dpr);
    const ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  }, []);

  // Draw photo to canvas (aspect-correct)
  const drawPhoto = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const crop = coverRect(img, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
  }, []);

  // Sample colors for pixel scramble
  const sampleColors = useCallback((img: HTMLImageElement, gridW: number, gridH: number): Uint8ClampedArray => {
    const sample = document.createElement('canvas');
    sample.width = gridW; sample.height = gridH;
    const ctx = sample.getContext('2d');
    if (!ctx) return new Uint8ClampedArray(gridW * gridH * 4);
    const crop = coverRect(img, gridW, gridH);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, gridW, gridH);
    return ctx.getImageData(0, 0, gridW, gridH).data;
  }, []);

  // Pixel scramble transition
  const runPixelScramble = useCallback((imgA: HTMLImageElement, imgB: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    const gridW = Math.ceil(w / PIXEL_SIZE), gridH = Math.ceil(h / PIXEL_SIZE);
    const total = gridW * gridH;
    const colorsA = sampleColors(imgA, gridW, gridH);
    const colorsB = sampleColors(imgB, gridW, gridH);
    const order = shuffleArray(Array.from({ length: total }, (_, i) => i));
    let startTs: number | null = null;
    isAnimating.current = true;

    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const raw = Math.min((ts - startTs) / 350, 1);
      const t = easeInOutCubic(raw);
      ctx.clearRect(0, 0, w, h);
      const switchedCount = Math.floor(t * total);
      for (let i = 0; i < total; i++) {
        const col = i % gridW, row = Math.floor(i / gridW), pi = i * 4;
        const src = order.indexOf(i) < switchedCount ? colorsB : colorsA;
        ctx.fillStyle = `rgb(${src[pi]},${src[pi + 1]},${src[pi + 2]})`;
        ctx.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
      if (raw >= 0.85) {
        ctx.globalAlpha = easeInOutCubic((raw - 0.85) / 0.15);
        const crop = coverRect(imgB, w, h);
        ctx.drawImage(imgB, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      if (raw < 1) rafRef.current = requestAnimationFrame(animate);
      else {
        ctx.clearRect(0, 0, w, h);
        const crop = coverRect(imgB, w, h);
        ctx.drawImage(imgB, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, w, h);
        setDisplayedIndex(currentIndex);
        isAnimating.current = false;
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [sampleColors, PIXEL_SIZE, currentIndex]);

  // Handle index changes
  useEffect(() => {
    const p = buffer[currentIndex];
    if (!p) return;
    const prevIdx = prevIndexRef.current;
    const prevPhoto = buffer[prevIdx];
    prevIndexRef.current = currentIndex;
    syncCanvasSize();

    if (prevIdx === currentIndex) {
      loadImage(p).then(img => { if (img.complete) { drawPhoto(img); setDisplayedIndex(currentIndex); } });
      return;
    }

    const runIt = async () => {
      const imgB = await loadImage(p);
      if (prevPhoto) {
        const imgA = imageCache.current.get(prevPhoto.id);
        if (imgA?.complete) { runPixelScramble(imgA, imgB); return; }
      }
      drawPhoto(imgB);
      setDisplayedIndex(currentIndex);
    };
    runIt();
  }, [buffer, currentIndex, loadImage, drawPhoto, runPixelScramble, syncCanvasSize]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    syncCanvasSize();
    const observer = new ResizeObserver(() => {
      syncCanvasSize();
      const p = buffer[currentIndex];
      if (p) { const img = imageCache.current.get(p.id); if (img?.complete) drawPhoto(img); }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [buffer, currentIndex, drawPhoto, syncCanvasSize]);

  // Arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;
      if (isAnimating.current) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); const n = Math.min(currentIndex + 1, buffer.length - 1); if (n !== currentIndex) onIndexChange(n); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); const p = Math.max(currentIndex - 1, 0); if (p !== currentIndex) onIndexChange(p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, buffer.length, onIndexChange]);

  // Cleanup
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden" style={{ backgroundColor: displayedPhoto?.color ?? '#0f0e0f' }}>
      {displayedPhoto && (
        <img src={displayedPhoto.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
      {photo && (
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
            <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">{photo.photographer}</a>
            <span> / </span>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">Unsplash</a>
          </div>
        </div>
      )}
    </div>
  );
}
