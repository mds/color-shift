'use client';

import { DialRoot, useDialKit } from 'dialkit';
import { InterfaceKit } from 'interface-kit/react';
import { useEffect } from 'react';

function MotionDials() {
  const values = useDialKit('Motion', {
    'Color Duration': { min: 0.1, max: 2, step: 0.05, default: 0.4 },
    'Photo Duration': { min: 0.1, max: 2, step: 0.05, default: 0.6 },
    'Photo Opacity': { min: 0, max: 1, step: 0.05, default: 0.3 },
    'Squish Scale': { min: 0.5, max: 1, step: 0.01, default: 0.85 },
    'Squish Duration': { min: 0.05, max: 0.5, step: 0.01, default: 0.15 },
    'Pop Scale': { min: 1, max: 1.5, step: 0.01, default: 1.05 },
    'Pop Duration': { min: 0.05, max: 0.5, step: 0.01, default: 0.1 },
    'Exit Duration': { min: 0.1, max: 1, step: 0.05, default: 0.25 },
    'Enter Duration': { min: 0.1, max: 1, step: 0.05, default: 0.35 },
    'Enter Overshoot': { min: 0, max: 4, step: 0.1, default: 1.4 },
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-duration', String(values['Color Duration']));
    root.style.setProperty('--photo-duration', String(values['Photo Duration']));
    root.style.setProperty('--photo-opacity', String(values['Photo Opacity']));
    root.style.setProperty('--squish-scale', String(values['Squish Scale']));
    root.style.setProperty('--squish-duration', String(values['Squish Duration']));
    root.style.setProperty('--pop-scale', String(values['Pop Scale']));
    root.style.setProperty('--pop-duration', String(values['Pop Duration']));
    root.style.setProperty('--exit-duration', String(values['Exit Duration']));
    root.style.setProperty('--enter-duration', String(values['Enter Duration']));
    root.style.setProperty('--enter-overshoot', String(values['Enter Overshoot']));
  }, [values]);

  return null;
}

export function DevTools() {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <>
      <DialRoot defaultOpen>
        <MotionDials />
      </DialRoot>
      <InterfaceKit />
    </>
  );
}
