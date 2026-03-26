'use client';

import { useRef, useEffect, useCallback } from 'react';
import { gsap } from '@/lib/gsap-config';
import type { PhotoData } from './control-strip';

// ── Transition Types ──────────────────────────────────────────────────

export type TransitionType =
  | 'pixel-scramble'
  | 'staggered-reveal'
  | 'sliding-tiles'
  | 'diagonal-wipe'
  | 'mosaic-flip'
  | 'blinds'
  | 'spiral-reveal'
  | 'pixel-rain'
  | 'scatter-gather';

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  'pixel-scramble': 'Pixel Scramble',
  'staggered-reveal': 'Staggered Reveal',
  'sliding-tiles': 'Sliding Tiles',
  'diagonal-wipe': 'Diagonal Wipe',
  'mosaic-flip': 'Mosaic Flip',
  'blinds': 'Blinds',
  'spiral-reveal': 'Spiral Reveal',
  'pixel-rain': 'Pixel Rain',
  'scatter-gather': 'Scatter & Gather',
};

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

function computeSpiralOrder(rows: number, cols: number): number[] {
  const order: number[] = new Array(rows * cols).fill(0);
  let top = 0, bottom = rows - 1, left = 0, right = cols - 1, idx = 0;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) order[top * cols + c] = idx++;
    top++;
    for (let r = top; r <= bottom; r++) order[r * cols + right] = idx++;
    right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) order[bottom * cols + c] = idx++; bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) order[r * cols + left] = idx++; left++; }
  }
  return order;
}

function coverRect(img: HTMLImageElement, destW: number, destH: number) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const destRatio = destW / destH;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > destRatio) { sw = img.naturalHeight * destRatio; sx = (img.naturalWidth - sw) / 2; }
  else { sh = img.naturalWidth / destRatio; sy = (img.naturalHeight - sh) / 2; }
  return { sx, sy, sw, sh };
}

// ── Grid Cell Creator ─────────────────────────────────────────────────

function createGridCells(
  container: HTMLDivElement, imgSrc: string,
  gridSize: number, containerW: number, containerH: number,
): HTMLDivElement[] {
  const cellW = containerW / gridSize;
  const cellH = containerH / gridSize;
  const cells: HTMLDivElement[] = [];

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = document.createElement('div');
      cell.style.position = 'absolute';
      cell.style.overflow = 'hidden';
      cell.style.left = `${c * cellW}px`;
      cell.style.top = `${r * cellH}px`;
      cell.style.width = `${cellW}px`;
      cell.style.height = `${cellH}px`;

      const img = document.createElement('img');
      img.src = imgSrc;
      img.style.position = 'absolute';
      img.style.left = `${-c * cellW}px`;
      img.style.top = `${-r * cellH}px`;
      img.style.width = `${containerW}px`;
      img.style.height = `${containerH}px`;
      img.style.objectFit = 'cover';

      cell.appendChild(img);
      container.appendChild(cell);
      cells.push(cell);
    }
  }
  return cells;
}

// ── Transition Runners ────────────────────────────────────────────────

