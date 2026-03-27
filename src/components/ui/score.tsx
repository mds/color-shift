// Score — contrast score pill showing rating + value
// Figma: "score" component (33:1445) — 6 variants
// score: wcag | apca, state: default | hovered | selected

type ScoreType = 'wcag' | 'apca';
type ScoreState = 'default' | 'hovered' | 'selected';

interface ScoreProps {
  type: ScoreType;
  state?: ScoreState;
  rating: string;   // e.g. "AAA", "AA", "FAIL"
  value: string;    // e.g. "10.59:1" (WCAG) or "LC 60.0" (APCA)
  onClick?: () => void;
  className?: string;
}

export function Score({
  type,
  state = 'default',
  rating,
  value,
  onClick,
  className,
}: ScoreProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center justify-center p-2 rounded-lg shrink-0
        transition-colors duration-150
        ${state === 'selected' ? 'bg-[#151515] border border-[#c9a7ff]' : ''}
        ${state === 'hovered' ? 'bg-[#151515]' : ''}
        ${state === 'default' ? 'hover:bg-[#151515]' : ''}
        ${className ?? ''}
      `}
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
