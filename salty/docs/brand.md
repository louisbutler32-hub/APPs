# Salty brand guide

The working rules for how Salty looks, sounds and behaves. The site in `salty/web` already follows them; this is the reference for videos, posts, the app and anything else that carries the name.

## What Salty is

**One line:** Salty tells you in ten seconds whether you are underpaid, using official numbers.

**Who it is for:** people aged roughly 18 to 30 in their first few jobs, who suspect they are paid less than they should be and have no way to check. A second audience is 15 to 18 year olds choosing what to do next, who want to know what jobs actually pay.

**The enemy:** pay secrecy. Not employers, not bosses, not "the system". The thing we are against is not knowing.

**The belief:** you cannot ask for more if you do not know the number.

**Why the name:** "salary" comes from the Latin for salt money, and "salty" is what you are when you find out you are underpaid. The tagline finishes the thought: *Find out if you should be.*

Name status: a web search found no existing app or company called Salty in this space. That is not a trademark search, and social handles and a domain have not been checked or registered. Both are on the launch checklist.

## Voice

Salty sounds like a friend who happens to have the data: on your side, a bit cheeky, never smug.

| Do | Don't |
|---|---|
| Lead with the number | Lead with a feeling or a slogan |
| Plain words: "the middle", "paid more than" | Jargon: "median", "percentile", "compensation" |
| Be on the reader's side | Mock or shame low earners |
| Say what the data cannot tell you | Promise a pay rise |
| One joke, lightly | Hustle talk, "bag", "grindset", finance-bro tone |

Examples in voice:

- "83% of people in your job are paid more than you."
- "You're right around the middle. Not robbed, not spoiled."
- "Official figures, from the people who count them."
- "Your pay never leaves your phone."

The honesty rule matters most. Where official figures exist, every number comes from a government statistics office. Where they do not (a job the figures miss, or a country outside the UK and US), Salty gives an AI estimate, shows it as a rough range with no percentage rank, and labels it "AI estimate" with its sources. The two are never blended. The brand's whole value is that people can trust the number and know which kind it is.

## The verdict ladder

Every result gets one of five verdicts. The names are the brand's vocabulary and the reason people share.

| Where you sit in your job | Verdict | Shakers |
|---|---|---|
| Bottom fifth | Extra salty | 3 |
| 20 to 40 | Salty | 2 |
| 40 to 60 | Fair shake | 1 |
| 60 to 80 | Well seasoned | 0 |
| Top fifth | Top shelf | 0 |

More shakers means more reason to be salty. Use the names consistently; do not invent new tiers in videos.

## Look

**Feel:** bold, flat and plain-spoken. Big blocks of solid colour, huge type, one typeface, nothing decorative. It should look like a brand with an opinion, and it must survive being screenshotted and reposted at low quality.

The first screen of the site is solid Brine with the headline in white and the pay check on a sheet of Salt. That is deliberate: it is the same blue screen that ends every Salty video, so the page a viewer lands on is the one they were just shown.

### Colour

| Name | Hex | Use |
|---|---|---|
| Salt | `#F4F1EA` | Page background. Warm white, never pure white |
| Paper | `#FBF9F4` | The lighter sheet that fields and result panels sit on. Used instead of pure white |
| Ink | `#0F0F12` | Text, outlines on fields, dark bands |
| Brine | `#2B36FF` | The brand colour: the opening screen, buttons, the grain in the logo |
| Chilli | `#FF4D2E` | "Extra salty". Bad news only |
| Amber | `#FFAD1F` | "Salty" |
| Zest | `#D9F24B` | Good news and the next step: "Top shelf", success, the raise-plan invitation, sign-up buttons on dark bands |

Rules: one loud colour per screen is plenty. Text on Brine is white; text on Chilli, Amber and Zest is Ink. Never put Brine text on Chilli or the reverse. Colour is always flat: no gradients, no glows, no tints fading into each other.

### Type

One typeface for everything: **Bricolage Grotesque**. It is a variable font that redraws itself between small text and huge headlines, so one file does both jobs.

