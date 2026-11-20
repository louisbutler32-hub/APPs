"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, COUNTRY_CODES, guessCountry } from "@/lib/countries";
import { currencySymbol, money, parsePay } from "@/lib/pay/format";
import { position, rank } from "@/lib/pay/percentile";
import { searchJobs } from "@/lib/pay/search";
import type { CountryCode, CountryData, Job } from "@/lib/pay/types";
import { verdictFor } from "@/lib/pay/verdict";
import { track } from "@/lib/track";
import { EmailForm } from "./EmailForm";
import { HiringResult } from "./HiringResult";
import { Result } from "./Result";

type Props = {
  /** Countries that have data, in display order. */
  available: CountryCode[];
  /** Fixed country (country and job pages). When absent the visitor's country is guessed. */
  country?: CountryCode;
  /** Preselected job (job pages). */
  job?: Job;
  /** Headline block shown beside the form on wide screens and above it on phones. */
  intro: React.ReactNode;
};

type Period = "year" | "hour";
/** What the visitor is doing: checking their own pay, weighing a job offer, or deciding what to offer. */
export type Mode = "pay" | "offer" | "hiring";

const MODES: { id: Mode; tab: string; button: string; payLabel: string }[] = [
  { id: "pay", tab: "My pay", button: "Am I underpaid?", payLabel: "Pay before tax" },
  { id: "offer", tab: "A job offer", button: "Is this offer any good?", payLabel: "The offer, before tax" },
  { id: "hiring", tab: "I'm hiring", button: "What should I offer?", payLabel: "" },
];
type Dataset = Pick<CountryData, "country" | "period" | "basis" | "source" | "jobs">;

const STORAGE_KEY = "salty.country";
// Empty on the live site. A preview hosted in a sub-folder sets it so files load relative to the page.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Storage can be missing or blocked (private browsing, embedded previews), so never let it break the page.
function readSavedCountry(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveCountry(code: CountryCode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not being able to remember the choice is fine.
  }
}
const cache = new Map<CountryCode, Promise<Dataset>>();

