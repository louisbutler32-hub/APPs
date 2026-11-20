/**
 * One place that sends an email sign-up. Every form on the site goes through here, tagged with an
 * `interest` so the list can be split later (newsletter, raise-plan, offer, employer, country-au ...).
 *
 * Privacy rule: pay is never one of the fields.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_URL ?? "";

export const SIGNUPS_ON = Boolean(ENDPOINT);

export type SignupResult = "ok" | "error" | "off";

function form(fields: Record<string, string>): FormData {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  return body;
}

/**
 * Some providers do not allow a cross-site JSON reply, so if the first attempt is blocked we resend
 * in a mode where the browser hides the reply; that send still reaches the provider.
 */
export async function submitSignup(fields: Record<string, string>): Promise<SignupResult> {
  if (!ENDPOINT) return "off";
  const all = { ...fields, source: "salty-web" };
  try {
    const response = await fetch(ENDPOINT, { method: "POST", body: form(all), headers: { Accept: "application/json" } });
    return response.ok ? "ok" : "error";
  } catch {
    try {
      await fetch(ENDPOINT, { method: "POST", body: form(all), mode: "no-cors" });
      return "ok";
    } catch {
      return "error";
    }
  }
}

/** Small device-only memory that never throws (storage can be blocked in private or embedded views). */
export const remember = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Forgetting is fine.
    }
  },
};
