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
  /** The lighter sheet that panels sit on. Never pure white. */
  paper: "#fbf9f4",
  saltDeep: "#e8e3d6",
} as const;

// One typeface for everything, as on the site.
export const FONT = { display: "Bricolage", body: "Bricolage" } as const;

// The same font file as the site, so a clip and the page it sends people to look like one brand.
// loadFont holds each frame back until the font is ready, so nothing here needs to be awaited.
void loadFont({ family: FONT.display, url: staticFile("fonts/bricolage.woff2"), weight: "200 800", stretch: "75% 100%" });

/** Corners are cut small and square, like a grain of salt. */
export const RADIUS = { ctl: 12, box: 24 } as const;

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