- **Headlines and numbers:** extra bold, slightly condensed. Numbers are the hero of the product and get the biggest type on any screen.
- **Body:** regular weight, about 17px, lines of 60 to 70 characters.
- **Labels:** the same face, semi-bold, in ordinary sentence case. No small capitals, no typewriter font, and no small label sitting above a headline: the headline says it.

The font is open-licensed and stored in `salty/web/src/app/fonts` and `salty/video/public/fonts`, so it is free to use in video and print as well.

### Shape

- **Corners** are cut small and square, like a grain of salt: 6px on anything you press or type in, 12px on the panels that hold them. Nothing is pill-shaped.
- **No shadows**, except a soft one under things that really float above the page (the job list under the search box, and pop-ups).
- **An ink outline means "you can type here".** Fields have one. Panels do not: they are set apart by a change of ground colour or a thin rule.
- **Lists are ruled lines, not boxes.** Jobs, tools and sources are rows with a line between them. Do not lay content out as a row of matching cards.
- **Icons** are drawn as a set (see `web/src/components/icons.tsx`). No emoji and no text characters standing in for icons.

### Logo

Lowercase **salty** in the headline face, followed by a single small tilted square in Brine: a grain of salt doing the job of a full stop. On dark backgrounds the word is Salt-coloured and the grain stays Brine. On a Brine background (the top of the site, the end card of a video, the app icon) the word is white and the grain is Zest, because a Brine grain would vanish.

Keep clear space around it equal to the height of the letter "s". Do not stretch it, outline it, add a shaker to it or use any other grain colour.

### Motif

Scattered grains: small tilted squares, as if salt has been sprinkled over the page. Use them sparingly at the edges, never over text. They sit still, except in one place: a few grains fall in when a result arrives.

### Motion

Movement is rare, so it means something.

- **One set piece:** a result arriving. The figure counts up, the marker glides to its place on the bar as the bar fills, and the grains drop in.
- **One entrance:** the headline's letters arrive once when a page with the pay check loads.
- **Everything else is feedback:** a button gives slightly under the finger, a colour changes under the pointer. No cards that lift, nothing that fades in as you scroll, no looping or scrolling strips.
- Scrolling is smoothed with a mouse wheel and left alone on touch screens.
- Anyone who has asked their device for less motion gets none of the above: everything is simply there.

The libraries behind this are GSAP (the result and the headline), React Bits' SplitText (the headline) and Lenis (scrolling). Reach for them for these jobs, not to add more movement.

### In video

- Background Salt or Brine, never a gradient.
- The number fills at least a third of the frame.
- Captions in the headline face, Ink on Salt or white on Brine. Flat blocks, no shadows.
- End card: the wordmark, "Are you underpaid?" and the web address.

### Things that make a site look machine-made

Salty avoids all of these, and anything added later should too: gradients, glass and blur, glows and soft blobs of colour, dot-grid backgrounds, emoji, sparkle icons, arrows on every link, a row of three matching cards, a grid of mismatched boxes, a stripe of colour down one side of a box, tick-mark bullet lists, big rounded corners, movement on everything you point at, made-up reviews, placeholder pictures of the product, and copy built on "it's not this, it's that". `.claude/skills/design-check` has the full list and how to test for it.

## Prompts and pop-ups

Salty asks for things, and it must never nag. The rules are built into the site (`web/src/lib/funnel.ts`) and apply to anything added later:

- **Value first.** Nothing is offered until a result has been on screen for a few seconds.
- **One interruption per visit.** The email prompt on opening counts. If it appeared, the leave-intent prompt shows as a small corner card that blocks nothing.
- **Only one thing on screen.** The next-step bar hides while a prompt is open.
- **Never mid-task.** Nothing appears while someone is answering the raise-plan questions.
- **No means no.** A closed prompt stays away for a week, the email prompt for a month, and the bar for the rest of the visit.
- **The offer fits what they did.** Checked pay: the free raise plan. Finished the free plan: the full plan. Anything else: the weekly email.

## Share image

The share image is the brand's main advert, so its layout is fixed: wordmark top left, "MY PAY CHECK" and the country, the giant figure, one sentence in the first person, the job, the verdict chip, and a dark footer with "Are you underpaid?" and the address. It shows rank and never pay, which is what makes people comfortable posting it.
