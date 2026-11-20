import { cleanJobTitle, estimateInstructions, parseEstimate, type EstimateOutcome } from "./estimate-shared";
import { builtinEstimate } from "./estimates-builtin";

/** Where the estimate is for: a listed country (ISO code and currency known) or a place someone typed. */
export type EstimateTarget = { name: string; iso?: string; currency?: string };

/** Where the browser asks for an estimate. Empty means the feature is off. See server/estimate.ts. */
const ENDPOINT = process.env.NEXT_PUBLIC_ESTIMATE_URL ?? "";
/** The hosted single-page preview has no server, so it asks Claude through the page host instead. */
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";

/**
 * True when an AI can be asked live, for any job in any country. Without it the site still has
 * the built-in estimates (common jobs in a set of countries), which cost nothing to show.
 */
export const LIVE_AI_ON = PREVIEW || Boolean(ENDPOINT);

type Sample = { json: (input: string, options?: Record<string, unknown>) => Promise<unknown> };
type Host = { claude?: { use: (name: string) => Promise<unknown> } };

/** Preview only: ask Claude through the page host. No web search is available there. */
async function askHost(place: EstimateTarget, job: string): Promise<EstimateOutcome> {
  const sample = (await (window as unknown as Host).claude?.use("sample")) as Sample | null | undefined;
  if (!sample) return { ok: false, reason: "off" };
  const prompt = [
    estimateInstructions(place.name, place.currency ?? null, false),
    "",
    `Job title: ${job}`,
    `Country: ${place.name}`,
    "",
    'Reply with only a JSON object with these keys: "recognised" (boolean), "found" (boolean), "title" (string), "low", "typical", "high" (numbers), "currency" (ISO 4217 code), "confidence" ("low", "medium" or "high"), "basis" (string), "sources" (an empty array).',
  ].join("\n");
  try {
    return parseEstimate(await sample.json(prompt), "general-knowledge", place.currency);
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "rate_limited") return { ok: false, reason: "busy" };
    if (code === "refused") return { ok: false, reason: "refused" };
    if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared") return { ok: false, reason: "off" };
    return { ok: false, reason: "failed" };
  }
}

/**
 * Ask for an AI estimate of what a job typically pays. Sends the job title and the place only.
 * Pay is never an argument here, by design: the comparison with someone's pay happens on the device.
 */
export async function requestEstimate(place: EstimateTarget, rawJob: string): Promise<EstimateOutcome> {
  const job = cleanJobTitle(rawJob);
  if (!job) return { ok: false, reason: "not-a-job" };
  // A built-in estimate is free and instant, so it is always tried first.
  const builtin = place.iso ? builtinEstimate(place.iso, job) : null;
  if (builtin) return { ok: true, estimate: builtin };
  if (PREVIEW) return askHost(place, job);
  if (!ENDPOINT) return { ok: false, reason: "off" };
  try {
    const where = place.iso ? `country=${place.iso}` : `place=${encodeURIComponent(place.name)}`;
    const response = await fetch(`${ENDPOINT}?${where}&job=${encodeURIComponent(job)}`, { headers: { Accept: "application/json" } });
    const body = (await response.json()) as EstimateOutcome;
    if (body && body.ok === true) return parseEstimateBody(body, place.currency);
    return { ok: false, reason: body?.reason ?? "failed" };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

/** The server already checked the answer; check the shape again so a bad reply cannot reach the screen. */
function parseEstimateBody(body: Extract<EstimateOutcome, { ok: true }>, knownCurrency?: string): EstimateOutcome {
  const e = body.estimate;
  return parseEstimate({ ...e, recognised: true, found: true }, e?.method === "general-knowledge" ? "general-knowledge" : "web-search", knownCurrency);
}

export const ESTIMATE_ERRORS: Record<Exclude<EstimateOutcome, { ok: true }>["reason"], string> = {
  "not-a-job": "We couldn't read that as a job title. Try the plain name of the job, like \"dog groomer\".",
  "no-data": "We couldn't find reliable pay information for that job there. Try a more common name for it, and check the country.",
  refused: "We couldn't estimate that one. Try the plain name of the job.",
  busy: "Lots of people are asking right now. Give it a minute and try again.",
  off: "We don't have an estimate for that job there yet. Pick the closest one from the list.",
  failed: "The estimate didn't come back. Check your connection and try again.",
};
