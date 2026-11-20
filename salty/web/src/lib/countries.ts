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
};

const isLive = (code: CountryCode) => (liveCountries as string[]).includes(code);

export const COUNTRIES: Record<CountryCode, Country> = {
  uk: { code: "uk", name: "United Kingdom", inName: "the UK", flag: "🇬🇧", locale: "en-GB", currency: "GBP", fullTimeHours: 37.5, examplePay: 32000,
    measure: "yearly pay before tax for full-time employees who have been in the job at least a year",
    publisher: "Office for National Statistics", live: isLive("uk") },
  us: { code: "us", name: "United States", inName: "the US", flag: "🇺🇸", locale: "en-US", currency: "USD", fullTimeHours: 40, examplePay: 55000,
    measure: "yearly wages before tax for employees, with hourly pay counted as a full-time, year-round wage",
    publisher: "Bureau of Labor Statistics", live: isLive("us") },
  au: { code: "au", name: "Australia", inName: "Australia", flag: "🇦🇺", locale: "en-AU", currency: "AUD", fullTimeHours: 38, examplePay: 80000,
    measure: "yearly salary or wages before tax, taken from tax returns, for everyone in the job whatever their hours",
    publisher: "Australian Taxation Office",
    caveat: "Australia's figures include part-time and casual workers. If you work full-time, you will rank higher here than you would against full-timers only.",
    // Held back: against this all-hours data an ordinary full-time wage ranks near the top
    // (a full-time barista came out above 97% of baristas), which would mislead.
    live: isLive("au") },
  nz: { code: "nz", name: "New Zealand", inName: "New Zealand", flag: "🇳🇿", locale: "en-NZ", currency: "NZD", fullTimeHours: 40, examplePay: 70000,
    measure: "pay before tax",
    publisher: "Stats NZ",
    // Held back: the only openly downloadable figures are 8 broad groups, hourly, from 2019.
    live: isLive("nz") },
};

export const COUNTRY_CODES = Object.keys(COUNTRIES) as CountryCode[];

export function isCountryCode(value: string): value is CountryCode {
  return value in COUNTRIES;
}

/** ISO country codes for the four countries with their own code on the site. */
export const ISO_CODES: Record<CountryCode, string> = { uk: "GB", us: "US", au: "AU", nz: "NZ" };

/**
 * Best guess at where a visitor is, from the browser: one of the countries with official figures,
 * or the ISO code of another country (empty when even that is unclear).
 */
export function guessWhere(languages: readonly string[], timeZone: string, available: CountryCode[]): { code: CountryCode } | { otherIso: string } {
  const live = (code: CountryCode) => (available.includes(code) ? { code } : null);
  if (timeZone === "Europe/London") return live("uk") ?? { otherIso: "" };
  if (timeZone.startsWith("Australia/")) return { otherIso: "AU" };
  if (timeZone === "Pacific/Auckland" || timeZone === "Pacific/Chatham") return { otherIso: "NZ" };
  const regions = languages.map((language) => language.split("-")[1]?.toUpperCase()).filter(Boolean) as string[];
  if (timeZone.startsWith("America/") && (regions.length === 0 || regions.includes("US"))) return live("us") ?? { otherIso: "" };
  for (const region of regions) {
    if (region === "GB") return live("uk") ?? { otherIso: "" };
    if (region === "US") return live("us") ?? { otherIso: "" };
    return { otherIso: region };
  }
  return available[0] ? { code: available[0] } : { otherIso: "" };
}
