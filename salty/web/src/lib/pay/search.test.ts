import { describe, expect, it } from "vitest";
import { searchJobs, slugify } from "./search";
import type { Job } from "./types";

const job = (code: string, title: string, aliases: string[], employees = 100000): Job => ({
  code,
  title,
  slug: slugify(title),
  employees,
  mean: null,
  p50: 30000,
  aliases,
});

const jobs: Job[] = [
  job("1", "Teaching assistants", ["teacher's aid", "classroom assistant"], 300000),
  job("2", "Secondary education teaching professionals", ["secondary teacher", "school teacher"], 400000),
  job("3", "Education advisers and school inspectors", ["teacher training adviser"], 40000),
  job("4", "Programmers and software development professionals", ["software engineer", "software developer", "programmer"], 500000),
  job("5", "Chefs", ["sous chef", "head chef"], 200000),
  job("6", "Bar staff", ["barista", "bartender"], 150000),
];

const top = (query: string) => searchJobs(jobs, query)[0]?.job.code;

describe("searchJobs", () => {
  it("ranks the job whose title ends with the query above ones that merely start with it", () => {
    expect(top("teacher")).toBe("2");
  });

  it("finds a job by an everyday title and reports which one matched", () => {
    const [first] = searchJobs(jobs, "software engineer");
    expect(first.job.code).toBe("4");
    expect(first.via).toBe("software engineer");
  });

  it("matches while the last word is still being typed", () => {
    expect(top("software eng")).toBe("4");
    expect(top("baris")).toBe("6");
  });

  it("matches the official title directly", () => {
    const [first] = searchJobs(jobs, "chefs");
    expect(first.job.code).toBe("5");
    expect(first.via).toBeNull();
  });

  it("returns nothing for very short or unmatched queries", () => {
    expect(searchJobs(jobs, "t")).toEqual([]);
    expect(searchJobs(jobs, "astronaut")).toEqual([]);
  });
});

describe("slugify", () => {
  it("makes URL-safe slugs", () => {
    expect(slugify("Children's nurses & carers (NHS)")).toBe("childrens-nurses-and-carers-nhs");
  });
});
