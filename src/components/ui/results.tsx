// Results — collapsed or expanded contrast results
// Figma: "results" component (33:1351)
// collapsed: score pill + algorithm label (e.g. "AAA 10.59:1 WCAG")
// expanded: threshold buttons + selected score pill

import { Score } from './score';
import { ThresholdButtons } from './threshold-buttons';
import { CSButton } from './cs-button';

type ContrastAlgorithm = 'wcag' | 'apca';

interface ResultsProps {
  expanded: boolean;
  algorithm: ContrastAlgorithm;
  rating: string;
  value: string;
  thresholds: number[];
  activeThreshold?: number;
  onToggle?: () => void;
  onAlgorithmToggle?: () => void;
  onThresholdSelect?: (threshold: number) => void;
  className?: string;
}

export function Results({
  expanded,
  algorithm,
  rating,
  value,
  thresholds,
  activeThreshold,
  onToggle,
  onAlgorithmToggle,
  onThresholdSelect,
  className,
}: ResultsProps) {
  if (expanded) {
    return (
      <div className={`flex items-center gap-1 shrink-0 ${className ?? ''}`}>
        <ThresholdButtons
          thresholds={thresholds}
          activeThreshold={activeThreshold}
          algorithm={algorithm}
          onSelect={onThresholdSelect}
        />
        <Score
          type={algorithm}
          state="selected"
          rating={rating}
          value={value}
          onClick={onToggle}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 shrink-0 ${className ?? ''}`}>
      <Score
        type={algorithm}
        state="default"
        rating={rating}
        value={value}
        onClick={onToggle}
      />
      <CSButton
        label={algorithm === 'wcag' ? 'WCAG' : 'APCA'}
        onClick={onAlgorithmToggle}
      />
    </div>
  );
}
