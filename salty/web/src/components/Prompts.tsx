"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isQuiet, markInterrupted, quieten, RESULT_ID, setFunnel, START_PLAN_EVENT, useFunnel, wasInterrupted, type Funnel } from "@/lib/funnel";
import { remember } from "@/lib/signup";
import { track } from "@/lib/track";
import { EmailForm } from "./EmailForm";
import { CloseIcon } from "./icons";

const CHECKOUT = process.env.NEXT_PUBLIC_PLAN_CHECKOUT_URL ?? "";
const PRICE = process.env.NEXT_PUBLIC_PLAN_PRICE ?? "";
/** A result has to have been on screen this long before anything is offered. */
const READ_FIRST_MS = 6000;
const EXIT_KEY = "salty.exit";

const startPlan = () => window.dispatchEvent(new Event(START_PLAN_EVENT));

type Offer = { id: "plan" | "full" | "email"; title: string; body: string };

/** What to offer someone who is leaving, from what they have done so far. Null means nothing. */
function offerFor(funnel: Funnel, joined: boolean): Offer | null {
  if (funnel.stage === "plan-done") {
    return { id: "full", title: "Your plan is half finished.", body: "The full plan has the conversation word for word, what to say when they push back, and the follow-up email." };
  }
  if (funnel.stage !== "result") return null;
  if (funnel.mode === "pay" || funnel.mode === "estimate") {
    return funnel.underpaid
      ? { id: "plan", title: "Don't just know it. Fix it.", body: "Your raise plan is free: the figure to ask for, how strong your case is, and your opening line. Six quick questions." }
      : { id: "plan", title: "One more minute?", body: "See the next figure worth asking for, and how to ask for it. Free, six quick questions." };
  }
  if (joined) return null;
  return { id: "email", title: "Before you go.", body: "The Sunday pay drop: three pay facts worth knowing and one move to make. Once a week, free." };
}

/**
 * The leave-intent prompt. It appears once per visit, only after a result has been read, when the
 * visitor moves to leave: the pointer heads for the top of the window, or they scroll back up and
 * out of the result. If the visit has already had its one pop-up (the email prompt on opening),
 * this shows as a small corner card that blocks nothing.
 */
