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
- "Official figures. Not vibes."
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

**Feel:** bold, flat and confident. Thick ink outlines, hard offset shadows, huge type, one loud colour. It should look like a brand with an opinion, and it must survive being screenshotted and reposted at low quality.

### Colour

| Name | Hex | Use |
|---|---|---|
| Salt | `#F4F1EA` | Page background. Warm white, never pure white |
| Ink | `#0F0F12` | Text, outlines, shadows, dark bands |
| Brine | `#2B36FF` | The brand colour: buttons, highlights, the grain in the logo |
| Chilli | `#FF4D2E` | "Extra salty" and the underline on the headline. Bad news only |
| Amber | `#FFAD1F` | "Salty" |
| Zest | `#D9F24B` | "Top shelf", success states, the waitlist button |

Rules: one loud colour per screen is plenty. Text on Brine is white; text on Chilli, Amber and Zest is Ink. Never put Brine text on Chilli or the reverse.

### Type

- **Headlines and numbers:** Bricolage Grotesque, extra bold, slightly condensed. Numbers are the hero of the product and get the biggest type on any screen.
- **Body:** Geist.
- **Labels and data:** Geist Mono, small, uppercase, widely spaced.

All three are open-licensed fonts stored in `salty/web/src/app/fonts`, so they are free to use in video and print as well.

### Logo

Lowercase **salty** in the headline face, followed by a single small tilted square in Brine: a grain of salt doing the job of a full stop. On dark backgrounds the word is Salt-coloured and the grain stays Brine. The app icon is a white "s" on Brine with a Zest grain.

Keep clear space around it equal to the height of the letter "s". Do not stretch it, outline it, add a shaker to it or change the grain's colour.

### Motif

Scattered grains: small tilted squares, as if salt has been sprinkled over the page. Use them sparingly at the edges, never over text. In video, grains falling in is the standard transition into a number reveal.

### In video

- Background Salt or Brine, never a gradient.
- The number fills at least a third of the frame.
- Captions in the headline face, Ink on Salt or white on Brine, with the hard shadow.
- End card: the wordmark, "Are you underpaid?" and the web address.

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
