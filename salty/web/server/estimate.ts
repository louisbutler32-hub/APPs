/**
 * Server side of the AI estimate, for jobs and countries the built-in estimates do not cover.
 * Asks Claude what a job typically pays and to report a rough range, then checks the answer
 * before returning it.
 *
 * Two modes, chosen by the host setting SALTY_ESTIMATE_SEARCH:
 * - off (the default): Claude answers from general knowledge on the cheapest model. A lookup costs
 *   a small fraction of a cent.
 * - "on": Claude searches the web first. Better and more current, and far dearer: each lookup adds
 *   a fee per search and many more tokens.
 *
 * It runs wherever the host runs server code (see functions/api/estimate.ts for the Cloudflare
 * Pages adapter). It needs an Anthropic API key, kept as a host secret and never sent to the
 * browser. Answers are cached by the adapter so a job is paid for once.
 *
 * NOT YET RUN AGAINST THE LIVE API: the build environment has no API key. The logic around the
 * call is covered by server/estimate.test.ts with a stand-in client.
 */
import Anthropic from "@anthropic-ai/sdk";
import { cleanJobTitle, ESTIMATE_SCHEMA, estimateInstructions, parseEstimate, type EstimateOutcome } from "../src/lib/estimate-shared";
import { cleanPlaceName, inName, worldCountry } from "../src/lib/world";

/** Where the estimate is for: a listed country (currency known) or a place someone typed. */
export type EstimateTarget = { name: string; iso?: string; currency?: string };

/** Used when searching the web: the reading and judging is where a stronger model earns its cost. */
export const SEARCH_MODEL = "claude-opus-5-5";
/** Used without search, where the owner asked for the cheapest route. */
export const KNOWLEDGE_MODEL = "claude-haiku-5-5";

export type EstimateSettings = { model: string; search: boolean };

export function settingsFrom(env: Record<string, string | undefined>): EstimateSettings {
  const search = env.SALTY_ESTIMATE_SEARCH === "on";
  return { search, model: env.SALTY_ESTIMATE_MODEL || (search ? SEARCH_MODEL : KNOWLEDGE_MODEL) };
}
const REPORT_TOOL = "report_estimate";
/** A turn that pauses mid-search is resumed at most this many times. */
const MAX_RESUMES = 3;

/** The part of the client this file uses, so tests can stand in for it. */
export type EstimateClient = { beta: { messages: Pick<Anthropic["beta"]["messages"], "create"> } };

export async function estimatePay(client: EstimateClient, settings: EstimateSettings, place: EstimateTarget, job: string): Promise<EstimateOutcome> {
  const { model, search } = settings;
  // Haiku has no server-side fallback, and the API rejects the setting there; other models get it.
  const fallback = model.startsWith("claude-haiku") ? {} : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: `Job title: ${job}\nCountry: ${place.name}` }];

  for (let attempt = 0; attempt <= MAX_RESUMES; attempt++) {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 16000,
      // If a safety check declines the request, let the API retry it on its default fallback model.
      ...fallback,
      // A lookup, not a research project: low effort keeps it quick and cheap.
      output_config: { effort: "low" },
      system: `${estimateInstructions(place.name, place.currency ?? null, search)}\nWhen you have your answer, call the ${REPORT_TOOL} tool once. Do not answer in plain text.`,
      tools: [
        ...(search ? [{ type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 4, ...(place.iso ? { user_location: { type: "approximate" as const, country: place.iso } } : {}) }] : []),
        { name: REPORT_TOOL, description: "Report the pay estimate for the job.", strict: true, input_schema: ESTIMATE_SCHEMA },
      ],
      messages,
    });

    if (response.stop_reason === "refusal") return { ok: false, reason: "refused" };
    const report = response.content.find((block) => block.type === "tool_use" && block.name === REPORT_TOOL);
    if (report && report.type === "tool_use") return parseEstimate(report.input, search ? "web-search" : "general-knowledge", place.currency);
    if (response.stop_reason !== "pause_turn") return { ok: false, reason: "failed" };
    // The search loop paused: send the turn back unchanged and the API carries on from there.
    messages.splice(1, messages.length - 1, { role: "assistant", content: response.content });
  }
  return { ok: false, reason: "failed" };
}

const json = (body: unknown, status: number, cache: string) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache } });

/**
 * GET /api/estimate?country=NZ&job=barista      a listed country, by ISO code
 * GET /api/estimate?place=Fiji&job=barista      anywhere else, by name
 * Only where and what job come in. Pay is never part of the request.
 */
export async function handleEstimate(request: Request, env: Record<string, string | undefined>, client?: EstimateClient): Promise<Response> {
  if (request.method !== "GET") return json({ ok: false, reason: "failed" }, 405, "no-store");
  const url = new URL(request.url);
  const job = cleanJobTitle(url.searchParams.get("job") ?? "");
  const listed = worldCountry(url.searchParams.get("country") ?? "");
  const typed = cleanPlaceName(url.searchParams.get("place") ?? "");
  const place: EstimateTarget | null = listed ? { name: inName(listed), iso: listed.iso, currency: listed.currency } : typed ? { name: typed } : null;
  if (!place || !job) return json({ ok: false, reason: "not-a-job" }, 400, "no-store");

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!client && !apiKey) return json({ ok: false, reason: "off" }, 503, "no-store");

  try {
    const outcome = await estimatePay(client ?? new Anthropic({ apiKey }), settingsFrom(env), place, job);
    // A good answer is the same for everyone who asks, so it can be kept for a month.
    return json(outcome, 200, outcome.ok ? "public, max-age=86400, s-maxage=2592000" : "no-store");
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ ok: false, reason: "busy" }, 429, "no-store");
    if (error instanceof Anthropic.APIError) {
      console.error(`estimate: API error ${error.status}: ${error.message}`);
      return json({ ok: false, reason: "failed" }, 502, "no-store");
    }
    console.error("estimate: unexpected error", error);
    return json({ ok: false, reason: "failed" }, 500, "no-store");
  }
}
