// Arrows — left/right navigation arrows
// Figma: "arrows" component (33:1592)

import { IconButton } from './icon-button';
import { LeftArrowIcon, RightArrowIcon } from './icons';

interface ArrowsProps {
  onLeft?: () => void;
  onRight?: () => void;
  className?: string;
}

export function Arrows({ onLeft, onRight, className }: ArrowsProps) {
  return (
    <div className={`flex items-center justify-end gap-1 flex-1 min-w-0 ${className ?? ''}`}>
      <IconButton onClick={onLeft}>
        <LeftArrowIcon className="size-6 text-[#a39f9f]" />
      </IconButton>
      <IconButton onClick={onRight}>
        <RightArrowIcon className="size-6 text-[#a39f9f]" />
      </IconButton>
    </div>
  );
}
