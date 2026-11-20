import Link from "next/link";
import { brand } from "@/lib/brand";
import { COUNTRIES } from "@/lib/countries";
import { AVAILABLE, DATA, popularJobs } from "@/lib/pay/data";
import { money, moneyShort, percent, shortPeriod } from "@/lib/pay/format";
import { position, quantilePoints, rank } from "@/lib/pay/percentile";
import type { CountryCode } from "@/lib/pay/types";
import { verdictFor } from "@/lib/pay/verdict";
import { EmailForm } from "./EmailForm";
import { OpenGateLink } from "./EmailGate";
import { Logo } from "./Logo";
import { Scale, VERDICT_TONE } from "./Scale";
import { Shaker } from "./Shaker";

/** The shared page width and side padding, so every section starts and ends on the same two lines. */
export const WRAP = "mx-auto max-w-6xl px-5 sm:px-8";

/**
 * The top bar. On pages that open with the blue pay check it is blue too, so the first screen is
 * one block of colour: the same blue screen a visitor has just seen at the end of a Salty video.
 */
export function SiteHeader({ tone = "salt" }: { tone?: "salt" | "brine" }) {
  const onBrine = tone === "brine";
  return (
    <header className={onBrine ? "on-dark bg-brine text-white" : "bg-salt"}>
      <div className={`${WRAP} flex items-center justify-between py-3 sm:py-5`}>
        <Link href="/" aria-label={`${brand.name} home`} className="py-2">
          <Logo grain={onBrine ? "bg-zest" : "bg-brine"} />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-3" aria-label="Countries">
          {AVAILABLE.map((code) => (
            <Link key={code} href={`/${code}`} aria-label={COUNTRIES[code].name} className="px-2.5 py-3 underline-offset-4 hover:underline">
              {code.toUpperCase()}
            </Link>
          ))}
          <OpenGateLink className={`press ml-1.5 rounded-ctl px-3.5 py-2 ${onBrine ? "border-2 border-white hover:bg-white hover:text-brine" : "bg-ink text-salt hover:bg-brine"}`}>Pay drop</OpenGateLink>
        </nav>
      </div>
    </header>
  );
}

/** The words beside the pay check: the headline, then one or two plain sentences. Sits on blue. */
export function HeroIntro({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      {title}
      <div className="mt-5 max-w-[34rem] text-lg text-white/90 sm:mt-7 sm:text-xl">{children}</div>
    </div>
  );
}

/** How many jobs have official figures, for the sentence under the headline. */
export function officialJobCount(countries: CountryCode[] = AVAILABLE): string {
  return countries.reduce((total, code) => total + DATA[code].jobs.length, 0).toLocaleString("en");
}

/**
 * The pay in the middle for the most common jobs, as a plain table of links. Real figures a
 * visitor can read before typing anything, and a way in to every job page.
 */
