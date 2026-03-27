// ControlsBar — full toolbar row with 3 states
// Figma: "controls" component (33:2263)
// state=default: swatches | results | arrows + export
// state=score:   swatches | expanded results (thresholds + selected score)
// state=export:  swatches | results | expanded export (copy url, download, export)

import { Swatches } from './swatches';
import { Results } from './results';
import { Arrows } from './arrows';
import { ExportPanel } from './export-panel';

type ControlsState = 'default' | 'score' | 'export';

interface ControlsBarProps {
  state: ControlsState;
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

export function ControlsBar({
  state,
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
}: ControlsBarProps) {
  return (
    <div className={`flex items-center justify-between bg-black w-full ${className ?? ''}`}>
      {/* Left: swatches */}
      <Swatches
        bgHex={bgHex}
        fgHex={fgHex}
        bgState={bgState}
        fgState={fgState}
        onBgClick={onBgClick}
        onFgClick={onFgClick}
        onSwap={onSwap}
      />

      {/* Center: results */}
      <Results
        expanded={state === 'score'}
        algorithm={algorithm}
        rating={rating}
        value={contrastValue}
        thresholds={thresholds}
        activeThreshold={activeThreshold}
        onToggle={onResultsToggle}
        onAlgorithmToggle={onAlgorithmToggle}
        onThresholdSelect={onThresholdSelect}
      />

      {/* Right container: arrows & export — single unit, content swaps per state */}
      {state !== 'score' && (
        <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0">
          {state === 'default' && (
            <>
              <Arrows onLeft={onLeftArrow} onRight={onRightArrow} />
              <ExportPanel expanded={false} onToggle={onExportToggle} />
            </>
          )}
          {state === 'export' && (
            <ExportPanel
              expanded
              onCopyUrl={onCopyUrl}
              onDownloadMd={onDownloadMd}
              onExport={onExport}
            />
          )}
        </div>
      )}
    </div>
  );
}
