"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Country } from "@/lib/countries";
import { brand } from "@/lib/brand";
import { money, moneyShort, percent, shortPeriod } from "@/lib/pay/format";
import { gapToMedian, position as positionOf, quantilePoints, rank, type Ranking } from "@/lib/pay/percentile";
import type { CountryData, Job } from "@/lib/pay/types";
import { verdictFor, type Verdict, type VerdictId } from "@/lib/pay/verdict";
import { canvasToBlob, drawShareCard, type ShareCardContent } from "@/lib/share-card";
import { track } from "@/lib/track";
import { target } from "@/lib/raise-plan";
import { EmailForm } from "./EmailForm";
import { RaisePlan } from "./RaisePlan";
import { Recommended } from "./Recommended";
import { Shaker } from "./Shaker";

const TONE: Record<VerdictId, string> = {
  "extra-salty": "bg-chilli text-ink",
  salty: "bg-amber text-ink",
  fair: "bg-white text-ink",
  seasoned: "bg-brine text-white",
  "top-shelf": "bg-zest text-ink",
};

type Words = { figure: string; lead: string; tail: string; mine: string; approx: boolean };

/** The headline in the person's own terms, plus the first-person version for sharing. */
function describe(ranking: Ranking, offer: boolean): Words | null {
  switch (ranking.kind) {
    case "published":
    case "estimate": {
      const p = ranking.percentile;
      const approx = ranking.kind === "estimate";
      if (p < 50) {
        return {
          figure: percent(100 - p),
          lead: approx ? "Roughly" : "",
          tail: offer ? "of people in this job are paid more than this offer." : "of people in your job are paid more than you.",
          mine: "of people in my job are paid more than me.",
          approx,
        };
      }
      return {
        figure: percent(p),
        lead: offer ? (approx ? "This offer beats roughly" : "This offer beats") : approx ? "You're paid more than roughly" : "You're paid more than",
        tail: offer ? "of people already in the job." : "of people in your job.",
        mine: "of people in my job are paid less than me.",
        approx,
      };
    }
    case "bound":
      return {
        figure: ranking.side === "below" ? `Bottom ${ranking.q}%` : `Top ${100 - ranking.q}%`,
        lead: offer ? "This offer is in the" : "You're in the",
        tail: offer ? "for pay in this job." : "for pay in your job.",
        mine: "for pay in my job.",
        approx: false,
      };
    case "median-only":
      return {
        figure: ranking.side === "below" ? "Below" : ranking.side === "above" ? "Above" : "Bang on",
        lead: offer ? "This offer is" : "You're",
        tail: offer ? "the middle for the job." : "the middle for your job.",
        mine: "the middle for pay in my job.",
        approx: false,
      };
    default:
      return null;
  }
}

/** Counts a percentage figure up from zero. Figures that are words are shown as they are. */
function useCountUp(figure: string): string {
  const match = /^(\d+)%$/.exec(figure);
  const target = match ? Number(match[1]) : null;
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(frame);
    }
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return target === null ? figure : `${value}%`;
}

