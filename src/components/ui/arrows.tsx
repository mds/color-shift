// Arrows — left/right navigation arrows
// Figma: "arrows" component (33:1592)
// Each arrow animated individually via leftRef/rightRef

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { IconButton } from './icon-button';
import { LeftArrowIcon, RightArrowIcon } from './icons';

export interface ArrowsHandle {
  leftEl: HTMLButtonElement | null;
  rightEl: HTMLButtonElement | null;
}

interface ArrowsProps {
  onLeft?: () => void;
  onRight?: () => void;
  className?: string;
}

export const Arrows = forwardRef<ArrowsHandle, ArrowsProps>(
  ({ onLeft, onRight, className }, ref) => {
    const leftRef = useRef<HTMLButtonElement>(null);
    const rightRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
      get leftEl() { return leftRef.current; },
      get rightEl() { return rightRef.current; },
    }));

    return (
      <div className={`flex items-center justify-end gap-1 ${className ?? ''}`}>
        <IconButton ref={leftRef} onClick={onLeft}>
          <LeftArrowIcon className="size-6 text-[#a39f9f]" />
        </IconButton>
        <IconButton ref={rightRef} onClick={onRight}>
          <RightArrowIcon className="size-6 text-[#a39f9f]" />
        </IconButton>
      </div>
    );
  }
);

Arrows.displayName = 'Arrows';
