import type { Job } from "./types";

export type JobMatch = {
  job: Job;
  /** The everyday title that matched, when the match was not on the official title. */
  via: string | null;
  score: number;
};

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]s\b/g, "s")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Score one candidate label against the query. Higher is better; 0 means no match.
 *
 * In English job titles the last word names the job ("secondary teacher" is a teacher,
 * "teacher training adviser" is an adviser), so a query that matches the end of a label
 * beats one that only matches the start. Extra unmatched words cost a little each.
 */
function score(label: string, query: string, tokens: string[]): number {
  if (label === query) return 100;
  const words = label.split(" ");
  const extra = Math.max(0, words.length - tokens.length) * 4;
  if (label.endsWith(` ${query}`)) return 78 - extra;
  let whole = 0;
  let prefix = 0;
  for (const token of tokens) {
    if (words.includes(token)) whole++;
    else if (words.some((word) => word.startsWith(token))) prefix++;
    else if (token.length < 4 || !label.includes(token)) return 0;
  }
  if (whole === tokens.length) return (label.startsWith(`${query} `) ? 62 : 58) - extra;
  // The word being typed is usually the last one, so a prefix there is a strong hint.
  return 30 + ((whole + prefix * 0.8) / tokens.length) * 22 - extra / 2;
}

/**
 * Some sources write titles head-first: "Electrician (general)", "Accountant - chartered",
 * "Driver - forklift". When the query is exactly that head, it is a strong match, and
 * strongest for the "(general)" entry, which is the plain version of the job.
 */
function headScore(label: string, query: string): number {
  const match = /^(.+?)(?: - | \()(.+?)\)?$/.exec(label);
  if (!match || normalise(match[1]) !== query) return 0;
  return normalise(match[2]) === "general" ? 90 : 76;
}

/** Jobs matching what someone typed, best first. Searches official titles and everyday aliases. */
export function searchJobs(jobs: Job[], rawQuery: string, limit = 8): JobMatch[] {
  const query = normalise(rawQuery);
  if (query.length < 2) return [];
  const tokens = query.split(" ");
  const matches: JobMatch[] = [];
  // The first few letters of each query word, to spot official titles on the same subject
  // ("teach" in "Secondary education teaching professionals" for the query "teacher").
  const stems = tokens.map((token) => token.slice(0, Math.max(4, token.length - 2)));
  for (const job of jobs) {
    const title = normalise(job.title);
    let best = Math.max(score(title, query, tokens), headScore(job.title, query));
    let via: string | null = null;
    for (const alias of job.aliases) {
      const s = Math.max(score(normalise(alias), query, tokens), headScore(alias, query));
      if (s > best) {
        best = s;
        via = alias;
      }
    }
    if (best > 0) {
      if (via && stems.every((stem) => title.includes(stem))) best += 6;
      // Nudge bigger occupations up so the common reading of a vague query wins ties.
      const size = job.employees ? Math.log10(job.employees + 1) * 2.5 : 0;
      matches.push({ job, via, score: best + size });
    }
  }
  matches.sort((a, b) => b.score - a.score || a.job.title.localeCompare(b.job.title));
  return matches.slice(0, limit);
}

export function slugify(text: string): string {
  return normalise(text).replace(/ /g, "-");
}
