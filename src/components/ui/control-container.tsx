// ControlContainer — the full bottom panel orchestrator
// Figma: "control container" component (33:2305)
// Contains: color mode row + color sliders + controls bar
// Slider panel animates -Y (slides up from below) on expand/collapse

import { ColorMode } from './color-mode';
import { ColorSliders } from './color-sliders';
import { ControlsBar } from './controls-bar';

type SliderMode = 'OKLCH' | 'HSB' | 'RGB';

interface SliderConfig {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  gradients: { oklch: string; hsb: string; rgb: string };
  trackDark?: boolean;
}

interface ControlContainerProps {
  // Slider panel
  slidersExpanded: boolean;
  sliderMode: SliderMode;
  sliders: [SliderConfig, SliderConfig, SliderConfig];
  onSliderModeChange?: (mode: SliderMode) => void;
  onSliderChange?: (index: number, value: number) => void;
  onSliderDragStart?: () => void;
  onSliderDragEnd?: () => void;
  onSlidersClose?: () => void;

  // Controls bar
  controlsState: 'default' | 'score' | 'export';
  bgHex: string;
  fgHex: string;
  bgState?: 'default' | 'hover' | 'selected';
  fgState?: 'default' | 'hover' | 'selected';
  algorithm: 'wcag' | 'apca';
  rating: string;
  contrastValue: string;
  thresholds: number[];
  activeThreshold?: number;
  onBgClick?: () => void;
  onFgClick?: () => void;
  onSwap?: () => void;
  onResultsToggle?: () => void;
  onAlgorithmToggle?: () => void;
  onThresholdSelect?: (threshold: number) => void;
  onLeftArrow?: () => void;
  onRightArrow?: () => void;
  onExportToggle?: () => void;
  onCopyUrl?: () => void;
  onDownloadMd?: () => void;
  onExport?: () => void;

  className?: string;
}

export function ControlContainer({
  slidersExpanded,
  sliderMode,
  sliders,
  onSliderModeChange,
  onSliderChange,
  onSliderDragStart,
  onSliderDragEnd,
  onSlidersClose,
  controlsState,
  bgHex,
  fgHex,
  bgState,
  fgState,
  algorithm,
  rating,
  contrastValue,
  thresholds,
  activeThreshold,
  onBgClick,
  onFgClick,
  onSwap,
  onResultsToggle,
  onAlgorithmToggle,
  onThresholdSelect,
  onLeftArrow,
  onRightArrow,
  onExportToggle,
  onCopyUrl,
  onDownloadMd,
  onExport,
  className,
}: ControlContainerProps) {
  return (
    <div className={`flex flex-col bg-black p-2 w-full ${className ?? ''}`}>
      {/* Slider panel — always mounted, animated with CSS grid rows + transform */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ gridTemplateRows: slidersExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div
            className="flex flex-col gap-2 w-full pb-4 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              opacity: slidersExpanded ? 1 : 0,
              transform: slidersExpanded ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            <ColorMode
              mode={sliderMode}
              onModeChange={onSliderModeChange}
              showClose
              onClose={onSlidersClose}
              className="w-full"
            />
            <ColorSliders
              sliders={sliders}
              activeMode={sliderMode}
              onChange={onSliderChange}
              onDragStart={onSliderDragStart}
              onDragEnd={onSliderDragEnd}
            />
          </div>
        </div>
      </div>

      {/* Controls bar — always visible */}
      <ControlsBar
        state={controlsState}
        bgHex={bgHex}
        fgHex={fgHex}
        bgState={bgState}
        fgState={fgState}
        algorithm={algorithm}
        rating={rating}
        contrastValue={contrastValue}
        thresholds={thresholds}
        activeThreshold={activeThreshold}
        onBgClick={onBgClick}
        onFgClick={onFgClick}
        onSwap={onSwap}
        onResultsToggle={onResultsToggle}
        onAlgorithmToggle={onAlgorithmToggle}
        onThresholdSelect={onThresholdSelect}
        onLeftArrow={onLeftArrow}
        onRightArrow={onRightArrow}
        onExportToggle={onExportToggle}
        onCopyUrl={onCopyUrl}
        onDownloadMd={onDownloadMd}
        onExport={onExport}
      />
    </div>
  );
}