function Distribution({ job, country, place }: { job: Job; country: Country; place: number }) {
  const points = quantilePoints(job);
  const labelled = points.filter((point) => [10, 25, 50, 75, 90].includes(point.q));
  const [shown, setShown] = useState(50);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(place));
    return () => cancelAnimationFrame(frame);
  }, [place]);

  return (
    <div className="mt-8">
      <div className="relative h-24">
        {/* You */}
        <div
          className="absolute top-0 -translate-x-1/2 transition-[left] duration-700 ease-out"
          style={{ left: `${Math.min(97, Math.max(3, shown))}%` }}
        >
          <div className="rounded-md border-2 border-ink bg-ink px-2 py-0.5 text-xs font-semibold text-salt">You</div>
          <div className="mx-auto h-5 w-0.5 bg-ink" />
        </div>
        {/* Track */}
        <div className="absolute inset-x-0 top-[46px] h-4 overflow-hidden rounded-full border-2 border-ink bg-white">
          <div className="h-full bg-gradient-to-r from-chilli via-amber to-zest opacity-90" />
        </div>
        {/* Published pay points */}
        {labelled.map((point) => (
          <div key={point.q} className="absolute top-[46px] -translate-x-1/2" style={{ left: `${point.q}%` }}>
            <div className={`mx-auto w-0.5 bg-ink ${point.q === 50 ? "h-6" : "h-4"}`} />
            <div className={`mt-1 text-center font-mono text-[0.7rem] leading-tight ${point.q === 50 ? "font-semibold text-ink" : "text-ink-soft"}`}>
              {moneyShort(country, point.value)}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between font-mono text-[0.68rem] tracking-wide text-ink-soft uppercase">
        <span>Lowest paid</span>
        <span>Middle</span>
        <span>Highest paid</span>
      </div>
    </div>
  );
}

type Props = { mode: "pay" | "offer"; country: Country; data: Pick<CountryData, "period" | "source">; job: Job; pay: number };

export function Result({ mode, country, data, job, pay }: Props) {
  const offer = mode === "offer";
  const ranking = useMemo(() => rank(job, pay), [job, pay]);
  const place = positionOf(job, pay, ranking);
  const words = describe(ranking, offer);
  const figure = useCountUp(words?.figure ?? "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shareState, setShareState] = useState<"idle" | "working" | "copied">("idle");
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  useEffect(() => () => {
    if (cardUrl) URL.revokeObjectURL(cardUrl);
  }, [cardUrl]);

  if (!words || place === null) {
    return (
      <div className="rounded-2xl border-2 border-ink bg-white p-6">
        <p className="display text-2xl">We can&apos;t rank that one yet.</p>
        <p className="mt-2 text-ink-soft">The official figures for this job don&apos;t include enough detail. Try a closely related job.</p>
      </div>
    );
  }

  const verdict: Verdict = verdictFor(place);
  const gap = gapToMedian(job, pay);
  const host = new URL(brand.url).host;
  const shareUrl = `${brand.url}/${country.code}/${job.slug}`;
  const card: ShareCardContent = {
    figure: words.figure,
    sentence: words.mine,
    jobTitle: job.title,
    countryLabel: country.name,
    verdictId: verdict.id,
    verdictLabel: verdict.label,
    shakers: verdict.shakers,
    host,
  };

  async function shareImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setShareState("working");
    await drawShareCard(canvas, card);
    const blob = await canvasToBlob(canvas);
    setShareState("idle");
    if (!blob) return;
    const file = new File([blob], "salty-pay-check.png", { type: "image/png" });
    // Always show the card on the page too, so there is something to save by hand
    // wherever sharing and downloads are blocked.
    const url = URL.createObjectURL(blob);
    setCardUrl(url);
    track("share", { kind: "image", verdict: verdict.id, country: country.code });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `Are you underpaid? ${shareUrl}` });
        return;
      } catch {
        // Share sheet dismissed: fall through to a plain download.
      }
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      return; // Clipboard blocked: leave the button as it is rather than claim it worked.
    }
    track("share", { kind: "link", verdict: verdict.id, country: country.code });
    setShareState("copied");
    setTimeout(() => setShareState("idle"), 1800);
  }

  return (
    <div className="animate-rise">
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
          {words.approx && <span className="eyebrow rounded-full border border-ink/30 px-2.5 py-1 text-ink-soft">Estimate</span>}
        </div>

        <p className="mt-6 text-lg text-ink-soft">{words.lead}</p>
        <p className={`figure ${/^\d/.test(figure) ? "text-[clamp(5rem,26vw,10rem)]" : "text-[clamp(3.25rem,15vw,6.5rem)]"}`} aria-live="polite">
          {figure}
        </p>
        <p className="display mt-3 max-w-xl text-[clamp(1.5rem,5vw,2.25rem)]">{words.tail}</p>
        <p className="mt-2 text-ink-soft">{job.title}</p>

        <Distribution job={job} country={country} place={place} />

        {gap && (
          <p className="mt-8 rounded-2xl bg-salt p-4 text-lg">
            {Math.abs(gap.fraction) < 0.005 ? (
              <>You&apos;re right on the middle figure of <strong>{money(country, job.p50 as number)}</strong> a year.</>
            ) : (
              <>
                That&apos;s <strong>{money(country, Math.abs(gap.amount))} a year {gap.amount < 0 ? "below" : "above"}</strong> the middle
                figure of {money(country, job.p50 as number)}.
              </>
            )}
          </p>
        )}

        <p className="mt-4 text-lg">{offer ? verdict.offerLine : verdict.line}</p>
        {country.caveat && <p className="mt-3 rounded-xl border-2 border-dashed border-ink/30 p-3 text-sm text-ink-soft">{country.caveat}</p>}

        {!offer && (
          <>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={shareImage}
            disabled={shareState === "working"}
            className="press h-14 rounded-xl border-2 border-ink bg-ink px-6 text-base font-semibold text-salt shadow-hard-sm disabled:opacity-60"
          >
            {shareState === "working" ? "Making your card…" : "Share my result"}
          </button>
          <button type="button" onClick={copyLink} className="press h-14 rounded-xl border-2 border-ink bg-white px-6 text-base font-semibold shadow-hard-sm">
            {shareState === "copied" ? "Link copied" : "Copy link for a friend"}
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-soft">The share image shows your rank, never your pay.</p>
        <canvas ref={canvasRef} className="hidden" />
        {cardUrl && (
          <figure className="mt-5 animate-pop">
            {/* eslint-disable-next-line @next/next/no-img-element -- a locally generated image, nothing to optimise */}
            <img src={cardUrl} alt={`Share image: ${words.figure} ${words.mine}`} className="w-full max-w-xs rounded-2xl border-2 border-ink shadow-hard-sm" />
            <figcaption className="mt-2 text-sm text-ink-soft">Your share image. Press and hold (or right-click) to save it.</figcaption>
          </figure>
        )}
          </>
        )}

        <details className="mt-6 border-t border-ink/10 pt-4 text-sm text-ink-soft">
          <summary className="cursor-pointer font-medium text-ink">How we worked this out</summary>
          <div className="mt-3 space-y-2">
            <p>
              We compared your pay with official figures from the {country.publisher}, {shortPeriod(data.period)}. The figures are{" "}
              {country.measure}.
            </p>
            {ranking.kind === "estimate" && (
              <p>
                This source publishes the middle and the average for each job but not the full spread, so your rank is our
                estimate from those two figures. Treat it as a guide.
              </p>
            )}
            {ranking.kind === "bound" && <p>The published figures stop at the {ranking.q}th percentile, so we can&apos;t place you more exactly than that.</p>}
            <p>
              It covers the whole country and does not yet adjust for your city, experience or employer. That is what we are
              building next.
            </p>
            <p>{data.source.attribution}</p>
          </div>
        </details>
      </div>

      <div className="mt-8">
        {offer ? <OfferCounter country={country} job={job} offer={pay} /> : <RaisePlan country={country} job={job} pay={pay} underpaid={verdict.shakers >= 2} />}
      </div>
      <Recommended />
    </div>
  );
}

