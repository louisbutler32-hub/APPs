import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Checker } from "@/components/Checker";
import { Coming, SiteFooter, SiteHeader } from "@/components/sections";
import { COUNTRIES, isCountryCode } from "@/lib/countries";
import { AVAILABLE, DATA, findJob } from "@/lib/pay/data";
import { money, shortPeriod } from "@/lib/pay/format";
import { quantilePoints } from "@/lib/pay/percentile";

export function generateStaticParams() {
  return AVAILABLE.flatMap((country) => DATA[country].jobs.map((job) => ({ country, job: job.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[country]/[job]">): Promise<Metadata> {
  const { country: code, job: slug } = await params;
  if (!isCountryCode(code)) return {};
  const job = findJob(code, slug);
  if (!job) return {};
  const country = COUNTRIES[code];
  const year = /\d{4}/.exec(DATA[code].period)?.[0] ?? "";
  return {
    title: `${job.title} pay in ${country.inName}${year ? ` (${year})` : ""}`,
    description: `The typical ${job.title.toLowerCase()} in ${country.inName} is paid ${money(country, job.p50 as number)} a year before tax. Enter your pay to see where you rank.`,
    alternates: { canonical: `/${code}/${slug}` },
  };
}

export default async function JobPage({ params }: PageProps<"/[country]/[job]">) {
  const { country: code, job: slug } = await params;
  if (!isCountryCode(code) || !AVAILABLE.includes(code)) notFound();
  const job = findJob(code, slug);
  if (!job) notFound();
  const country = COUNTRIES[code];
  const data = DATA[code];
  const points = quantilePoints(job);
  const at = (q: number) => points.find((point) => point.q === q)?.value;
  const low = at(25) ?? at(20) ?? at(30);
  const lowQ = at(25) ? 25 : at(20) ? 20 : 30;
  const high = at(75) ?? at(80) ?? at(70);
  const highQ = at(75) ? 75 : at(80) ? 80 : 70;
  const family = job.code.slice(0, 3);
  const related = data.jobs.filter((other) => other.code !== job.code && other.code.startsWith(family)).slice(0, 6);
  const stats = [
    { label: "Middle pay", value: money(country, job.p50 as number), note: "Half earn more, half earn less" },
    ...(low ? [{ label: `Lower end`, value: money(country, low), note: `${lowQ} in 100 earn less than this` }] : []),
    ...(high ? [{ label: `Higher end`, value: money(country, high), note: `${100 - highQ} in 100 earn more than this` }] : []),
    ...(!low && !high && job.mean ? [{ label: "Average pay", value: money(country, job.mean), note: "Pulled up by the highest earners" }] : []),
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
          <Checker
            available={AVAILABLE}
            country={code}
            job={job}
            intro={
              <div>
                <p className="eyebrow text-ink-soft">
                  <Link href={`/${code}`} className="underline underline-offset-4">
                    {country.name}
                  </Link>{" "}
                  · {shortPeriod(data.period)}
                </p>
                <h1 className="display mt-4 text-[clamp(2.4rem,8vw,4.5rem)] text-balance">
                  {job.title}: <span className="text-brine">what the job pays</span>
                </h1>
                <dl className="mt-8 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border-2 border-ink bg-white p-4">
                      <dt className="eyebrow text-ink-soft">{stat.label}</dt>
                      <dd className="mt-2 font-display text-3xl font-extrabold tracking-tight">{stat.value}</dd>
                      <dd className="mt-1 text-xs text-ink-soft">{stat.note}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 max-w-lg text-ink-soft">
                  Per year, before tax. The figures are {country.measure}, from the {country.publisher}.
                  {job.employees ? ` Based on about ${job.employees.toLocaleString("en")} people.` : ""}
                </p>
                {country.caveat && <p className="mt-3 max-w-lg text-sm text-ink-soft">{country.caveat}</p>}
              </div>
            }
          />
        </section>

        {(job.aliases.length > 0 || related.length > 0) && (
          <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-20 sm:px-8 md:grid-cols-2">
            {job.aliases.length > 0 && (
              <div>
                <h2 className="display text-2xl">Job titles in this group</h2>
                <p className="mt-3 text-ink-soft capitalize">{job.aliases.slice(0, 12).join(" · ")}</p>
              </div>
            )}
            {related.length > 0 && (
              <div>
                <h2 className="display text-2xl">Similar jobs</h2>
                <ul className="mt-3 space-y-2">
                  {related.map((other) => (
                    <li key={other.code}>
                      <Link href={`/${code}/${other.slug}`} className="flex justify-between gap-4 border-b border-ink/15 pb-2 hover:text-brine">
                        <span>{other.title}</span>
                        <span className="font-semibold tabular-nums">{money(country, other.p50 as number)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        <Coming />
      </main>
      <SiteFooter />
    </>
  );
}
