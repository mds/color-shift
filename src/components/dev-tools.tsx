'use client';

import { DialRoot } from 'dialkit';
import { InterfaceKit } from 'interface-kit/react';

export function DevTools() {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <>
      <DialRoot />
      <InterfaceKit />
    </>
  );
}
