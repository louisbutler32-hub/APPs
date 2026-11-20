#!/usr/bin/env python3
"""Build data/out/au.json: Australian pay by occupation for Salty.

Source (both files are Australian Taxation Office publications hosted on
data.gov.au, licensed Creative Commons Attribution 2.5 Australia):

1. Taxation statistics 2023-24, Individuals Table 15, sheet "Table 15A":
   number of individuals, average and median "salary or wage income" by
   6-digit occupation code and sex, with a published "Total" (persons) row.
   Feeds: code, title, employees, p50, mean.
2. ATO Salary and Wage Occupation Codes, sheet "2023-24": the official list of
   job descriptions that map to each 6-digit code on the tax return.
   Feeds: aliases.

Nothing is estimated, interpolated or re-weighted. Only the published
"Total" rows are used; male/female rows are never combined. p10/p25/p75/p90
are null because the source does not publish them.

Run:  python3 -I build.py            (downloads into raw/ if missing)
      python3 -I build.py --offline  (fail instead of downloading)

Stdlib + openpyxl only. Output is deterministic for the same input files.
"""

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.request
from decimal import ROUND_HALF_UP, Decimal

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
OUT = os.path.normpath(os.path.join(HERE, "..", "..", "out", "au.json"))

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0 Safari/537.36"
)

DATASET_PAGE = "https://data.gov.au/data/dataset/taxation-statistics-2023-24"
ALIASES_PAGE = "https://data.gov.au/data/dataset/ato-salary-and-wage-occupation-codes"

PAY_FILE = "ts24individual15occupationsex.xlsx"
PAY_URL = (
    "https://data.gov.au/data/dataset/faea4485-f407-457d-97f8-3f0822ccd654/"
    "resource/3286e287-ee87-4be4-87b2-56c5c6602009/download/" + PAY_FILE
)
PAY_SHEET = "Table 15A"

ALIAS_FILE = "ato-salary-and-wage-occupation-codes.xlsx"
ALIAS_URL = (
    "https://data.gov.au/data/dataset/0063be5d-2e80-477e-94cb-e865e6749b4b/"
    "resource/78426e3f-87d5-4ea4-ae66-2ce12cbe0324/download/" + ALIAS_FILE
)
ALIAS_SHEET = "2023-24"

# Rows in Table 15A that are not an occupation. Everything else is kept.
#  - "0"      "Occupation code blank": no occupation given on the return.
#  - "999000" "Occupation not listed": residual bucket, not a job.
NOT_AN_OCCUPATION = {"0", "999000"}
# In addition, codes that are absent from the ATO's official code list for the
# income year are dropped (see load_pay). In 2023-24 these are 12 leftover
# "type not specified"/retired codes covering 462 individuals in total.

PERCENTILE_FIELDS = ("p10", "p25", "p50", "p75", "p90")


def download(url, dest):
    """Fetch url to dest (atomically). Refuses anything that is not an xlsx."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = resp.read()
    if not data.startswith(b"PK\x03\x04"):
        raise SystemExit(f"{url}: response is not an .xlsx file (got {data[:40]!r})")
    tmp = dest + ".part"
    with open(tmp, "wb") as fh:
        fh.write(data)
    os.replace(tmp, dest)


def ensure(filename, url, offline):
    path = os.path.join(RAW, filename)
    if not os.path.exists(path):
        if offline:
            raise SystemExit(f"missing {path} and --offline was given")
        os.makedirs(RAW, exist_ok=True)
        print(f"downloading {url}")
        download(url, path)
    return path


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def norm_header(cell):
    """'Median salary or wage income5\\n$' -> 'median salary or wage income $'."""
    text = re.sub(r"\s+", " ", str(cell or "")).strip().lower()
    return re.sub(r"(?<=[a-z])[\d,]+(?=\s|$)", "", text).strip()


def dollars(value):
    """Published number -> whole dollars, rounding half up. None stays None."""
    if value is None or value == "":
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SystemExit(f"unexpected non-numeric value in a money column: {value!r}")
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def load_aliases(path):
    """code -> list of official job descriptions for the income year."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    if ALIAS_SHEET not in wb.sheetnames:
        raise SystemExit(f"{path}: no sheet {ALIAS_SHEET!r} (have {wb.sheetnames})")
    rows = wb[ALIAS_SHEET].iter_rows(values_only=True)
    header = [norm_header(c) for c in next(rows)[:2]]
    if header != ["occupation code", "occupation code description"]:
        raise SystemExit(f"{path}: unexpected header {header}")
    out = {}
    for row in rows:
        code, desc = row[0], row[1]
        if code is None or desc is None:
            continue
        out.setdefault(str(code).strip(), set()).add(str(desc).strip())
    wb.close()
    return out


