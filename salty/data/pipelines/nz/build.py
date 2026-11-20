#!/usr/bin/env python3
"""Salty - New Zealand pay-by-occupation pipeline.

Run:  python3 -I build.py          (stdlib only; downloads into ./raw if missing)

What this builds
----------------
The only dollar-level earnings-by-occupation figures Stats NZ hosts on
www.stats.govt.nz itself are the median hourly earnings for the eight ANZSCO
major groups that were published as a chart/table inside the
"Labour market statistics (income): June 2019 quarter" release page.
Every later year of that table (and the mean, weekly figures and earner
counts) is published only through Aotearoa Data Explorer
(explore.data.stats.govt.nz / api.data.stats.govt.nz), which this pipeline
does not touch.

Three files are read, all from www.stats.govt.nz:

1. June 2019 income release page  -> median hourly earnings by occupation
   (HLFS income supplement, June 2019 quarter).  -> jobs[].h_p50
2. Labour market statistics September 2026 quarter CSV zip -> HLFS "Persons
   Employed by Sex by Occupation, ANZSCO", June 2019 quarter value.
   -> jobs[].employed_total  (all employed people, NOT just employees)
3. June 2026 income release page -> national (all occupations) median weekly
   earnings from wages and salaries, June 2019 and June 2026 quarters.
   -> all_occupations[]

Nothing is interpolated, estimated or annualised from hourly values. The only
arithmetic is: thousands -> units for the employment counts, and
weekly x 52 for the national all-occupations weekly median.
"""

import csv
import html
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from decimal import Decimal
from pathlib import Path

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OUT = HERE.parents[1] / "out" / "nz.json"

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/126.0 Safari/537.36"
)

BASE = "https://www.stats.govt.nz"
PAY_URL = BASE + "/information-releases/labour-market-statistics-income-june-2019-quarter/"
NATIONAL_URL = BASE + "/information-releases/labour-market-statistics-income-june-2026-quarter/"
HLFS_ZIP_URL = (
    BASE + "/assets/Uploads/Labour-market-statistics/"
    "Labour-market-statistics-September-2026-quarter/Download-data/"
    "labour-market-statistics-september-2026-quarter.zip"
)
LICENCE_URL = BASE + "/about-us/copyright/"

FILES = {
    "pay": (PAY_URL, RAW / "lms-income-june-2019-quarter.html"),
    "national": (NATIONAL_URL, RAW / "lms-income-june-2026-quarter.html"),
    "hlfs": (HLFS_ZIP_URL, RAW / "labour-market-statistics-september-2026-quarter.zip"),
}

PAY_PERIOD = "June 2019 quarter"
PAY_GRAPH_HEADING = (
    "Median hourly earnings from wages and salaries, by occupation, June quarter 2018–19"
)
PAY_GRAPH_ROW = "2019"

NATIONAL_GRAPH_HEADING = (
    "Median weekly earnings from wages and salaries ($), by sex, June quarters, 1998–2026"
)
NATIONAL_COLUMNS = {"Jun-19": "June 2019 quarter", "Jun-26": "June 2026 quarter"}

HLFS_MEMBER_SUFFIX = "lms-sep26qtr-tables.csv"
HLFS_GROUP = "Persons Employed by Sex by Occupation, ANZSCO"
# The same table exists twice in the file: HLFQ.* is the quarterly series,
# HLFA.* the annual (year-ended average) one. Only the quarterly one is used.
HLFS_SERIES_PREFIX = "HLFQ."
HLFS_PERIOD = "2019.06"

# ANZSCO major groups. The codes are the standard ANZSCO major-group digits;
# the source chart carries titles only, so rows are matched on title.
# Keys are normalised titles (lower case, "trade workers" -> "trades workers").
ANZSCO_MAJOR = {
    "managers": ("1", "Managers"),
    "professionals": ("2", "Professionals"),
    "technicians and trades workers": ("3", "Technicians and Trades Workers"),
    "community and personal service workers": ("4", "Community and Personal Service Workers"),
    "clerical and administrative workers": ("5", "Clerical and Administrative Workers"),
    "sales workers": ("6", "Sales Workers"),
    "machinery operators and drivers": ("7", "Machinery Operators and Drivers"),
    "labourers": ("8", "Labourers"),
}

