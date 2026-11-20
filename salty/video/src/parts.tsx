import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, RADIUS, SAFE, display } from "./brand";

/** The wordmark: "salty" with the tilted grain of salt as its full stop. */
export const Logo: React.FC<{ size?: number; color?: string; grain?: string }> = ({ size = 72, color = COLOR.ink, grain = COLOR.brine }) => (
  <div style={{ ...display, fontSize: size, color, display: "flex", alignItems: "baseline" }}>
    salty
    <div style={{ width: size * 0.22, height: size * 0.22, marginLeft: size * 0.07, borderRadius: 2, backgroundColor: grain, rotate: "18deg" }} />
  </div>
);

const GRAINS = [
  { x: 70, y: 420, size: 22, turn: 18, delay: 2 },
  { x: 960, y: 250, size: 16, turn: -30, delay: 6 },
  { x: 120, y: 1320, size: 14, turn: 44, delay: 10 },
  { x: 880, y: 1450, size: 24, turn: 12, delay: 4 },
  { x: 540, y: 190, size: 12, turn: -18, delay: 8 },
  { x: 990, y: 860, size: 18, turn: 60, delay: 12 },
  { x: 40, y: 900, size: 12, turn: -44, delay: 14 },
];

/** Grains of salt falling into place over the first second: the brand's one decoration. */
export const Grains: React.FC<{ color?: string }> = ({ color = COLOR.ink }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      {GRAINS.map((grain, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: grain.x,
            top: grain.y,
            width: grain.size,
            height: grain.size,
            borderRadius: 2,
            backgroundColor: color,
            opacity: interpolate(frame, [grain.delay, grain.delay + 0.3 * fps], [0, 0.22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [grain.delay, grain.delay + 0.7 * fps], ["0px -160px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.3, 0, 0.7, 1),
            }),
            rotate: `${grain.turn}deg`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** The frame every clip shares: paper background, grains, and the wordmark top left. */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill name="Stage" style={{ backgroundColor: COLOR.salt, color: COLOR.ink, fontFamily: FONT.body }}>
    <Grains />
    <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top - 20 }}>
      <Logo />
    </div>
    {children}
  </AbsoluteFill>
);

/**
 * The closing card: the question, where to answer it, and where the numbers came from. It slides
 * up over the clip and holds, so the last frame is always the call to action.
 */
export const EndCard: React.FC<{ from: number; site: string; source: string }> = ({ from, site, source }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Interactive.Div
      name="End card"
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: COLOR.brine,
        color: COLOR.white,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: `${SAFE.top}px ${SAFE.right}px ${SAFE.bottom}px ${SAFE.left}px`,
        translate: interpolate(frame, [from, from + 0.5 * fps], ["0px 1920px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {/* On the blue card the grain turns lime, since a blue grain would vanish. */}
      <Logo size={84} color={COLOR.white} grain={COLOR.zest} />
      <div style={{ ...display, fontSize: 170, marginTop: 70 }}>Are you underpaid?</div>
      <div style={{ fontSize: 52, marginTop: 44, lineHeight: 1.25, opacity: 0.92 }}>Type your job and your pay. Ten seconds, free.</div>
      <div
        style={{
          ...display,
          fontSize: 76,
          marginTop: 70,
          alignSelf: "flex-start",
          backgroundColor: COLOR.zest,
          color: COLOR.ink,
          borderRadius: RADIUS.ctl,
          padding: "22px 44px",
        }}
      >
        {site}
      </div>
      <div style={{ fontSize: 34, marginTop: 90, opacity: 0.85, lineHeight: 1.35 }}>{source}</div>
    </Interactive.Div>
  );
};
