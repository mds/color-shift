'use client';

import { useEffect, useRef, useState } from 'react';
import { DialRoot } from 'dialkit';
import 'dialkit/styles.css';

const STORAGE_KEY = 'dialkit-position';

export function DialKitWrapper() {
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Defer mount to client-only to avoid SSR hydration mismatch
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPos(JSON.parse(stored));
    } catch {}
  }, []);

  // Persist position
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {}
  }, [pos, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onMove = (e: PointerEvent) => {
      const s = dragState.current;
      if (!s) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 40;
      setPos({
        x: Math.max(0, Math.min(maxX, s.origX + dx)),
        y: Math.max(0, Math.min(maxY, s.origY + dy)),
      });
    };
    const onUp = () => { dragState.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [mounted]);

  // Attach drag handler to the DialKit panel header once it appears
  useEffect(() => {
    if (!mounted) return;
    const attachDrag = () => {
      const header = document.querySelector('.dialkit-panel-header') as HTMLElement | null;
      if (!header) return false;
      header.style.cursor = 'grab';
      header.addEventListener('pointerdown', (e) => {
        // Ignore clicks on buttons/interactive children
        const target = e.target as HTMLElement;
        if (target.closest('button, input, select, [role="button"]')) return;
        e.preventDefault();
        dragState.current = {
          startX: e.clientX,
          startY: e.clientY,
          origX: pos.x,
          origY: pos.y,
        };
      });
      return true;
    };
    // Retry until the panel mounts
    if (!attachDrag()) {
      const id = setInterval(() => {
        if (attachDrag()) clearInterval(id);
      }, 100);
      return () => clearInterval(id);
    }
  }, [mounted, pos.x, pos.y]);

  if (process.env.NODE_ENV !== 'development') return null;
  if (!mounted) return null;

  return (
    <>
      <style>{`
        /* Override DialKit's static corner positioning with our own coordinates */
        .dialkit-panel[data-position] {
          top: ${pos.y}px !important;
          left: ${pos.x}px !important;
          right: auto !important;
          bottom: auto !important;
        }
      `}</style>
      <DialRoot defaultOpen={false} />
    </>
  );
}
