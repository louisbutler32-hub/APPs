# Salty

**Find out if you should be.** Type your job and your pay, and see where you rank against everyone doing the same work, using official government pay figures.

This is the validation test for the idea: a free pay check on the web, a shareable result, and a waitlist for the paid app. If enough people sign up, the app gets built.

## What is here

| Folder | What it holds |
|---|---|
| [`web/`](web/) | The site: pay checker, a page per job, waitlist |
| [`data/`](data/) | Pay data pipelines, one per country, and their outputs. See [`data/SOURCES.md`](data/SOURCES.md) |
| [`docs/brand.md`](docs/brand.md) | Name, voice, colours, type, logo |
| [`docs/marketing.md`](docs/marketing.md) | The zero-cost launch plan and the two-week test |
| [`docs/money.md`](docs/money.md) | Ways to earn, and how they feed the founder's personal brand |
| [`docs/launch-checklist.md`](docs/launch-checklist.md) | What still needs doing before this goes live |

## Run it

```
cd salty/web
npm install
npm run dev
```

Then open http://localhost:3000. Copy `web/.env.example` to `web/.env.local` to set the waitlist address and other options.

## Put it live

The site is plain static files, so any free static host works. Point the host at this repo with:

- **Folder:** `salty/web`
- **Build command:** `npm run build`
- **Output folder:** `out`
- **Settings:** the names in `web/.env.example`

Full steps are in the launch checklist.

## How the ranking works

Statistics offices publish pay at set points for each job: the level a tenth of people fall below, a quarter, the middle, and so on. Salty places your pay between the two nearest published points. Outside the published range it does not guess: it says "bottom 10%" or "top 10%". Where a source publishes only the middle and the average, the rank is modelled from those two figures and labelled "Estimate". The maths and its tests are in `web/src/lib/pay/`.
