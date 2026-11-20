// Prints the top matches for common job titles so search quality can be eyeballed after a data refresh.
// Run: npm run search-check
import { readFileSync } from "node:fs";
import { searchJobs } from "../src/lib/pay/search.ts";

const QUERIES = ["teacher", "nurse", "software engineer", "chef", "driver", "accountant", "electrician", "barista", "doctor", "lawyer", "plumber", "cleaner", "marketing", "sales assistant", "waiter", "receptionist", "project manager", "data analyst"];

for (const country of ["uk", "us", "au", "nz"]) {
  const { jobs } = JSON.parse(readFileSync(new URL(`../public/data/${country}.json`, import.meta.url), "utf8"));
  if (jobs.length === 0) continue;
  for (const query of QUERIES) {
    const found = searchJobs(jobs, query, 3).map((match) => `${match.job.title}${match.via ? ` [${match.via}]` : ""}`);
    console.log(`${country} ${query.padEnd(18)} -> ${found.join("  |  ") || "NO MATCH"}`);
  }
}
