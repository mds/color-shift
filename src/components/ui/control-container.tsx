// ControlContainer — the full bottom panel orchestrator
// Figma: "control container" component (33:2305)
// Contains: color mode row + color sliders + controls bar
// This is the "big boy" — the single parent that holds the entire bottom UI

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
  trackGradient: string;
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
    <div className={`flex flex-col gap-4 bg-black p-2 w-full ${className ?? ''}`}>
      {/* Slider panel — collapsible */}
      {slidersExpanded && (
        <div className="flex flex-col gap-2 w-full">
          <ColorMode
            mode={sliderMode}
            onModeChange={onSliderModeChange}
            showClose
            onClose={onSlidersClose}
            className="w-full"
          />
          <ColorSliders
            sliders={sliders}
            onChange={onSliderChange}
            onDragStart={onSliderDragStart}
            onDragEnd={onSliderDragEnd}
          />
        </div>
      )}

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
