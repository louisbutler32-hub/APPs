# Pay data sources

Every figure on Salty comes from one of the sources below. This file is the register: what each source is, what its numbers actually measure, the licence that lets us use it, and its weaknesses. Update it whenever a pipeline or a release changes.

Outputs live in `out/<country>.json`. Raw downloads go in `pipelines/<country>/raw/` and are never committed.

| Country | On the site? | Jobs | Has the spread, or only the middle? |
|---|---|---|---|
| United Kingdom | Yes | 362 | Spread (up to 11 points per job, thinner at the top) |
| New Zealand | See below | See below | See below |
| Australia | **Held back** | 1,166 in the file | Middle and average only, and not full-time |
| United States | **Waiting on a file** | None yet | Spread (5 points per job) once loaded |

## United Kingdom

- **Source:** Office for National Statistics, Annual Survey of Hours and Earnings, Table 14.7a (annual gross pay, full-time employee jobs, 4-digit occupation), 2026 provisional edition, released 22 October 2026.
- **Dataset page:** https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14
- **What the figures are:** yearly pay before tax for full-time employee jobs, for employees on adult rates who have been in the same job for more than a year, for the tax year ending 5 April 2026. Full-time means more than 30 paid hours a week (25 for teaching). Self-employed people are not included. It is a 1% sample of payroll jobs.
- **Job titles for search:** the ONS SOC 2020 coding index (about 32,000 everyday titles mapped to occupation codes). Up to 25 per job.
- **Licence:** Open Government Licence v3.0. The dataset page says "All content is available under the Open Government Licence v3.0, except where otherwise stated", and ONS's licensing page says its material may be reused "whether commercially or privately" with a source credit. Credit used: "Source: Office for National Statistics licensed under the Open Government Licence v.3.0". The licence text itself (hosted by the National Archives) was not reachable from the build environment and has not been read directly.
- **Access:** fetched automatically. The pipeline identifies itself honestly rather than posing as a browser. ONS's fair use policy also asks automated clients for a contact; set `SALTY_USER_AGENT` to include one before running this on a schedule.
- **Checked:** every one of the 4,706 values for the 362 jobs was compared back against the spreadsheet with no mismatches, and the all-employee middle figure (£40,911) matches the ONS bulletin.
- **Weaknesses:**
  - ONS hides figures it considers unreliable. 50 of 412 job groups have no middle figure and are left out (including dentists, pilots, musicians and actors). Only 42 jobs have a published 90% point, so for most jobs the top of the range is reported as "top 20%" or "top 25%" rather than a precise rank.
  - Provisional figures are revised about a year later.
  - What "gross" covers (overtime, bonuses) was not found stated in the file; treat it as pay before tax and National Insurance.
  - Some everyday titles from the index are dated. They are used for search only.

## Australia (held back from the site)

- **Source in the file today:** Australian Taxation Office, Taxation statistics 2023-24, Individuals Table 15A, with job titles from the ATO salary and wage occupation code list. Published on data.gov.au.
- **Dataset page:** https://data.gov.au/data/dataset/taxation-statistics-2023-24
- **What the figures are:** the middle and the average of salary or wage income reported on 2023-24 tax returns, by occupation, for everyone with that occupation code whatever their hours: full-time, part-time, casual and part-year workers together.
- **Licence:** Creative Commons Attribution 2.5 Australia, as shown on the dataset page. Commercial use is allowed with credit.
- **Why it is held back:** because part-time and casual workers are included, an ordinary full-time wage ranks near the top. In testing, a full-time barista on $29.50 an hour came out as paid more than about 97% of baristas. That would mislead, so `live` is `false` for Australia in `web/src/lib/countries.ts`.
- **What would fix it:** Jobs and Skills Australia publishes median full-time weekly earnings by occupation ("Occupation and Industry Profiles"). Its site accepted the connection but returned nothing to automated requests, so the file has not been seen and none of this is confirmed. If someone downloads that spreadsheet in a browser and adds it to `pipelines/au/raw/`, the pipeline can be rebuilt on it. It would give a full-time middle figure for a few hundred jobs, probably without the spread.
- **Other options looked at and rejected:** Australian Bureau of Statistics earnings releases give the spread only for 8 or 43 broad groups, or an average only at job level.

## United States (waiting on a file)

- **Source:** U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, national estimates.
- **Why there is no data yet:** www.bls.gov refuses automated downloads and says so ("bot activity that doesn't conform to BLS usage policy is prohibited"). The pipeline therefore reads a file downloaded by hand. Instructions are at the top of `pipelines/us/build.py`.
- **Licence:** U.S. federal government work, generally public domain. The BLS copyright page has not been read from the build environment; confirm it when the file is added.
- **State of the pipeline:** written from the published file layout and run only against a small stand-in file. Check its first real output against the spreadsheet by eye.
