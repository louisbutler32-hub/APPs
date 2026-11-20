import Link from "next/link";
import { brand } from "@/lib/brand";
import { COUNTRIES } from "@/lib/countries";
import { AVAILABLE, DATA, popularJobs } from "@/lib/pay/data";
import { moneyShort, shortPeriod } from "@/lib/pay/format";
import type { CountryCode } from "@/lib/pay/types";
import { Grains } from "./Grains";
import { Logo } from "./Logo";
import { EmailForm } from "./EmailForm";
import { OpenGateLink } from "./EmailGate";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-ink/0 bg-salt/85 backdrop-blur-md supports-[backdrop-filter]:bg-salt/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4">
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
        <OpenGateLink className="press ml-1 rounded-full border-2 border-ink bg-zest px-4 py-1.5 text-sm font-semibold shadow-hard-sm">Pay drop</OpenGateLink>
      </nav>
      </div>
    </header>
  );
}

/** The headline block passed into the checker. */
export function HeroIntro({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <p className="kicker text-ink-soft">{eyebrow}</p>
      <h1 className="display mt-3 text-[clamp(3.1rem,13vw,7rem)] text-balance sm:mt-4">{title}</h1>
      <div className="mt-4 max-w-md text-base text-ink-soft sm:mt-6 sm:text-xl">{children}</div>
    </div>
  );
}

