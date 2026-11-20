/** Shape of the per-country files written by the data pipelines in salty/data. */

export type CountryCode = "uk" | "us" | "au" | "nz";

/** Quantile fields a pipeline may publish. Values are annual pay in whole local currency. */
export const QUANTILE_FIELDS = [
  ["p10", 10],
  ["p20", 20],
  ["p25", 25],
  ["p30", 30],
  ["p40", 40],
  ["p50", 50],
  ["p60", 60],
  ["p70", 70],
  ["p75", 75],
  ["p80", 80],
  ["p90", 90],
] as const;

export type QuantileField = (typeof QUANTILE_FIELDS)[number][0];

export type Job = {
  code: string;
  title: string;
  /** Added by scripts/sync-data.mjs, unique within a country. */
  slug: string;
  employees: number | null;
  mean: number | null;
  aliases: string[];
} & { [K in QuantileField]?: number | null };

export type PaySource = {
  name: string;
  url: string;
  licence: string;
  attribution: string;
};

export type CountryData = {
  country: CountryCode;
  currency: string;
  period: string;
  basis: string;
  source: PaySource;
  jobs: Job[];
};
