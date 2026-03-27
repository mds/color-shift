// Grip — expand/collapse handle for the slider panel
// Figma: "grip" component (33:2128) — 2 states: expanded=false, expanded=true

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
      className={`flex items-center justify-center size-6 ${className ?? ''}`}
      aria-label={expanded ? 'Collapse sliders' : 'Expand sliders'}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`text-[#a39f9f] transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}
      >
        <path d="M6 15L12 9L18 15" />
      </svg>
    </button>
  );
}
