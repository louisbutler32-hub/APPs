import type { Place } from "./world";
import { money } from "./pay/format";
import { quantilePoints } from "./pay/percentile";
import type { Job } from "./pay/types";

/**
 * The raise plan: a short survey turns a pay check into something to act on. Everything here is
 * computed on the device from the survey and the published figures. Nothing is sent anywhere.
 *
 * The free part is the number to ask for, how strong the case is, when to ask and the opening line.
 * The paid part is the full word-for-word plan (see fullPlan).
 */

export type Answers = {
  tenure: "under6" | "6to12" | "1to2" | "2to5" | "over5";
  lastRaise: "never" | "under6" | "6to12" | "1to2" | "over2";
  changes: ("responsibility" | "training" | "covering" | "skills" | "targets")[];
  asked: "no" | "yes-got" | "yes-no";
  timing: "review-soon" | "no-review" | "just-had";
  leave: "looking" | "maybe" | "no";
};

type Option<V extends string> = { value: V; label: string };
export type Question =
  | { id: Exclude<keyof Answers, "changes">; title: string; multi: false; options: Option<string>[] }
  | { id: "changes"; title: string; hint: string; multi: true; options: Option<Answers["changes"][number]>[] };

export const QUESTIONS: Question[] = [
  {
    id: "tenure",
    title: "How long have you been in this job?",
    multi: false,
    options: [
      { value: "under6", label: "Under 6 months" },
      { value: "6to12", label: "6 to 12 months" },
      { value: "1to2", label: "1 to 2 years" },
      { value: "2to5", label: "2 to 5 years" },
      { value: "over5", label: "Over 5 years" },
    ],
  },
  {
    id: "lastRaise",
    title: "When did your pay last go up?",
    multi: false,
    options: [
      { value: "never", label: "It hasn't, in this job" },
      { value: "under6", label: "In the last 6 months" },
      { value: "6to12", label: "6 to 12 months ago" },
      { value: "1to2", label: "1 to 2 years ago" },
      { value: "over2", label: "Over 2 years ago" },
    ],
  },
  {
    id: "changes",
    title: "What has changed since then?",
    hint: "Pick everything that's true.",
    multi: true,
    options: [
      { value: "responsibility", label: "I've taken on more responsibility" },
      { value: "training", label: "I train or look after other people" },
      { value: "covering", label: "I'm covering for someone who left" },
      { value: "skills", label: "I've gained a skill or qualification" },
      { value: "targets", label: "I've hit or beaten my targets" },
    ],
  },
  {
    id: "asked",
    title: "Have you asked for a raise here before?",
    multi: false,
    options: [
      { value: "no", label: "No, never" },
      { value: "yes-got", label: "Yes, and I got one" },
      { value: "yes-no", label: "Yes, and they said no" },
    ],
  },
  {
    id: "timing",
    title: "Is a pay review coming up?",
    multi: false,
    options: [
      { value: "review-soon", label: "Yes, in the next 3 months" },
      { value: "no-review", label: "Nothing in the diary" },
      { value: "just-had", label: "I've just had one" },
    ],
  },
  {
    id: "leave",
    title: "If they say no, would you leave?",
    multi: false,
    options: [
      { value: "looking", label: "I'm already looking" },
      { value: "maybe", label: "Maybe" },
      { value: "no", label: "No, I want to stay" },
    ],
  },
];

const round = (value: number, step: number) => Math.round(value / step) * step;

export type Target =
  /** A figure to ask for, taken from the published pay points for the job. */
  | { kind: "raise"; target: number; opening: number; why: string; increase: number; bigJump: boolean; firstStep: number | null }
  /** Already above the highest published point: there is no higher figure to point at. */
  | { kind: "top" }
  | { kind: "none" };

/**
 * The number to ask for. Below the middle, the target is the middle: it is the easiest figure to
 * defend. At or above it, the target is the next published pay point up. The opening figure sits a
 * little above the target so there is room to land on it.
 */
export function target(job: Job, pay: number): Target {
  const middle = job.p50;
  if (typeof middle !== "number" || middle <= 0 || !(pay > 0)) return { kind: "none" };
  let figure: number | null = null;
  let why = "";
  if (pay < middle * 0.995) {
    figure = middle;
    why = "the middle for your job, where half of the people doing it are paid more";
  } else {
    const next = quantilePoints(job).find((point) => point.q > 50 && point.value > pay * 1.03);
    if (next) {
      figure = next.value;
      why = `what the best-paid ${100 - next.q} in 100 people in your job earn at least`;
    }
  }
  if (figure === null) return { kind: "top" };
  const goal = round(figure, 100);
  const increase = (goal - pay) / pay;
  const bigJump = increase > 0.15;
  return {
    kind: "raise",
    target: goal,
    opening: Math.ceil((goal * 1.05) / 500) * 500,
    why,
    increase,
    bigJump,
    firstStep: bigJump ? round(pay * 1.1, 100) : null,
  };
}

