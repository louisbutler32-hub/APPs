# Launch checklist

What stands between the repo and a live test. Items marked **You** need an account or a decision only the founder can make.

## Before anything is public

- [ ] **You: check the name.** Search the trademark register in each launch country for "Salty" in software and financial services, and see which handles and domain are free. Only a web search has been done so far.
- [ ] **You: pick a domain** and buy it (the only cost in this test).
- [ ] **You: create the accounts**: Salty and a founder account on TikTok, Instagram and YouTube.

## Put the site live

- [ ] **You: connect a free static host** to this repo. Folder `salty/web`, build command `npm run build`, output folder `out`. Check the host's file limit first: the site is about 1,500 pages and several thousand files, and it grows with each country.
- [ ] **You: create a waitlist form.** Use an email newsletter tool with a free tier rather than a plain form tool, because the list's job is to be emailed at launch and it becomes the weekly newsletter. Put the form's POST address in `NEXT_PUBLIC_WAITLIST_URL`. Then sign up once yourself on the live site and confirm the entry arrives: the sign-up code has only been tested against a local stand-in, not a real provider.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the live address.
- [ ] Optional: create a free Umami site and set `NEXT_PUBLIC_UMAMI_ID` to count checks, shares and sign-ups. Without it there are no numbers for the two-week test.
- [ ] Set the founder links (`NEXT_PUBLIC_FOUNDER_*`) so the "built in public" block appears.
- [ ] Set `NEXT_PUBLIC_CONTACT_EMAIL`, then read the privacy page on the live site. It is a plain-language draft: **have it checked** against the rules where you launch, since the site collects email addresses.

## Data

- [ ] **You: United States.** The US statistics site refuses automated downloads, so download the national wage file in a browser (instructions at the top of `salty/data/pipelines/us/build.py`), add it to `pipelines/us/raw/`, and run the pipeline. The parser has only been run on a stand-in file, so check its first output against the spreadsheet.
- [ ] Read `salty/data/SOURCES.md` for each country's known weaknesses before making claims in videos.

## First week

- [ ] Follow the two-week test in `marketing.md`.
- [ ] Check the waitlist and analytics daily, and note which waitlist feature is picked most.
