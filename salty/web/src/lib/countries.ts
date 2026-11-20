import liveCountries from "./live-countries.json";
import type { CountryCode } from "./pay/types";

export type Country = {
  code: CountryCode;
  name: string;
  /** Used in sentences: "in the UK", "in Australia". */
  inName: string;
  flag: string;
  locale: string;
  currency: string;
  /** Typical full-time hours per week, used only to turn an hourly rate into a yearly figure. */
  fullTimeHours: number;
  /** A believable salary for the input placeholder. */
  examplePay: number;
  /** Who the official figures cover, finishing the sentence "The figures are ...". Keep in step with salty/data/SOURCES.md. */
  measure: string;
  /** Short name of the publisher, for tight spots. */
  publisher: string;
  /** A limitation big enough that it must sit next to the result, not in the small print. */
  caveat?: string;
  /**
   * Whether the site shows this country, from live-countries.json. A country can have data in
   * salty/data/out and still be held back when that data cannot support the claim the site makes.
   * Reasons are in salty/data/SOURCES.md.
   */
  live: boolean;
  /** Shown in place of the checker while the country is not live: the honest reason, in Salty's voice. */
  soonNote?: string;
};

const isLive = (code: CountryCode) => (liveCountries as string[]).includes(code);

export const COUNTRIES: Record<CountryCode, Country> = {
  uk: { code: "uk", name: "United Kingdom", inName: "the UK", flag: "🇬🇧", locale: "en-GB", currency: "GBP", fullTimeHours: 37.5, examplePay: 32000,
    measure: "yearly pay before tax for full-time employees who have been in the job at least a year",
    publisher: "Office for National Statistics", live: isLive("uk") },
  us: { code: "us", name: "United States", inName: "the US", flag: "🇺🇸", locale: "en-US", currency: "USD", fullTimeHours: 40, examplePay: 55000,
    measure: "yearly wages before tax for employees, with hourly pay counted as a full-time, year-round wage",
    publisher: "Bureau of Labor Statistics", live: isLive("us"),
    soonNote: "US pay figures are on the way. The official source has to be loaded by hand and that hasn't been done yet." },
  au: { code: "au", name: "Australia", inName: "Australia", flag: "🇦🇺", locale: "en-AU", currency: "AUD", fullTimeHours: 38, examplePay: 80000,
    measure: "yearly salary or wages before tax, taken from tax returns, for everyone in the job whatever their hours",
    publisher: "Australian Taxation Office",
    caveat: "Australia's figures include part-time and casual workers. If you work full-time, you will rank higher here than you would against full-timers only.",
    // Held back: against this all-hours data an ordinary full-time wage ranks near the top
    // (a full-time barista came out above 97% of baristas), which would mislead.
    live: isLive("au"),
    soonNote: "We only show numbers we'd stake our name on. Australia's free official figures mix part-time and casual work in with full-time, which would make your pay look better than it is. We're holding Australia back until we have full-time figures." },
  nz: { code: "nz", name: "New Zealand", inName: "New Zealand", flag: "🇳🇿", locale: "en-NZ", currency: "NZD", fullTimeHours: 40, examplePay: 70000,
    measure: "pay before tax",
    publisher: "Stats NZ",
    // Held back: the only openly downloadable figures are 8 broad groups, hourly, from 2019.
    live: isLive("nz"),
    soonNote: "New Zealand doesn't yet publish free official pay figures job by job, only for eight broad groups. We're looking for a source we can trust." },
};

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES;
}

/** Best guess at a visitor's country from the browser, limited to the countries on offer. */
export function guessCountry(languages: readonly string[], timeZone: string, available: CountryCode[]): CountryCode {
  const pick = (code: CountryCode) => (available.includes(code) ? code : null);
  let guess: CountryCode | null = null;
  if (timeZone.startsWith("Australia/")) guess = pick("au");
  else if (timeZone === "Pacific/Auckland" || timeZone === "Pacific/Chatham") guess = pick("nz");
  else if (timeZone === "Europe/London") guess = pick("uk");
  else if (timeZone.startsWith("America/") || timeZone.startsWith("US/")) guess = pick("us");
  if (guess) return guess;
  for (const language of languages) {
    const region = language.split("-")[1]?.toUpperCase();
    if (region === "GB") guess = pick("uk");
    else if (region === "US") guess = pick("us");
    else if (region === "AU") guess = pick("au");
    else if (region === "NZ") guess = pick("nz");
    if (guess) return guess;
  }
  return available[0];
}
