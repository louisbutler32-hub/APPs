"use client";

import { useEffect, useRef, useState } from "react";
import type { Place } from "@/lib/world";
import { money } from "@/lib/pay/format";
import { setFunnel, START_PLAN_EVENT } from "@/lib/funnel";
import type { Job } from "@/lib/pay/types";
import { fullPlan, openingLines, QUESTIONS, strength, target, timing, type Answers } from "@/lib/raise-plan";
import { remember } from "@/lib/signup";
import { track } from "@/lib/track";
import { EmailForm } from "./EmailForm";
import { CheckIcon, LockIcon } from "./icons";
import { scrollToElement } from "./SmoothScroll";

/** `official` is false when the figures behind the plan are an AI estimate rather than official statistics. */
type Props = { country: Place; job: Job; pay: number; underpaid: boolean; official?: boolean };

/** Settings for selling the full plan. All optional: without a checkout link the plan collects interest instead. */
const CHECKOUT = process.env.NEXT_PUBLIC_PLAN_CHECKOUT_URL ?? "";
const PRICE = process.env.NEXT_PUBLIC_PLAN_PRICE ?? "";
const CODE = process.env.NEXT_PUBLIC_PLAN_CODE ?? "";
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";
const UNLOCK_KEY = "salty.plan";

const LEVEL_TONE = { Strong: "bg-zest text-ink", Solid: "bg-amber text-ink", "Needs building": "border border-ink/40 text-ink" } as const;

