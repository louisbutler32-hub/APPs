import { describe, expect, it } from "vitest";
import { COUNTRIES } from "./countries";
import type { Job } from "./pay/types";
import { fullPlan, openingLines, strength, target, timing, type Answers } from "./raise-plan";

const job: Job = { code: "1", title: "Tester", slug: "tester", employees: 1000, aliases: [], p10: 20000, p25: 25000, p50: 32040, p75: 41000, p90: 52000, mean: 34000 };

const answers: Answers = { tenure: "2to5", lastRaise: "over2", changes: ["responsibility", "training"], asked: "no", timing: "no-review", leave: "maybe" };

describe("target", () => {
  it("aims for the middle when pay is below it", () => {
    const goal = target(job, 30000);
    expect(goal).toMatchObject({ kind: "raise", target: 32000, opening: 34000, bigJump: false, firstStep: null });
  });

  it("aims for the next published point when pay is at or above the middle", () => {
    expect(target(job, 33000)).toMatchObject({ kind: "raise", target: 41000 });
    expect(target(job, 41000)).toMatchObject({ kind: "raise", target: 52000 });
  });

  it("skips a point that is barely above current pay", () => {
    // 41,000 is under 3% above 40,500, so it is not worth a conversation: go to the next point.
    expect(target(job, 40500)).toMatchObject({ kind: "raise", target: 52000 });
  });

  it("flags a big jump and offers a first step of about a tenth", () => {
    const goal = target(job, 24000);
    expect(goal).toMatchObject({ kind: "raise", target: 32000, bigJump: true, firstStep: 26400 });
  });

  it("has no figure above the top of the published range, or without a middle", () => {
    expect(target(job, 60000)).toEqual({ kind: "top" });
    expect(target({ ...job, p50: null }, 30000)).toEqual({ kind: "none" });
    expect(target(job, 0)).toEqual({ kind: "none" });
  });

  it("works when only a middle figure is published", () => {
    const thin: Job = { code: "2", title: "Thin", slug: "thin", employees: null, aliases: [], p50: 30000, mean: null };
    expect(target(thin, 25000)).toMatchObject({ kind: "raise", target: 30000 });
    expect(target(thin, 31000)).toEqual({ kind: "top" });
  });
});

describe("strength", () => {
  it("is strong with a long wait, growth in the job and pay below the middle", () => {
    const result = strength(answers, true);
    expect(result.level).toBe("Strong");
    expect(result.forYou.length).toBeGreaterThanOrEqual(4);
  });

  it("needs building for someone new with nothing changed", () => {
    const result = strength({ ...answers, tenure: "under6", lastRaise: "never", changes: [] }, false);
    expect(result.level).toBe("Needs building");
    expect(result.fixFirst.length).toBeGreaterThanOrEqual(2);
  });

  it("does not count a pay rise that never came for someone who has only just started", () => {
    const fresh = strength({ ...answers, tenure: "6to12", lastRaise: "never", changes: [] }, false);
    expect(fresh.forYou).toEqual([]);
  });
});

describe("plan text", () => {
  const input = { country: COUNTRIES.uk, job, pay: 30000, answers };

  it("quotes the published middle and the person's own pay in the opening", () => {
    const lines = openingLines(input).join(" ");
    expect(lines).toContain("£32,040");
    expect(lines).toContain("£30,000");
    expect(lines).toContain("Office for National Statistics");
  });

  it("asks for the opening figure and names a figure to settle at", () => {
    const text = fullPlan(input).flatMap((section) => section.lines).join("\n");
    expect(text).toContain("I'd like to move to £34,000");
    expect(text).toContain("settle at £32,000");
    expect(text).toContain("taken on more responsibility and started training");
  });

  it("asks for the first step, not the whole gap, when the jump is big", () => {
    const text = fullPlan({ ...input, pay: 24000 }).flatMap((section) => section.lines).join("\n");
    expect(text).toContain("I'd like to move to £26,400");
  });

  it("leaves a blank to fill when nothing has changed", () => {
    const text = fullPlan({ ...input, answers: { ...answers, changes: [] } }).flatMap((section) => section.lines).join("\n");
    expect(text).toContain("[one specific thing you now do");
  });

  it("gives timing advice for each situation", () => {
    expect(timing({ ...answers, timing: "review-soon" })).toContain("before your review");
    expect(timing({ ...answers, timing: "just-had" })).toContain("within the month");
    expect(timing(answers)).toContain("this week");
  });
});
