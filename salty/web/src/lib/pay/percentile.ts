import { QUANTILE_FIELDS, type Job } from "./types";

export type QuantilePoint = { q: number; value: number };

/**
 * The published quantiles for a job, lowest to highest. A point is skipped when
 * it is missing or does not rise above the previous one, so the list is always
 * strictly increasing and safe to interpolate.
 */
export function quantilePoints(job: Job): QuantilePoint[] {
  const points: QuantilePoint[] = [];
  for (const [field, q] of QUANTILE_FIELDS) {
    const value = job[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    const last = points[points.length - 1];
    if (last && value <= last.value) continue;
    points.push({ q, value });
  }
  return points;
}

export type Ranking =
  /** Interpolated between two published quantiles. */
  | { kind: "published"; percentile: number }
  /** Outside the published range: all we know is which side of `q` the pay falls. */
  | { kind: "bound"; side: "below" | "above"; q: number }
  /** Modelled from the median and the average, because no quantiles are published. */
  | { kind: "estimate"; percentile: number }
  /** Only a median is known. */
  | { kind: "median-only"; side: "below" | "above" | "equal" }
  | { kind: "unknown" };

/** Standard normal cumulative distribution (Abramowitz and Stegun 7.1.26, error below 1e-7). */
export function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/**
 * Where `pay` sits among people in `job`, as "earns more than X% of them".
 *
 * Between two published quantiles we interpolate on the log of pay, since pay
 * is spread roughly log-normally. Outside the published range we do not guess:
 * the answer is only "below the 10th" or "above the 90th".
 *
 * When a source publishes just a median and a mean, the percentile is modelled
 * as log-normal, where mean / median = exp(sigma^2 / 2). That is an estimate
 * and callers must label it as one.
 */
export function rank(job: Job, pay: number): Ranking {
  if (!Number.isFinite(pay) || pay <= 0) return { kind: "unknown" };
  const points = quantilePoints(job);

  if (points.length >= 2) {
    const first = points[0];
    const last = points[points.length - 1];
    if (pay < first.value) return { kind: "bound", side: "below", q: first.q };
    if (pay > last.value) return { kind: "bound", side: "above", q: last.q };
    for (let i = 1; i < points.length; i++) {
      const lo = points[i - 1];
      const hi = points[i];
      if (pay <= hi.value) {
        const t = (Math.log(pay) - Math.log(lo.value)) / (Math.log(hi.value) - Math.log(lo.value));
        return { kind: "published", percentile: lo.q + t * (hi.q - lo.q) };
      }
    }
  }

  const median = job.p50;
  if (typeof median === "number" && median > 0) {
    const mean = job.mean;
    if (typeof mean === "number" && mean > median) {
      const sigma = Math.sqrt(2 * Math.log(mean / median));
      const percentile = 100 * normalCdf(Math.log(pay / median) / sigma);
      return { kind: "estimate", percentile: Math.min(99, Math.max(1, percentile)) };
    }
    return { kind: "median-only", side: pay < median ? "below" : pay > median ? "above" : "equal" };
  }

  return { kind: "unknown" };
}

/** A single 0 to 100 position for placing a marker and choosing a verdict, or null if unknown. */
export function position(job: Job, pay: number, ranking: Ranking): number | null {
  switch (ranking.kind) {
    case "published":
    case "estimate":
      return ranking.percentile;
    case "bound":
      return ranking.side === "below" ? ranking.q / 2 : (100 + ranking.q) / 2;
    case "median-only": {
      // No spread is known, so place by distance from the median, capped well inside the bar.
      const median = job.p50 as number;
      const ratio = pay / median;
      return Math.min(90, Math.max(10, 50 + (ratio - 1) * 100));
    }
    default:
      return null;
  }
}

/** Pay minus the job's median, and the same as a fraction of the median. Null without a median. */
export function gapToMedian(job: Job, pay: number): { amount: number; fraction: number } | null {
  const median = job.p50;
  if (typeof median !== "number" || median <= 0) return null;
  return { amount: pay - median, fraction: (pay - median) / median };
}
