/**
 * Everything brand-level lives here so a rename or a new social handle is a one-file change.
 * Values that depend on accounts the founder has not created yet come from environment
 * variables (see .env.example) and the matching part of the site hides itself until they are set.
 */

export const brand = {
  name: "Salty",
  /** Shown under the logo and in page titles. */
  tagline: "Find out if you should be.",
  description:
    "Type your job and your pay. Salty shows where you rank against everyone doing the same work, using official government pay data. Free, and your number never leaves your phone.",
  /** Public address of the site, used for share links, the sitemap and social previews. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  founder: {
    name: process.env.NEXT_PUBLIC_FOUNDER_NAME ?? "",
    links: [
      { label: "TikTok", href: process.env.NEXT_PUBLIC_FOUNDER_TIKTOK ?? "" },
      { label: "Instagram", href: process.env.NEXT_PUBLIC_FOUNDER_INSTAGRAM ?? "" },
      { label: "YouTube", href: process.env.NEXT_PUBLIC_FOUNDER_YOUTUBE ?? "" },
      { label: "X", href: process.env.NEXT_PUBLIC_FOUNDER_X ?? "" },
    ].filter((link) => link.href),
  },
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;