export function RaisePlan({ country, job, pay, underpaid, official = true }: Props) {
  const [stage, setStage] = useState<"intro" | "survey" | "plan">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({ changes: [] });
  const [unlocked, setUnlocked] = useState(false);
  const [codeText, setCodeText] = useState("");
  const [codeWrong, setCodeWrong] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const m = (value: number) => money(country, value);

  const scrollTop = () => requestAnimationFrame(() => scrollToElement(top.current));

  // Tell the prompts where this visitor has got to, so nothing interrupts the questions.
  useEffect(() => {
    if (stage === "survey") setFunnel({ stage: "plan" });
    else if (stage === "plan") setFunnel({ stage: unlocked ? "unlocked" : "plan-done" });
  }, [stage, unlocked]);

  // A prompt elsewhere on the page ("Build my raise plan") starts the questions here.
  useEffect(() => {
    const begin = () => {
      setStage((current) => (current === "intro" ? "survey" : current));
      setUnlocked(remember.get(UNLOCK_KEY) === "1");
      requestAnimationFrame(() => scrollToElement(top.current));
    };
    window.addEventListener(START_PLAN_EVENT, begin);
    return () => window.removeEventListener(START_PLAN_EVENT, begin);
  }, []);

  function start() {
    setStage("survey");
    setUnlocked(remember.get(UNLOCK_KEY) === "1");
    track("plan", { action: "started", country: country.code });
    scrollTop();
  }

  function next() {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setStage("plan");
      track("plan", { action: "finished", country: country.code });
    }
    scrollTop();
  }

  function tryCode(event: React.FormEvent) {
    event.preventDefault();
    if (CODE && codeText.trim().toLowerCase() === CODE.toLowerCase()) {
      remember.set(UNLOCK_KEY, "1");
      setUnlocked(true);
      track("plan", { action: "unlocked", country: country.code });
    } else {
      setCodeWrong(true);
    }
  }

  if (stage === "intro") {
    return (
      <div ref={top} id="raise-plan" className="scroll-mt-6 rounded-box bg-zest p-6 sm:p-9">
        <p className="display text-[clamp(1.9rem,7vw,3rem)]">{underpaid ? "Now go and get it." : "Know your next number."}</p>
        <p className="mt-3 max-w-xl text-lg">
          Answer six quick questions and get your raise plan: the exact figure to ask for, how strong your case is, when to ask
          and your opening line. Free.
        </p>
        <button type="button" onClick={start} className="press mt-6 h-14 rounded-ctl bg-ink px-6 text-base font-semibold text-salt hover:bg-brine">
          Build my raise plan
        </button>
        <p className="mt-3 text-sm">Takes a minute. Your answers stay on this device.</p>
      </div>
    );
  }

  if (stage === "survey") {
    const question = QUESTIONS[step];
    const picked = answers[question.id];
    const canContinue = question.multi || picked !== undefined;
    return (
      <div ref={top} id="raise-plan" className="scroll-mt-6 rounded-box border border-ink/15 bg-paper p-6 sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <p className="label text-ink-soft">
            Raise plan · {step + 1} of {QUESTIONS.length}
          </p>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="py-1 text-sm font-semibold underline">
              Back
            </button>
          )}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-[2px] bg-salt-deep" aria-hidden>
          <div className="h-full origin-left bg-brine transition-transform duration-300 ease-out" style={{ transform: `scaleX(${(step + 1) / QUESTIONS.length})` }} />
        </div>
        <fieldset className="mt-6">
          <legend className="display text-[clamp(1.6rem,6vw,2.25rem)]">{question.title}</legend>
          {question.multi && <p className="mt-2 text-ink-soft">{question.hint}</p>}
          <div className="mt-5 grid gap-2.5">
            {question.options.map((option) => {
              // In the multi-choice question every option is one of the "changes" values.
              const change = option.value as Answers["changes"][number];
              const selected = question.multi ? (answers.changes ?? []).includes(change) : picked === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    if (question.multi) {
                      const current = answers.changes ?? [];
                      setAnswers({ ...answers, changes: selected ? current.filter((item) => item !== change) : [...current, change] });
                    } else {
                      setAnswers({ ...answers, [question.id]: option.value });
                    }
                  }}
                  className={`press flex min-h-14 items-center justify-between gap-3 rounded-ctl border-2 px-4 py-3 text-left text-base font-medium ${
                    selected ? "border-brine bg-brine text-white" : "border-ink/25 bg-salt hover:border-ink"
                  }`}
                >
                  {option.label}
                  <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-[4px] border-2 ${selected ? "border-white bg-white text-brine" : "border-ink/40"}`}>
                    {selected && <CheckIcon className="size-4" />}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <button
          type="button"
          disabled={!canContinue}
          onClick={next}
          className="press mt-6 h-14 w-full rounded-ctl bg-ink px-6 text-base font-semibold text-salt hover:bg-brine disabled:opacity-40"
        >
          {step === QUESTIONS.length - 1 ? "Show my plan" : question.multi && (answers.changes ?? []).length === 0 ? "None of these" : "Next"}
        </button>
      </div>
    );
  }

  const complete = answers as Answers;
  const goal = target(job, pay);
  const belowMiddle = typeof job.p50 === "number" && pay < job.p50;
  const strong = strength(complete, belowMiddle, official);
  const input = { country, job, pay, answers: complete, official };
  const sections = fullPlan(input);

  return (
    <div ref={top} id="raise-plan" className="scroll-mt-6 space-y-6">
      <div className="rounded-box border border-ink/15 bg-paper p-6 sm:p-9">
        <h2 className="display text-[clamp(1.75rem,6vw,2.5rem)]">Your raise plan</h2>

        <section className="mt-6">
          <h3 className="display text-2xl">1. Your number</h3>
          {goal.kind === "raise" ? (
            <>
              <p className="figure mt-3 text-[clamp(3.5rem,17vw,6rem)] text-brine">{m(goal.bigJump && goal.firstStep ? goal.firstStep : goal.target)}</p>
              {goal.bigJump && goal.firstStep ? (
                <p className="mt-3 text-lg">
                  The figure to aim for is <strong>{m(goal.target)}</strong>{official ? "" : " (our estimate)"}: {goal.why}. That is {Math.round(goal.increase * 100)}% above your pay
                  today, which is a lot to ask for in one conversation. Ask for <strong>{m(goal.firstStep)}</strong> now and a date for the rest.
                </p>
              ) : (
                <p className="mt-3 text-lg">
                  {official ? "That is" : "By our estimate that is"} {goal.why}. Open at <strong>{m(goal.opening)}</strong> so you have room to
                  land on it.
                </p>
              )}
            </>
          ) : goal.kind === "top" ? (
            <p className="mt-3 text-lg">
              You&apos;re already above the top of the range we have for this job, so there is no bigger number to point at. Your case
              is about what you do, not what others earn.
            </p>
          ) : (
            <p className="mt-3 text-lg">The figures for this job don&apos;t give us a number to aim at.</p>
          )}
        </section>

        <section className="mt-8 border-t border-ink/15 pt-6">
          <h3 className="display text-2xl">2. Your case</h3>
          <p className={`tag mt-3 px-3 py-1 font-display text-lg font-extrabold ${LEVEL_TONE[strong.level]}`}>{strong.level}</p>
          {strong.forYou.length > 0 && (
            <>
              <p className="label mt-5">On your side</p>
              <ul className="mt-2 space-y-1.5">
                {strong.forYou.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span aria-hidden className="mt-[0.55em] size-2 shrink-0 rotate-[18deg] rounded-[1px] bg-brine" />
                    {line}
                  </li>
                ))}
              </ul>
            </>
          )}
          {strong.fixFirst.length > 0 && (
            <>
              <p className="label mt-5">Sort this first</p>
              <ul className="mt-2 space-y-1.5">
                {strong.fixFirst.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span aria-hidden className="mt-[0.55em] size-2 shrink-0 rotate-[18deg] rounded-[1px] bg-chilli" />
                    {line}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="mt-8 border-t border-ink/15 pt-6">
          <h3 className="display text-2xl">3. When to ask</h3>
          <p className="mt-3 text-lg">{timing(complete)}</p>
        </section>

        <section className="mt-8 border-t border-ink/15 pt-6">
          <h3 className="display text-2xl">4. How to open</h3>
          <div className="mt-3 space-y-2 rounded-ctl bg-salt p-4 text-lg">
            {openingLines(input).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      </div>

      {unlocked ? (
        <div className="rounded-box border border-ink/15 bg-paper p-6 sm:p-9">
          <h2 className="display text-[clamp(1.75rem,6vw,2.5rem)]">The full plan</h2>
          {sections.map((section) => (
            <section key={section.title} className="mt-6 border-t border-ink/15 pt-6 first-of-type:border-0 first-of-type:pt-0">
              <h3 className="display text-2xl">{section.title}</h3>
              {section.intro && <p className="mt-2 text-ink-soft">{section.intro}</p>}
              <ul className="mt-3 space-y-3 text-lg">
                {section.lines.map((line) => (
                  <li key={line} className={line.startsWith('"') ? "rounded-ctl bg-salt p-4" : ""}>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="mt-8 text-sm text-ink-soft">General guidance, not legal or financial advice. Salty can&apos;t promise a raise; it can make sure you ask well.</p>
        </div>
      ) : (
        <div className="on-dark rounded-box bg-ink p-6 text-salt sm:p-9">
          <p className="display text-[clamp(1.75rem,6vw,2.5rem)]">The full plan: the rest, word for word.</p>
          <ul className="mt-5 space-y-2.5">
            {sections.map((section) => (
              <li key={section.title} className="flex items-center gap-3">
                <LockIcon className="size-5 shrink-0 text-salt/60" />
                <span>
                  <span className="font-semibold">{section.title}</span>
                  {section.intro && <span className="block text-sm text-salt/70">{section.intro}</span>}
                </span>
              </li>
            ))}
          </ul>

          {CHECKOUT ? (
            <div className="mt-7">
              <a
                href={CHECKOUT}
                target="_blank"
                rel="noopener"
                onClick={() => track("plan", { action: "checkout", country: country.code })}
                className="press inline-flex h-14 items-center rounded-ctl bg-zest px-6 text-base font-semibold text-ink hover:bg-white"
              >
                Unlock the full plan{PRICE ? ` · ${PRICE}` : ""}
              </a>
              <form onSubmit={tryCode} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-sm text-salt/70" htmlFor="plan-code">
                  Already bought it? Enter your code:
                </label>
                <input
                  id="plan-code"
                  value={codeText}
                  onChange={(event) => {
                    setCodeText(event.target.value);
                    setCodeWrong(false);
                  }}
                  autoComplete="off"
                  autoCapitalize="none"
                  className="h-11 w-40 rounded-ctl border-2 border-salt/60 bg-transparent px-3 text-base"
                />
                <button type="submit" className="press h-11 rounded-ctl border-2 border-salt/60 px-4 text-sm font-semibold hover:bg-salt hover:text-ink">
                  Unlock
                </button>
              </form>
              {codeWrong && (
                <p role="alert" className="mt-2 text-sm text-amber">
                  That code didn&apos;t match. Check the email you got when you paid.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-7">
              <p className="mb-3 text-salt/90">The full plan opens soon. Leave your email and you&apos;ll get it first, at the launch price.</p>
              <EmailForm
                interest="raise-plan"
                context={{ country: country.code, job: job.code, job_title: job.title }}
                cta="Tell me when it opens"
                tone="dark"
                successTitle="You're first in line."
                successBody="We'll email you the moment the full plan opens."
              />
            </div>
          )}

          {PREVIEW && (
            <button type="button" onClick={() => setUnlocked(true)} className="mt-5 py-1 text-sm underline">
              Preview only: show the full plan as a buyer would see it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