def load_pay(path, valid_codes):
    """Read the persons ("Total") rows of Table 15A.

    Returns (jobs, dropped) where dropped is a list of (code, title, n, why).
    """
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    if PAY_SHEET not in wb.sheetnames:
        raise SystemExit(f"{path}: no sheet {PAY_SHEET!r} (have {wb.sheetnames})")
    rows = wb[PAY_SHEET].iter_rows(values_only=True)
    title_row = str(next(rows)[0] or "")
    if "2023" not in title_row or "24" not in title_row:
        raise SystemExit(f"{path}: unexpected table title {title_row!r}")
    header = [norm_header(c) for c in next(rows)[:10]]
    expected = [
        "occupation - unit group",
        "occupation",
        "sex",
        "individuals no.",
        "average taxable income $",
        "median taxable income $",
        "average salary or wage income $",
        "median salary or wage income $",
        "average total income $",
        "median total income $",
    ]
    if header != expected:
        raise SystemExit(f"{path}: unexpected header\n got {header}\n want {expected}")
    COL_OCC, COL_SEX, COL_N, COL_MEAN, COL_MEDIAN = 1, 2, 3, 6, 7

    seen_any, totals = set(), {}
    for row in rows:
        if row[COL_OCC] is None:
            continue
        code, _, title = str(row[COL_OCC]).strip().partition(" ")
        seen_any.add(code)
        if str(row[COL_SEX]).strip() != "Total":
            continue
        if code in totals:
            raise SystemExit(f"duplicate Total row for occupation code {code}")
        totals[code] = (title.strip(), row[COL_N], row[COL_MEAN], row[COL_MEDIAN])
    wb.close()

    jobs, dropped = [], []
    # An occupation published by sex only would be reported, never averaged.
    for code in sorted(seen_any - set(totals)):
        dropped.append((code, "", None, "no persons (Total) row published"))
    for code, (title, n, mean, median) in totals.items():
        if code in NOT_AN_OCCUPATION:
            dropped.append((code, title, n, "not an occupation"))
            continue
        if code not in valid_codes:
            dropped.append((code, title, n, "code not in ATO 2023-24 code list"))
            continue
        if not re.fullmatch(r"\d{6}", code) or not title:
            raise SystemExit(f"unexpected occupation label: {code!r} {title!r}")
        if not isinstance(n, int) or isinstance(n, bool) or n <= 0:
            raise SystemExit(f"{code}: unexpected individuals count {n!r}")
        p50, mean = dollars(median), dollars(mean)
        if p50 is None and mean is None:
            dropped.append((code, title, n, "no median and no mean published"))
            continue
        jobs.append(
            {
                "code": code,
                "title": title,
                "employees": n,
                "p10": None,
                "p25": None,
                "p50": p50,
                "p75": None,
                "p90": None,
                "mean": mean,
                "aliases": [],
            }
        )
    jobs.sort(key=lambda j: j["code"])
    return jobs, dropped


def attach_aliases(jobs, aliases):
    for job in jobs:
        title_key = job["title"].casefold()
        names = {a for a in aliases.get(job["code"], ()) if a.casefold() != title_key}
        job["aliases"] = sorted(names, key=lambda s: (s.casefold(), s))


def build_document(jobs):
    return {
        "country": "au",
        "currency": "AUD",
        "period": "2023-24 financial year (1 July 2023 to 30 June 2024)",
        "basis": (
            "Annual salary or wage income before tax, in whole Australian dollars, as "
            "reported at the 'Salary or wages' label of 2023-24 individual income tax "
            "returns (returns processed by 31 October 2025), grouped by the main "
            "salary-and-wage occupation code on the return. p50 is the published median "
            "and mean the published average, both for persons (the source's 'Total' "
            "row) and both calculated by the ATO over individuals whose salary or wages "
            "were not zero. This covers everyone who lodged with that occupation, "
            "whatever their hours: full-time, part-time, casual and part-year workers "
            "are all included, so it is not a full-time-only figure. The amounts are "
            "already annual, so no weekly-to-annual conversion was applied; the only "
            "change is rounding to whole dollars (half up). 'employees' is the number "
            "of individuals who lodged a return with that occupation code. p10, p25, "
            "p75 and p90 are null because the source does not publish them."
        ),
        "source": {
            "name": (
                "Australian Taxation Office, Taxation statistics 2023-24, Individuals "
                "Table 15A (pay and counts); ATO Salary and Wage Occupation Codes, "
                "2023-24 sheet (aliases)"
            ),
            "url": DATASET_PAGE,
            "licence": (
                "Creative Commons Attribution 2.5 Australia "
                "(https://creativecommons.org/licenses/by/2.5/au/)"
            ),
            "attribution": (
                "Source: Australian Taxation Office, Taxation statistics 2023-24 "
                "(Individuals, Table 15A) and ATO Salary and Wage Occupation Codes, "
                "published on data.gov.au under a Creative Commons Attribution 2.5 "
                "Australia licence. Figures rounded to whole dollars."
            ),
        },
        "jobs": jobs,
    }