export function ExitPrompt() {
  const funnel = useFunnel();
  const [shown, setShown] = useState<{ offer: Offer; quiet: boolean } | null>(null);
  const done = useRef(false);

  const eligible = funnel.stage === "result" || funnel.stage === "plan-done";
  const resultAt = funnel.resultAt;

  const fire = useCallback(
    (trigger: string) => {
      if (done.current || document.querySelector('[role="dialog"]')) return;
      const offer = offerFor(funnel, remember.get("salty.joined") === "1");
      if (!offer || isQuiet(EXIT_KEY)) return;
      done.current = true;
      // The second prompt of a visit must not block the page.
      const quiet = wasInterrupted();
      if (!quiet) markInterrupted();
      setShown({ offer, quiet });
      setFunnel({ prompt: "open" });
      track("prompt", { action: "shown", offer: offer.id, trigger, style: quiet ? "card" : "modal" });
    },
    [funnel],
  );

  useEffect(() => {
    if (!eligible || resultAt === null || done.current) return;
    let armed = false;
    let entered = false;
    const arm = setTimeout(() => (armed = true), Math.max(0, READ_FIRST_MS - (Date.now() - resultAt)));

    // Desktop: the pointer leaves through the top of the window, towards the tabs and the close button.
    const onMouseOut = (event: MouseEvent) => {
      if (armed && !event.relatedTarget && event.clientY <= 0) fire("pointer");
    };
    // Any device: having scrolled into the result, they scroll back up and out of it.
    const onScroll = () => {
      const top = document.getElementById(RESULT_ID)?.getBoundingClientRect().top;
      if (top === undefined) return;
      if (top < 0) entered = true;
      else if (armed && entered && top > window.innerHeight * 0.55) fire("scroll-up");
    };
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(arm);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    };
  }, [eligible, resultAt, fire]);

  const close = useCallback(
    (reason: "closed" | "accepted") => {
      if (shown && reason === "closed") {
        quieten(EXIT_KEY);
        track("prompt", { action: "closed", offer: shown.offer.id });
      }
      setShown(null);
      // Having said no to the offer, they are not shown the bar for the same thing either.
      setFunnel({ prompt: reason === "closed" ? "declined" : "none" });
    },
    [shown],
  );

  useEffect(() => {
    if (!shown) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close("closed");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shown, close]);

  if (!shown) return null;
  const { offer, quiet } = shown;

  const action =
    offer.id === "plan" ? (
      <button
        type="button"
        onClick={() => {
          track("prompt", { action: "accepted", offer: offer.id });
          close("accepted");
          startPlan();
        }}
        className="press h-14 w-full rounded-ctl bg-brine px-6 text-base font-semibold text-white hover:bg-brine-deep"
      >
        Build my raise plan
      </button>
    ) : offer.id === "full" && CHECKOUT ? (
      <a
        href={CHECKOUT}
        target="_blank"
        rel="noopener"
        onClick={() => {
          track("prompt", { action: "accepted", offer: offer.id });
          close("accepted");
        }}
        className="press flex h-14 w-full items-center justify-center rounded-ctl bg-brine px-6 text-base font-semibold text-white hover:bg-brine-deep"
      >
        Get the full plan{PRICE ? ` · ${PRICE}` : ""}
      </a>
    ) : (
      <EmailForm
        interest={offer.id === "full" ? "raise-plan" : "newsletter"}
        context={funnel.context}
        cta={offer.id === "full" ? "Tell me when it opens" : "Send it to me"}
        successTitle={offer.id === "full" ? "You're first in line." : "You're on the list."}
        successBody={offer.id === "full" ? "We'll email you the moment the full plan opens." : "You'll get the next pay drop when it goes out."}
      />
    );

  const panel = (
    <>
      <button
        type="button"
        onClick={() => close("closed")}
        aria-label="Close"
        className="press absolute top-2 right-2 flex size-11 items-center justify-center rounded-ctl hover:bg-ink hover:text-salt"
      >
        <CloseIcon />
      </button>
      <h2 id="exit-title" className={`display pr-10 ${quiet ? "text-2xl" : "text-[clamp(1.9rem,8vw,2.5rem)]"}`}>
        {offer.title}
      </h2>
      <p className={`mt-2 text-ink-soft ${quiet ? "text-sm" : ""}`}>{offer.body}</p>
      <div className="mt-4">{action}</div>
    </>
  );

  // Second prompt of the visit: a card in the corner, no backdrop, nothing blocked.
  if (quiet) {
    return (
      <aside aria-labelledby="exit-title" className="fixed inset-x-3 bottom-3 z-40 animate-rise rounded-box bg-salt p-5 shadow-float sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96">
        {panel}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="exit-title">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={() => close("closed")} className="absolute inset-0 cursor-default bg-ink/60" />
      <div data-lenis-prevent className="relative w-full max-w-md animate-rise rounded-t-box bg-salt p-6 shadow-float sm:rounded-box sm:p-8">
        {panel}
        <button type="button" onClick={() => close("closed")} className="mt-2 w-full rounded-ctl py-3 text-center font-semibold underline">
          Not now
        </button>
      </div>
    </div>
  );
}

/**
 * A slim bar at the bottom of the screen that points at the next step while a pay result is
 * showing and the raise plan has not been started. It blocks nothing, can be dismissed for the
 * visit, and gets out of the way whenever the raise plan itself is on screen.
 */
export function NextStepBar() {
  const funnel = useFunnel();
  const [dismissed, setDismissed] = useState(false);
  const [planInView, setPlanInView] = useState(true);
  const [ready, setReady] = useState(false);

  const relevant = funnel.stage === "result" && (funnel.mode === "pay" || funnel.mode === "estimate");
  const resultAt = funnel.resultAt;

  useEffect(() => {
    if (!relevant || resultAt === null) return;
    // Give the result a few seconds on its own first.
    const timer = setTimeout(() => setReady(true), Math.max(0, READ_FIRST_MS / 2 - (Date.now() - resultAt)));
    const plan = document.getElementById("raise-plan");
    if (!plan) return () => clearTimeout(timer);
    const observer = new IntersectionObserver(([entry]) => setPlanInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(plan);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      setReady(false);
    };
  }, [relevant, resultAt]);

  if (!relevant || !ready || dismissed || planInView || funnel.prompt !== "none") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 animate-rise bg-zest pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <p className="min-w-0 flex-1 text-sm font-semibold">Next: your free raise plan. The figure to ask for, and how.</p>
        <button
          type="button"
          onClick={() => {
            track("prompt", { action: "accepted", offer: "bar" });
            startPlan();
          }}
          className="press shrink-0 rounded-ctl bg-ink px-4 py-2.5 text-sm font-semibold text-salt hover:bg-brine"
        >
          Build it
        </button>
        <button type="button" onClick={() => setDismissed(true)} aria-label="Hide" className="press flex size-11 shrink-0 items-center justify-center rounded-ctl hover:bg-ink hover:text-salt">
          <CloseIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
