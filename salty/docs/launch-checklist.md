# Launch checklist

What stands between the repo and a live test. Items marked **You** need an account or a decision only the founder can make.

## Before anything is public

- [ ] **You: check the name.** Search the trademark register in each launch country for "Salty" in software and financial services, and see which handles and domain are free. Only a web search has been done so far.
- [ ] **You: pick a domain** and buy it (the only cost in this test).
- [ ] **You: create the accounts**: Salty and a founder account on TikTok, Instagram and YouTube.

## Put the site live

- [ ] **You: connect a free static host** to this repo. Folder `salty/web`, build command `npm run build`, output folder `out`. Check the host's file limit first: with the UK alone the site is about 370 pages and 1,900 files, and each added country multiplies that (Australia's 1,100 jobs took it past 12,000 files in testing).
- [ ] **You: create the email list.** Use an email newsletter tool with a free tier rather than a plain form tool, because this list is the weekly "Sunday pay drop" and every other sign-up on the site feeds it. Put the form's POST address in `NEXT_PUBLIC_WAITLIST_URL`. Each sign-up arrives tagged with an `interest` (newsletter, raise-plan, offer, employer, country-au and so on) so the list can be split. Then sign up once yourself on the live site and confirm the entry arrives: the sign-up code has only been tested against a local stand-in, not a real provider.
- [ ] **You: write the first pay drop before switching the prompt on.** The site asks every new visitor for their email and promises a weekly email, so the first one needs to exist.
- [ ] **You: decide whether to sell the full raise plan yet.** With no payment link the locked plan collects emails ("tell me when it opens"). To take money, create a payment link with a payment provider, have it show an unlock code after payment, and set `NEXT_PUBLIC_PLAN_CHECKOUT_URL`, `NEXT_PUBLIC_PLAN_PRICE` and `NEXT_PUBLIC_PLAN_CODE`. Read the note in `web/.env.example` first: it is a soft lock.
- [x] Built-in estimates: 32 common jobs in ten countries (Australia, Canada, France, Germany, India, Italy, Japan, New Zealand, South Africa, Spain), written by AI from general knowledge. They ship with the site, cost nothing and need no key. **Read through `salty/web/src/lib/estimates-builtin.ts` for a country you know before launch**: nobody has checked these numbers against real sources. Regenerate them at least once a year.
- [ ] **You: decide whether to add a live AI** for every other job and country. It needs an Anthropic API key set as a secret on the host, a spending limit set on that key, and `NEXT_PUBLIC_ESTIMATE_URL=/api/estimate`. By default it answers from general knowledge on the cheapest Claude model, at a small fraction of a cent per new job (answers are cached for a month). Setting `SALTY_ESTIMATE_SEARCH=on` makes it search the web first, which is better and far dearer. The server code has only been tested with a stand-in for the AI, so run a few real lookups and read the answers before telling anyone about it.
- [ ] **You: load the email sequence.** `salty/emails/README.md` explains the set-up: tags from the `interest` field, then the timed emails in `salty/emails/sequence.md`. It needs your sender name and a postal address for the footer.
- [ ] Recommended tools: add real partners to `web/src/lib/recommended.json` when you have them. The block stays hidden while the list is empty.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the live address.
- [ ] Optional: create a free Umami site and set `NEXT_PUBLIC_UMAMI_ID` to count checks, shares and sign-ups. Without it there are no numbers for the two-week test.
- [ ] Set the founder links (`NEXT_PUBLIC_FOUNDER_*`) so the "built in public" block appears.
- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL`, then read the privacy page on the live site. It is a plain-language draft: **have it checked** against the rules where you launch, since the site collects email addresses.

## Data

- [x] United States: loaded from the May 2025 national wage file. When BLS publishes a new year, download the new "National" file from https://www.bls.gov/oes/tables.htm in a browser, put it in `salty/data/pipelines/us/raw/` and rerun the pipeline.
- [ ] **Australia and New Zealand** run on AI estimates, like every country other than the UK and US. Official figures for Australia would need the Jobs and Skills Australia "Occupation and Industry Profiles" spreadsheet (file "ANZSCO Occupation data"), which has to be downloaded in a browser because its site does not answer automated requests; put it in `salty/data/pipelines/au/raw/` and the pipeline can be rebuilt on it. New Zealand has no free official per-job pay data; see `salty/data/SOURCES.md`.
- [ ] Read `salty/data/SOURCES.md` for each country's known weaknesses before making claims in videos.

## First week

- [ ] Follow the two-week test in `marketing.md`.
- [ ] Check the waitlist and analytics daily, and note which waitlist feature is picked most.
