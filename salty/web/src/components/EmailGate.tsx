"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markInterrupted } from "@/lib/funnel";
import { remember } from "@/lib/signup";
import { track } from "@/lib/track";
import { EmailForm } from "./EmailForm";
import { Logo } from "./Logo";

const KEY = "salty.gate";
const QUIET_DAYS = 30;
/** Fired by anything that wants to open the sign-up again, such as the footer link. */
export const OPEN_GATE_EVENT = "salty:open-gate";

/**
 * The email ask shown when the site opens. It is easy to close, and once closed it stays away for
 * a month; once someone has joined it never returns. Only a deliberate click reopens it.
 */
export function EmailGate() {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  const close = useCallback((reason: "dismissed" | "joined") => {
    setOpen(false);
    if (reason === "dismissed") {
      remember.set(KEY, String(Date.now()));
      track("gate", { action: "closed" });
    }
  }, []);

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_GATE_EVENT, reopen);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const closedAt = Number(remember.get(KEY) ?? 0);
    const quiet = closedAt > 0 && Date.now() - closedAt < QUIET_DAYS * 86_400_000;
    if (!remember.get("salty.joined") && !quiet) {
      // A beat after load, so the page is seen first and the ask does not feel like a wall.
      timer = setTimeout(() => {
        setOpen(true);
        markInterrupted();
        track("gate", { action: "shown" });
      }, 900);
    }
    return () => {
      window.removeEventListener(OPEN_GATE_EVENT, reopen);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close("dismissed");
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="gate-title">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={() => close("dismissed")} className="absolute inset-0 cursor-default bg-ink/60" />
      <div className="relative w-full max-w-md animate-rise rounded-t-3xl border-2 border-ink bg-salt p-6 shadow-hard sm:rounded-3xl sm:p-8">
        <button
          ref={closeButton}
          type="button"
          onClick={() => close("dismissed")}
          aria-label="Close"
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full border-2 border-ink bg-white text-xl leading-none font-semibold hover:bg-ink hover:text-salt"
        >
          <span aria-hidden>×</span>
        </button>
        <Logo className="text-[1.4rem]" />
        <h2 id="gate-title" className="display mt-4 text-[clamp(2rem,9vw,2.75rem)]">
          Know what everyone else is paid.
        </h2>
        <p className="mt-3 text-ink-soft">
          The Sunday pay drop: three pay facts worth knowing and one move to make. Once a week, free.
        </p>
        <div className="mt-5">
          <EmailForm
            interest="newsletter"
            cta="Send it to me"
            successTitle="You're on the list."
            successBody="You'll get the next pay drop when it goes out."
            onDone={() => remember.set(KEY, "joined")}
          />
        </div>
        <button type="button" onClick={() => close("dismissed")} className="mt-2 w-full rounded-xl py-3 text-center font-semibold underline underline-offset-4">
          No thanks, just check my pay
        </button>
      </div>
    </div>
  );
}

/** A plain link that reopens the sign-up, for the footer and anywhere else it is wanted. */
export function OpenGateLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_GATE_EVENT))} className={className}>
      {children}
    </button>
  );
}