/** What to say back to an offer: a counter figure from the published pay points, and the line to use. */
function OfferCounter({ country, job, offer }: { country: Country; job: Job; offer: number }) {
  const goal = target(job, offer);
  return (
    <div className="rounded-3xl border-2 border-ink bg-zest p-6 shadow-hard sm:p-9">
      <p className="eyebrow">Next step</p>
      {goal.kind === "raise" ? (
        <>
          <p className="display mt-2 text-[clamp(1.9rem,7vw,3rem)]">Counter at {money(country, goal.opening)}.</p>
          <p className="mt-3 max-w-xl text-lg">
            Aim to land on {money(country, goal.target)}: {goal.why}. Many offers have room in them, and one polite ask is a normal part of
            being hired.
          </p>
          <p className="mt-4 rounded-2xl border-2 border-ink bg-white p-4 text-lg">
            &ldquo;Thank you, I&apos;m really pleased to get the offer. Looking at the official figures for this role, I was expecting
            something closer to {money(country, goal.opening)}. Is there room to move?&rdquo;
          </p>
        </>
      ) : (
        <>
          <p className="display mt-2 text-[clamp(1.9rem,7vw,3rem)]">Take a good look at this one.</p>
          <p className="mt-3 max-w-xl text-lg">
            This offer is already above the highest pay point the official figures publish for the job. Check the hours, the holiday and
            the pension before you say yes, because the money is not where the catch will be.
          </p>
        </>
      )}
      <p className="mt-6 mb-3 font-semibold">The full counter-offer plan is coming. Get it first:</p>
      <EmailForm
        interest="offer"
        context={{ country: country.code, job: job.code, job_title: job.title }}
        cta="Tell me when it opens"
        successTitle="You're first in line."
        successBody="We'll email you when the counter-offer plan opens."
      />
    </div>
  );
}
