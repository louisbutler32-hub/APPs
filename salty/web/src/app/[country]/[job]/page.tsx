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
      <SiteHeader tone="brine" />
      <main>
          <Checker
            available={AVAILABLE}
            country={code}
            job={job}
            intro={
              <div>
                <nav aria-label="Breadcrumb" className="text-sm font-semibold">
                  <Link href={`/${code}`} className="inline-block py-2 underline">
                    All jobs in {country.inName}
                  </Link>
                </nav>
                <h1 className="display mt-3 text-[clamp(2.4rem,8vw,4.5rem)]">{job.title}: what the job pays</h1>
                {/* A ruled table rather than a row of boxes: the figure, then what it means. */}
                <dl className="mt-8 border-t-2 border-white">
                  {stats.map((stat) => (
                    <div key={stat.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-white/30 py-3.5">
                      <dt className="font-semibold">{stat.label}</dt>
                      <dd className="figure text-3xl">{stat.value}</dd>
                      <dd className="col-span-2 mt-0.5 text-sm text-white/85">{stat.note}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 max-w-lg text-white/90">
                  Per year, before tax, {shortPeriod(data.period)}. The figures are {country.measure}, from the {country.publisher}.
                  {job.employees ? ` Based on about ${job.employees.toLocaleString("en")} people.` : ""}
                </p>
                {country.caveat && <p className="mt-3 max-w-lg text-sm text-white/85">{country.caveat}</p>}
              </div>
            }
          />

        {(job.aliases.length > 0 || related.length > 0) && (
          <section className="mx-auto grid max-w-6xl gap-x-14 gap-y-10 px-5 py-20 sm:px-8 md:grid-cols-2">
            {job.aliases.length > 0 && (
              <div>
                <h2 className="display border-b-2 border-ink pb-3 text-2xl">Job titles in this group</h2>
                <p className="mt-4 text-ink-soft capitalize">{job.aliases.slice(0, 12).join(", ")}</p>
              </div>
            )}
            {related.length > 0 && (
              <div>
                <h2 className="display border-b-2 border-ink pb-3 text-2xl">Similar jobs</h2>
                <ul>
                  {related.map((other) => (
                    <li key={other.code}>
                      <Link href={`/${code}/${other.slug}`} className="group flex items-baseline justify-between gap-4 border-b border-ink/15 py-3.5">
                        <span className="underline-offset-4 group-hover:underline">{other.title}</span>
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
