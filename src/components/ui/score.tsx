// Score — contrast score pill showing rating + value
// Figma: "score" component (33:1445) — 6 variants
// Selected state uses inset box-shadow with accent color (brighter of bg/fg)

type ScoreType = 'wcag' | 'apca';
type ScoreState = 'default' | 'hovered' | 'selected';

interface ScoreProps {
  type: ScoreType;
  state?: ScoreState;
  rating: string;   // e.g. "AAA", "AA", "FAIL"
  value: string;    // e.g. "10.59:1" (WCAG) or "LC 60.0" (APCA)
  accentColor?: string;
  onClick?: () => void;
  className?: string;
}

export function Score({
  type,
  state = 'default',
  rating,
  value,
  accentColor,
  onClick,
  className,
}: ScoreProps) {
  const selectedStyle = state === 'selected'
    ? {
        backgroundColor: '#151515',
        boxShadow: `inset 0 0 0 1px ${accentColor ?? 'rgba(255,255,255,0.2)'}`,
      }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center p-2 rounded-lg shrink-0
        transition-colors duration-150
        ${state === 'hovered' ? 'bg-[#151515]' : ''}
        ${state === 'default' ? 'hover:bg-[#151515]' : ''}
        ${className ?? ''}
      `}
      style={selectedStyle}
    >
      <div className="flex items-center justify-center gap-2.5">
        <span className="font-mono text-xs text-[#a39f9f] leading-none whitespace-nowrap text-right">
          {rating}
        </span>
        <span className="font-mono text-xs text-[#a39f9f] leading-none whitespace-nowrap text-right">
          {value}
        </span>
      </div>
    </button>
  );
}
