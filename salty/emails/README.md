# Salty email system

Everything needed to follow up with people who give Salty their email: who gets what, when, and the full text of every email. The sending itself is done by an email newsletter tool; the site does not send email.

## How it works

1. Every sign-up form on the site posts to the address in `NEXT_PUBLIC_WAITLIST_URL`, which should be a form belonging to your email tool.
2. Each sign-up arrives with fields that say what the person did. The email tool turns those into tags, and each tag starts the matching sequence.
3. The person gets one email within the hour, then follow-ups at 3 days, 1 week, 1 month, 2 months, 6 months and 1 year.
4. Separately, everyone gets the weekly "Sunday pay drop".

### Fields sent with a sign-up

| Field | Example | Used for |
|---|---|---|
| `email` | | |
| `interest` | `newsletter`, `raise-plan`, `offer`, `employer`, `country-other` | Chooses the first emails |
| `country` | `uk`, `us`, `in`, `other` | Picks the right examples and currency |
| `job` | `5434` | Official job code, where there is one |
| `job_title` | `Chefs` | The line "your job" in an email |
| `source` | `salty-web` | |

Pay is never sent, so no email can quote it. Emails talk about "your pay" without a number, and send the reader back to the site to see their own figures. That is deliberate: it keeps the privacy promise and gives every email a reason to click.

### What each `interest` means

| `interest` | The person... | Starts with |
|---|---|---|
| `newsletter` | closed nothing, just asked for the weekly email (the prompt on opening the site, or the form further down) | Welcome A |
| `raise-plan` | checked their pay, answered the six questions, saw their free plan and asked for the full one | Welcome B |
| `offer` | checked a job offer and asked for the counter-offer plan | Welcome C |
| `employer` | looked up what to offer for a role | Welcome D |
| `country-other` | is outside the UK and US and asked to hear when official figures arrive | Welcome E |

After the welcome email everyone moves on to the same follow-ups (emails 2 to 7), except employers, who get emails 4 and 7 only: the rest are written for employees.

## Setting it up in an email tool

Any newsletter tool with forms, tags and timed sequences can do this. In whichever you choose:

1. Create a form and put its POST address in `NEXT_PUBLIC_WAITLIST_URL`. Add custom fields named exactly as in the table above.
2. Add a rule for each `interest` value that applies a tag of the same name.
3. Build one sequence per tag from `sequence.md`. Set the delays to: 1 hour, 3 days, 7 days, 30 days, 60 days, 180 days, 365 days after sign-up.
4. Add an exit rule: anyone tagged `customer` (set by your payment provider when someone buys) leaves the sequence. Nobody who has paid should be sold the thing they bought.
5. Make sequence emails skip Sundays, so they never land on top of the pay drop.
6. Send yourself every email once and click every link before switching it on.

Things only you can supply: the sender name and address, a postal address for the footer (email law in the US and elsewhere requires one), and the link to the full plan once it is on sale.

## Rules these emails follow

- **Useful on their own.** Each one gives the reader something they can use without clicking. If it only works as an advert, it does not go out.
- **One idea, one link.**
- **Written like a person.** Plain text, first person, short. No banners, no countdown timers.
- **Honest urgency only.** The cost of waiting is real and worth saying. Invented deadlines, fake scarcity and "last chance" are not used.
- **Every figure is from the site's data.** The pay figures quoted are from the official releases loaded on the site (UK: Office for National Statistics 2026 provisional; US: Bureau of Labor Statistics May 2025). Re-check them when the data is refreshed.
- **Easy to leave.** Every email carries the unsubscribe link your email tool adds. Do not hide it.

## Files

- `sequence.md`: the five welcome emails and follow-ups 2 to 7, with subject lines.
- `pay-drop-01.md`: a first issue of the weekly Sunday pay drop, UK and US versions.