function loadDataset(code: CountryCode): Promise<Dataset> {
  let pending = cache.get(code);
  if (!pending) {
    pending = fetch(`${BASE}/data/${code}.json`).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${code} pay data`);
      return response.json() as Promise<Dataset>;
    });
    pending.catch(() => cache.delete(code));
    cache.set(code, pending);
  }
  return pending;
}

export function Checker({ available, country: fixedCountry, job: fixedJob, intro }: Props) {
  const jobInputId = useId();
  const payInputId = useId();
  const listId = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [code, setCode] = useState<CountryCode>(fixedCountry ?? available[0]);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState(fixedJob?.title ?? "");
  const [job, setJob] = useState<Job | null>(fixedJob ?? null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [payText, setPayText] = useState("");
  const [period, setPeriod] = useState<Period>("year");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("pay");
  const [checked, setChecked] = useState<{ mode: Mode; job: Job; pay: number | null } | null>(null);

  const country = COUNTRIES[code];
  const isLive = available.includes(code);
  // Every country is offered; the ones without trustworthy data yet explain why and take an email.
  const choices = useMemo(() => [...available, ...COUNTRY_CODES.filter((item) => !available.includes(item))], [available]);
  const current = MODES.find((item) => item.id === mode) ?? MODES[0];

  // Pick the visitor's country once, on the pages that do not fix it.
  useEffect(() => {
    if (fixedCountry) return;
    const saved = readSavedCountry() as CountryCode | null;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const next = saved && choices.includes(saved) ? saved : guessCountry(navigator.languages, zone, choices);
    const frame = requestAnimationFrame(() => setCode(next));
    return () => cancelAnimationFrame(frame);
  }, [fixedCountry, choices]);

  useEffect(() => {
    if (!isLive) return;
    let wanted = true;
    loadDataset(code)
      .then((data) => {
        if (wanted) {
          setDataset(data);
          setLoadFailed(false);
        }
      })
      .catch(() => {
        if (wanted) setLoadFailed(true);
      });
    return () => {
      wanted = false;
    };
  }, [code, isLive]);

  const jobs = dataset?.country === code ? dataset.jobs : null;
  const browseAll = jobs !== null && jobs.length <= 30;
  const matches = useMemo(() => {
    if (!jobs) return [];
    if (browseAll && query.trim().length < 2) return jobs.map((item) => ({ job: item, via: null, score: 0 }));
    return searchJobs(jobs, query);
  }, [jobs, query, browseAll]);

  const pay = parsePay(payText);
  const yearly = pay === null ? null : period === "year" ? pay : pay * country.fullTimeHours * 52;

  function changeCountry(next: CountryCode) {
    setCode(next);
    saveCountry(next);
    setJob(null);
    setQuery("");
    setChecked(null);
    setError(null);
    track("country", { country: next });
  }

  function choose(item: Job) {
    setJob(item);
    setQuery(item.title);
    setOpen(false);
    setError(null);
  }

  function onJobKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && open && matches[active]) {
      event.preventDefault();
      choose(matches[active].job);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const chosen = job ?? (matches.length === 1 ? matches[0].job : null);
    if (!chosen) {
      setError(query.trim() ? "Pick the closest job from the list." : "Start typing the job, then pick it from the list.");
      setOpen(matches.length > 0);
      return;
    }
    if (mode !== "hiring") {
      if (yearly === null) {
        setError(mode === "offer" ? "Enter the offer before tax, as a number." : "Enter what you earn before tax, as a number.");
        return;
      }
      if (period === "year" && yearly < 2000) {
        setError(`Enter the yearly figure in full, like ${country.examplePay}.`);
        return;
      }
    }
    if (!job) choose(chosen);
    setError(null);
    const amount = mode === "hiring" ? null : yearly;
    setChecked({ mode, job: chosen, pay: amount });
    const place = amount === null ? null : position(chosen, amount, rank(chosen, amount));
    track("check", { mode, country: code, job: chosen.code, verdict: place === null ? "none" : verdictFor(place).id });
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div>
      <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        <div>{intro}</div>
        <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-hard-brine sm:p-7">
          {!fixedCountry && choices.length > 1 && (
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Country">
              {choices.map((item) => {
                const selected = item === code;
                const soon = !available.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => changeCountry(item)}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors ${
                      selected ? "border-ink bg-ink text-salt" : "border-ink/20 text-ink hover:border-ink"
                    }`}
                  >
                    <span aria-hidden className="mr-1.5">
                      {COUNTRIES[item].flag}
                    </span>
                    {item.toUpperCase()}
                    {soon && <span className={`ml-1.5 text-[0.65rem] font-medium tracking-wide uppercase ${selected ? "text-zest" : "text-ink-soft"}`}>soon</span>}
                  </button>
                );
              })}
            </div>
          )}

          {!isLive ? (
            <div>
              <p className="display text-3xl">{country.name} is coming.</p>
              <p className="mt-3 text-ink-soft">{country.soonNote}</p>
              <p className="mt-5 mb-3 font-semibold">Get an email the day it lands:</p>
              <EmailForm
                key={code}
                interest={`country-${code}`}
                context={{ country: code }}
                cta="Tell me"
                successTitle="Done."
                successBody={`We'll email you when ${country.inName} is live.`}
              />
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border-2 border-ink bg-salt p-1" role="tablist" aria-label="What do you want to check?">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === item.id}
                    onClick={() => {
                      setMode(item.id);
                      setChecked(null);
                      setError(null);
                      track("mode", { mode: item.id });
                    }}
                    className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors ${mode === item.id ? "bg-ink text-salt" : "text-ink hover:bg-white"}`}
                  >
                    {item.tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <label htmlFor={jobInputId} className="eyebrow mb-2 block text-ink-soft">
                  {mode === "pay" ? "Your job" : mode === "offer" ? "The job" : "The role you're hiring for"}
                </label>
                <input
                  id={jobInputId}
                  type="text"
                  role="combobox"
                  aria-expanded={open && matches.length > 0}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={jobs === null ? "Loading jobs…" : "e.g. nurse, chef, electrician"}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setJob(null);
                    setActive(0);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 120)}
                  onKeyDown={onJobKeyDown}
                  className="h-14 w-full rounded-xl border-2 border-ink bg-salt px-4 text-lg font-medium placeholder:font-normal placeholder:text-ink-soft/60"
                />
                {open && matches.length > 0 && (
                  <ul
                    id={listId}
                    role="listbox"
                    className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-xl border-2 border-ink bg-white py-1 shadow-hard-sm"
                  >
                    {matches.map((match, index) => (
                      <li
                        key={match.job.code}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={index === active}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          choose(match.job);
                        }}
                        onMouseEnter={() => setActive(index)}
                        className={`cursor-pointer px-4 py-2.5 ${index === active ? "bg-brine text-white" : ""}`}
                      >
                        <span className="block font-medium">{match.job.title}</span>
                        {match.via && <span className={`block text-sm ${index === active ? "text-white/80" : "text-ink-soft"}`}>includes “{match.via}”</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {open && jobs !== null && query.trim().length >= 2 && matches.length === 0 && (
                  <p className="absolute inset-x-0 top-full z-20 mt-2 rounded-xl border-2 border-ink bg-white px-4 py-3 text-sm shadow-hard-sm">
                    No match. Try a simpler title, like “teacher” or “driver”.
                  </p>
                )}
              </div>

              {mode !== "hiring" && (
                <div className="mt-5">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <label htmlFor={payInputId} className="eyebrow text-ink-soft">
                      {current.payLabel}
                    </label>
                    <div className="flex shrink-0 rounded-full border-2 border-ink p-0.5 text-sm font-semibold whitespace-nowrap" role="group" aria-label="Pay period">
                      {(["year", "hour"] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={period === item}
                          onClick={() => setPeriod(item)}
                          className={`rounded-full px-3 py-1 ${period === item ? "bg-ink text-salt" : "text-ink"}`}
                        >
                          per {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-display text-2xl font-extrabold">
                      {currencySymbol(country)}
                    </span>
                    <input
                      id={payInputId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={period === "year" ? country.examplePay.toLocaleString(country.locale) : "15.50"}
                      value={payText}
                      onChange={(event) => {
                        setPayText(event.target.value);
                        setError(null);
                      }}
                      className="h-16 w-full rounded-xl border-2 border-ink bg-salt pr-4 pl-12 font-display text-3xl font-extrabold tracking-tight tabular-nums placeholder:font-semibold placeholder:text-ink-soft/40"
                    />
                  </div>
                  {period === "hour" && yearly !== null && (
                    <p className="mt-2 text-sm text-ink-soft">
                      About {money(country, yearly)} a year at {country.fullTimeHours} hours a week.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-chilli/15 px-3 py-2 text-sm font-medium">
                  {error}
                </p>
              )}
              {loadFailed && (
                <p role="alert" className="mt-4 rounded-lg bg-chilli/15 px-3 py-2 text-sm font-medium">
                  The pay figures didn&apos;t load. Check your connection and refresh.
                </p>
              )}

              <button type="submit" className="press mt-6 h-16 w-full rounded-xl border-2 border-ink bg-brine font-display text-2xl font-extrabold tracking-tight text-white shadow-hard-sm">
                {current.button}
              </button>
              <p className="mt-3 text-center text-sm text-ink-soft">
                {mode === "hiring" ? "Free. Official figures, not job-ad guesses." : "Free. No sign-up. Your pay never leaves this device."}
              </p>
            </form>
          )}
        </div>
      </div>

      <div ref={resultRef} className="mx-auto max-w-3xl scroll-mt-6">
        {checked && dataset && isLive && (
          <div className="mt-12">
            {checked.mode === "hiring" || checked.pay === null ? (
              <HiringResult key={checked.job.code} country={country} data={dataset} job={checked.job} />
            ) : (
              <Result key={`${checked.mode}-${checked.job.code}-${checked.pay}`} mode={checked.mode} country={country} data={dataset} job={checked.job} pay={checked.pay} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
