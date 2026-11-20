"use client";

import { useEffect, useRef } from "react";
import type { Place } from "@/lib/world";
import type { Estimate } from "@/lib/estimate-shared";
import { RESULT_ID, setFunnel } from "@/lib/funnel";
import { money, moneyShort } from "@/lib/pay/format";
import type { Job } from "@/lib/pay/types";
import { verdictFor } from "@/lib/pay/verdict";
import { useReveal } from "@/lib/reveal";
import { RaisePlan } from "./RaisePlan";
import { Scale, VERDICT_TONE } from "./Scale";
import { Shaker } from "./Shaker";

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
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

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
    <div id={RESULT_ID} ref={root}>
      <div className="rounded-box border border-ink/15 bg-paper p-6 sm:p-9">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`tag px-3 py-1 font-display text-lg font-extrabold tracking-tight ${VERDICT_TONE[verdict.id]}`}>
            {verdict.label}
            {verdict.shakers > 0 && (
              <span className="flex gap-0.5">
                {Array.from({ length: verdict.shakers }, (_, index) => (
                  <Shaker key={index} className="h-6 w-auto" />
                ))}
              </span>
            )}
          </span>
          <span className="tag bg-ink text-salt">AI estimate</span>
        </div>

        <p className="mt-6 text-lg text-ink-soft">This job usually pays about</p>
        <p className={`figure ${money(country, estimate.typical).length > 9 ? "text-[clamp(2.25rem,10.5vw,5rem)]" : "text-[clamp(4rem,20vw,8rem)]"}`}>{money(country, estimate.typical)}</p>
        <p className="display mt-3 max-w-xl text-[clamp(1.5rem,5vw,2.25rem)]">You&apos;re {spot.words}.</p>
        <p className="mt-2 text-ink-soft">{estimate.title}</p>

        {/* A dashed outline rather than a solid bar: this is a rough range, not measured data. */}
        <Scale
          className="mt-8"
          place={barPosition(estimate, pay)}
          points={[
            { at: 20, label: moneyShort(country, estimate.low) },
            { at: 50, label: moneyShort(country, estimate.typical), main: true },
            { at: 80, label: moneyShort(country, estimate.high) },
          ]}
          ends={["Lower end", "Typical", "Upper end"]}
          tone={verdict.id}
          rough
        />

        <p className="mt-8 rounded-ctl bg-salt p-4 text-lg">
          {Math.abs(gap) < estimate.typical * 0.03 ? (
            <>That is right around the typical figure.</>
          ) : (
            <>
              That&apos;s roughly <strong>{money(country, Math.round(Math.abs(gap) / 100) * 100)} a year {gap < 0 ? "under" : "over"}</strong> the typical figure. Most
              people in this job earn between {money(country, estimate.low)} and {money(country, estimate.high)}.
            </>
          )}
        </p>

        <div className="mt-5 rounded-ctl border-2 border-dashed border-ink/40 p-4 text-sm text-ink-soft">
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
                  <a href={source.url} target="_blank" rel="noopener nofollow" className="font-semibold text-brine underline">
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