export type Strength = { level: "Strong" | "Solid" | "Needs building"; forYou: string[]; fixFirst: string[] };

/** How strong the case is, from plain rules the person can read, with the reasons spelled out. */
export function strength(answers: Answers, belowMiddle: boolean, official = true): Strength {
  let score = 0;
  const forYou: string[] = [];
  const fixFirst: string[] = [];

  if (belowMiddle) {
    score += 2;
    forYou.push(official ? "Official figures show you're paid below the middle for your job." : "Our estimate puts you below the going rate for your job.");
  }
  const longWithoutRaise = answers.lastRaise === "over2" || answers.lastRaise === "1to2" || (answers.lastRaise === "never" && !["under6", "6to12"].includes(answers.tenure));
  if (longWithoutRaise) {
    score += 2;
    forYou.push(answers.lastRaise === "never" ? "Your pay hasn't moved since you started." : "It's been over a year since your pay last went up.");
  } else if (answers.lastRaise === "6to12") {
    score += 1;
  } else if (answers.lastRaise === "under6") {
    score -= 1;
    fixFirst.push("Your pay went up recently, so lead with what has changed since, not with time served.");
  }
  const changeLabels: Record<Answers["changes"][number], string> = {
    responsibility: "You've taken on more responsibility.",
    training: "You train or look after other people.",
    covering: "You're doing someone else's job as well as your own.",
    skills: "You've gained a skill or qualification.",
    targets: "You've hit or beaten your targets.",
  };
  for (const change of answers.changes.slice(0, 3)) {
    score += 1;
    forYou.push(changeLabels[change]);
  }
  if (answers.changes.length === 0) fixFirst.push("Find one thing you do now that you didn't when your pay was set. \"I've been here a while\" isn't a reason on its own.");
  if (answers.tenure === "under6") {
    score -= 2;
    fixFirst.push("You're new. Unless the job has changed, ask for a date for a review rather than a raise today.");
  } else if (answers.tenure === "6to12") {
    score -= 1;
  }
  if (answers.asked === "yes-no") fixFirst.push("You were turned down before. Open by asking what would need to be true for a yes this time.");
  if (answers.timing === "just-had") fixFirst.push("You've just had a review, so you'll need to explain what they missed.");

  return { level: score >= 5 ? "Strong" : score >= 2 ? "Solid" : "Needs building", forYou, fixFirst };
}

export function timing(answers: Answers): string {
  if (answers.timing === "review-soon") return "Ask two to three weeks before your review, not in it. Budgets are usually decided before the meeting, so the review is too late.";
  if (answers.timing === "just-had") return "Don't wait a year. Ask for a separate conversation about pay within the month, and say the review didn't cover it.";
  return "Don't wait for a review that isn't coming. Ask for 20 minutes this week, right after something has gone well.";
}

const TENURE_WORDS: Record<Answers["tenure"], string> = {
  under6: "a few months",
  "6to12": "the best part of a year",
  "1to2": "over a year",
  "2to5": "a few years",
  over5: "more than five years",
};

const CHANGE_WORDS: Record<Answers["changes"][number], string> = {
  responsibility: "taken on more responsibility",
  training: "started training and looking after other people",
  covering: "been covering a second role",
  skills: "added to my skills",
  targets: "hit my targets",
};

