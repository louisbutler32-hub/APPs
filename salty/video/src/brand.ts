import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Salty's colours, the same values as the site (salty/docs/brand.md). */
export const COLOR = {
  salt: "#f4f1ea",
  ink: "#0f0f12",
  inkSoft: "#4b4a52",
  brine: "#2b36ff",
  chilli: "#ff4d2e",
  amber: "#ffad1f",
  zest: "#d9f24b",
  white: "#ffffff",
} as const;

export const FONT = { display: "Bricolage", body: "Geist", mono: "GeistMono" } as const;

// The same font files as the site, so a clip and the page it sends people to look like one brand.
// loadFont holds each frame back until its font is ready, so nothing here needs to be awaited.
void Promise.all([
  loadFont({ family: FONT.display, url: staticFile("fonts/bricolage.woff2"), weight: "200 800", stretch: "75% 100%" }),
  loadFont({ family: FONT.body, url: staticFile("fonts/geist.woff2"), weight: "100 900" }),
  loadFont({ family: FONT.mono, url: staticFile("fonts/geist-mono.woff2"), weight: "100 900" }),
]);

/** Headline type: heavy and slightly condensed, as on the site. */
export const display = { fontFamily: FONT.display, fontWeight: 800, fontStretch: "88%", letterSpacing: "-0.015em", lineHeight: 0.95 } as const;

export function money(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.round(amount));
}

/**
 * Short-video apps draw their own buttons and captions over the frame: a column down the right
 * edge and a block along the bottom. Anything that must be read stays inside this area.
 */
export const SAFE = { left: 80, right: 150, top: 150, bottom: 420 } as const;
