import Link from "next/link";
import { brand, COMING_FEATURES } from "@/lib/brand";
import { COUNTRIES } from "@/lib/countries";
import { AVAILABLE, DATA, popularJobs } from "@/lib/pay/data";
import { moneyShort, shortPeriod } from "@/lib/pay/format";
import type { CountryCode } from "@/lib/pay/types";
import { Grains } from "./Grains";
import { Logo } from "./Logo";
import { WaitlistForm } from "./WaitlistForm";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <Link href="/" aria-label={`${brand.name} home`}>
        <Logo />
      </Link>
      <nav className="flex items-center gap-1.5 sm:gap-3" aria-label="Countries">
        {AVAILABLE.map((code) => (
          <Link
            key={code}
            href={`/${code}`}
            className="rounded-full px-2 py-1 text-sm font-semibold hover:bg-ink hover:text-salt sm:px-3"
            title={COUNTRIES[code].name}
          >
            <span aria-hidden>{COUNTRIES[code].flag}</span>
            <span className="ml-1.5 hidden sm:inline">{code.toUpperCase()}</span>
            <span className="sr-only sm:hidden">{COUNTRIES[code].name}</span>
          </Link>
        ))}
        <a href="#waitlist" className="press ml-1 rounded-full border-2 border-ink bg-zest px-4 py-1.5 text-sm font-semibold shadow-hard-sm">
          Waitlist
        </a>
      </nav>
    </header>
  );
}

/** The headline block passed into the checker. */
export function HeroIntro({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <p className="eyebrow text-ink-soft">{eyebrow}</p>
      <h1 className="display mt-3 text-[clamp(3.1rem,13vw,7rem)] text-balance sm:mt-4">{title}</h1>
      <div className="mt-4 max-w-md text-base text-ink-soft sm:mt-6 sm:text-xl">{children}</div>
    </div>
  );
}

