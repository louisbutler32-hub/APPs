"use client";

import { useSyncExternalStore } from "react";
import { remember } from "./signup";

/**
 * Where a visitor is in the journey, shared between the result screens and the prompts that
 * respond to them (the leave-intent prompt and the next-step bar).
 *
 * The rules the prompts follow, so marketing never becomes nagging:
 * - Value first: nothing is pushed until a result has been on screen for a few seconds.
 * - One interruption per visit: if the email prompt appeared on opening, the leave-intent prompt
 *   shows as a small corner card that blocks nothing, not as a second pop-up.
 * - Never mid-task: nothing appears while someone is answering the raise-plan questions.
 * - Closing means no: a closed prompt stays away for a week.
 * - Nothing is offered twice: someone who has taken the offer is not shown it again.
 */
export type Funnel = {
  /** browsing: no result yet. result: a result is showing. plan: answering the questions. plan-done: free plan showing, full plan locked. unlocked: has the full plan. */
  stage: "browsing" | "result" | "plan" | "plan-done" | "unlocked";
  /** What was checked. Only pay checks and estimates lead to the raise plan. */
  mode: "pay" | "offer" | "hiring" | "estimate" | null;
  /** True when the verdict was "Salty" or "Extra salty". Chooses the wording, nothing else. */
  underpaid: boolean;
  /** When the current result appeared, for the "few seconds first" rule. */
  resultAt: number | null;
  /** Sent with a sign-up from a prompt: country and job. Never pay. */
  context: Record<string, string>;
  /**
   * The leave-intent prompt: not shown yet, showing, or closed without taking the offer. Only one
   * prompt is ever on screen, so the next-step bar hides while this is open, and stays hidden once
   * the visitor has said no.
   */
  prompt: "none" | "open" | "declined";
};

let state: Funnel = { stage: "browsing", mode: null, underpaid: false, resultAt: null, context: {}, prompt: "none" };
const listeners = new Set<() => void>();

export function setFunnel(patch: Partial<Funnel>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => state;

export function useFunnel(): Funnel {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

// One interruption per visit. Kept in memory and in session storage, so a reload does not reset it.
let interrupted = false;

export function markInterrupted() {
  interrupted = true;
  try {
    window.sessionStorage.setItem("salty.interrupted", "1");
  } catch {
    // Storage blocked: the in-memory flag still covers this page.
  }
}

export function wasInterrupted(): boolean {
  if (interrupted) return true;
  try {
    return window.sessionStorage.getItem("salty.interrupted") === "1";
  } catch {
    return false;
  }
}

const QUIET_DAYS = 7;

/** True while a prompt closed in the last week should stay away. */
export function isQuiet(key: string): boolean {
  const closedAt = Number(remember.get(key) ?? 0);
  return closedAt > 0 && Date.now() - closedAt < QUIET_DAYS * 86_400_000;
}

export function quieten(key: string) {
  remember.set(key, String(Date.now()));
}

/** Asks the raise plan on the page to start and scroll into view. */
export const START_PLAN_EVENT = "salty:start-plan";
/** The element that wraps a result, so prompts can tell when someone is leaving it. */
export const RESULT_ID = "salty-result";
