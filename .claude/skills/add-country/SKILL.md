---
name: add-country
description: Add a new country to Salty, from finding an official pay-by-occupation source to showing it on the site. Use when asked to launch Salty in another country or add another country's pay data.
---

# Add a country to Salty

1. **Find the source.** It must be an official statistics body, free to reuse commercially, and broken down by detailed occupation. Prefer, in order: full-time pay over all-workers pay; published percentiles over a median and mean; a median over a mean alone. Record the licence wording and where you found it.
2. **Check access.** The cloud environment only reaches hosts on its allowlist. If the source's host is not on it, ask the user to approve adding it. If the site refuses automated downloads or its terms forbid them, do not work around that: write the pipeline to read a file the user downloads by hand, as the United States pipeline does.
3. **Write the pipeline** at `salty/data/pipelines/<code>/build.py`, following the existing ones: download to `raw/` (never committed), write `salty/data/out/<code>.json` in the shared shape (see `salty/web/src/lib/pay/types.ts`), yearly pay in whole local currency, empty for anything suppressed, nothing estimated.
4. **Test what it claims.** Enter a realistic full-time wage for three common jobs and read the verdicts. If an ordinary wage comes out as "Top shelf" or "Extra salty", the comparison group is wrong for the claim (this is how the first Australian source was caught) and the country is not ready.
5. **Wire up the site.** Add the code to `CountryCode` in `types.ts`, to `COUNTRIES` in `countries.ts` (currency, locale, hours, the plain-language `measure`, and a `caveat` if there is a weakness people must see), to `data.ts`, and to the lists in `scripts/sync-data.mjs` and `scripts/search-check.mts`.
6. **Document it** in `salty/data/SOURCES.md`, then run the full checks in `salty/web`.