ANNUAL_FIELDS = ["p10", "p25", "p50", "p75", "p90"]
HOURLY_FIELDS = ["h_p10", "h_p25", "h_p50", "h_p75", "h_p90"]


def die(msg):
    sys.exit("build.py: " + msg)


def norm_title(s):
    s = re.sub(r"\s+", " ", s.strip().lower())
    return s.replace("trade workers", "trades workers")


def download(url, dest):
    """Fetch url to dest unless it is already there. Never sends anything but a UA."""
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print("downloading", url)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    tmp = dest.with_name(dest.name + ".part")
    with urllib.request.urlopen(req, timeout=180) as resp, open(tmp, "wb") as fh:
        if resp.status != 200:
            die("HTTP %s for %s" % (resp.status, url))
        while True:
            chunk = resp.read(1 << 20)
            if not chunk:
                break
            fh.write(chunk)
    if tmp.stat().st_size == 0:
        die("empty download: " + url)
    os.replace(tmp, dest)


def page_data(path):
    """Return the JSON the Stats NZ site embeds in each page (id=pageViewData)."""
    text = path.read_text(encoding="utf-8", errors="strict")
    m = re.search(r'id="pageViewData"[^>]*\sdata-value="([^"]*)"', text)
    if not m:
        die("no pageViewData block in %s (page layout changed, or a bot-check page)" % path.name)
    return json.loads(html.unescape(m.group(1)))


def graph_table(data, heading, path):
    """Find the one chart block with this exact heading; return its rows (list of lists)."""
    hits = [
        b for b in data.get("PageBlocks", [])
        if b.get("ClassName") == "GraphTableBlock" and (b.get("GraphHeading") or "").strip() == heading
    ]
    if len(hits) != 1:
        die("expected exactly one chart %r in %s, found %d" % (heading, path.name, len(hits)))
    series = hits[0].get("SeriesData") or []
    if len(series) != 1:
        die("expected one series group in chart %r, found %d" % (heading, len(series)))
    raw = series[0].get("GraphCsvData") or ""
    rows = [r for r in csv.reader(io.StringIO(raw.lstrip("﻿"))) if any(c.strip() for c in r)]
    if len(rows) < 2:
        die("chart %r has no data rows" % heading)
    return rows


def dollars(s, lo, hi, what):
    s = s.strip().replace(",", "").replace("$", "")
    if not re.fullmatch(r"\d+(\.\d+)?", s):
        die("non-numeric value %r for %s" % (s, what))
    d = Decimal(s)
    if not (lo <= d <= hi):
        die("implausible value %s for %s" % (s, what))
    return d


def read_pay(path):
    """{code: median hourly earnings (Decimal)} for the eight ANZSCO major groups."""
    rows = graph_table(page_data(path), PAY_GRAPH_HEADING, path)
    header = rows[0]
    by_label = {r[0].strip(): r for r in rows[1:]}
    if PAY_GRAPH_ROW not in by_label:
        die("row %r missing from occupation chart; rows: %s" % (PAY_GRAPH_ROW, sorted(by_label)))
    row = by_label[PAY_GRAPH_ROW]
    if len(row) != len(header):
        die("occupation chart row length does not match its header")
    out = {}
    for label, value in zip(header[1:], row[1:]):
        key = norm_title(label)
        if key not in ANZSCO_MAJOR:
            die("unexpected occupation label %r in chart" % label)
        code = ANZSCO_MAJOR[key][0]
        if code in out:
            die("duplicate occupation %r in chart" % label)
        out[code] = dollars(value, Decimal(5), Decimal(500), "hourly median, " + label)
    if len(out) != len(ANZSCO_MAJOR):
        die("expected %d occupation groups, got %d" % (len(ANZSCO_MAJOR), len(out)))
    return out


