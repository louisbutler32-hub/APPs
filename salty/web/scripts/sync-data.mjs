// Copies the pipeline outputs in salty/data/out into the site, adding a URL slug to every job.
// Runs before `dev`, `build` and `test`. Its outputs are generated files and are not committed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "..", "data", "out");
const serverDir = join(root, "src", "data", "pay");
const publicDir = join(root, "public", "data");
const COUNTRIES = ["uk", "us", "au", "nz"];
const QUANTILES = ["p10", "p20", "p25", "p30", "p40", "p50", "p60", "p70", "p75", "p80", "p90"];
// Jobs the site will not show, because a ranking against them would mislead:
// counted on fewer people than this (where the source gives a count at all) ...
const MIN_PEOPLE = 100;
// ... or with a yearly median so low it cannot be a wage for the job (a source coding quirk).
const MIN_MEDIAN = 5000;

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['’]s\b/g, "s")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/ /g, "-");
}

function fail(country, message) {
  console.error(`sync-data: ${country}: ${message}`);
  process.exit(1);
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function load(country) {
  const path = join(sourceDir, `${country}.json`);
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8"));
  if (raw.country !== country) fail(country, `file says country "${raw.country}"`);
  for (const key of ["currency", "period", "basis"]) {
    if (typeof raw[key] !== "string" || !raw[key]) fail(country, `missing "${key}"`);
  }
  for (const key of ["name", "url", "licence", "attribution"]) {
    if (typeof raw.source?.[key] !== "string" || !raw.source[key]) fail(country, `missing source.${key}`);
  }
  if (!Array.isArray(raw.jobs)) fail(country, "jobs is not a list");

  const seen = new Map();
  const jobs = [];
  let dropped = 0;
  for (const job of raw.jobs) {
    if (typeof job.title !== "string" || !job.title) fail(country, `job ${job.code} has no title`);
    const out = { code: String(job.code), title: job.title.trim(), slug: "" };
    const base = slugify(out.title) || `job-${out.code}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    out.slug = count === 1 ? base : `${base}-${slugify(out.code)}`;
    out.employees = numberOrNull(job.employees);
    for (const q of QUANTILES) {
      const value = numberOrNull(job[q]);
      if (value !== null) out[q] = value;
    }
    out.mean = numberOrNull(job.mean);
    out.aliases = Array.isArray(job.aliases) ? job.aliases.filter((a) => typeof a === "string" && a) : [];
    // A job is only useful on the site if there is a median to compare against.
    if (out.p50 === undefined) continue;
    if (out.p50 < MIN_MEDIAN || (out.employees !== null && out.employees < MIN_PEOPLE)) {
      dropped++;
      continue;
    }
    jobs.push(out);
  }
  jobs.sort((a, b) => a.title.localeCompare(b.title, "en"));
  if (dropped) console.log(`sync-data: ${country}: left out ${dropped} jobs (too few people or implausible median)`);
  return {
    country,
    currency: raw.currency,
    period: raw.period,
    basis: raw.basis,
    source: {
      name: raw.source.name,
      url: raw.source.url,
      licence: raw.source.licence,
      attribution: raw.source.attribution,
    },
    jobs,
  };
}

mkdirSync(serverDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

const summary = [];
for (const country of COUNTRIES) {
  const data = load(country) ?? {
    country,
    currency: "",
    period: "",
    basis: "",
    source: { name: "", url: "", licence: "", attribution: "" },
    jobs: [],
  };
  const json = JSON.stringify(data);
  writeFileSync(join(serverDir, `${country}.json`), json);
  writeFileSync(join(publicDir, `${country}.json`), json);
  summary.push(`${country}: ${data.jobs.length}`);
}
console.log(`sync-data: jobs per country -> ${summary.join(", ")}`);
