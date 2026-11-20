// Builds a single-page copy of the home page that can be hosted in a sub-folder, for sharing a
// private preview before the site is live. Output: ./preview (not committed).
//
//   npm run preview:build
//
// It differs from the real build in three ways: files load relative to the page, links to other
// pages are stopped with a notice, and folders or files whose names start with "_" are renamed,
// because some hosts reserve that prefix.
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "out");
const preview = join(root, "preview");

execSync("npm run build", {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_PREVIEW: "1", NEXT_PUBLIC_BASE_PATH: "." },
});

rmSync(preview, { recursive: true, force: true });
mkdirSync(join(preview, "data"), { recursive: true });
cpSync(join(out, "index.html"), join(preview, "index.html"));
cpSync(join(out, "_next"), join(preview, "_next"), { recursive: true });
// Ship data only for the countries the site shows.
for (const code of JSON.parse(readFileSync(join(root, "src", "lib", "live-countries.json"), "utf8"))) {
  const file = join(out, "data", `${code}.json`);
  if (JSON.parse(readFileSync(file, "utf8")).jobs.length > 0) cpSync(file, join(preview, "data", `${code}.json`));
}

// Rename every "_name" to "x-name", deepest first, remembering each rename.
const renames = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    if (name.startsWith("_")) {
      const next = `x-${name.slice(1)}`;
      renameSync(path, join(dir, next));
      renames.push([name, next]);
    }
  }
}
walk(preview);

// Point every reference at the new names.
function rewrite(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) rewrite(path);
    else if (/\.(html|js|css|json)$/.test(name) && !path.includes(`${join(preview, "data")}`)) {
      let text = readFileSync(path, "utf8");
      // Match the name only as a whole path part, so identifiers such as `__next_f` are left alone.
      for (const [from, to] of renames) {
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        text = text.replace(new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "g"), to);
      }
      writeFileSync(path, text);
    }
  }
}
rewrite(preview);

const count = execSync(`find "${preview}" -type f | wc -l`).toString().trim();
console.log(`preview: ${count} files in ${preview}; renamed ${renames.map(([from]) => from).join(", ")}`);
