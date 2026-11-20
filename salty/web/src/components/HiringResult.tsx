"use client";

import type { Country } from "@/lib/countries";
import { money, shortPeriod } from "@/lib/pay/format";
import { quantilePoints } from "@/lib/pay/percentile";
import type { CountryData, Job } from "@/lib/pay/types";
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
    ...(low ? [{ label: "Low", value: low.value, note: `${low.q} in 100 people in the job earn less than this`, tone: "bg-chilli" }] : []),
    { label: "Fair", value: middle, note: "The middle: half earn more, half earn less", tone: "bg-amber" },
    ...(high ? [{ label: "Strong", value: high.value, note: `Beats ${high.q} in 100 people already in the job`, tone: "bg-zest" }] : []),
  ];

  return (
    <div className="animate-rise space-y-8">
      <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-9">
        <p className="eyebrow text-ink-soft">What to offer</p>
        <h2 className="display mt-2 text-[clamp(1.75rem,6vw,2.5rem)]">{job.title}</h2>
        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {bands.map((band) => (
            <div key={band.label} className="rounded-2xl border-2 border-ink p-4">
              <dt>
                <span className={`inline-block rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold ${band.tone}`}>{band.label}</span>
              </dt>
              <dd className="mt-3 font-display text-3xl font-extrabold tracking-tight">{money(country, band.value)}</dd>
              <dd className="mt-1 text-xs text-ink-soft">{band.note}</dd>
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
        {country.caveat && <p className="mt-3 rounded-xl border-2 border-dashed border-ink/30 p-3 text-sm text-ink-soft">{country.caveat}</p>}
      </div>

      <div className="rounded-3xl border-2 border-ink bg-brine p-6 text-white shadow-hard sm:p-9">
        <p className="eyebrow text-white/80">For employers</p>
        <p className="display mt-2 text-[clamp(1.75rem,6vw,2.5rem)]">Hiring for more than one role?</p>
        <p className="mt-3 max-w-xl text-white/90">
          We&apos;re building a pay report that covers every role in your team on one page. Leave a work email and you&apos;ll get it first.
        </p>
        <div className="mt-6">
          <EmailForm
            interest="employer"
            context={{ country: country.code, job: job.code, job_title: job.title }}
            cta="Send me the report"
            tone="brine"
            note="One email when it's ready. Nothing else."
            successTitle="You're on the list."
            successBody="We'll email you when the pay report is ready."
          />
        </div>
      </div>
    </div>
  );
}
