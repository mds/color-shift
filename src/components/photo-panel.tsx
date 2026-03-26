'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { PhotoData } from './control-strip';

// ── Pixel Scramble Transition ─────────────────────────────────────────
// Canvas-based: samples both photos into pixel grids, scrambles positions
// while crossfading colors from A → B, then resolves into photo B.
// No carousel library needed.

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

interface PhotoPanelProps {
  buffer: PhotoData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export function PhotoPanel({ buffer, currentIndex, onIndexChange }: PhotoPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);

  // Track loaded images
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const prevIndexRef = useRef(currentIndex);
  const rafRef = useRef<number>(0);
  const isAnimating = useRef(false);

  const PIXEL_SIZE = 12;
  const TRANSITION_DURATION = 350; // ms

  // Load an image and cache it
  const loadImage = useCallback((photo: PhotoData): Promise<HTMLImageElement> => {
    const cached = imageCache.current.get(photo.id);
    if (cached?.complete) return Promise.resolve(cached);

    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache.current.set(photo.id, img);
        resolve(img);
      };
      img.onerror = () => resolve(img);
      img.src = photo.url;
    });
  }, []);

  // Preload nearby images
  useEffect(() => {
    buffer.slice(0, Math.min(buffer.length, currentIndex + 3)).forEach(p => loadImage(p));
  }, [buffer, currentIndex, loadImage]);

  // Sample a photo into a grid of RGB values
  const sampleColors = useCallback((img: HTMLImageElement, gridW: number, gridH: number): Uint8ClampedArray => {
    const sample = document.createElement('canvas');
    sample.width = gridW;
    sample.height = gridH;
    const ctx = sample.getContext('2d');
    if (!ctx) return new Uint8ClampedArray(gridW * gridH * 4);
    ctx.drawImage(img, 0, 0, gridW, gridH);
    return ctx.getImageData(0, 0, gridW, gridH).data;
  }, []);

  // Draw the current photo (no transition)
  const drawPhoto = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  // Run the pixel scramble transition from photo A to photo B
  const runTransition = useCallback((imgA: HTMLImageElement, imgB: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const gridW = Math.ceil(w / PIXEL_SIZE);
    const gridH = Math.ceil(h / PIXEL_SIZE);
    const total = gridW * gridH;

    const colorsA = sampleColors(imgA, gridW, gridH);
    const colorsB = sampleColors(imgB, gridW, gridH);

    // Generate scramble order — which cells get replaced first
    const order = shuffleArray(Array.from({ length: total }, (_, i) => i));

    // Random offset for each pixel during scramble
    const offsets = Array.from({ length: total }, () => ({
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
    }));

    let startTs: number | null = null;
    isAnimating.current = true;

    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const raw = Math.min((ts - startTs) / TRANSITION_DURATION, 1);
      const t = easeInOutCubic(raw);

      ctx.clearRect(0, 0, w, h);

      const switchedCount = Math.floor(t * total);

      for (let i = 0; i < total; i++) {
        const col = i % gridW;
        const row = Math.floor(i / gridW);
        const pi = i * 4;

        // Has this cell switched to photo B?
        const orderIdx = order.indexOf(i);
        const isB = orderIdx < switchedCount;

        // Color: from A or B
        const src = isB ? colorsB : colorsA;
        const r = src[pi];
        const g = src[pi + 1];
        const b = src[pi + 2];

        // Position: scramble peaks at t=0.5, settles at t=1
        const scramble = Math.sin(t * Math.PI); // 0 → 1 → 0
        const ox = offsets[i].dx * scramble * PIXEL_SIZE;
        const oy = offsets[i].dy * scramble * PIXEL_SIZE;

        const x = col * PIXEL_SIZE + ox;
        const y = row * PIXEL_SIZE + oy;

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
      }

      // At the end, overlay the full photo B for crisp resolve
      if (raw >= 0.85) {
        const resolveAlpha = (raw - 0.85) / 0.15; // 0→1 over last 15%
        ctx.globalAlpha = easeInOutCubic(resolveAlpha);
        ctx.drawImage(imgB, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Final: clean photo B
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(imgB, 0, 0, w, h);
        isAnimating.current = false;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [sampleColors, PIXEL_SIZE, TRANSITION_DURATION]);

  // Handle index changes — run transition or draw static
  useEffect(() => {
    const photo = buffer[currentIndex];
    if (!photo) return;

    const prevIdx = prevIndexRef.current;
    const prevPhoto = buffer[prevIdx];
    prevIndexRef.current = currentIndex;

    if (prevIdx === currentIndex) {
      // Same photo — just draw it
      loadImage(photo).then(img => {
        if (img.complete) drawPhoto(img);
      });
      return;
    }

    // Different photo — run scramble transition
    const runIt = async () => {
      const imgB = await loadImage(photo);

      // Try to get the previous image; if not available, just draw B
      if (prevPhoto) {
        const imgA = imageCache.current.get(prevPhoto.id);
        if (imgA?.complete) {
          runTransition(imgA, imgB);
          return;
        }
      }

      // No previous image available — draw B directly
      drawPhoto(imgB);
    };

    runIt();
  }, [buffer, currentIndex, loadImage, drawPhoto, runTransition]);

  // Resize canvas to match container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Redraw current photo at new size
      const photo = buffer[currentIndex];
      if (photo) {
        const img = imageCache.current.get(photo.id);
        if (img?.complete) drawPhoto(img);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [buffer, currentIndex, drawPhoto]);

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') return;
      if (isAnimating.current) return; // don't stack transitions

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, buffer.length - 1);
        if (next !== currentIndex) onIndexChange(next);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        if (prev !== currentIndex) onIndexChange(prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, buffer.length, onIndexChange]);

  const photo = buffer[currentIndex];

  return (
    <div ref={containerRef} className="relative h-full overflow-hidden" style={{ backgroundColor: photo?.color ?? '#000' }}>
      {/* Fallback image while canvas initializes */}
      {photo && (
        <img
          ref={fallbackRef}
          src={photo.tinyUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* Canvas for transitions */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10"
      />

      {/* Attribution */}
      {photo && (
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="text-white/50 text-[10px] font-mono drop-shadow-sm">
            <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white/90">
              {photo.photographer}
            </a>
            <span> / </span>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              Unsplash
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
