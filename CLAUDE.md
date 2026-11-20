# Working in this repo

This repo holds apps built on free public data. Each app lives in its own top-level folder. Today there is one: `salty/`.

## Salty

A pay checker: type a job and a salary, see where you rank among everyone doing that job, from official statistics. Around it sit a raise plan (free summary, paid full plan), an offer check, an employer view and an email list. Jobs and countries without official figures get an AI estimate, always labelled as one. It is still a validation test.

- `salty/web` is the site. Next.js, exported as plain static files. This version of Next.js is newer than most training data: read `salty/web/AGENTS.md` and the guides in `node_modules/next/dist/docs/` before changing framework-level code.
- `salty/data` is the pay data. `pipelines/<country>/build.py` writes `out/<country>.json`; the site reads only `out/`. `SOURCES.md` records every source, its licence and its weaknesses.
- `salty/web/server` and `salty/web/functions` are the one piece of server code: the AI estimate, which asks Claude to search the web for a job's pay. It needs an Anthropic API key held as a host secret. Shared types and the answer checker are in `web/src/lib/estimate-shared.ts`.
- `salty/emails` holds the follow-up email sequence and how to load it into an email tool.
- `salty/docs` holds the brand guide, the marketing playbook, the money plan and the launch checklist.

### Commands (run in `salty/web`)

```
npm run dev            # local site on http://localhost:3000
npm run lint
npm run typecheck
npm test
npm run build          # writes the static site to ./out
npm run search-check   # prints search matches for common job titles
```

`python3 -I salty/data/pipelines/<country>/build.py` rebuilds one country's data.

### Rules that matter here

1. **Published numbers only.** Never interpolate, estimate or hand-edit a figure in `salty/data/out`. A suppressed value stays empty. Where the site estimates something (a rank from a median and an average), it is computed in `web/src/lib/pay/percentile.ts` and labelled "Estimate" on screen.
2. **Pay stays on the device.** The salary a visitor types, and their raise-plan answers, are never sent anywhere: not with a sign-up, not to analytics, not into a share link or image, and not to the AI estimate (which receives a job title and a country only). Keep it that way. All sign-ups go through `web/src/lib/signup.ts`.
8. **Estimates never pose as official figures.** An AI estimate is shown as a rough range with no percentage rank, carries the "AI estimate" label and its sources, and is checked by `parseEstimate` before it reaches the screen. Never write an estimate into `salty/data/out`.
7. **Value before the ask.** Free tools give a real answer first; payment and email asks come after it, and every prompt can be closed.
3. **Say what the data cannot do.** If a source has a weakness a user would care about (for example, it mixes part-time workers in), it goes next to the result as a `caveat` in `web/src/lib/countries.ts`, not in small print.
4. **Respect the sources.** Do not disguise automated downloads as a browser, and do not work around a site that refuses them. The United States pipeline reads a hand-downloaded file for this reason.
5. **Brand.** Copy and visuals follow `salty/docs/brand.md`: plain words ("the middle", not "median"), the five verdict names, the fixed colour palette.
6. **Test a new or refreshed country like a user would**: enter an ordinary full-time wage for three common jobs. An ordinary wage scoring "Top shelf" means the comparison group is wrong.

### Git

Work on a branch and open a pull request; do not push to `main` directly. Checks in `.github/workflows/ci.yml` must pass. Generated files (`web/src/data/pay`, `web/public/data`, `web/out`) and raw downloads (`data/pipelines/*/raw`) are not committed.

Repo skills in `.claude/skills`: `refresh-pay-data` and `add-country`.
