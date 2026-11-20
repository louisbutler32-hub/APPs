/**
 * Cloudflare Pages adapter for the AI estimate: this file's location makes it answer at
 * /api/estimate on a Pages site. Set ANTHROPIC_API_KEY as an encrypted variable in the Pages
 * project settings. Other hosts need their own few-line adapter around handleEstimate.
 *
 * Good answers are stored in Cloudflare's cache under the request address, so each job in each
 * country is looked up (and paid for) once a month however many people ask.
 */
import { handleEstimate } from "../../server/estimate";

type Context = { request: Request; env: Record<string, string | undefined>; waitUntil: (work: Promise<unknown>) => void };

export async function onRequestGet(context: Context): Promise<Response> {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  // Normalise the address so "Barista" and "barista " share one cache entry.
  const url = new URL(context.request.url);
  const tidy = (name: string) => encodeURIComponent((url.searchParams.get(name) ?? "").trim().replace(/\s+/g, " ").toLowerCase());
  const key = new Request(`${url.origin}${url.pathname}?country=${tidy("country")}&place=${tidy("place")}&job=${tidy("job")}`);
  const hit = await cache?.match(key);
  if (hit) return hit;

  const response = await handleEstimate(context.request, context.env);
  if (cache && response.ok && response.headers.get("Cache-Control")?.includes("s-maxage")) {
    context.waitUntil(cache.put(key, response.clone()));
  }
  return response;
}