/** Three real numbers under the headline: how much official data sits behind the check. */
export function HeroStats() {
  const jobs = AVAILABLE.reduce((total, code) => total + DATA[code].jobs.length, 0);
  const stats = [
    { value: jobs.toLocaleString("en"), label: "jobs with official figures" },
    { value: String(AVAILABLE.length), label: AVAILABLE.length === 1 ? "country live" : "countries live" },
    { value: "0", label: "sign-ups needed" },
  ];
  return (
    <dl className="mt-6 hidden gap-6 sm:flex">
      {stats.map((stat) => (
        <div key={stat.label} className="border-l-2 border-ink pl-3">
          <dt className="sr-only">{stat.label}</dt>
          <dd className="font-display text-2xl leading-none font-extrabold tracking-tight">{stat.value}</dd>
          <dd className="mt-1 text-xs text-ink-soft">{stat.label}</dd>
        </div>
      ))}
    </dl>
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

/** Small pictures of the product for the three steps. Decorative: the words beside them say the same thing. */
function StepArt({ step }: { step: 1 | 2 | 3 }) {
  if (step === 1) {
    return (
      <div aria-hidden className="space-y-1.5">
        <div className="flex h-10 items-center rounded-lg border-2 border-ink bg-salt px-3 text-sm font-medium">
          chef<span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-brine" />
        </div>
        <div className="rounded-lg border-2 border-ink bg-brine px-3 py-1.5 text-sm font-medium text-white">Chefs</div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div aria-hidden className="flex h-[5.5rem] flex-col justify-center">
        <div className="flex h-12 items-center gap-2 rounded-lg border-2 border-ink bg-salt px-3 font-display text-2xl font-extrabold tracking-tight">
          <span>£</span>26,000
        </div>
        <div className="mt-1.5 flex gap-1 text-[0.65rem] font-semibold">
          <span className="rounded-full bg-ink px-2 py-0.5 text-salt">per year</span>
          <span className="rounded-full border border-ink/30 px-2 py-0.5">per hour</span>
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden className="flex h-[5.5rem] flex-col justify-center">
      <div className="flex items-end justify-between">
        <span className="font-display text-4xl leading-none font-extrabold tracking-tight">81%</span>
        <span className="rounded-full border-2 border-ink bg-chilli px-2 py-0.5 text-[0.65rem] font-bold">Extra salty</span>
      </div>
      <div className="relative mt-3 h-3 rounded-full border-2 border-ink bg-gradient-to-r from-chilli via-amber to-zest">
        <span className="absolute -top-1.5 left-[19%] h-5 w-1 rounded-full bg-ink" />
      </div>
    </div>
  );
}

const STEPS = [
  { n: 1, title: "Say what you do", body: "Type your job the way you'd say it. We match it to the official job group." },
  { n: 2, title: "Say what you earn", body: "Yearly or hourly, before tax. It stays on your device. We never see it." },
  { n: 3, title: "See where you rank", body: "Instantly, against everyone doing the same work, from government figures." },
] as const;

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <p className="kicker text-ink-soft">How it works</p>
      <h2 className="display mt-3 max-w-2xl text-[clamp(2.25rem,7vw,4rem)]">Ten seconds. No sign-up. No guessing.</h2>
      <ol className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.n} className="lift flex flex-col rounded-3xl border-2 border-ink bg-white p-6 shadow-hard-sm">
            <div className="rounded-2xl bg-salt-deep/60 p-4">
              <StepArt step={step.n} />
            </div>
            <p className="mt-6 flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-brine font-display text-lg font-extrabold text-white">{step.n}</span>
              <span className="display text-2xl">{step.title}</span>
            </p>
            <p className="mt-3 text-ink-soft">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One line-drawn icon per tool, all on the same 24-unit grid and stroke. */
const ICONS: Record<string, React.ReactNode> = {
  check: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  raise: <path d="M4 17l6-6 4 4 6-8m0 0h-5m5 0v5" />,
  offer: <path d="M7 3h8l4 4v14H7zM14 3v5h5M10 14l2 2 4-4" />,
  hire: <path d="M3 8h18v12H3zM9 8V5h6v3M3 13h18" />,
  mail: <path d="M3 6h18v12H3zM3 7l9 7 9-7" />,
  company: <path d="M4 21V5h9v16M13 10h7v11M2 21h20M7 9h3M7 13h3M7 17h3M16 14h1M16 18h1" />,
};

const TOOLS = [
  { icon: "check", title: "Pay check", tag: "Free", body: "Where you rank against everyone doing your job. Any job, any country." },
  { icon: "raise", title: "Raise plan", tag: "Free to start", body: "The figure to ask for, how strong your case is, and the words to use." },
  { icon: "offer", title: "Offer check", tag: "Free", body: "Is a job offer low, fair or strong? And what to say back." },
  { icon: "hire", title: "For employers", tag: "Free", body: "What to offer for any role, from the same official figures." },
  { icon: "mail", title: "Sunday pay drop", tag: "Free", body: "Three pay facts worth knowing and one move to make, weekly." },
  { icon: "company", title: "Pay by company", tag: "Coming", body: "What your employer, and the one down the road, actually pays." },
];

export function Coming() {
  return (
    <section id="join" className="relative scroll-mt-4 border-y-2 border-ink bg-brine text-white">
      <Grains tone="bg-white/70" className="opacity-60" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="kicker text-white/80 before:bg-zest">More than a number</p>
          <h2 className="display mt-3 text-[clamp(2.25rem,7vw,4rem)]">Knowing is step one. Getting paid is step two.</h2>
          <p className="mt-5 max-w-md text-lg text-white/90">
            Check your pay, then build the plan to change it. And every Sunday, the pay drop: three pay facts worth knowing and one
            move to make.
          </p>
          <div className="mt-8 max-w-lg">
            <EmailForm interest="newsletter" cta="Get the pay drop" tone="brine" successTitle="You're on the list." successBody="You'll get the next pay drop when it goes out." />
          </div>
        </div>
        <ul className="grid content-start gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <li key={tool.title} className="lift rounded-2xl border-2 border-ink bg-salt p-5 text-ink shadow-hard-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-white">
                  <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[tool.icon]}
                  </svg>
                </span>
                <span className={`shrink-0 rounded-full border border-ink px-2 py-0.5 text-xs font-semibold ${tool.tag === "Coming" ? "bg-white" : "bg-zest"}`}>{tool.tag}</span>
              </div>
              <h3 className="display mt-4 text-xl">{tool.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{tool.body}</p>
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
      <p className="kicker text-ink-soft">Where the numbers come from</p>
      <h2 className="display mt-3 max-w-2xl text-[clamp(2.25rem,7vw,4rem)]">Official figures. Not vibes.</h2>
      <p className="mt-5 max-w-2xl text-lg text-ink-soft">
        Where a government statistics office publishes pay for your job, that is what Salty uses: no scraped job ads and no
        anonymous self-reports. For jobs and countries those figures don&apos;t cover, Salty gives an AI estimate instead, and
        always says so on the result.
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
        <p className="kicker">Built in public</p>
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
    <footer className="overflow-hidden border-t-2 border-ink bg-ink text-salt">
      <div className="mx-auto max-w-6xl px-5 pt-14 sm:px-8">
        <p aria-hidden className="display -mb-[0.06em] flex items-baseline text-[clamp(5.5rem,27vw,19rem)] leading-[0.8] text-salt">
          salty
          <span className="ml-[0.05em] inline-block size-[0.2em] rotate-[18deg] rounded-[2px] bg-brine" />
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <p className="font-display text-2xl font-extrabold tracking-tight text-salt">{brand.tagline}</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {AVAILABLE.map((code) => (
              <Link key={code} href={`/${code}`} className="hover:text-zest">
                {COUNTRIES[code].name}
              </Link>
            ))}
            <Link href="/#sources" className="hover:text-zest">
              Sources
            </Link>
            <OpenGateLink className="hover:text-zest">Sunday pay drop</OpenGateLink>
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