function runGridTransition(
  type: TransitionType, cells: HTMLDivElement[],
  gridSize: number, onComplete: () => void,
): gsap.core.Timeline {
  const tl = gsap.timeline({ onComplete });

  switch (type) {
    case 'staggered-reveal':
      gsap.set(cells, { scale: 0, opacity: 0 });
      tl.to(cells, { scale: 1, opacity: 1, duration: 0.4,
        stagger: { amount: 0.5, from: 'random' }, ease: 'back.out(1.4)' });
      break;

    case 'sliding-tiles': {
      const dirs = [{ x: '-100%', y: '0' }, { x: '100%', y: '0' }, { x: '0', y: '-100%' }, { x: '0', y: '100%' }];
      cells.forEach(cell => { const d = dirs[Math.floor(Math.random() * dirs.length)]; gsap.set(cell, { x: d.x, y: d.y, opacity: 0 }); });
      tl.to(cells, { x: '0%', y: '0%', opacity: 1, duration: 0.45,
        stagger: { amount: 0.4, from: 'random' }, ease: 'power3.out' });
      break;
    }

    case 'diagonal-wipe':
      gsap.set(cells, { scale: 0, opacity: 0 });
      tl.to(cells, { scale: 1, opacity: 1, duration: 0.3,
        stagger: { each: 0.025, grid: [gridSize, gridSize], from: 'start' }, ease: 'power2.out' });
      break;

    case 'mosaic-flip':
      gsap.set(cells, { rotationY: -90, opacity: 0, transformPerspective: 800 });
      tl.to(cells, { rotationY: 0, opacity: 1, duration: 0.5,
        stagger: { amount: 0.6, from: 'random' }, ease: 'power2.out' });
      break;

    case 'blinds':
      gsap.set(cells, { scaleY: 0, transformOrigin: 'top' });
      for (let r = 0; r < gridSize; r++) {
        const rowCells = cells.slice(r * gridSize, (r + 1) * gridSize);
        tl.to(rowCells, { scaleY: 1, duration: 0.35, ease: 'power2.out' }, r * 0.04);
      }
      break;

    case 'spiral-reveal': {
      const spiralOrder = computeSpiralOrder(gridSize, gridSize);
      gsap.set(cells, { scale: 0, opacity: 0 });
      cells.forEach((cell, i) => {
        tl.to(cell, { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out' }, spiralOrder[i] * 0.015);
      });
      break;
    }

    case 'pixel-rain':
      gsap.set(cells, { y: '-100%', opacity: 0 });
      tl.to(cells, { y: '0%', opacity: 1, duration: 0.35,
        stagger: { each: 0.015, grid: [gridSize, gridSize], from: 'start', axis: 'x' }, ease: 'power2.out' });
      break;

    case 'scatter-gather':
      cells.forEach(cell => {
        gsap.set(cell, { x: (Math.random() - 0.5) * 400, y: (Math.random() - 0.5) * 400,
          scale: 0.3, opacity: 0, rotation: (Math.random() - 0.5) * 60 });
      });
      tl.to(cells, { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.5,
        stagger: { amount: 0.4, from: 'edges' }, ease: 'power3.out' });
      break;

    default:
      gsap.set(cells, { scale: 0, opacity: 0 });
      tl.to(cells, { scale: 1, opacity: 1, duration: 0.4,
        stagger: { amount: 0.5, from: 'random' }, ease: 'back.out(1.4)' });
  }
  return tl;
}

// ── PhotoPanel ────────────────────────────────────────────────────────

interface PhotoPanelProps {
  buffer: PhotoData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  transition: TransitionType;
}

export function PhotoPanel({ buffer, currentIndex, onIndexChange, transition }: PhotoPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const prevIndexRef = useRef(currentIndex);
  const rafRef = useRef<number>(0);
  const isAnimating = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const PIXEL_SIZE = 24;
  const GRID_SIZE = 8;
  const photo = buffer[currentIndex];

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

  useEffect(() => {
    buffer.slice(0, Math.min(buffer.length, currentIndex + 3)).forEach(p => loadImage(p));
  }, [buffer, currentIndex, loadImage]);

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

  const drawPhoto = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const crop = coverRect(img, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
  }, []);

  const sampleColors = useCallback((img: HTMLImageElement, gridW: number, gridH: number): Uint8ClampedArray => {
    const sample = document.createElement('canvas');
    sample.width = gridW; sample.height = gridH;
    const ctx = sample.getContext('2d');
    if (!ctx) return new Uint8ClampedArray(gridW * gridH * 4);
    const crop = coverRect(img, gridW, gridH);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, gridW, gridH);
    return ctx.getImageData(0, 0, gridW, gridH).data;
  }, []);

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
        isAnimating.current = false;
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [sampleColors, PIXEL_SIZE]);

  const clearGridLayer = useCallback(() => {
    const layer = gridLayerRef.current;
    if (layer) { while (layer.firstChild) layer.removeChild(layer.firstChild); }
  }, []);

  const runGsapTransition = useCallback((imgB: HTMLImageElement, transType: TransitionType) => {
    const container = containerRef.current;
    const gridLayer = gridLayerRef.current;
    if (!container || !gridLayer) return;
    if (timelineRef.current) timelineRef.current.kill();
    clearGridLayer();
    const rect = container.getBoundingClientRect();
    const cells = createGridCells(gridLayer, imgB.src, GRID_SIZE, rect.width, rect.height);
    isAnimating.current = true;
    timelineRef.current = runGridTransition(transType, cells, GRID_SIZE, () => {
      drawPhoto(imgB);
      clearGridLayer();
      isAnimating.current = false;
    });
  }, [GRID_SIZE, drawPhoto, clearGridLayer]);

  useEffect(() => {
    const p = buffer[currentIndex];
    if (!p) return;
    const prevIdx = prevIndexRef.current;
    const prevPhoto = buffer[prevIdx];
    prevIndexRef.current = currentIndex;
    syncCanvasSize();
    if (prevIdx === currentIndex) {
      loadImage(p).then(img => { if (img.complete) drawPhoto(img); });
      return;
    }
    const runIt = async () => {
      const imgB = await loadImage(p);
      if (transition === 'pixel-scramble') {
        if (prevPhoto) {
          const imgA = imageCache.current.get(prevPhoto.id);
          if (imgA?.complete) { runPixelScramble(imgA, imgB); return; }
        }
        drawPhoto(imgB);
      } else {
        runGsapTransition(imgB, transition);
      }
    };
    runIt();
  }, [buffer, currentIndex, loadImage, drawPhoto, runPixelScramble, runGsapTransition, syncCanvasSize, transition]);

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

  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); if (timelineRef.current) timelineRef.current.kill(); };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden" style={{ backgroundColor: photo?.color ?? '#000' }}>
      {photo && (
        <img src={photo.tinyUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
      <div ref={gridLayerRef} className="absolute inset-0 z-20" />
      {photo && (
        <div className="absolute bottom-3 left-3 right-3 z-30">
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
