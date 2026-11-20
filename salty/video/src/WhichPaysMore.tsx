import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { COLOR, FONT, RADIUS, SAFE, display, money } from "./brand";
import { EndCard, Stage } from "./parts";

/**
 * "Which pays more?" Two jobs, three seconds to guess, then the official figures.
 * The pause is the point: people commit to an answer, and then they have to see if they were right.
 */
export const whichPaysMoreSchema = z.object({
  a: z.object({ name: z.string(), pay: z.number() }),
  b: z.object({ name: z.string(), pay: z.number() }),
  locale: z.string(),
  currency: z.string(),
  /** Where the figures come from, shown on the closing card. */
  source: z.string(),
  site: z.string(),
});

type Props = z.infer<typeof whichPaysMoreSchema>;

/** Frame numbers at 30 frames a second. */
const T = { cards: 10, countdown: 45, reveal: 135, difference: 172, end: 215 };

const JobCard: React.FC<{ name: string; pay: number; top: number; fromLeft: boolean; wins: boolean; locale: string; currency: string }> = ({ name, pay, top, fromLeft, wins, locale, currency }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const revealed = frame >= T.reveal;
  return (
    <Interactive.Div
      name={fromLeft ? "First job" : "Second job"}
      style={{
        position: "absolute",
        left: SAFE.left,
        right: SAFE.right,
        top,
        height: 360,
        borderRadius: RADIUS.box,
        backgroundColor: revealed && wins ? COLOR.zest : COLOR.paper,
        padding: "40px 52px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: revealed && !wins ? 0.55 : 1,
        translate: interpolate(frame, [T.cards, T.cards + 0.6 * fps], [fromLeft ? "-1100px 0px" : "1100px 0px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        scale: interpolate(frame, [T.reveal, T.reveal + 0.35 * fps], [1, wins ? 1.04 : 0.97], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
          output: "perceptual-scale",
        }),
      }}
    >
      <div style={{ ...display, fontSize: name.length > 16 ? 76 : 96 }}>{name}</div>
      <div style={{ ...display, fontStretch: "84%", fontSize: 150, marginTop: 14, color: revealed ? COLOR.ink : COLOR.inkSoft }}>
        {revealed
          ? money(interpolate(frame, [T.reveal, T.reveal + 0.9 * fps], [pay * 0.6, pay], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), locale, currency)
          : "?"}
      </div>
    </Interactive.Div>
  );
};

export const WhichPaysMore: React.FC<Props> = ({ a, b, locale, currency, source, site }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = 3 - Math.floor((frame - T.countdown) / fps);
  const counting = frame >= T.countdown && frame < T.reveal;

  return (
    <Stage>
      <Interactive.Div
        name="Hook"
        style={{
          ...display,
          position: "absolute",
          left: SAFE.left,
          right: SAFE.right,
          top: 290,
          fontSize: 150,
          scale: interpolate(frame, [0, 0.4 * fps], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 200 }), output: "perceptual-scale" }),
          opacity: interpolate(frame, [0, 0.25 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Which pays <span style={{ color: COLOR.brine }}>more?</span>
      </Interactive.Div>

      <JobCard name={a.name} pay={a.pay} top={640} fromLeft wins={a.pay >= b.pay} locale={locale} currency={currency} />
      <JobCard name={b.name} pay={b.pay} top={1090} fromLeft={false} wins={b.pay > a.pay} locale={locale} currency={currency} />

      <Interactive.Div
        name="Countdown badge"
        style={{
          position: "absolute",
          left: 1080 / 2 - 95 - (SAFE.right - SAFE.left) / 2,
          top: 1045 - 95,
          width: 190,
          height: 190,
          borderRadius: RADIUS.box,
          backgroundColor: counting ? COLOR.chilli : COLOR.ink,
          color: counting ? COLOR.ink : COLOR.salt,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...display,
          fontSize: counting ? 130 : 76,
          scale: interpolate(frame, [T.cards + 0.5 * fps, T.cards + 0.85 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({ damping: 14 }), output: "perceptual-scale" }),
          opacity: interpolate(frame, [T.reveal, T.reveal + 0.2 * fps], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        {counting ? count : "vs"}
      </Interactive.Div>

      <Interactive.Div
        name="Difference"
        style={{
          position: "absolute",
          left: SAFE.left,
          right: SAFE.right,
          top: 1500,
          fontFamily: FONT.body,
          fontSize: 54,
          fontWeight: 600,
          opacity: interpolate(frame, [T.difference, T.difference + 0.3 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [T.difference, T.difference + 0.3 * fps], ["0px 24px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
        }}
      >
        {money(Math.abs(a.pay - b.pay), locale, currency)} a year apart.
      </Interactive.Div>

      <EndCard from={T.end} site={site} source={source} />
    </Stage>
  );
};
