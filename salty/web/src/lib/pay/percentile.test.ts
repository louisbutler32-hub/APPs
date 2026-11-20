import { describe, expect, it } from "vitest";
import { gapToMedian, normalCdf, position, quantilePoints, rank } from "./percentile";
import type { Job } from "./types";

const base = { code: "1", title: "Tester", slug: "tester", employees: 1000, aliases: [] };

const full: Job = { ...base, p10: 20000, p25: 25000, p50: 32000, p75: 41000, p90: 52000, mean: 34000 };

describe("quantilePoints", () => {
  it("skips missing values and any value that does not rise", () => {
    const job: Job = { ...base, p10: 20000, p25: null, p50: 19000, p75: 30000, mean: null };
    expect(quantilePoints(job)).toEqual([
      { q: 10, value: 20000 },
      { q: 75, value: 30000 },
    ]);
  });
});

describe("rank with published quantiles", () => {
  it("returns the quantile itself at a published value", () => {
    expect(rank(full, 32000)).toEqual({ kind: "published", percentile: 50 });
    expect(rank(full, 20000)).toEqual({ kind: "published", percentile: 10 });
    expect(rank(full, 52000)).toEqual({ kind: "published", percentile: 90 });
  });

  it("interpolates on log pay between two quantiles", () => {
    const geometricMid = Math.sqrt(25000 * 32000);
    const r = rank(full, geometricMid);
    expect(r.kind).toBe("published");
    if (r.kind === "published") expect(r.percentile).toBeCloseTo(37.5, 6);
  });

  it("rises with pay", () => {
    let previous = 0;
    for (let pay = 20000; pay <= 52000; pay += 500) {
      const r = rank(full, pay);
      if (r.kind !== "published") throw new Error("expected a published ranking");
      expect(r.percentile).toBeGreaterThanOrEqual(previous);
      previous = r.percentile;
    }
  });

  it("does not guess outside the published range", () => {
    expect(rank(full, 15000)).toEqual({ kind: "bound", side: "below", q: 10 });
    expect(rank(full, 90000)).toEqual({ kind: "bound", side: "above", q: 90 });
  });
});

describe("rank without published quantiles", () => {
  const medianAndMean: Job = { ...base, p50: 60000, mean: 68000 };

  it("estimates 50 at the median", () => {
    const r = rank(medianAndMean, 60000);
    expect(r.kind).toBe("estimate");
    if (r.kind === "estimate") expect(r.percentile).toBeCloseTo(50, 6);
  });

  it("matches the log-normal model at one sigma above the median", () => {
    const sigma = Math.sqrt(2 * Math.log(68000 / 60000));
    const r = rank(medianAndMean, 60000 * Math.exp(sigma));
    if (r.kind !== "estimate") throw new Error("expected an estimate");
    expect(r.percentile).toBeCloseTo(84.13, 1);
  });

  it("keeps estimates between 1 and 99", () => {
    const low = rank(medianAndMean, 100);
    const high = rank(medianAndMean, 10_000_000);
    if (low.kind !== "estimate" || high.kind !== "estimate") throw new Error("expected estimates");
    expect(low.percentile).toBe(1);
    expect(high.percentile).toBe(99);
  });

  it("falls back to above or below when the mean cannot support a model", () => {
    expect(rank({ ...base, p50: 60000, mean: null }, 50000)).toEqual({ kind: "median-only", side: "below" });
    expect(rank({ ...base, p50: 60000, mean: 59000 }, 70000)).toEqual({ kind: "median-only", side: "above" });
    expect(rank({ ...base, p50: 60000, mean: null }, 60000)).toEqual({ kind: "median-only", side: "equal" });
  });

  it("is unknown without a median or with nonsense pay", () => {
    expect(rank({ ...base, mean: 50000 }, 50000)).toEqual({ kind: "unknown" });
    expect(rank(full, 0)).toEqual({ kind: "unknown" });
    expect(rank(full, Number.NaN)).toEqual({ kind: "unknown" });
  });
});

describe("position", () => {
  it("places bounded results in the middle of the unknown tail", () => {
    expect(position(full, 15000, rank(full, 15000))).toBe(5);
    expect(position(full, 90000, rank(full, 90000))).toBe(95);
  });

  it("caps median-only placement inside the bar", () => {
    const job: Job = { ...base, p50: 60000, mean: null };
    expect(position(job, 600000, rank(job, 600000))).toBe(90);
    expect(position(job, 6000, rank(job, 6000))).toBe(10);
    expect(position(job, 60000, rank(job, 60000))).toBe(50);
  });
});

describe("gapToMedian", () => {
  it("gives the amount and fraction against the median", () => {
    expect(gapToMedian(full, 28800)).toEqual({ amount: -3200, fraction: -0.1 });
    expect(gapToMedian({ ...base, mean: 1 }, 100)).toBeNull();
  });
});

describe("normalCdf", () => {
  it("matches known values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 4);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 4);
  });
});
