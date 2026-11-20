"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { remember, submitSignup, type SignupResult } from "@/lib/signup";
import { track } from "@/lib/track";

type Props = {
  /** What the person is signing up for; sent with the email so the list can be split. */
  interest: string;
  /** Extra context to send. Never pay. */
  context?: Record<string, string>;
  cta: string;
  /** "dark" when the form sits on brine or ink, where the button turns zest. */
  tone?: "light" | "dark";
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
  const onDark = tone === "dark";

  if (status === "ok") {
    return (
      <div className="animate-settle rounded-ctl bg-zest p-5 text-ink">
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
          className={`field h-14 min-w-0 shrink-0 px-4 text-base sm:flex-1 ${onDark ? "border-transparent" : ""}`}
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
          className={`press h-14 shrink-0 rounded-ctl px-6 text-base font-semibold disabled:opacity-60 ${
            onDark ? "bg-zest text-ink hover:bg-white" : "bg-brine text-white hover:bg-brine-deep"
          }`}
        >
          {status === "sending" ? "One second…" : cta}
        </button>
      </div>
      <p role="status" className={`text-sm ${onDark ? "text-white/80" : "text-ink-soft"}`}>
        {status === "error"
          ? "That didn't go through. Check your connection and try again."
          : status === "off"
            ? "Sign-ups aren't switched on yet, so this wasn't saved."
            : note}{" "}
        <Link href="/privacy" prefetch={false} className="underline">
          Privacy
        </Link>{" "}
        and{" "}
        <Link href="/terms" prefetch={false} className="underline">
          terms
        </Link>
        .
      </p>
    </form>
  );
}