export function PayTable({ countries, rows = 8 }: { countries: CountryCode[]; rows?: number }) {
  const single = countries.length === 1;
  return (
    <section className={`${WRAP} py-20 sm:py-28`}>
      <h2 className="display max-w-3xl text-[clamp(2.25rem,7vw,4rem)]">{single ? `What jobs pay in ${COUNTRIES[countries[0]].inName}.` : "What the job pays."}</h2>
      <p className="mt-5 max-w-[60ch] text-lg text-ink-soft">
        The pay in the middle for each job: half the people doing it earn more, half earn less. Per year, before tax. Pick a job to see the
        full spread.
      </p>
      <div className={`mt-12 grid gap-x-14 gap-y-12 ${single ? "" : "lg:grid-cols-2"}`}>
        {countries.map((code) => {
          const country = COUNTRIES[code];
          const data = DATA[code];
          return (
            <div key={code}>
              {!single && (
                <h3 className="flex items-baseline justify-between gap-4 border-b-2 border-ink pb-3">
                  <span className="display text-2xl">{country.name}</span>
                  <span className="text-sm text-ink-soft">{shortPeriod(data.period)}</span>
                </h3>
              )}
              <ul className={single ? "grid gap-x-14 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-3" : ""}>
                {popularJobs(code, rows).map((job) => (
                  <li key={job.code}>
                    <Link href={`/${code}/${job.slug}`} className="group flex items-baseline justify-between gap-4 border-b border-ink/15 py-3.5">
                      <span className="underline-offset-4 group-hover:underline">{job.title}</span>
                      <span className="font-semibold tabular-nums">{money(country, job.p50 as number)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-soft">
                {single ? (
                  <>
                    {shortPeriod(data.period)} figures from the {country.publisher}. {data.jobs.length.toLocaleString("en")} jobs covered: search above for
                    yours.
                  </>
                ) : (
                  <Link href={`/${code}`} className="font-semibold text-ink underline">
                    All {data.jobs.length.toLocaleString("en")} jobs in {country.inName}
                  </Link>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** The job and pay used for the worked example. Its result is worked out from the published figures, never typed in. */
const EXAMPLE = { country: "uk" as CountryCode, title: "Care workers and home carers", name: "care worker", pay: 25000 };

const FACTS = [
  {
    title: "The figures are official.",
    body: "They are published by government statistics offices. A job or country they miss gets an AI estimate instead, and the result says so.",
  },
  { title: "Your pay stays on your device.", body: "The sum is done in your browser. Nothing you type about your pay is sent to us or to anyone else." },
  { title: "It is free.", body: "The pay check, the offer check and the first part of the raise plan cost nothing and need no account." },
];

/**
 * One real result, shown before the visitor has typed anything, so they can see what they will
 * get. It is labelled as an example and built from the same data and sums as a live check.
 */
export function Example() {
  if (!AVAILABLE.includes(EXAMPLE.country)) return null;
  const country = COUNTRIES[EXAMPLE.country];
  const job = DATA[EXAMPLE.country].jobs.find((item) => item.title === EXAMPLE.title);
  if (!job) return null;
  const ranking = rank(job, EXAMPLE.pay);
  const place = position(job, EXAMPLE.pay, ranking);
  if (ranking.kind !== "published" || place === null || ranking.percentile >= 50) return null;
  const verdict = verdictFor(place);
  const points = quantilePoints(job)
    .filter((point) => [10, 25, 50, 75, 90].includes(point.q))
    .map((point) => ({ at: point.q, label: moneyShort(country, point.value), main: point.q === 50 }));

  return (
    <section className="border-y border-ink/15 bg-paper">
      <div className={`${WRAP} grid gap-12 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20`}>
        <div>
          <h2 className="display text-[clamp(2.25rem,7vw,4rem)]">What you get back.</h2>
          <p className="mt-5 max-w-[46ch] text-lg text-ink-soft">
            Take a {EXAMPLE.name} in {country.inName} on {money(country, EXAMPLE.pay)} a year. They type that in, and this is the answer.
          </p>
          <dl className="mt-10 border-t-2 border-ink">
            {FACTS.map((fact) => (
              <div key={fact.title} className="border-b border-ink/15 py-4">
                <dt className="font-semibold">{fact.title}</dt>
                <dd className="mt-1 text-ink-soft">{fact.body}</dd>
              </div>
            ))}
          </dl>
        </div>
        <figure className="self-start rounded-box bg-salt p-6 sm:p-9">
          <figcaption className="text-sm text-ink-soft">
            Example: {job.title.toLowerCase()}, {country.name}, {money(country, EXAMPLE.pay)} a year
          </figcaption>
          <p className="mt-5">
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
          </p>
          <p className="figure mt-6 text-[clamp(4.5rem,20vw,8rem)]">{percent(100 - ranking.percentile)}</p>
          <p className="display mt-3 max-w-md text-[clamp(1.4rem,4.5vw,2rem)]">of people in the job are paid more.</p>
          <Scale className="mt-8" place={place} points={points} ends={["Lowest paid", "Middle", "Highest paid"]} tone={verdict.id} marker={money(country, EXAMPLE.pay)} />
        </figure>
      </div>
    </section>
  );
}

const TOOLS = [
  { title: "Pay check", tag: "Free", body: "Where you rank against everyone doing your job. Any job, any country." },
  { title: "Raise plan", tag: "Free to start", body: "The figure to ask for, how strong your case is, and the words to use." },
  { title: "Offer check", tag: "Free", body: "Is a job offer low, fair or strong? And what to say back." },
  { title: "For employers", tag: "Free", body: "What to offer for any role, from the same official figures." },
  { title: "Sunday pay drop", tag: "Free", body: "Three pay facts worth knowing and one move to make, weekly." },
  { title: "Pay by company", tag: "Coming", body: "What your employer, and the one down the road, pays." },
];

/** Everything Salty does beyond the first number, and the sign-up for the weekly email. */
export function Coming() {
  return (
    <section id="join" className="on-dark scroll-mt-4 bg-ink text-salt">
      <div className={`${WRAP} grid gap-14 py-20 sm:py-28 lg:grid-cols-[1fr_1.1fr] lg:gap-20`}>
        <div>
          <h2 className="display text-[clamp(2.25rem,7vw,4rem)]">Knowing is step one. Getting paid is step two.</h2>
          <p className="mt-5 max-w-[44ch] text-lg text-salt/80">
            Check your pay, then build the plan to change it. And every Sunday, the pay drop: three pay facts worth knowing and one move to
            make.
          </p>
          <div className="mt-8 max-w-lg">
            <EmailForm interest="newsletter" cta="Get the pay drop" tone="dark" successTitle="You're on the list." successBody="You'll get the next pay drop when it goes out." />
          </div>
        </div>
        <ul className="self-start border-t-2 border-salt">
          {TOOLS.map((tool) => (
            <li key={tool.title} className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 border-b border-salt/20 py-4">
              <h3 className="display text-xl">{tool.title}</h3>
              <span className={`text-sm font-semibold ${tool.tag === "Coming" ? "text-salt/60" : "text-zest"}`}>{tool.tag}</span>
              <p className="col-span-2 mt-1 max-w-[52ch] text-salt/70">{tool.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Sources() {
  return (
    <section id="sources" className={`${WRAP} scroll-mt-4 py-20 sm:py-28`}>
      <h2 className="display max-w-3xl text-[clamp(2.25rem,7vw,4rem)]">Where the numbers come from.</h2>
      <p className="mt-5 max-w-[62ch] text-lg text-ink-soft">
        Where a government statistics office publishes pay for your job, that is what Salty uses. For jobs and countries those figures
        don&apos;t cover, Salty gives an AI estimate, and the result always says so.
      </p>
      <ul className="mt-12 grid gap-x-14 gap-y-10 md:grid-cols-2">
        {AVAILABLE.map((code) => {
          const country = COUNTRIES[code];
          const data = DATA[code];
          return (
            <li key={code} className="border-t-2 border-ink pt-4">
              <h3 className="display text-2xl">{country.name}</h3>
              <p className="mt-3 max-w-[52ch] text-ink-soft">
                {country.publisher}, {shortPeriod(data.period)}. {data.jobs.length.toLocaleString("en")} jobs. The figures are {country.measure}.
              </p>
              {country.caveat && <p className="mt-2 max-w-[52ch] text-sm text-ink-soft">{country.caveat}</p>}
              <a href={data.source.url} rel="noopener" className="mt-3 inline-block py-1 font-semibold underline">
                See the source
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Founder() {
  const { name, links } = brand.founder;
  if (links.length === 0) return null;
  return (
    <section className="bg-zest">
      <div className={`${WRAP} py-16 sm:py-20`}>
        <h2 className="display max-w-2xl text-[clamp(1.9rem,6vw,3.25rem)]">{name ? `${name} is building Salty out loud.` : "Salty is being built out loud."}</h2>
        <p className="mt-4 max-w-[52ch] text-lg">Every number, every mistake and every lesson, posted as it happens.</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.href} rel="noopener" className="press inline-block rounded-ctl bg-ink px-5 py-3 font-semibold text-salt hover:bg-brine">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const link = "py-2 underline-offset-4 hover:underline";
  return (
    <footer className="on-dark overflow-hidden bg-ink text-salt">
      <div className={`${WRAP} pt-14`}>
        <p aria-hidden className="display -mb-[0.06em] flex items-baseline text-[clamp(5.5rem,27vw,19rem)] leading-[0.8] text-salt">
          salty
          <span className="ml-[0.05em] inline-block size-[0.2em] rotate-[18deg] rounded-[2px] bg-brine" />
        </p>
      </div>
      <div className={`${WRAP} py-12`}>
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <p className="display text-2xl text-salt">{brand.tagline}</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
            {AVAILABLE.map((code) => (
              <Link key={code} href={`/${code}`} className={link}>
                {COUNTRIES[code].name}
              </Link>
            ))}
            <Link href="/#sources" className={link}>
              Sources
            </Link>
            <OpenGateLink className={link}>Sunday pay drop</OpenGateLink>
            <Link href="/privacy" className={link}>
              Privacy
            </Link>
            <Link href="/terms" className={link}>
              Terms
            </Link>
          </nav>
        </div>
        <div className="mt-10 space-y-2 border-t border-salt/20 pt-6 text-xs text-salt/65">
          {AVAILABLE.map((code) => (
            <p key={code} className="max-w-[27rem]">
              {DATA[code].source.attribution}
            </p>
          ))}
          <p className="max-w-[27rem]">Salty shows where pay sits among official figures for a job. It is a guide, not financial or legal advice.</p>
        </div>
      </div>
    </footer>
  );
}
