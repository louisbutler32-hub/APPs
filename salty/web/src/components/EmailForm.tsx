"use client";

import { useId, useState } from "react";
import { remember, submitSignup, type SignupResult } from "@/lib/signup";
import { track } from "@/lib/track";

type Props = {
  /** What the person is signing up for; sent with the email so the list can be split. */
  interest: string;
  /** Extra context to send. Never pay. */
  context?: Record<string, string>;
  cta: string;
  tone?: "light" | "brine";
  note?: string;
  successTitle?: string;
  successBody?: string;
  onDone?: () => void;
};

type Status = "idle" | "sending" | SignupResult;

export function EmailForm({
  interest,
  context,
  cta,
  tone = "light",
  note = "Unsubscribe any time. We never see or store your pay.",
  successTitle = "You're in.",
  successBody = "Check your inbox soon.",
  onDone,
}: Props) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const onBrine = tone === "brine";

  if (status === "ok") {
    return (
      <div className="animate-pop rounded-2xl border-2 border-ink bg-zest p-5 text-ink shadow-hard-sm">
        <p className="display text-2xl">{successTitle}</p>
        <p className="mt-2 text-sm">{successBody}</p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (trap) return; // Filled only by bots.
    setStatus("sending");
    const result = await submitSignup({ email, interest, ...context });
    if (result === "ok") {
      remember.set("salty.joined", "1");
      track("waitlist", { interest, country: context?.country ?? "" });
      onDone?.();
    }
    setStatus(result);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
          {status === "sending" ? "One second…" : cta}
        </button>
      </div>
      <p role="status" className={`text-sm ${onBrine ? "text-white/80" : "text-ink-soft"}`}>
        {status === "error"
          ? "That didn't go through. Check your connection and try again."
          : status === "off"
            ? "Sign-ups aren't switched on yet, so this wasn't saved."
            : note}
      </p>
    </form>
  );
}
