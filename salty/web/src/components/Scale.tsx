import type { VerdictId } from "@/lib/pay/verdict";

/** How each verdict colours a flat fill, a tag or a block. Text colour included so contrast always holds. */
export const VERDICT_TONE: Record<VerdictId, string> = {
  "extra-salty": "bg-chilli text-ink",
  salty: "bg-amber text-ink",
  fair: "bg-ink text-salt",
  seasoned: "bg-brine text-white",
  "top-shelf": "bg-zest text-ink",
};

export type ScalePoint = { at: number; label: string; main?: boolean };

type Props = {
  /** Where the marker sits, 0 to 100. */
  place: number;
  /** Published pay points to mark under the bar. */
  points: ScalePoint[];
  /** Words under the left, middle and right of the bar. */
  ends: [string, string, string];
  tone: VerdictId;
  /** A dashed outline: this is a rough range, not measured data. */
  rough?: boolean;
  marker?: string;
  className?: string;
};

/**
 * The bar a result is read from. The filled part is everyone paid less than the marker, in one
 * flat colour; the ticks underneath are real published pay points. `useReveal` animates the
 * marker and the fill when a result arrives; without it the bar is simply drawn in place.
 */
export function Scale({ place, points, ends, tone, rough = false, marker = "You", className = "" }: Props) {
  const at = Math.min(97, Math.max(3, place));
  return (
    <div className={className}>
      <div className="relative h-[5.75rem]">
        {/* A full-width carrier moved by a transform, so the marker can glide without the page re-laying out. */}
        <div data-scale-you data-at={at} className="pointer-events-none absolute inset-x-0 top-0" style={{ transform: `translateX(${at}%)` }}>
          <div className="absolute left-0 -translate-x-1/2">
            <div className="tag bg-ink whitespace-nowrap text-salt">{marker}</div>
            <div className="mx-auto h-4 w-0.5 bg-ink" />
          </div>
        </div>
        <div className={`absolute inset-x-0 top-[44px] h-3.5 overflow-hidden rounded-[3px] ${rough ? "border-2 border-dashed border-ink bg-paper" : "bg-salt-deep"}`}>
          <div data-scale-fill data-at={at} className={`h-full origin-left ${VERDICT_TONE[tone]} ${rough ? "opacity-70" : ""}`} style={{ transform: `scaleX(${at / 100})` }} />
        </div>
        {points.map((point) => (
          <div key={point.at} className="absolute top-[44px] -translate-x-1/2" style={{ left: `${point.at}%` }}>
            <div className={`mx-auto w-0.5 bg-ink ${point.main ? "h-6" : "h-[1.125rem]"}`} />
            <div className={`mt-1 text-center text-xs leading-tight tabular-nums ${point.main ? "font-semibold text-ink" : "text-ink-soft"}`}>{point.label}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-ink-soft">
        {ends.map((end) => (
          <span key={end}>{end}</span>
        ))}
      </div>
    </div>
  );
}

/** A few grains of salt that fall in when a result arrives: the brand's one flourish. */
const REVEAL_GRAINS = [
  { right: 6, top: 9, size: 11, turn: 18, brine: true },
  { right: 15, top: 5, size: 7, turn: -24 },
  { right: 10, top: 21, size: 6, turn: 40 },
  { right: 24, top: 13, size: 8, turn: -12 },
  { right: 3, top: 30, size: 7, turn: 52 },
  { right: 19, top: 28, size: 5, turn: -35 },
];

export function RevealGrains() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-box">
      {REVEAL_GRAINS.map((grain, index) => (
        <span
          key={index}
          data-grain
          className={`absolute rounded-[1px] ${grain.brine ? "bg-brine" : "bg-ink/20"}`}
          style={{ right: `${grain.right}%`, top: `${grain.top}%`, width: grain.size, height: grain.size, rotate: `${grain.turn}deg` }}
        />
      ))}
    </div>
  );
}
