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
- [ ] Recommended tools: add real partners to `web/src/lib/recommended.json` when you have them. The block stays hidden while the list is empty.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the live address.
- [ ] Optional: create a free Umami site and set `NEXT_PUBLIC_UMAMI_ID` to count checks, shares and sign-ups. Without it there are no numbers for the two-week test.
- [ ] Set the founder links (`NEXT_PUBLIC_FOUNDER_*`) so the "built in public" block appears.
- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL`, then read the privacy page on the live site. It is a plain-language draft: **have it checked** against the rules where you launch, since the site collects email addresses.

## Data

- [ ] **You: United States.** The US statistics site refuses automated downloads, so download the national wage file in a browser (instructions at the top of `salty/data/pipelines/us/build.py`), add it to `pipelines/us/raw/`, and run the pipeline. The parser has only been run on a stand-in file, so check its first output against the spreadsheet.
- [ ] **You: Australia.** The free data that could be fetched mixes part-time workers in and misleads, so Australia is switched off. Jobs and Skills Australia publishes full-time pay by job, but its site would not respond to automated requests. Download its "Occupation and Industry Profiles" occupation spreadsheet in a browser, add it to `salty/data/pipelines/au/raw/`, and the pipeline can be rebuilt on it.
- [ ] **New Zealand** has no usable free per-job pay data today; see `salty/data/SOURCES.md`. It stays switched off.
- [ ] Read `salty/data/SOURCES.md` for each country's known weaknesses before making claims in videos.

## First week

- [ ] Follow the two-week test in `marketing.md`.
- [ ] Check the waitlist and analytics daily, and note which waitlist feature is picked most.
