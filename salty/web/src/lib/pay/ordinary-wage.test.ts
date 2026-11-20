import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import liveCountries from "../live-countries.json";
import { position, rank } from "./percentile";
import { searchJobs } from "./search";
import type { Job } from "./types";

/**
 * The check that caught Australia's first data source: type an ordinary full-time wage for a
 * common job and see where it lands. If the comparison group is right, an ordinary wage sits
 * somewhere in the broad middle. If it lands at an extreme, the data does not mean what the
 * site says it means, and the country should not be live.
 *
 * The wages are deliberately unremarkable round figures for each job, chosen by hand. They are
 * a smoke test for the data, not facts about pay.
 */
const ORDINARY: Record<string, [query: string, yearlyPay: number][]> = {
  uk: [
    ["care worker", 27000],
    ["chef", 31000],
    ["secondary teacher", 46000],
    ["software developer", 55000],
    ["electrician", 39000],
    ["sales assistant", 25000],
  ],
  us: [
    ["cashier", 31200],
    ["line cook", 37440],
    ["registered nurse", 95680],
    ["truck driver", 58240],
    ["software developer", 135200],
    ["elementary school teacher", 64480],
    ["electrician", 62400],
  ],
};

function jobsFor(country: string): Job[] {
  return JSON.parse(readFileSync(new URL(`../../../public/data/${country}.json`, import.meta.url), "utf8")).jobs;
}

describe.each((liveCountries as string[]).filter((country) => jobsFor(country).length > 0))("ordinary wages in %s", (country) => {
  const cases = ORDINARY[country];

  it("has ordinary-wage cases written for it", () => {
    expect(cases, `add ordinary wages for "${country}" to this test before switching it on`).toBeDefined();
  });

  it.each(cases ?? [])("%s on %i lands in the broad middle", (query, pay) => {
    const jobs = jobsFor(country);
    const job = searchJobs(jobs, query, 1)[0]?.job;
    expect(job, `no job found for "${query}"`).toBeDefined();
    const place = position(job, pay, rank(job, pay));
    expect(place).not.toBeNull();
    expect(place as number).toBeGreaterThan(15);
    expect(place as number).toBeLessThan(85);
  });
});
