"use client";

import { useEffect, useState } from "react";
import type { Place } from "@/lib/world";
import type { Estimate } from "@/lib/estimate-shared";
import { RESULT_ID, setFunnel } from "@/lib/funnel";
import { money, moneyShort } from "@/lib/pay/format";
import type { Job } from "@/lib/pay/types";
import { verdictFor, type VerdictId } from "@/lib/pay/verdict";
import { RaisePlan } from "./RaisePlan";
import { Shaker } from "./Shaker";

const TONE: Record<VerdictId, string> = {
  "extra-salty": "bg-chilli text-ink",
  salty: "bg-amber text-ink",
  fair: "bg-white text-ink",
  seasoned: "bg-brine text-white",
  "top-shelf": "bg-zest text-ink",
};

/** What to say about how far to trust it, which depends on whether anything was looked up. */
const CONFIDENCE = {
  "web-search": {
    high: "Good sources agree on this.",
    medium: "Sources roughly agree on this.",
    low: "Sources are thin or disagree, so treat this as a loose guide.",
  },
  "general-knowledge": {
    high: "Pay for this job is well documented there, so it should be in the right area.",
    medium: "Pay for this job is well documented there, so it should be in the right area.",
    low: "Pay for this job varies a lot there, so treat this as a loose guide.",
  },
} as const;

/**
 * Where the pay sits against a rough range, in five broad steps. An estimate cannot support a
 * precise rank, so there is deliberately no percentage here.
 */
function place(estimate: Estimate, pay: number): { position: number; words: string } {
  const { low, typical, high } = estimate;
  if (pay < low) return { position: 10, words: "well below what this job usually pays" };
  if (pay < typical * 0.97) return { position: 30, words: "below what this job usually pays" };
  if (pay <= typical * 1.03) return { position: 50, words: "about what this job usually pays" };
  if (pay <= high) return { position: 70, words: "above what this job usually pays" };
  return { position: 90, words: "well above what this job usually pays" };
}

/** Where to draw the marker on a bar whose thirds are low, typical and high. */
function barPosition(estimate: Estimate, pay: number): number {
  const { low, typical, high } = estimate;
  const between = (a: number, b: number, from: number, to: number) => from + ((pay - a) / (b - a)) * (to - from);
  if (pay <= low) return Math.max(4, between(low * 0.7, low, 4, 20));
  if (pay <= typical) return between(low, typical, 20, 50);
  if (pay <= high) return between(typical, high, 50, 80);
  return Math.min(96, between(high, high * 1.3, 80, 96));
}

type Props = { country: Place; estimate: Estimate; pay: number };

