// Shared SVG icons — exact paths from Figma exports (public/icons/)
// Figma: "icon / left" (19:808), "icon / right" (19:807), "icon / reverse" (22:942)

export function LeftArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 12H7M7 12L11 16M7 12L11 8" />
    </svg>
  );
}

export function RightArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 12H7M17 12L13 16M17 12L13 8" />
    </svg>
  );
}

export function SwapArrowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15C9.65685 15 6.34315 15 4 15M4 15L8 19M4 15L8 11" />
      <path d="M20 9H12M20 9L16 13M20 9L16 5" />
    </svg>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5V19M5 12H19" />
    </svg>
  );
}
