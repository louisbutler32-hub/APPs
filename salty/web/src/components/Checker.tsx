"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, guessWhere, ISO_CODES } from "@/lib/countries";
import { ESTIMATE_ERRORS, LIVE_AI_ON, requestEstimate, type EstimateTarget } from "@/lib/estimate-client";
import { BUILTIN_JOBS, hasBuiltin } from "@/lib/estimates-builtin";
import { cleanJobTitle, type Estimate } from "@/lib/estimate-shared";
import { currencySymbol, money, parsePay } from "@/lib/pay/format";
import { position, rank } from "@/lib/pay/percentile";
import { searchJobs } from "@/lib/pay/search";
import type { CountryCode, CountryData, Job } from "@/lib/pay/types";
import { verdictFor } from "@/lib/pay/verdict";
import { track } from "@/lib/track";
import { cleanPlaceName, inName, OTHER_COUNTRIES, placeFor, typedPlace, worldCountry, type Place } from "@/lib/world";
import { EmailForm } from "./EmailForm";
import { EstimateResult } from "./EstimateResult";
import { HiringResult } from "./HiringResult";
import { Grains } from "./Grains";
import { Result } from "./Result";
import { scrollToElement } from "./SmoothScroll";

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

type Period = "year" | "month" | "hour";
/** Value of the country list when the visitor wants to type a country that is not on it. */
const ELSEWHERE = "ZZ";
/**
 * Countries offered under "Other". With a live AI behind the site that is every listed country;
 * without one it is the countries that have built-in estimates.
 */
const OTHER_CHOICES = LIVE_AI_ON ? OTHER_COUNTRIES : OTHER_COUNTRIES.filter((item) => hasBuiltin(item.iso));
/** The jobs with a built-in estimate, in the shape the job search works on. */
const BUILTIN_AS_JOBS: Job[] = BUILTIN_JOBS.map((item) => ({ code: item.title, title: item.title, slug: "", employees: null, mean: null, aliases: item.aliases }));
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