export function EstimateResult({ country, estimate, pay }: Props) {
  const spot = place(estimate, pay);
  const verdict = verdictFor(spot.position);
  const gap = pay - estimate.typical;
  const [shown, setShown] = useState(50);
  const target = barPosition(estimate, pay);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const underpaid = verdict.shakers >= 2;
  useEffect(() => {
    setFunnel({ stage: "result", mode: "estimate", underpaid, resultAt: Date.now(), context: { country: country.code, job_title: estimate.title } });
    return () => setFunnel({ stage: "browsing", mode: null, resultAt: null });
  }, [underpaid, country.code, estimate.title]);

  // The raise plan works from pay points, so give it the estimate in that shape.
  const job: Job = {
    code: "estimate",
    title: estimate.title,
    slug: "estimate",
    employees: null,
    mean: null,
    aliases: [],
    p25: estimate.low,
    p50: estimate.typical,
    p75: estimate.high,
  };

  return (
    <div id={RESULT_ID} className="animate-rise">
      <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 font-display text-lg font-extrabold tracking-tight ${TONE[verdict.id]}`}>
            {verdict.label}
            {verdict.shakers > 0 && (
              <span className="flex gap-0.5">
                {Array.from({ length: verdict.shakers }, (_, index) => (
                  <Shaker key={index} className="h-6 w-auto" />
                ))}
              </span>
            )}
          </span>
          <span className="eyebrow rounded-full border-2 border-ink bg-ink px-2.5 py-1 text-salt">AI estimate</span>
        </div>

        <p className="mt-6 text-lg text-ink-soft">This job usually pays about</p>
        <p className={`figure ${money(country, estimate.typical).length > 9 ? "text-[clamp(2.25rem,10.5vw,5rem)]" : "text-[clamp(4rem,20vw,8rem)]"}`}>{money(country, estimate.typical)}</p>
        <p className="display mt-3 max-w-xl text-[clamp(1.5rem,5vw,2.25rem)]">You&apos;re {spot.words}.</p>
        <p className="mt-2 text-ink-soft">{estimate.title}</p>

        <div className="mt-8">
          <div className="relative h-24">
            <div className="absolute top-0 -translate-x-1/2 transition-[left] duration-700 ease-out" style={{ left: `${shown}%` }}>
              <div className="rounded-md border-2 border-ink bg-ink px-2 py-0.5 text-xs font-semibold text-salt">You</div>
              <div className="mx-auto h-5 w-0.5 bg-ink" />
            </div>
            {/* A dashed outline rather than a solid bar: this is a rough range, not measured data. */}
            <div className="absolute inset-x-0 top-[46px] h-4 overflow-hidden rounded-full border-2 border-dashed border-ink bg-white">
              <div className="h-full bg-gradient-to-r from-chilli via-amber to-zest opacity-60" />
            </div>
            {(
              [
                [20, estimate.low, false],
                [50, estimate.typical, true],
                [80, estimate.high, false],
              ] as const
            ).map(([left, value, main]) => (
              <div key={left} className="absolute top-[46px] -translate-x-1/2" style={{ left: `${left}%` }}>
                <div className={`mx-auto w-0.5 bg-ink ${main ? "h-6" : "h-4"}`} />
                <div className={`mt-1 text-center font-mono text-[0.7rem] leading-tight ${main ? "font-semibold text-ink" : "text-ink-soft"}`}>{moneyShort(country, value)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-mono text-[0.68rem] tracking-wide text-ink-soft uppercase">
            <span>Lower end</span>
            <span>Typical</span>
            <span>Upper end</span>
          </div>
        </div>

        <p className="mt-8 rounded-2xl bg-salt p-4 text-lg">
          {Math.abs(gap) < estimate.typical * 0.03 ? (
            <>That is right around the typical figure.</>
          ) : (
            <>
              That&apos;s roughly <strong>{money(country, Math.round(Math.abs(gap) / 100) * 100)} a year {gap < 0 ? "under" : "over"}</strong> the typical figure. Most
              people in this job earn between {money(country, estimate.low)} and {money(country, estimate.high)}.
            </>
          )}
        </p>

        <div className="mt-5 rounded-2xl border-2 border-dashed border-ink/40 p-4 text-sm text-ink-soft">
          <p className="font-semibold text-ink">This is a rough estimate, not official figures.</p>
          <p className="mt-1">
            {estimate.method === "web-search"
              ? "We don't have official pay data for this job here, so our AI searched the web and summarised what it found."
              : "We don't have official pay data for this job here, so our AI gave its best estimate from general knowledge, without searching the web."}{" "}
            {CONFIDENCE[estimate.method][estimate.confidence]}
            {estimate.method === "general-knowledge" && " Check it against a local source before you rely on it in a pay conversation."}
          </p>
          {estimate.basis && <p className="mt-2">{estimate.basis}</p>}
          {estimate.sources.length > 0 && (
            <ul className="mt-2 space-y-1">
              {estimate.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener nofollow" className="font-medium text-brine underline underline-offset-4">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8">
        <RaisePlan country={country} job={job} pay={pay} underpaid={verdict.shakers >= 2} official={false} />
      </div>
    </div>
  );
}
