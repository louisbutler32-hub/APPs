"use client";

import { useRef, useState } from "react";
import type { Country } from "@/lib/countries";
import { money } from "@/lib/pay/format";
import type { Job } from "@/lib/pay/types";
import { fullPlan, openingLines, QUESTIONS, strength, target, timing, type Answers } from "@/lib/raise-plan";
import { remember } from "@/lib/signup";
import { track } from "@/lib/track";
import { EmailForm } from "./EmailForm";

type Props = { country: Country; job: Job; pay: number; underpaid: boolean };

/** Settings for selling the full plan. All optional: without a checkout link the plan collects interest instead. */
const CHECKOUT = process.env.NEXT_PUBLIC_PLAN_CHECKOUT_URL ?? "";
const PRICE = process.env.NEXT_PUBLIC_PLAN_PRICE ?? "";
const CODE = process.env.NEXT_PUBLIC_PLAN_CODE ?? "";
const PREVIEW = process.env.NEXT_PUBLIC_PREVIEW === "1";
const UNLOCK_KEY = "salty.plan";

const LEVEL_TONE = { Strong: "bg-zest", Solid: "bg-amber", "Needs building": "bg-white" } as const;

export function RaisePlan({ country, job, pay, underpaid }: Props) {
  const [stage, setStage] = useState<"intro" | "survey" | "plan">("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({ changes: [] });
  const [unlocked, setUnlocked] = useState(false);
  const [codeText, setCodeText] = useState("");
  const [codeWrong, setCodeWrong] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const m = (value: number) => money(country, value);

  const scrollTop = () => requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

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
      <div ref={top} className="scroll-mt-6 rounded-3xl border-2 border-ink bg-zest p-6 shadow-hard sm:p-9">
        <p className="eyebrow">Next step</p>
        <p className="display mt-2 text-[clamp(1.9rem,7vw,3rem)]">{underpaid ? "Now go and get it." : "Know your next number."}</p>
        <p className="mt-3 max-w-xl text-lg">
          Answer six quick questions and get your raise plan: the exact figure to ask for, how strong your case is, when to ask
          and your opening line. Free.
        </p>
        <button type="button" onClick={start} className="press mt-6 h-14 rounded-xl border-2 border-ink bg-ink px-6 text-base font-semibold text-salt shadow-hard-sm">
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
      <div ref={top} className="scroll-mt-6 rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-9">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow text-ink-soft">
            Raise plan · {step + 1} of {QUESTIONS.length}
          </p>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="text-sm font-semibold underline underline-offset-4">
              Back
            </button>
          )}
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-salt-deep" aria-hidden>
          <div className="h-full rounded-full bg-brine transition-[width] duration-300" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
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
                  className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors ${
                    selected ? "border-ink bg-brine text-white" : "border-ink/20 bg-salt hover:border-ink"
                  }`}
                >
                  {option.label}
                  <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${selected ? "border-white bg-white text-brine" : "border-ink/30"}`}>
                    {selected ? "✓" : ""}
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
          className="press mt-6 h-14 w-full rounded-xl border-2 border-ink bg-ink px-6 text-base font-semibold text-salt shadow-hard-sm disabled:opacity-40"
        >
          {step === QUESTIONS.length - 1 ? "Show my plan" : question.multi && (answers.changes ?? []).length === 0 ? "None of these" : "Next"}
        </button>
      </div>
    );
  }

  const complete = answers as Answers;
  const goal = target(job, pay);
  const belowMiddle = typeof job.p50 === "number" && pay < job.p50;
  const strong = strength(complete, belowMiddle);
  const input = { country, job, pay, answers: complete };
  const sections = fullPlan(input);

  return (
    <div ref={top} className="scroll-mt-6 space-y-6">
      <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-9">
        <p className="eyebrow text-ink-soft">Your raise plan</p>

        <section className="mt-4">
          <h3 className="display text-2xl">1. Your number</h3>
          {goal.kind === "raise" ? (
            <>
              <p className="figure mt-3 text-[clamp(3.5rem,17vw,6rem)] text-brine">{m(goal.bigJump && goal.firstStep ? goal.firstStep : goal.target)}</p>
              {goal.bigJump && goal.firstStep ? (
                <p className="mt-3 text-lg">
                  The figure to aim for is <strong>{m(goal.target)}</strong>: {goal.why}. That is {Math.round(goal.increase * 100)}% above your pay
                  today, which is a lot to ask for in one conversation. Ask for <strong>{m(goal.firstStep)}</strong> now and a date for the rest.
                </p>
              ) : (
                <p className="mt-3 text-lg">
                  That is {goal.why}. Open at <strong>{m(goal.opening)}</strong> so you have room to land on it.
                </p>
              )}
            </>
          ) : goal.kind === "top" ? (
            <p className="mt-3 text-lg">
              You&apos;re already above the highest pay point the official figures publish for this job, so there is no bigger number to
              point at. Your case is about what you do, not what others earn.
            </p>
          ) : (
            <p className="mt-3 text-lg">The official figures for this job don&apos;t give us a number to aim at.</p>
          )}
        </section>

        <section className="mt-8 border-t border-ink/10 pt-6">
          <h3 className="display text-2xl">2. Your case</h3>
          <p className={`mt-3 inline-block rounded-full border-2 border-ink px-4 py-1 font-display text-lg font-extrabold ${LEVEL_TONE[strong.level]}`}>{strong.level}</p>
          {strong.forYou.length > 0 && (
            <>
              <p className="eyebrow mt-5 text-ink-soft">On your side</p>
              <ul className="mt-2 space-y-1.5">
                {strong.forYou.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden className="font-bold text-brine">+</span>
                    {line}
                  </li>
                ))}
              </ul>
            </>
          )}
          {strong.fixFirst.length > 0 && (
            <>
              <p className="eyebrow mt-5 text-ink-soft">Sort this first</p>
              <ul className="mt-2 space-y-1.5">
                {strong.fixFirst.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span aria-hidden className="font-bold text-chilli">!</span>
                    {line}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="mt-8 border-t border-ink/10 pt-6">
          <h3 className="display text-2xl">3. When to ask</h3>
          <p className="mt-3 text-lg">{timing(complete)}</p>
        </section>

        <section className="mt-8 border-t border-ink/10 pt-6">
          <h3 className="display text-2xl">4. How to open</h3>
          <div className="mt-3 space-y-2 rounded-2xl bg-salt p-4 text-lg">
            {openingLines(input).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      </div>

      {unlocked ? (
        <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-hard sm:p-9">
          <p className="eyebrow text-ink-soft">The full plan</p>
          {sections.map((section) => (
            <section key={section.title} className="mt-6 border-t border-ink/10 pt-6 first-of-type:border-0 first-of-type:pt-0">
              <h3 className="display text-2xl">{section.title}</h3>
              {section.intro && <p className="mt-2 text-ink-soft">{section.intro}</p>}
              <ul className="mt-3 space-y-3 text-lg">
                {section.lines.map((line) => (
                  <li key={line} className={line.startsWith('"') ? "rounded-2xl bg-salt p-4" : ""}>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="mt-8 text-sm text-ink-soft">General guidance, not legal or financial advice. Salty can&apos;t promise a raise; it can make sure you ask well.</p>
        </div>
      ) : (
        <div className="rounded-3xl border-2 border-ink bg-ink p-6 text-salt shadow-hard sm:p-9">
          <p className="eyebrow text-zest">The full plan</p>
          <p className="display mt-2 text-[clamp(1.75rem,6vw,2.5rem)]">The rest, word for word.</p>
          <ul className="mt-5 space-y-2.5">
            {sections.map((section) => (
              <li key={section.title} className="flex items-center gap-3">
                <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full border border-salt/40 text-sm">
                  🔒
                </span>
                <span>
                  <span className="font-semibold">{section.title}</span>
                  {section.intro && <span className="block text-sm text-salt/60">{section.intro}</span>}
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
                className="press inline-flex h-14 items-center rounded-xl border-2 border-salt bg-zest px-6 text-base font-semibold text-ink"
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
                  className="h-11 w-40 rounded-lg border-2 border-salt/50 bg-transparent px-3 text-base"
                />
                <button type="submit" className="h-11 rounded-lg border-2 border-salt/50 px-4 text-sm font-semibold hover:bg-salt hover:text-ink">
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
                context={{ country: country.code, job: job.code }}
                cta="Tell me when it opens"
                tone="brine"
                successTitle="You're first in line."
                successBody="We'll email you the moment the full plan opens."
              />
            </div>
          )}

          {PREVIEW && (
            <button type="button" onClick={() => setUnlocked(true)} className="mt-5 text-sm underline underline-offset-4">
              Preview only: show the full plan as a buyer would see it
            </button>
          )}
        </div>
      )}
    </div>
  );
}
