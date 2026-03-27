// ExportPanel — collapsed or expanded export options
// Figma: "export" component (33:1878)
// collapsed: "EXPORT" label
// expanded: COPY URL | DOWNLOAD .MD | EXPORT (selected)

import { CSButton } from './cs-button';

interface ExportPanelProps {
  expanded: boolean;
  onToggle?: () => void;
  onCopyUrl?: () => void;
  onDownloadMd?: () => void;
  onExport?: () => void;
  className?: string;
}

export function ExportPanel({
  expanded,
  onToggle,
  onCopyUrl,
  onDownloadMd,
  onExport,
  className,
}: ExportPanelProps) {
  if (expanded) {
    return (
      <div className={`flex items-start gap-1 shrink-0 ${className ?? ''}`}>
        <CSButton label="COPY URL" onClick={onCopyUrl} />
        <CSButton label="DOWNLOAD .MD" onClick={onDownloadMd} />
        <CSButton label="EXPORT" state="selected" onClick={onExport} />
      </div>
    );
  }

  return (
    <div className={`flex items-start shrink-0 ${className ?? ''}`}>
      <CSButton label="EXPORT" onClick={onToggle} />
    </div>
  );
}