def read_national(path):
    """[(period label, median weekly earnings Decimal)] for all wage and salary earners."""
    rows = graph_table(page_data(path), NATIONAL_GRAPH_HEADING, path)
    header = [c.strip() for c in rows[0]]
    total = [r for r in rows[1:] if r[0].strip() == "Total"]
    if len(total) != 1 or len(total[0]) != len(header):
        die("national weekly-earnings chart: cannot find a clean 'Total' row")
    out = []
    for col, label in NATIONAL_COLUMNS.items():
        if header.count(col) != 1:
            die("national weekly-earnings chart: column %r missing" % col)
        value = total[0][header.index(col)]
        out.append((label, dollars(value, Decimal(100), Decimal(20000), "weekly median " + col)))
    return out


def read_employed(path):
    """{code: persons employed (int)} from the HLFS series, June 2019 quarter, both sexes."""
    if not zipfile.is_zipfile(path):
        die("%s is not a zip file" % path.name)
    want_group = HLFS_GROUP.encode()
    want_period = ("," + HLFS_PERIOD + ",").encode()
    out = {}
    with zipfile.ZipFile(path) as zf:
        members = [n for n in zf.namelist() if n.endswith(HLFS_MEMBER_SUFFIX)]
        if len(members) != 1:
            die("expected one %s in zip, found %s" % (HLFS_MEMBER_SUFFIX, members))
        with zf.open(members[0]) as fh:
            header = next(csv.reader([fh.readline().decode("utf-8-sig")]))
            col = {name: i for i, name in enumerate(header)}
            for need in ("Series_reference", "Period", "Data_value", "UNITS", "MAGNTUDE", "Group",
                         "Series_title_1", "Series_title_2"):
                if need not in col:
                    die("HLFS csv: column %r missing" % need)
            for line in fh:
                if want_group not in line or want_period not in line:
                    continue
                r = next(csv.reader([line.decode("utf-8")]))
                if (r[col["Group"]] != HLFS_GROUP or r[col["Period"]] != HLFS_PERIOD
                        or not r[col["Series_reference"]].startswith(HLFS_SERIES_PREFIX)
                        or r[col["Series_title_1"]] != "Total Both Sexes"):
                    continue
                key = norm_title(r[col["Series_title_2"]])
                if key not in ANZSCO_MAJOR:
                    continue  # "Residual Categories", "Total All Occupations"
                if r[col["UNITS"]].lower() != "number" or r[col["MAGNTUDE"]] != "3":
                    die("HLFS csv: unexpected units for " + r[col["Series_title_2"]])
                code = ANZSCO_MAJOR[key][0]
                if code in out:
                    die("HLFS csv: duplicate row for " + r[col["Series_title_2"]])
                value = r[col["Data_value"]].strip()
                if not re.fullmatch(r"\d+(\.\d+)?", value):
                    out[code] = None  # suppressed / not available
                else:
                    out[code] = int(Decimal(value) * 1000)
    if set(out) != {c for c, _ in ANZSCO_MAJOR.values()}:
        die("HLFS csv: expected 8 occupation groups, got %s" % sorted(out))
    return out


def money2(d):
    """Dollars-and-cents Decimal -> float with exactly the published precision."""
    return float(d.quantize(Decimal("0.01")))