def write_json(doc, path):
    """Stable layout: metadata pretty-printed, one job per line."""
    head = {k: v for k, v in doc.items() if k != "jobs"}
    text = json.dumps(head, ensure_ascii=False, indent=2)
    lines = [json.dumps(j, ensure_ascii=False, separators=(", ", ": ")) for j in doc["jobs"]]
    text = text[: text.rindex("}")].rstrip() + ',\n  "jobs": [\n    '
    text += ",\n    ".join(lines) + "\n  ]\n}\n"
    json.loads(text)  # must round-trip
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    with open(tmp, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    os.replace(tmp, path)


def report(doc, dropped, files):
    jobs = doc["jobs"]
    print(f"\ninputs:")
    for path in files:
        print(f"  {sha256(path)}  {os.path.basename(path)}")
    print(f"\njobs: {len(jobs)}")
    print("non-null coverage:")
    for field in ("employees",) + PERCENTILE_FIELDS + ("mean",):
        n = sum(j[field] is not None for j in jobs)
        print(f"  {field:<9} {n:>5} / {len(jobs)}")
    with_alias = sum(bool(j["aliases"]) for j in jobs)
    print(f"  aliases   {with_alias:>5} / {len(jobs)} jobs "
          f"({sum(len(j['aliases']) for j in jobs)} alias strings)")

    violations = []
    for j in jobs:
        vals = [(f, j[f]) for f in PERCENTILE_FIELDS if j[f] is not None]
        for (fa, a), (fb, b) in zip(vals, vals[1:]):
            if a > b:
                violations.append(f"{j['code']} {j['title']}: {fa}={a} > {fb}={b}")
    print(f"percentile ordering violations: {len(violations)}")
    for v in violations[:20]:
        print("  " + v)

    counts = sorted(j["employees"] for j in jobs)
    print("individuals per job: min %d, p10 %d, median %d, max %d; total %d" % (
        counts[0], counts[len(counts) // 10], counts[len(counts) // 2], counts[-1], sum(counts)))
    for limit in (50, 100, 500, 1000):
        print(f"  jobs with fewer than {limit} individuals: {sum(c < limit for c in counts)}")
    print(f"jobs where mean < median: {sum(j['mean'] < j['p50'] for j in jobs if j['p50'] and j['mean'])}")

    print(f"\ndropped rows: {len(dropped)}")
    for code, title, n, why in sorted(dropped):
        print(f"  {code:<7} {title[:50]:<50} n={n}  [{why}]")

    print("\nsamples:")
    wanted = ("261313", "254499", "241213", "351311", "621111")
    by_code = {j["code"]: j for j in jobs}
    for code in wanted:
        j = by_code.get(code)
        if j:
            shown = dict(j, aliases=j["aliases"][:4] + (["..."] if len(j["aliases"]) > 4 else []))
            print("  " + json.dumps(shown, ensure_ascii=False))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--offline", action="store_true", help="never download; use raw/ only")
    ap.add_argument("--out", default=OUT, help=f"output path (default {OUT})")
    args = ap.parse_args(argv)

    pay_path = ensure(PAY_FILE, PAY_URL, args.offline)
    alias_path = ensure(ALIAS_FILE, ALIAS_URL, args.offline)

    aliases = load_aliases(alias_path)
    jobs, dropped = load_pay(pay_path, set(aliases))
    attach_aliases(jobs, aliases)
    if len(jobs) < 500:
        raise SystemExit(f"only {len(jobs)} jobs parsed; the source layout has probably changed")
    if len({j["code"] for j in jobs}) != len(jobs):
        raise SystemExit("duplicate job codes")

    doc = build_document(jobs)
    write_json(doc, args.out)
    report(doc, dropped, [pay_path, alias_path])
    print(f"\nwrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
