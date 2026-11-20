import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Checker } from "@/components/Checker";
import { Grains } from "@/components/Grains";
import { Coming, Founder, HeroIntro, HowItWorks, SiteFooter, SiteHeader, Sources, Sting, Ticker } from "@/components/sections";
import { COUNTRIES, isCountryCode } from "@/lib/countries";
import { AVAILABLE, DATA, popularJobs } from "@/lib/pay/data";
import { money, shortPeriod } from "@/lib/pay/format";

export function generateStaticParams() {
  return AVAILABLE.map((country) => ({ country }));
}

export async function generateMetadata({ params }: PageProps<"/[country]">): Promise<Metadata> {
  const { country: code } = await params;
  if (!isCountryCode(code)) return {};
  const country = COUNTRIES[code];
  return {
    title: `Are you underpaid? Check your pay in ${country.inName}`,
    description: `See where your pay ranks against everyone doing your job in ${country.inName}, using official ${country.publisher} figures. Free, no sign-up.`,
    alternates: { canonical: `/${code}` },
  };
}

export default async function CountryPage({ params }: PageProps<"/[country]">) {
  const { country: code } = await params;
  if (!isCountryCode(code) || !AVAILABLE.includes(code)) notFound();
  const country = COUNTRIES[code];
  const data = DATA[code];
  const popular = popularJobs(code, 24);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="relative">
          <Grains className="opacity-25" />
          <div className="relative mx-auto max-w-6xl px-5 pt-3 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
            <Checker
              available={AVAILABLE}
              country={code}
              intro={
                <HeroIntro
                  eyebrow={`${country.name} · ${country.publisher} figures`}
                  title={
                    <>
                      Are you <Sting>underpaid?</Sting>
                    </>
                  }
                >
                  <p>
                    Type your job and your pay. See where you rank against everyone doing the same work in {country.inName}.
                  </p>
                </HeroIntro>
              }
            />
          </div>
        </section>
        <Ticker countries={[code]} />

        <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 sm:pt-28">
          <p className="eyebrow text-ink-soft">Popular jobs in {country.inName}</p>
          <h2 className="display mt-3 max-w-2xl text-[clamp(2.25rem,7vw,4rem)]">What the job actually pays.</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((job) => (
              <li key={job.code}>
                <Link
                  href={`/${code}/${job.slug}`}
                  className="press flex items-baseline justify-between gap-4 rounded-2xl border-2 border-ink bg-white px-5 py-4 shadow-hard-sm"
                >
                  <span className="font-medium">{job.title}</span>
                  <span className="font-display text-xl font-extrabold tracking-tight text-brine">{money(country, job.p50 as number)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-ink-soft">
            Middle yearly pay before tax, {shortPeriod(data.period)}. {data.jobs.length.toLocaleString("en")} jobs covered: search above for yours.
          </p>
        </section>

        <HowItWorks />
        <Coming />
        <Sources />
        <Founder />
      </main>
      <SiteFooter />
    </>
  );
}
