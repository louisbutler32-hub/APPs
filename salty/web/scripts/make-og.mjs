// Remakes public/og.png, the picture shown when a link to the site is shared.
// It is a photograph of the real first screen, so it can never show a figure the site does not.
//
//   npm run dev                      (in another terminal)
//   node scripts/make-og.mjs         (needs Playwright, which is not one of the site's own packages)
import { createRequire } from "node:module";

// Loaded this way so a Playwright installed for the whole machine is found as well as a local one.
const { chromium } = createRequire(import.meta.url)("playwright");

const base = process.env.BASE ?? "http://localhost:3000";
const browser = await chromium.launch();
// 1500 by 788 scaled by 0.8 gives the 1200 by 630 that social sites expect.
const context = await browser.newContext({ viewport: { width: 1500, height: 788 }, deviceScaleFactor: 0.8 });
const page = await context.newPage();
// The opening email prompt is not part of the picture.
await page.addInitScript(() => {
  try {
    localStorage.setItem("salty.gate", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    localStorage.setItem("salty.country", "uk");
  } catch {}
});
await page.goto(base, { waitUntil: "networkidle" });
// Hide the development badge, and let the blue screen fill the whole picture.
await page.addStyleTag({ content: "nextjs-portal{display:none!important} main>section:first-of-type{min-height:100vh}" });
await page.waitForTimeout(2000);
await page.screenshot({ path: new URL("../public/og.png", import.meta.url).pathname });
await browser.close();
console.log("make-og: wrote public/og.png");