function evidence(answers: Answers): string {
  const items = answers.changes.map((change) => CHANGE_WORDS[change]);
  if (items.length === 0) return "[one specific thing you now do that you didn't before]";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** `official` is false when the pay figures are an AI estimate, so the script must not claim official figures. */
export type PlanInput = { country: Place; job: Job; pay: number; answers: Answers; official?: boolean };

/** The first lines of the conversation. This much is free. */
export function openingLines({ country, job, pay, answers, official = true }: PlanInput): string[] {
  const goal = target(job, pay);
  const looked = official ? `I've looked at the official ${country.publisher} figures for my job` : "I've looked into what this job pays elsewhere";
  const lines = [`"Thanks for making time. I'd like to talk about my pay. I've been in the role ${TENURE_WORDS[answers.tenure]}, and ${looked}."`];
  if (goal.kind === "raise" && typeof job.p50 === "number") {
    lines.push(official ? `"The middle for this job is ${money(country, job.p50)}. I'm on ${money(country, pay)}."` : `"The going rate looks to be around ${money(country, job.p50)}. I'm on ${money(country, pay)}."`);
  }
  return lines;
}

export type PlanSection = { title: string; intro?: string; lines: string[] };

/** The full word-for-word plan. This is the paid part. */
export function fullPlan(input: PlanInput): PlanSection[] {
  const { country, job, pay, answers, official = true } = input;
  const goal = target(job, pay);
  const figures = official ? "the official figures for my job" : "what I can find on pay for my job";
  const m = (value: number) => money(country, value);
  const middle = typeof job.p50 === "number" ? m(job.p50) : "the going rate";
  const ask = goal.kind === "raise" ? m(goal.bigJump && goal.firstStep ? goal.firstStep : goal.opening) : "[your figure]";
  const settle = goal.kind === "raise" ? m(goal.bigJump && goal.firstStep ? goal.firstStep : goal.target) : "[your figure]";
  const proof = evidence(answers);

  const ifNo: Record<Answers["leave"], string[]> = {
    looking: [
      "You were already looking, and now you have your answer.",
      `Use the figure: the middle for your job is ${middle}. Don't accept a new role below it.`,
      "Put every offer through Salty's offer check before you say yes.",
      "Don't resign until the new contract is signed.",
    ],
    maybe: [
      "Ask what would change the answer, and get it in writing with a date three months out.",
      "Quietly see what's out there. One real conversation elsewhere tells you more than a year of wondering.",
      "If the three months pass with nothing, treat that as the answer.",
    ],
    no: [
      "Money isn't the only thing on the table. Ask for one of these instead:",
      "A new title that matches what you do. It costs them nothing and raises your next salary.",
      "A guaranteed pay review, with a date, in writing.",
      "Paid training, an extra day's leave, or a say over your hours.",
    ],
  };

  return [
    {
      title: "The message that gets you the meeting",
      intro: "Send this today. Short, calm, no numbers yet.",
      lines: [
        `"Hi [name], could we find 20 minutes this week to talk about my pay? I've put some thought into it and I'd like your view. Any time on [day] works for me."`,
        "Don't explain in the message. The meeting is where the case gets made.",
      ],
    },
    {
      title: "The conversation, word for word",
      intro: "Five moves. Say them in this order.",
      lines: [
        ...openingLines(input),
        `"Since my pay was last set, I've ${proof}."`,
        goal.kind === "raise"
          ? `"I'd like to move to ${ask}."`
          : `"I'm already at the top of the published range, so I'd like to talk about what the next step looks like here."`,
        "Then stop talking. The next person to speak should be them. Count to ten in your head if you have to.",
        `"What would you need from me to make that happen, and by when?"`,
        goal.kind === "raise" ? `Be ready to settle at ${settle}. Below that, ask for the rest on a set date.` : "",
      ].filter(Boolean),
    },
    {
      title: "When they push back",
      intro: "Five things managers say, and what to say next.",
      lines: [
        `"There's no budget." You say: "I understand. Can we agree the figure now and the date it starts? If it can't be this quarter, I'd like the date in writing."`,
        `"It's not the right time." You say: "When is? Let's put that date in the diary now, so I know what I'm working towards."`,
        official
          ? `"You're already paid fairly." You say: "The official figures put the middle at ${middle}. What am I missing?"`
          : `"You're already paid fairly." You say: "Everything I can find puts the going rate around ${middle}. What am I missing?"`,
        `"I can't make an exception." You say: "I'm not asking for an exception. I'm asking to be paid the going rate for the work I do. What would it take?"`,
        `"Leave it with me." You say: "Thank you. When should I expect to hear? I'll put a note in for two weeks today."`,
      ],
    },
    {
      title: "The follow-up email",
      intro: "Send it the same day. If it isn't written down, it didn't happen.",
      lines: [
        `"Thanks for talking today. To confirm: I asked to move from ${m(pay)} to ${ask}, based on ${figures} (middle: ${middle}) and on having ${proof}. You said [what they said]. We agreed to pick this up by [date]. Thanks again."`,
      ],
    },
    { title: "If the answer is no", lines: ifNo[answers.leave] },
    {
      title: "Your 30 days",
      lines: [
        "Day 1: write down three things you've done, each with a number in it.",
        "Day 2: send the message.",
        "Day 3 to 10: have the conversation. Mornings, early in the week, after a win.",
        "Same day: send the follow-up email.",
        "Day 14: if you've heard nothing, ask once, politely.",
        "Day 30: no answer is an answer. Go to \"If the answer is no\".",
      ],
    },
  ];
}
