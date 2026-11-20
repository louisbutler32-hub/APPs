import { describe, expect, it } from "vitest";
import { parseEstimate } from "./estimate-shared";
import { BUILTIN_COUNTRIES, BUILTIN_JOBS, builtinEstimate, hasBuiltin } from "./estimates-builtin";

/** Rough yearly full-time minimum wage in each country when the estimates were written, in local currency. */
const FLOOR: Record<string, number> = { AU: 50_000, NZ: 48_500, CA: 32_500, DE: 28_500, FR: 21_500, ES: 16_500, IT: 18_500, JP: 2_300_000, IN: 90_000, ZA: 66_000 };

describe("built-in estimates", () => {
  it("has a complete, ordered range for every job in every country", () => {
    for (const country of BUILTIN_COUNTRIES) {
      for (const job of BUILTIN_JOBS) {
        const estimate = builtinEstimate(country, job.title);
        expect(estimate, `${job.title} in ${country}`).not.toBeNull();
        if (!estimate) continue;
        expect(estimate.low, `${job.title} in ${country}`).toBeLessThan(estimate.typical);
        expect(estimate.typical, `${job.title} in ${country}`).toBeLessThan(estimate.high);
        // A range wider than double is too vague to be useful as "what this job usually pays".
        expect(estimate.high / estimate.low, `${job.title} in ${country}`).toBeLessThanOrEqual(3.2);
      }
    }
  });

  it("never puts the lower end below the country's rough full-time minimum wage", () => {
    for (const country of BUILTIN_COUNTRIES) {
      for (const job of BUILTIN_JOBS) {
        expect(builtinEstimate(country, job.title)!.low, `${job.title} in ${country}`).toBeGreaterThanOrEqual(FLOOR[country]);
      }
    }
  });

  it("passes the same check every other estimate goes through", () => {
    for (const country of BUILTIN_COUNTRIES) {
      for (const job of BUILTIN_JOBS) {
        const estimate = builtinEstimate(country, job.title)!;
        const outcome = parseEstimate({ ...estimate, recognised: true, found: true }, "general-knowledge", estimate.currency);
        expect(outcome.ok, `${job.title} in ${country}`).toBe(true);
      }
    }
  });

  it("is always labelled as general knowledge with no sources", () => {
    const estimate = builtinEstimate("NZ", "barista")!;
    expect(estimate.method).toBe("general-knowledge");
    expect(estimate.sources).toEqual([]);
    expect(estimate.currency).toBe("NZD");
    expect(estimate.basis).toContain("not checked against live sources");
  });

  it("finds a job by its everyday names, in any case, singular or plural", () => {
    expect(builtinEstimate("au", "Nurse")?.title).toBe("Registered nurse");
    expect(builtinEstimate("AU", "software engineer")?.title).toBe("Software developer");
    expect(builtinEstimate("AU", "baristas")?.title).toBe("Barista");
    expect(builtinEstimate("AU", "astronaut")).toBeNull();
  });

  it("covers only the listed countries", () => {
    expect(hasBuiltin("nz")).toBe(true);
    expect(hasBuiltin("US")).toBe(false);
    expect(builtinEstimate("BR", "barista")).toBeNull();
  });
});
