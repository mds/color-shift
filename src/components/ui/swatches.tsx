// Swatches — bg color button + swap icon + fg color button
// Figma: "swatches" component (33:1206)

import { CSButton } from './cs-button';
import { IconButton } from './icon-button';
import { SwapArrowsIcon } from './icons';

interface SwatchesProps {
  bgHex: string;
  fgHex: string;
  bgState?: 'default' | 'hover' | 'selected';
  fgState?: 'default' | 'hover' | 'selected';
  onBgClick?: () => void;
  onFgClick?: () => void;
  onSwap?: () => void;
  className?: string;
}

export function Swatches({
  bgHex,
  fgHex,
  bgState = 'default',
  fgState = 'default',
  onBgClick,
  onFgClick,
  onSwap,
  className,
}: SwatchesProps) {
  return (
    <div className={`flex items-center gap-1 flex-1 min-w-0 ${className ?? ''}`}>
      <CSButton
        label={bgHex.replace('#', '').toUpperCase()}
        swatchColor={bgHex}
        accentColor={bgHex}
        state={bgState}
        animated
        onClick={onBgClick}
      />
      <IconButton onClick={onSwap}>
        <SwapArrowsIcon className="size-6 text-[#a39f9f]" />
      </IconButton>
      <CSButton
        label={fgHex.replace('#', '').toUpperCase()}
        swatchColor={fgHex}
        accentColor={fgHex}
        state={fgState}
        animated
        onClick={onFgClick}
      />
    </div>
  );
}
