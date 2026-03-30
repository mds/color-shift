// Grip — expand/collapse handle for the slider panel
// Figma: "grip" component (33:2128)
// Collapsed: small 8px white dot centered in 24px hit area
// Expanded: 24px translucent circle (white/20)
// Animates size + color between states

interface GripProps {
  expanded: boolean;
  onClick?: () => void;
  className?: string;
}

export function Grip({ expanded, onClick, className }: GripProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative size-6 flex items-center justify-center no-press ${className ?? ''}`}
      aria-label={expanded ? 'Collapse sliders' : 'Expand sliders'}
    >
      <div
        className="rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          width: expanded ? 24 : 8,
          height: expanded ? 24 : 8,
          backgroundColor: expanded ? 'rgba(255,255,255,0.2)' : 'white',
          boxShadow: expanded ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      />
    </button>
  );
}
