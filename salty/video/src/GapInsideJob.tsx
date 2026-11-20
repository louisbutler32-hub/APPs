import { Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { COLOR, display, FONT, money, SAFE } from "./brand";
import { EndCard, Stage } from "./parts";

/**
 * "Same job title, very different pay." Shows the gap between the lowest and highest paid tenth
 * of one job, then asks the viewer which end they are at.
 */
export const gapInsideJobSchema = z.object({
  /** The job in the plural, as it reads after "Two": "software developers". */
  jobPlural: z.string(),
  /** One in ten earn less than this. */
  low: z.number(),
  /** One in ten earn more than this. */
  high: z.number(),
  locale: z.string(),
  currency: z.string(),
  source: z.string(),
  site: z.string(),
});

type Props = z.infer<typeof gapInsideJobSchema>;

const T = { second: 22, bar: 55, low: 70, high: 115, apart: 165, ask: 198, end: 232 };

export const GapInsideJob: React.FC<Props> = ({ jobPlural, low, high, locale, currency, source, site }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = (from: number) => interpolate(frame, [from, from + 0.3 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = (from: number) => interpolate(frame, [from, from + 0.35 * fps], ["0px 30px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const counted = (from: number, value: number) => money(interpolate(frame, [from, from + 0.9 * fps], [value * 0.6, value], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }), locale, currency);

  return (
    <Stage>
      <Interactive.Div name="Hook" style={{ ...display, position: "absolute", left: SAFE.left, right: SAFE.right, top: 290, fontSize: jobPlural.length > 18 ? 104 : 128 }}>
        <div style={{ opacity: fade(0), translate: rise(0) }}>Two {jobPlural}.</div>
        <div style={{ opacity: fade(T.second), translate: rise(T.second), color: COLOR.brine }}>Same job title.</div>
      </Interactive.Div>

      <Interactive.Div name="Lower earner" style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: 700, opacity: fade(T.low), translate: rise(T.low) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: "0.1em", textTransform: "uppercase", color: COLOR.inkSoft }}>One in ten earns under</div>
        <div style={{ ...display, fontStretch: "84%", fontSize: 170, color: COLOR.chilli }}>{counted(T.low, low)}</div>
      </Interactive.Div>

      <Interactive.Div
        name="Pay range bar"
        style={{
          position: "absolute",
          left: SAFE.left,
          top: 990,
          height: 40,
          borderRadius: 999,
          border: `6px solid ${COLOR.ink}`,
          background: `linear-gradient(90deg, ${COLOR.chilli}, ${COLOR.amber}, ${COLOR.zest})`,
          width: interpolate(frame, [T.bar, T.high + 0.4 * fps], [60, 1080 - SAFE.left - SAFE.right], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
          opacity: fade(T.bar),
        }}
      />

      <Interactive.Div name="Higher earner" style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: 1080, textAlign: "right", opacity: fade(T.high), translate: rise(T.high) }}>
        <div style={{ ...display, fontStretch: "84%", fontSize: 170 }}>{counted(T.high, high)}</div>
        <div style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: "0.1em", textTransform: "uppercase", color: COLOR.inkSoft }}>One in ten earns over</div>
      </Interactive.Div>

      <Interactive.Div name="Gap" style={{ position: "absolute", left: SAFE.left, right: SAFE.right, top: 1370, fontSize: 58, fontWeight: 600, opacity: fade(T.apart), translate: rise(T.apart) }}>
        That is <span style={{ ...display, fontSize: 68, color: COLOR.brine }}>{money(high - low, locale, currency)}</span> apart.
      </Interactive.Div>

      <Interactive.Div name="Question" style={{ ...display, position: "absolute", left: SAFE.left, right: SAFE.right, top: 1475, fontSize: 84, opacity: fade(T.ask), translate: rise(T.ask) }}>
        Which one are you?
      </Interactive.Div>

      <EndCard from={T.end} site={site} source={source} />
    </Stage>
  );
};
