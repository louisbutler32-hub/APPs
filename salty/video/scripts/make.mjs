// Makes the clips listed in content/videos.json, filling each one from the pay data.
//
//   npm run make                     every clip, both countries
//   npm run make -- --country uk     one country
//   npm run make -- --only train     only clips whose file name contains "train"
//   npm run make -- --list           show what would be made, render nothing
//
// For each clip it writes out/<name>.mp4 and out/<name>.txt (a caption to post with it).
// The clips are silent: add sound in the app you post from.
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "..", "data", "out");
const outDir = join(root, "out");

const args = process.argv.slice(2);
const option = (name) => (args.includes(`--${name}`) ? (args[args.indexOf(`--${name}`) + 1] ?? "") : null);
const onlyCountry = option("country");
const only = option("only");
const listOnly = args.includes("--list");

const content = JSON.parse(readFileSync(join(root, "content", "videos.json"), "utf8"));
const site = process.env.SALTY_SITE || content.site;

const COUNTRIES = {
  uk: { locale: "en-GB", currency: "GBP", tags: "#uk #salary #payrise #career" },
  us: { locale: "en-US", currency: "USD", tags: "#usa #salary #payraise #career" },
};

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function fail(message) {
  console.error(`make: ${message}`);
  process.exit(1);
}

/** Read one country's pay data, and the line that credits it on the closing card. */
function load(country) {
  const path = join(dataDir, `${country}.json`);
  if (!existsSync(path)) fail(`no pay data for "${country}" at ${path}`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  const jobs = new Map(data.jobs.map((job) => [job.title, job]));
  const publisher = { uk: "Office for National Statistics", us: "U.S. Bureau of Labor Statistics" }[country];
  // Who the figures cover, in the fewest honest words (see salty/data/SOURCES.md).
  const basis = { uk: "Full-time, per year, before tax.", us: "Employees, per year, before tax." }[country];
  // The period is shown as published, so provisional figures say they are provisional.
  return { jobs, source: `Official figures: ${publisher}, ${data.period}. ${basis}` };
}

function job(jobs, title, country) {
  const found = jobs.get(title);
  if (!found) fail(`"${title}" is not a job title in the ${country} data. Titles must match salty/data/out/${country}.json exactly.`);
  return found;
}

/** One published figure for a job. Stops the run if it is missing, or is the source's ceiling rather than a real figure. */
function figure(found, field, what) {
  const value = found[field];
  if (typeof value !== "number") fail(`"${found.title}" has no published figure for ${what}, so it cannot be used for this clip`);
  if (found.topcoded?.includes(field)) fail(`for "${found.title}" the source only says ${what} is above its ceiling, not what it is, so it cannot be used for this clip`);
  return value;
}

/** Work out every clip to make: which template, what goes in it, and the caption to post with it. */
function plan() {
  const clips = [];
  for (const [country, settings] of Object.entries(COUNTRIES)) {
    if (onlyCountry && onlyCountry !== country) continue;
    const list = content[country];
    if (!list) continue;
    const { jobs, source } = load(country);
    const money = (value) => new Intl.NumberFormat(settings.locale, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 }).format(value);
    const shared = { locale: settings.locale, currency: settings.currency, source, site };

    for (const pair of list.whichPaysMore ?? []) {
      const a = job(jobs, pair.a.title, country);
      const b = job(jobs, pair.b.title, country);
      const payA = figure(a, "p50", "the middle");
      const payB = figure(b, "p50", "the middle");
      clips.push({
        name: `${country}-which-${slug(pair.a.name)}-vs-${slug(pair.b.name)}`,
        composition: "WhichPaysMore",
        props: { a: { name: pair.a.name, pay: payA }, b: { name: pair.b.name, pay: payB }, ...shared },
        caption: [
          `Which pays more: ${pair.a.name.toLowerCase()} or ${pair.b.name.toLowerCase()}?`,
          "",
          // The caption does not give the answer away: people watch to the reveal for it.
          `Guess before the reveal. The pay in the middle for each job, per year, before tax.`,
          `Comment your job and I'll tell you what it really pays.`,
          "",
          `Check yours in ten seconds: ${site}`,
          source,
          "",
          `${settings.tags} #${slug(pair.a.name).replace(/-/g, "")} #${slug(pair.b.name).replace(/-/g, "")}`,
        ].join("\n"),
      });
    }

    for (const item of list.gapInsideJob ?? []) {
      const found = job(jobs, item.title, country);
      // This clip is about the lowest and highest paid tenth, so both figures must be published.
      const low = figure(found, "p10", "the lowest paid tenth");
      const high = figure(found, "p90", "the highest paid tenth");
      clips.push({
        name: `${country}-gap-${slug(item.plural)}`,
        composition: "GapInsideJob",
        props: { jobPlural: item.plural, low, high, ...shared },
        caption: [
          `Two ${item.plural}. Same job title. ${money(high - low)} apart.`,
          "",
          `One in ten earns under ${money(low)}. One in ten earns over ${money(high)}. Per year, before tax.`,
          "Which one are you?",
          "",
          `Find out in ten seconds: ${site}`,
          source,
          "",
          `${settings.tags} #${slug(item.plural).replace(/-/g, "")}`,
        ].join("\n"),
      });
    }
  }
  return only ? clips.filter((clip) => clip.name.includes(only)) : clips;
}

const clips = plan();
if (clips.length === 0) fail("nothing to make: check --country and --only");

if (listOnly) {
  for (const clip of clips) console.log(`${clip.name}  ${JSON.stringify(clip.props.a ? [clip.props.a, clip.props.b] : { low: clip.props.low, high: clip.props.high })}`);
  console.log(`\n${clips.length} clip${clips.length === 1 ? "" : "s"}. Site on the closing card: ${site}`);
  process.exit(0);
}

if (site === "your-site.com") console.warn('make: the closing card will say "your-site.com". Set "site" in content/videos.json (or SALTY_SITE) to your real address.\n');

mkdirSync(outDir, { recursive: true });
// Use the browser already on this machine when there is one; otherwise Remotion fetches its own.
const installed = "/opt/pw-browsers/chromium_headless_shell";
const browserExecutable = process.env.REMOTION_BROWSER || (existsSync(installed) ? installed : undefined);

console.log(`make: preparing ${clips.length} clip${clips.length === 1 ? "" : "s"}...`);
const serveUrl = await bundle({ entryPoint: join(root, "src", "index.ts"), publicDir: join(root, "public") });

for (const [index, clip] of clips.entries()) {
  const composition = await selectComposition({ serveUrl, id: clip.composition, inputProps: clip.props, browserExecutable });
  const file = join(outDir, `${clip.name}.mp4`);
  await renderMedia({ serveUrl, composition, inputProps: clip.props, codec: "h264", outputLocation: file, browserExecutable, muted: true, logLevel: "error" });
  writeFileSync(join(outDir, `${clip.name}.txt`), `${clip.caption}\n`);
  console.log(`  ${index + 1}/${clips.length}  out/${clip.name}.mp4`);
}
console.log(`make: done. Each clip has a caption beside it in out/.`);
