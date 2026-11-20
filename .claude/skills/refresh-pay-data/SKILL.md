---
name: refresh-pay-data
description: Re-run a country's pay data pipeline when its statistics office publishes a new release, check the result and update the site. Use when asked to update, refresh or re-pull Salty's pay figures for a country.
---

# Refresh a country's pay data

Salty's figures come from official releases that update about once a year. Each country has a pipeline in `salty/data/pipelines/<country>/build.py` that writes `salty/data/out/<country>.json`. The site reads only those output files.

1. Read `salty/data/SOURCES.md` for the country: where the data comes from, how it is fetched and its known weaknesses.
2. Check the source's dataset page for a newer release than the `period` in the current output file. If there is none, stop and say so.
3. Run the pipeline: `python3 -I salty/data/pipelines/<country>/build.py`. The United States file cannot be downloaded automatically; ask the user to download it in a browser and put it in `pipelines/us/raw/`.
4. Compare old and new output before accepting it:
   - the number of jobs should be close to before; a big drop means the file layout changed;
   - spot-check three well-known jobs against the source spreadsheet by eye;
   - medians should move by a few percent, not double or halve.
5. In `salty/web`, run `npm run search-check` and read the matches for common job titles, then `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.
6. Update the country's entry in `salty/data/SOURCES.md` (release, date fetched, anything that changed) and the `measure` text in `salty/web/src/lib/countries.ts` if what the figures cover has changed.
7. Any figure quoted in `salty/docs/marketing.md` is tied to the old release. List the ones that changed so the videos can be corrected.

Never interpolate, estimate or hand-edit a published figure. If a value is suppressed in the source it stays empty.