def build():
    for url, dest in FILES.values():
        download(url, dest)

    pay = read_pay(FILES["pay"][1])
    employed = read_employed(FILES["hlfs"][1])
    national = read_national(FILES["national"][1])

    jobs = []
    for code, title in sorted(ANZSCO_MAJOR.values()):
        job = {"code": code, "title": title, "employees": None}
        for f in ANNUAL_FIELDS:
            job[f] = None
        job["mean"] = None
        for f in HOURLY_FIELDS:
            job[f] = None
        job["h_p50"] = money2(pay[code])
        job["h_mean"] = None
        job["employed_total"] = employed[code]
        job["aliases"] = []
        jobs.append(job)

    doc = {
        "country": "nz",
        "currency": "NZD",
        "period": PAY_PERIOD,
        "basis": (
            "HOURLY, NOT ANNUAL. h_p50 = median hourly earnings from wages and salaries, "
            "gross (before tax), for wage and salary earners, by occupation, from the income "
            "supplement of Stats NZ's Household Labour Force Survey, June 2019 quarter, "
            "exactly as published (NZD per hour). Stats NZ published only the median for this "
            "breakdown on www.stats.govt.nz, so h_p10/h_p25/h_p75/h_p90/h_mean are null. "
            "No hourly-to-annual conversion has been applied: the source gives no hours worked "
            "by occupation, so every annual field (p10..p90, mean) is null. "
            "employees is null because the number of wage and salary earners per occupation is "
            "not published on www.stats.govt.nz; employed_total is a different measure: all "
            "people employed in that occupation group (employees plus employers and "
            "self-employed), HLFS quarterly series, June 2019 quarter, both sexes, published in thousands and "
            "multiplied by 1,000. all_occupations is a national benchmark, not an occupation "
            "figure: median weekly earnings from wages and salaries for all wage and salary "
            "earners (w_p50, as published), with p50 = w_p50 x 52."
        ),
        "granularity": "ANZSCO major group (8 groups, 1-digit)",
        "source": {
            "name": (
                "Stats NZ, Labour market statistics (income): June 2019 quarter "
                "(Household Labour Force Survey income supplement) - chart 'Median hourly "
                "earnings from wages and salaries, by occupation, June quarter 2018-19'"
            ),
            "url": PAY_URL,
            "licence": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
            "licence_url": LICENCE_URL,
            "attribution": (
                "This work is based on/includes Stats NZ's data which are licensed by "
                "Stats NZ for reuse under the Creative Commons Attribution 4.0 International "
                "licence."
            ),
            "files": [
                {"use": "jobs[].h_p50", "url": PAY_URL},
                {"use": "jobs[].employed_total", "url": HLFS_ZIP_URL},
                {"use": "all_occupations[]", "url": NATIONAL_URL},
            ],
        },
        "all_occupations": [
            {"period": label, "w_p50": int(w) if w == w.to_integral_value() else money2(w),
             "p50": int((w * 52).to_integral_value())}
            for label, w in national
        ],
        "jobs": jobs,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    tmp = OUT.with_name(OUT.name + ".part")
    tmp.write_text(text, encoding="utf-8")
    os.replace(tmp, OUT)
    return doc


def report(doc):
    jobs = doc["jobs"]
    print("wrote", OUT)
    print("period:", doc["period"], "| granularity:", doc["granularity"])
    print("rows:", len(jobs))
    fields = ["employees"] + ANNUAL_FIELDS + ["mean"] + HOURLY_FIELDS + ["h_mean", "employed_total"]
    print("non-null coverage:")
    for f in fields:
        n = sum(1 for j in jobs if j.get(f) is not None)
        print("  %-15s %d/%d" % (f, n, len(jobs)))
    print("sample rows:")
    for j in jobs[:5]:
        print("  ", json.dumps(j, ensure_ascii=False))
    violations = []
    for j in jobs:
        for group in (ANNUAL_FIELDS, HOURLY_FIELDS):
            vals = [(f, j[f]) for f in group if j[f] is not None]
            for (fa, a), (fb, b) in zip(vals, vals[1:]):
                if a > b:
                    violations.append("%s %s: %s=%s > %s=%s" % (j["code"], j["title"], fa, a, fb, b))
    codes = [j["code"] for j in jobs]
    if codes != sorted(codes) or len(set(codes)) != len(codes):
        violations.append("job codes not sorted/unique")
    print("ordering violations:", len(violations))
    for v in violations:
        print("  ", v)
    print("all_occupations:", json.dumps(doc["all_occupations"]))


if __name__ == "__main__":
    report(build())