/** Word in the headline that carries the sting. */
export function Sting({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap text-brine">
      {children}
      <svg aria-hidden viewBox="0 0 300 14" preserveAspectRatio="none" className="absolute -bottom-[0.06em] left-0 h-[0.12em] w-full text-chilli">
        <path d="M2 9 C 50 2, 90 13, 150 7 S 250 3, 298 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Ticker({ countries }: { countries: CountryCode[] }) {
  const perCountry = Math.max(6, Math.ceil(18 / Math.max(1, countries.length)));
  const items = countries.flatMap((code) =>
    popularJobs(code, perCountry).map((job) => ({
      key: `${code}-${job.code}`,
      href: `/${code}/${job.slug}`,
      flag: COUNTRIES[code].flag,
      title: job.title,
      pay: moneyShort(COUNTRIES[code], job.p50 as number),
    })),
  );
  if (items.length === 0) return null;
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item.key} className="flex items-center whitespace-nowrap">
          <Link href={item.href} tabIndex={hidden ? -1 : undefined} className="flex items-baseline gap-2.5 px-5 py-3.5 hover:text-zest">
            <span aria-hidden>{item.flag}</span>
            <span className="eyebrow">{item.title}</span>
            <span className="font-display text-xl font-extrabold tracking-tight text-zest">{item.pay}</span>
          </Link>
          <span aria-hidden className="size-1.5 rotate-45 bg-salt/40" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Typical pay for popular jobs" className="overflow-hidden border-y-2 border-ink bg-ink text-salt">
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

const STEPS = [
  { n: "1", title: "Say what you do", body: "Type your job the way you'd say it. We match it to the official job group." },
  { n: "2", title: "Say what you earn", body: "Yearly or hourly, before tax. It stays on your device. We never see it." },
  { n: "3", title: "See where you rank", body: "Instantly, against everyone doing the same work, from government figures." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <p className="eyebrow text-ink-soft">How it works</p>
      <h2 className="display mt-3 max-w-2xl text-[clamp(2.25rem,7vw,4rem)]">Ten seconds. No sign-up. No guessing.</h2>
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.n} className="rounded-3xl border-2 border-ink bg-white p-7 shadow-hard-sm">
            <span className="figure text-6xl text-brine">{step.n}</span>
            <h3 className="display mt-5 text-2xl">{step.title}</h3>
            <p className="mt-3 text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Coming() {
  return (
    <section id="waitlist" className="relative scroll-mt-4 border-y-2 border-ink bg-brine text-white">
      <Grains tone="bg-white/70" className="opacity-60" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="eyebrow text-white/80">Coming soon</p>
          <h2 className="display mt-3 text-[clamp(2.25rem,7vw,4rem)]">Knowing is step one. Getting paid is step two.</h2>
          <p className="mt-5 max-w-md text-lg text-white/90">
            The free check tells you where you stand. The app we&apos;re building tells you what to do about it.
          </p>
          <div className="mt-8 max-w-lg">
            <WaitlistForm tone="brine" />
          </div>
        </div>
        <ul className="grid content-start gap-4 sm:grid-cols-2">
          {COMING_FEATURES.map((feature) => (
            <li key={feature.id} className="rounded-2xl border-2 border-ink bg-salt p-5 text-ink shadow-hard-sm">
              <h3 className="display text-xl">{feature.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Sources() {
  return (
    <section id="sources" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-20 sm:px-8 sm:py-28">
      <p className="eyebrow text-ink-soft">Where the numbers come from</p>
      <h2 className="display mt-3 max-w-2xl text-[clamp(2.25rem,7vw,4rem)]">Official figures. Not vibes.</h2>
      <p className="mt-5 max-w-2xl text-lg text-ink-soft">
        Every number on Salty comes from a government statistics office. No scraped job ads, no anonymous
        self-reports, and nothing made up.
      </p>
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {AVAILABLE.map((code) => {
          const country = COUNTRIES[code];
          const data = DATA[code];
          return (
            <li key={code} className="rounded-2xl border-2 border-ink bg-white p-6">
              <p className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
                <span aria-hidden>{country.flag}</span> {country.name}
              </p>
              <p className="mt-2 text-ink-soft">
                {country.publisher}, {shortPeriod(data.period)}. {data.jobs.length.toLocaleString("en")} jobs. The figures are {country.measure}.
              </p>
              {country.caveat && <p className="mt-2 text-sm text-ink-soft">{country.caveat}</p>}
              <a href={data.source.url} rel="noopener" className="mt-3 inline-block text-sm font-semibold text-brine underline underline-offset-4">
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
    <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
      <div className="rounded-3xl border-2 border-ink bg-zest p-7 shadow-hard sm:p-10">
        <p className="eyebrow">Built in public</p>
        <h2 className="display mt-3 max-w-2xl text-[clamp(1.9rem,6vw,3.25rem)]">
          {name ? `${name} is building Salty out loud.` : "Salty is being built out loud."}
        </h2>
        <p className="mt-4 max-w-xl text-lg">Every number, every mistake and every lesson, posted as it happens. Follow along.</p>
        <ul className="mt-6 flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.href} rel="noopener" className="press inline-block rounded-full border-2 border-ink bg-white px-5 py-2 font-semibold shadow-hard-sm">
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
  return (
    <footer className="border-t-2 border-ink bg-ink text-salt">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <Logo className="text-salt" />
            <p className="mt-2 text-salt/70">{brand.tagline}</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {AVAILABLE.map((code) => (
              <Link key={code} href={`/${code}`} className="hover:text-zest">
                {COUNTRIES[code].name}
              </Link>
            ))}
            <Link href="/#sources" className="hover:text-zest">
              Sources
            </Link>
            <Link href="/privacy" className="hover:text-zest">
              Privacy
            </Link>
          </nav>
        </div>
        <div className="mt-10 space-y-1.5 border-t border-salt/15 pt-6 text-xs text-salt/55">
          {AVAILABLE.map((code) => (
            <p key={code}>{DATA[code].source.attribution}</p>
          ))}
          <p>Salty shows where pay sits among official figures for a job. It is a guide, not financial or legal advice.</p>
        </div>
      </div>
    </footer>
  );
}
