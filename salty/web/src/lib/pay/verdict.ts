export type VerdictId = "extra-salty" | "salty" | "fair" | "seasoned" | "top-shelf";

export type Verdict = {
  id: VerdictId;
  /** Short label shown on the result and the share card. */
  label: string;
  /** One line said to the person, in Salty's voice. */
  line: string;
  /** Number of shakers shown, 0 to 3. More shakers means more reason to be salty. */
  shakers: number;
};

const VERDICTS: Record<VerdictId, Verdict> = {
  "extra-salty": {
    id: "extra-salty",
    label: "Extra salty",
    line: "Most people doing your job are paid more than you. You have every right to be salty.",
    shakers: 3,
  },
  salty: {
    id: "salty",
    label: "Salty",
    line: "You're paid less than the typical person in your job. Worth a conversation.",
    shakers: 2,
  },
  fair: {
    id: "fair",
    label: "Fair shake",
    line: "You're right around the middle for your job. Not robbed, not spoiled.",
    shakers: 1,
  },
  seasoned: {
    id: "seasoned",
    label: "Well seasoned",
    line: "You're paid more than most people in your job. Nicely done.",
    shakers: 0,
  },
  "top-shelf": {
    id: "top-shelf",
    label: "Top shelf",
    line: "You're near the top of the pay range for your job. Whatever you did, it worked.",
    shakers: 0,
  },
};

/** Verdict for a 0 to 100 position among people in the same job. */
export function verdictFor(position: number): Verdict {
  if (position < 20) return VERDICTS["extra-salty"];
  if (position < 40) return VERDICTS.salty;
  if (position < 60) return VERDICTS.fair;
  if (position < 80) return VERDICTS.seasoned;
  return VERDICTS["top-shelf"];
}
