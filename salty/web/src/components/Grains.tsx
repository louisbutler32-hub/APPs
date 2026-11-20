/**
 * Scattered grains of salt, the brand's one decorative motif. Positions are fixed
 * (not random) so the server and the browser draw the same thing.
 */
const GRAINS = [
  { x: 6, y: 12, size: 10, turn: 18, delay: 0 },
  { x: 14, y: 64, size: 7, turn: -22, delay: 0.15 },
  { x: 23, y: 30, size: 5, turn: 40, delay: 0.3 },
  { x: 38, y: 8, size: 8, turn: -12, delay: 0.1 },
  { x: 47, y: 78, size: 6, turn: 28, delay: 0.4 },
  { x: 58, y: 20, size: 11, turn: 52, delay: 0.2 },
  { x: 66, y: 58, size: 5, turn: -35, delay: 0.5 },
  { x: 74, y: 10, size: 7, turn: 14, delay: 0.25 },
  { x: 82, y: 44, size: 9, turn: -48, delay: 0.35 },
  { x: 91, y: 72, size: 6, turn: 30, delay: 0.45 },
  { x: 95, y: 22, size: 8, turn: -8, delay: 0.05 },
  { x: 31, y: 88, size: 9, turn: 62, delay: 0.55 },
];

export function Grains({ className = "", tone = "bg-ink" }: { className?: string; tone?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {GRAINS.map((grain, index) => (
        <span
          key={index}
          className={`absolute animate-fall rounded-[1px] ${tone}`}
          style={{
            left: `${grain.x}%`,
            top: `${grain.y}%`,
            width: grain.size,
            height: grain.size,
            animationDelay: `${grain.delay}s`,
            ["--grain-turn" as string]: `${grain.turn}deg`,
          }}
        />
      ))}
    </div>
  );
}