function saveCountry(code: string) {
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
  const [checked, setChecked] = useState<{ mode: Mode; job: Job; pay: number | null } | { mode: "estimate"; estimate: Estimate; pay: number; place: Place } | null>(null);
  // "Other": any country beyond the ones with official figures. These run on the AI estimate.
  const [other, setOther] = useState(false);
  const [otherIso, setOtherIso] = useState("");
  const [otherName, setOtherName] = useState("");
  // A job title the official figures do not list, to be looked up by the AI instead.
  const [custom, setCustom] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);

  const country = COUNTRIES[code];
  const isLive = !other && available.includes(code);
  const listed = other ? worldCountry(otherIso) : undefined;
  // Where the figures are for: the chosen country, or nothing yet while "Other" has no country picked.
  const place: Place | null = other ? (listed ? placeFor(listed) : null) : country;
  const hours = place?.fullTimeHours ?? 40;
  const current = MODES.find((item) => item.id === mode) ?? MODES[0];
  // A country without official figures can still be checked, by AI estimate only.
  // Any country under "Other" runs on estimates: built-in ones always, and a live AI where there is one.
  const estimateOnly = other;
  const wantsEstimate = estimateOnly || custom !== null;
  // In the UK and US an unlisted job can only be estimated by a live AI: there are no built-in figures there.
  const canOfferEstimate = LIVE_AI_ON && isLive && mode === "pay" && custom === null && query.trim().length >= 3;

  // Pick the visitor's country once, on the pages that do not fix it.
  useEffect(() => {
    if (fixedCountry) return;
    const saved = readSavedCountry();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const where: { code: CountryCode } | { otherIso: string } =
      saved && available.includes(saved as CountryCode)
        ? { code: saved as CountryCode }
        : saved?.startsWith("other:")
          ? { otherIso: saved.slice(6) }
          : guessWhere(navigator.languages, zone, available);
    const frame = requestAnimationFrame(() => {
      if ("code" in where) {
        setCode(where.code);
        return;
      }
      const iso = where.otherIso;
      setOther(true);
      // Only preselect a country that is actually on the list.
      setOtherIso(OTHER_CHOICES.some((item) => item.iso === iso) || (LIVE_AI_ON && iso === ELSEWHERE) ? iso : "");
    });
    return () => cancelAnimationFrame(frame);
  }, [fixedCountry, available]);

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

  // In "Other" the suggestions are the jobs with a built-in estimate, where the country has them.
  const jobs = other ? (listed && hasBuiltin(listed.iso) ? BUILTIN_AS_JOBS : null) : isLive && dataset?.country === code ? dataset.jobs : null;
  // A short list (the built-in jobs) can simply be browsed on focus, with no typing needed.
  const browseAll = jobs !== null && jobs.length <= 40;
  const matches = useMemo(() => {
    if (!jobs) return [];
    if (browseAll && query.trim().length < 2) return jobs.map((item) => ({ job: item, via: null, score: 0 }));
    return searchJobs(jobs, query);
  }, [jobs, query, browseAll]);

  const pay = parsePay(payText);
  const yearly = pay === null ? null : period === "year" ? pay : period === "month" ? pay * 12 : pay * hours * 52;

  function reset() {
    setJob(null);
    setCustom(null);
    setQuery("");
    setChecked(null);
    setError(null);
  }

  function changeCountry(next: CountryCode) {
    setOther(false);
    setCode(next);
    saveCountry(next);
    reset();
    track("country", { country: next });
  }

  function chooseOther(iso: string) {
    setOther(true);
    setOtherIso(iso);
    setMode("pay");
    saveCountry(`other:${iso}`);
    reset();
    if (iso) track("country", { country: iso === ELSEWHERE ? "other" : iso.toLowerCase() });
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

  function chooseEstimate(title: string) {
    setCustom(title.trim());
    setJob(null);
    setOpen(false);
    setError(null);
  }

  async function submitEstimate() {
    const title = cleanJobTitle(custom ?? query);
    if (!title) {
      setError("Type your job title in a few plain words, like \"dog groomer\".");
      return;
    }
    const typedName = cleanPlaceName(otherName);
    let target: EstimateTarget | null;
    if (!other) target = { iso: ISO_CODES[code], name: country.inName, currency: country.currency };
    else if (listed) target = { iso: listed.iso, name: inName(listed), currency: listed.currency };
    else target = otherIso === ELSEWHERE && typedName ? { name: typedName } : null;
    if (!target) {
      setError(otherIso === ELSEWHERE ? "Type the name of your country." : "Pick your country from the list.");
      return;
    }
    if (yearly === null) {
      setError("Enter what you earn before tax, as a number.");
      return;
    }
    if (!other && period === "year" && yearly < 2000) {
      setError(`Enter the yearly figure in full, like ${country.examplePay}.`);
      return;
    }
    setError(null);
    setEstimating(true);
    const outcome = await requestEstimate(target, title);
    setEstimating(false);
    if (!outcome.ok) {
      setError(ESTIMATE_ERRORS[outcome.reason]);
      return;
    }
    const where = place ?? typedPlace(target.name, outcome.estimate.currency);
    setChecked({ mode: "estimate", estimate: outcome.estimate, pay: yearly, place: where });
    // The job title is free text, so it is not recorded: only that an estimate was made, and where.
    track("check", { mode: "estimate", country: where.code });
    requestAnimationFrame(() => scrollToElement(resultRef.current));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (estimating) return;
    if (wantsEstimate) {
      void submitEstimate();
      return;
    }
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
    requestAnimationFrame(() => scrollToElement(resultRef.current));
  }

  return (
    <>
      {/* The page opens on one block of brine: the words on the left, the pay check as a sheet of salt on the right. */}
      {/* Pulled up a pixel so no hairline of the page colour can show between the blue header and the blue screen. */}
      <section className="relative -mt-px bg-brine text-white">
        <Grains tone="bg-white" className="opacity-25" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 pt-4 pb-12 sm:px-8 sm:pt-10 sm:pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="on-dark">{intro}</div>
        <div className="rounded-box bg-salt p-5 text-ink sm:p-7">
          {!fixedCountry && (
            <div className="mb-5">
              <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-ctl bg-salt-deep p-1" role="group" aria-label="Country">
                {available.map((item) => {
                  const selected = !other && item === code;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => changeCountry(item)}
                      aria-label={COUNTRIES[item].name}
                      className={`press rounded-[4px] px-3 py-2.5 text-sm font-semibold ${selected ? "bg-ink text-salt" : "text-ink hover:bg-paper"}`}
                    >
                      {item.toUpperCase()}
                    </button>
                  );
                })}
                <button
                  type="button"
                  aria-pressed={other}
                  onClick={() => chooseOther(otherIso)}
                  className={`press rounded-[4px] px-3 py-2.5 text-sm font-semibold ${other ? "bg-ink text-salt" : "text-ink hover:bg-paper"}`}
                >
                  Other
                </button>
              </div>
              {other && (
                <div className="mt-3 grid gap-2">
                  <label htmlFor={`${jobInputId}-where`} className="sr-only">
                    Your country
                  </label>
                  <select
                    id={`${jobInputId}-where`}
                    value={otherIso}
                    onChange={(event) => chooseOther(event.target.value)}
                    className="field h-12 px-3 text-base font-medium"
                  >
                    <option value="">Pick your country…</option>
                    {OTHER_CHOICES.map((item) => (
                      <option key={item.iso} value={item.iso}>
                        {item.name}
                      </option>
                    ))}
                    {LIVE_AI_ON && <option value={ELSEWHERE}>Somewhere else…</option>}
                  </select>
                  {otherIso === ELSEWHERE && (
                    <>
                      <label htmlFor={`${jobInputId}-place`} className="sr-only">
                        Type your country
                      </label>
                      <input
                        id={`${jobInputId}-place`}
                        type="text"
                        autoComplete="country-name"
                        placeholder="Type your country"
                        value={otherName}
                        onChange={(event) => {
                          setOtherName(event.target.value);
                          setError(null);
                        }}
                        className="field h-12 px-3 text-base font-medium placeholder:font-normal"
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
              {estimateOnly && (
                <p className="mb-5 rounded-ctl border-2 border-dashed border-ink/40 p-3 text-sm text-ink-soft">
                  <strong className="text-ink">Outside the UK and US, Salty runs on AI estimates.</strong> We don&apos;t have official figures
                  for {place?.inName ?? "other countries"} yet, so you get a rough range instead of an exact rank.
                </p>
              )}
              <div className={`mb-6 grid grid-cols-3 border-b-2 border-ink ${estimateOnly ? "hidden" : ""}`} role="tablist" aria-label="What do you want to check?">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === item.id}
                    onClick={() => {
                      setMode(item.id);
                      setChecked(null);
                      setCustom(null);
                      setError(null);
                      track("mode", { mode: item.id });
                    }}
                    className={`press rounded-t-[4px] px-2 py-3 text-sm font-semibold ${mode === item.id ? "bg-ink text-salt" : "text-ink-soft hover:text-ink"}`}
                  >
                    {item.tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <label htmlFor={jobInputId} className="label mb-2 block">
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
                  placeholder={estimateOnly ? (jobs ? "e.g. nurse, chef, electrician" : "Type your job title") : jobs === null ? "Loading jobs…" : "e.g. nurse, chef, electrician"}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setJob(null);
                    setCustom(null);
                    setActive(0);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => setTimeout(() => setOpen(false), 120)}
                  onKeyDown={onJobKeyDown}
                  className="field h-14 px-4 text-lg font-medium placeholder:font-normal"
                />
                {open && matches.length > 0 && (
                  <ul
                    id={listId}
                    role="listbox"
                    className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-ctl border-2 border-ink bg-paper py-1 shadow-float"
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
                    {canOfferEstimate && (
                      <li role="presentation" className="border-t border-ink/10">
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            chooseEstimate(query);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm font-semibold text-brine hover:bg-salt"
                        >
                          Not the right one? Get an AI estimate for “{query.trim()}”
                        </button>
                      </li>
                    )}
                  </ul>
                )}
                {open && !estimateOnly && jobs !== null && query.trim().length >= 2 && matches.length === 0 && custom === null && (
                  <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-ctl border-2 border-ink bg-paper px-4 py-3 text-sm shadow-float">
                    <p>No match in the official figures. Try a simpler title, like “teacher” or “driver”.</p>
                    {canOfferEstimate && (
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          chooseEstimate(query);
                        }}
                        className="mt-2 font-semibold text-brine underline"
                      >
                        Or get an AI estimate for “{query.trim()}”
                      </button>
                    )}
                  </div>
                )}
                {custom !== null && (
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <span className="tag bg-ink text-salt">AI estimate</span>
                    <span className="text-ink-soft">We&apos;ll look this job up for you.</span>
                  </p>
                )}
              </div>

              {mode !== "hiring" && (
                <div className="mt-5">
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <label htmlFor={payInputId} className="label">
                      {current.payLabel}
                    </label>
                    <div className="flex shrink-0 gap-0.5 rounded-ctl bg-salt-deep p-0.5 text-sm font-semibold whitespace-nowrap" role="group" aria-label="Pay period">
                      {(["year", "month", "hour"] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          aria-pressed={period === item}
                          aria-label={`per ${item}`}
                          onClick={() => setPeriod(item)}
                          className={`press rounded-[4px] px-3 py-1.5 capitalize ${period === item ? "bg-ink text-salt" : "text-ink hover:bg-paper"}`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-extrabold">
                      {place ? currencySymbol(place) : ""}
                    </span>
                    <input
                      id={payInputId}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={other ? "Your pay" : period === "year" ? country.examplePay.toLocaleString(country.locale) : period === "month" ? Math.round(country.examplePay / 12).toLocaleString(country.locale) : "15.50"}
                      value={payText}
                      onChange={(event) => {
                        setPayText(event.target.value);
                        setError(null);
                      }}
                      className={`field h-16 pr-4 text-3xl font-extrabold tracking-tight tabular-nums placeholder:font-semibold ${
                        place ? (currencySymbol(place).length > 1 ? "pl-20" : "pl-12") : "pl-4"
                      }`}
                    />
                  </div>
                  {period !== "year" && yearly !== null && place && (
                    <p className="mt-2 text-sm text-ink-soft">
                      About {money(place, yearly)} a year{period === "hour" ? ` at ${hours} hours a week` : ""}.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p role="alert" className="mt-4 rounded-ctl bg-chilli/15 px-3 py-2 text-sm font-medium">
                  {error}
                </p>
              )}
              {loadFailed && (
                <p role="alert" className="mt-4 rounded-ctl bg-chilli/15 px-3 py-2 text-sm font-medium">
                  The pay figures didn&apos;t load. Check your connection and refresh.
                </p>
              )}

              <button
                type="submit"
                disabled={estimating}
                className="press display mt-6 h-16 w-full rounded-ctl bg-brine text-2xl text-white hover:bg-brine-deep disabled:opacity-70"
              >
                {estimating ? "Working it out…" : wantsEstimate ? "Estimate my pay" : current.button}
              </button>
              <p className="mt-3 text-center text-sm text-ink-soft" role="status">
                {estimating
                  ? "This can take up to a minute."
                  : wantsEstimate
                    ? LIVE_AI_ON
                      ? "Free. A job we haven't seen is sent to our AI to look up. Your pay is not."
                      : "Free. No sign-up. Your pay never leaves this device."
                    : mode === "hiring"
                      ? "Free. Worked out from official figures."
                      : "Free. No sign-up. Your pay never leaves this device."}
              </p>
          </form>
          {estimateOnly && (
            <div className="mt-6 border-t border-ink/15 pt-5">
              <p className="mb-3 text-sm text-ink-soft">Want official figures for {place?.inName ?? "your country"}? Get an email if we add them:</p>
              <EmailForm
                key={otherIso}
                interest="country-other"
                context={{ country: place?.code ?? "other" }}
                cta="Tell me"
                successTitle="Done."
                successBody="We'll email you if we add official figures for your country."
              />
            </div>
          )}
        </div>
        </div>
      </section>

      <div ref={resultRef} className="mx-auto max-w-3xl scroll-mt-6 px-5 sm:px-8">
        {estimating && <ResultSkeleton />}
        {!estimating && checked && checked.mode === "estimate" && (
          <div className="my-12 sm:my-16">
            <EstimateResult key={`${checked.estimate.title}-${checked.pay}`} country={checked.place} estimate={checked.estimate} pay={checked.pay} />
          </div>
        )}
        {!estimating && checked && checked.mode !== "estimate" && dataset && isLive && (
          <div className="my-12 sm:my-16">
            {checked.mode === "hiring" || checked.pay === null ? (
              <HiringResult key={checked.job.code} country={country} data={dataset} job={checked.job} />
            ) : (
              <Result key={`${checked.mode}-${checked.job.code}-${checked.pay}`} mode={checked.mode} country={country} data={dataset} job={checked.job} pay={checked.pay} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The outline of a result, shown while an AI estimate is being worked out (which can take up to a
 * minute), so the wait has a shape and the page does not jump when the answer lands.
 */
function ResultSkeleton() {
  return (
    <div className="my-12 rounded-box border border-ink/15 bg-paper p-6 sm:my-16 sm:p-9" role="status" aria-label="Working out an estimate">
      <div className="skeleton h-8 w-36" />
      <div className="skeleton mt-7 h-5 w-48" />
      <div className="skeleton mt-3 h-24 w-64 max-w-full sm:h-32" />
      <div className="skeleton mt-4 h-8 w-80 max-w-full" />
      <div className="skeleton mt-10 h-3.5 w-full" />
      <div className="skeleton mt-8 h-16 w-full" />
    </div>
  );
}
