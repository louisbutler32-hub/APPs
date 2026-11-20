// Server-only: importing this pulls every country's dataset into the bundle.
// Client components fetch /data/<country>.json instead (see components/Checker.tsx).
import au from "@/data/pay/au.json";
import nz from "@/data/pay/nz.json";
import uk from "@/data/pay/uk.json";
import us from "@/data/pay/us.json";
import { COUNTRIES, COUNTRY_CODES } from "../countries";
import type { CountryCode, CountryData, Job } from "./types";

export const DATA: Record<CountryCode, CountryData> = {
  uk: uk as unknown as CountryData,
  us: us as unknown as CountryData,
  au: au as unknown as CountryData,
  nz: nz as unknown as CountryData,
};

/** Countries the site shows: switched on in countries.ts and with data from their pipeline. In display order. */
export const AVAILABLE: CountryCode[] = COUNTRY_CODES.filter((code) => COUNTRIES[code].live && DATA[code].jobs.length > 0);

export function findJob(country: CountryCode, slug: string): Job | undefined {
  return DATA[country].jobs.find((job) => job.slug === slug);
}

/** The biggest occupations with short names, for the ticker and "popular" links. */
export function popularJobs(country: CountryCode, count: number): Job[] {
  return DATA[country].jobs
    .filter((job) => job.employees !== null && job.title.length <= 34 && !/n\.e\.c|not elsewhere|other /i.test(job.title))
    .sort((a, b) => (b.employees ?? 0) - (a.employees ?? 0))
    .slice(0, count);
}
