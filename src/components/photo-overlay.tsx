'use client';

import { useState, useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap-config';
import { extractContrastPair } from '@/lib/color-engine';
import type { PhotoData } from './control-strip';
import type { ContrastAlgorithm } from '@/lib/color-engine';

interface PhotoOverlayProps {
  photoData: PhotoData;
  contrastAlgorithm: ContrastAlgorithm;
  onColorsExtracted: (bg: string, fg: string) => void;
  onNewPhoto: () => void;
  onCollapse: () => void;
}

export function PhotoOverlay({
  photoData, contrastAlgorithm, onColorsExtracted, onNewPhoto, onCollapse,
}: PhotoOverlayProps) {
  const [colorsReady, setColorsReady] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Animate in
  useEffect(() => {
    if (overlayRef.current) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, []);

  const handleImageLoad = async () => {
    if (!imgRef.current || extracting) return;
    setExtracting(true);

    try {
      const { Vibrant } = await import('node-vibrant/browser');
      const palette = await Vibrant.from(imgRef.current).getPalette();

      // Map vibrant palette to our interface
      const mapped = {
        Vibrant: palette.Vibrant ? { hex: palette.Vibrant.hex, population: palette.Vibrant.population } : null,
        DarkVibrant: palette.DarkVibrant ? { hex: palette.DarkVibrant.hex, population: palette.DarkVibrant.population } : null,
        LightVibrant: palette.LightVibrant ? { hex: palette.LightVibrant.hex, population: palette.LightVibrant.population } : null,
        Muted: palette.Muted ? { hex: palette.Muted.hex, population: palette.Muted.population } : null,
        DarkMuted: palette.DarkMuted ? { hex: palette.DarkMuted.hex, population: palette.DarkMuted.population } : null,
        LightMuted: palette.LightMuted ? { hex: palette.LightMuted.hex, population: palette.LightMuted.population } : null,
      };

      const pair = extractContrastPair(mapped, contrastAlgorithm);
      if (pair) {
        setColorsReady(true);
        onColorsExtracted(pair.bg, pair.fg);
      }
    } catch (err) {
      console.error('Color extraction failed:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleCollapse = () => {
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: onCollapse,
      });
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: photoData.color }}
    >
      {/* Photo */}
      <img
        ref={imgRef}
        src={photoData.url}
        alt={photoData.alt}
        crossOrigin="anonymous"
        onLoad={handleImageLoad}
        className="w-full h-full object-cover"
      />

      {/* Overlay controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-end justify-between">
          {/* Attribution */}
          <div className="text-white/70 text-[11px] font-mono">
            <span>Photo by </span>
            <a
              href={photoData.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline underline-offset-2"
            >
              {photoData.photographer}
            </a>
            <span> on </span>
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline underline-offset-2"
            >
              Unsplash
            </a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {extracting && (
              <span className="text-white/50 text-[11px] font-mono">Extracting...</span>
            )}
            <button
              onClick={onNewPhoto}
              className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/90 text-[12px] font-mono hover:bg-white/25 transition-colors"
            >
              New Photo
            </button>
            <button
              onClick={handleCollapse}
              disabled={!colorsReady && !extracting}
              className="px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm text-white/90 text-[12px] font-mono hover:bg-white/25 transition-colors disabled:opacity-30"
            >
              Use Colors
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
