"use client";

import { useId, useState } from "react";
import { COMING_FEATURES, type FeatureId } from "@/lib/brand";
import { track } from "@/lib/track";

type Props = {
  /** Context sent with the signup so we learn who wants this. Never includes pay. */
  context?: { country?: string; job?: string; verdict?: string };
  tone?: "light" | "brine";
};

type Status = "idle" | "sending" | "done" | "error";

const ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_URL ?? "";

/**
 * Posts to whatever form endpoint is configured. Some providers do not allow a
 * cross-site JSON reply, so if the first attempt is blocked we resend in a mode
 * where the browser hides the reply; that send still reaches the provider.
 */
async function submit(fields: Record<string, string>): Promise<boolean> {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.append(key, value);
  try {
    const response = await fetch(ENDPOINT, { method: "POST", body, headers: { Accept: "application/json" } });
    return response.ok;
  } catch {
    try {
      const retry = new FormData();
      for (const [key, value] of Object.entries(fields)) retry.append(key, value);
      await fetch(ENDPOINT, { method: "POST", body: retry, mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  }
}

export function WaitlistForm({ context, tone = "light" }: Props) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [feature, setFeature] = useState<FeatureId | null>(null);
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const onBrine = tone === "brine";

  if (!ENDPOINT) {
    return (
      <p className={`rounded-xl border-2 border-dashed p-4 text-sm ${onBrine ? "border-white/60 text-white" : "border-ink/40 text-ink-soft"}`}>
        The waitlist is not connected yet. Set <code className="font-mono">NEXT_PUBLIC_WAITLIST_URL</code> to a form
        endpoint (see the README) and this becomes the sign-up form.
      </p>
    );
  }

  if (status === "done") {
    return (
      <div className={`animate-pop rounded-2xl border-2 border-ink p-5 bg-zest text-ink shadow-hard-sm`}>
        <p className="display text-2xl">You&apos;re on the list.</p>
        <p className="mt-2 text-sm">One email when it&apos;s ready. Nothing else.</p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (trap) return; // Filled only by bots.
    setStatus("sending");
    const ok = await submit({
      email,
      feature: feature ?? "",
      country: context?.country ?? "",
      job: context?.job ?? "",
      verdict: context?.verdict ?? "",
      source: "salty-web",
    });
    if (ok) track("waitlist", { feature: feature ?? "none", country: context?.country ?? "" });
    setStatus(ok ? "done" : "error");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <fieldset>
        <legend className={`eyebrow mb-2 ${onBrine ? "text-white/80" : "text-ink-soft"}`}>What do you want first? (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {COMING_FEATURES.map((item) => {
            const active = feature === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFeature(active ? null : item.id)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-ink bg-zest text-ink"
                    : onBrine
                      ? "border-white/70 text-white hover:bg-white/10"
                      : "border-ink/25 text-ink hover:border-ink"
                }`}
              >
                {item.title}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-14 min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-4 text-base text-ink placeholder:text-ink-soft/60"
        />
        {/* Honeypot: hidden from people, tempting to bots. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={trap}
          onChange={(event) => setTrap(event.target.value)}
          className="absolute -left-[9999px] size-px opacity-0"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={`press h-14 shrink-0 rounded-xl border-2 border-ink px-6 text-base font-semibold shadow-hard-sm disabled:opacity-60 ${
            onBrine ? "bg-zest text-ink" : "bg-brine text-white"
          }`}
        >
          {status === "sending" ? "Adding you…" : "Join the waitlist"}
        </button>
      </div>

      <p role="status" className={`text-sm ${onBrine ? "text-white/80" : "text-ink-soft"}`}>
        {status === "error"
          ? "That didn't go through. Check your connection and try again."
          : "One email when it launches. We never see or store your pay."}
      </p>
    </form>
  );
}
