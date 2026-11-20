/**
 * Scattered grains of salt, the brand's one decorative motif. They sit still at the edges of a
 * section, never over text. Positions are fixed (not random) so the server and the browser draw
 * the same thing. The grains that move are the ones that fall in with a result (see Scale.tsx).
 */
const GRAINS = [
  { x: 2, y: 14, size: 9, turn: 18 },
  { x: 5, y: 82, size: 6, turn: -22 },
  { x: 44, y: 4, size: 7, turn: 40 },
  { x: 49, y: 94, size: 6, turn: -12 },
  { x: 58, y: 6, size: 10, turn: 52 },
  { x: 88, y: 3, size: 6, turn: -35 },
  { x: 97, y: 34, size: 8, turn: 14 },
  { x: 96, y: 88, size: 7, turn: -48 },
  { x: 30, y: 97, size: 8, turn: 30 },
];

export function Grains({ className = "", tone = "bg-ink" }: { className?: string; tone?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {GRAINS.map((grain, index) => (
        <span
          key={index}
          className={`absolute rounded-[1px] ${tone}`}
          style={{ left: `${grain.x}%`, top: `${grain.y}%`, width: grain.size, height: grain.size, rotate: `${grain.turn}deg` }}
        />
      ))}
    </div>
  );
}
