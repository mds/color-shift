'use client';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Flip } from 'gsap/Flip';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(Flip, MorphSVGPlugin, Draggable, InertiaPlugin, useGSAP);

export { Draggable };
gsap.defaults({ ease: 'power2.out', duration: 0.4 });

// Reduced motion: make all GSAP animations effectively instant
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    gsap.globalTimeline.timeScale(1000);
  }
  mq.addEventListener('change', (e) => {
    gsap.globalTimeline.timeScale(e.matches ? 1000 : 1);
  });
}

export { gsap, Flip, useGSAP };
