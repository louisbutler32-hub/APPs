"use client";

import { useEffect, useRef } from "react";
import type { Country } from "@/lib/countries";
import { RESULT_ID, setFunnel } from "@/lib/funnel";
import { money, shortPeriod } from "@/lib/pay/format";
import { quantilePoints } from "@/lib/pay/percentile";
import type { CountryData, Job } from "@/lib/pay/types";
import { useReveal } from "@/lib/reveal";
import { EmailForm } from "./EmailForm";

type Props = { country: Country; data: Pick<CountryData, "period" | "source">; job: Job };

/** For someone deciding what to offer: the pay band for a role, from the same official figures. */
export function HiringResult({ country, data, job }: Props) {
  const points = quantilePoints(job);
  const at = (...qs: number[]) => {
    for (const q of qs) {
      const point = points.find((item) => item.q === q);
      if (point) return point;
    }
    return undefined;
  };
  const low = at(25, 20, 30);
  const high = at(75, 80, 70);
  const middle = job.p50 as number;
  const bands = [
    ...(low ? [{ label: "Low", value: low.value, note: `${low.q} in 100 people in the job earn less than this`, tone: "border border-ink/50 text-ink" }] : []),
    { label: "Fair", value: middle, note: "The middle: half earn more, half earn less", tone: "bg-salt-deep text-ink" },
    ...(high ? [{ label: "Strong", value: high.value, note: `Beats ${high.q} in 100 people already in the job`, tone: "bg-ink text-salt" }] : []),
  ];

  const root = useRef<HTMLDivElement>(null);
  useReveal(root);
  useEffect(() => {
    setFunnel({ stage: "result", mode: "hiring", underpaid: false, resultAt: Date.now(), context: { country: country.code, job: job.code, job_title: job.title } });
    return () => setFunnel({ stage: "browsing", mode: null, resultAt: null });
  }, [country.code, job.code, job.title]);

  return (
    <div id={RESULT_ID} ref={root} className="space-y-8">
      <div className="rounded-box border border-ink/15 bg-paper p-6 sm:p-9">
        <h2 className="display text-[clamp(1.75rem,6vw,2.5rem)]">What to offer: {job.title.toLowerCase()}</h2>
        {/* A ruled table, one offer level a row: the level, the figure, and what it means. */}
        <dl className="mt-6 border-t-2 border-ink">
          {bands.map((band) => (
            <div key={band.label} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 border-b border-ink/15 py-4 sm:grid-cols-[5.5rem_11rem_1fr]">
              <dt>
                <span className={`tag text-sm ${band.tone}`}>{band.label}</span>
              </dt>
              <dd className="figure text-3xl">{money(country, band.value)}</dd>
              <dd className="col-span-2 mt-1 text-sm text-ink-soft sm:col-span-1 sm:mt-0">{band.note}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-lg">
          {low
            ? `Offer below ${money(country, low.value)} and most people already doing this job are paid more than you're offering. To hire someone good without a long search, start at ${money(country, middle)}.`
            : `To be competitive, start at ${money(country, middle)}: half of the people already doing this job are paid more than that.`}
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          Per year, before tax. Official figures from the {country.publisher}, {shortPeriod(data.period)}: {country.measure}. They cover the
          whole country and do not adjust for location or experience. {data.source.attribution}
        </p>
        {country.caveat && <p className="mt-3 rounded-ctl border-2 border-dashed border-ink/40 p-3 text-sm text-ink-soft">{country.caveat}</p>}
      </div>

      <div className="on-dark rounded-box bg-brine p-6 text-white sm:p-9">
        <p className="display text-[clamp(1.75rem,6vw,2.5rem)]">Hiring for more than one role?</p>
        <p className="mt-3 max-w-xl text-white/90">
          We&apos;re building a pay report that covers every role in your team on one page. Leave a work email and you&apos;ll get it first.
        </p>
        <div className="mt-6">
          <EmailForm
            interest="employer"
            context={{ country: country.code, job: job.code, job_title: job.title }}
            cta="Send me the report"
            tone="dark"
            note="One email when it's ready. Nothing else."
            successTitle="You're on the list."
            successBody="We'll email you when the pay report is ready."
          />
        </div>
      </div>
    </div>
  );
}
