#!/usr/bin/env python3
"""Build out/us.json from the BLS Occupational Employment and Wage Statistics national file.

Pay: BLS does not allow automated downloads from www.bls.gov, so this script never
fetches the pay file. Download the national file yourself in a browser and put the zip
in raw/:

    https://www.bls.gov/oes/tables.htm  ->  "National" (XLS), e.g. oesm25nat.zip

then run:  python3 -I build.py

Everyday job titles (for search): fetched automatically from the O*NET database, which
is published for reuse under CC BY 4.0 and whose robots.txt allows these files.

Checked against the May 2025 file: 830 detailed occupations, 825 with an annual median
(the other five publish hourly wages only). The layout is OCC_CODE, OCC_TITLE, O_GROUP,
TOT_EMP, A_MEAN, A_PCT10 ... A_PCT90, with "*" for unavailable and "#" for a wage at or
above the published ceiling. The script stops with a clear message if a file does not
look like that.
"""
from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OUT = HERE.parent.parent / "out" / "us.json"

ONET_VERSION = "31_0"
ONET_BASE = f"https://www.onetcenter.org/dl_files/database/db_{ONET_VERSION}_csv/"
# Titles workers most often report for the job, then the longer list of other job titles.
ONET_FILES = ["sample_of_reported_titles.csv", "job_titles.csv"]
# An honest identifier, not a browser string.
USER_AGENT = "salty-pay-data/0.1 (open pay statistics pipeline; fetches two files per year)"
MAX_ALIASES = 25

FIELDS = {"p10": "A_PCT10", "p25": "A_PCT25", "p50": "A_MEDIAN", "p75": "A_PCT75", "p90": "A_PCT90", "mean": "A_MEAN"}
REQUIRED = ["OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", *FIELDS.values()]


def die(message: str) -> "None":
    sys.exit(f"us pipeline: {message}")


def find_zip() -> Path:
    zips = sorted(RAW.glob("oesm*nat.zip"))
    if not zips:
        die(f"no oesm*nat.zip in {RAW}. See the note at the top of this script.")
    return zips[-1]  # the latest year sorts last


def onet_file(name: str) -> Path:
    path = RAW / name
    if not path.exists():
        request = urllib.request.Request(ONET_BASE + urllib.parse.quote(name), headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(request, timeout=60) as response:
            path.write_bytes(response.read())
    return path


def load_aliases() -> dict[str, list[str]]:
    """Everyday titles per 6-digit SOC code, most recognisable first.

    O*NET codes look like 15-1252.00; the part before the dot is the SOC code BLS uses.
    Reported titles come first because they are what people actually call the job; the
    alternates fill the remaining places, shortest first. Titles with brackets or more
    than four words are left out: they are qualifiers, not what someone would type.
    """
    found: dict[str, list[str]] = {}
    seen: dict[str, set[str]] = {}

    def add(code: str, title: str) -> None:
        # "CEO (Chief Executive Officer)" is two usable titles, not one to throw away.
        both = re.fullmatch(r"(.+?) \((.+)\)", title.strip())
        for part in both.groups() if both else (title,):
            part = " ".join(part.split())
            if not part or "(" in part or len(part.split()) > 4:
                continue
            key = part.lower()
            if key in seen.setdefault(code, set()) or len(found.setdefault(code, [])) >= MAX_ALIASES:
                continue
            seen[code].add(key)
            found[code].append(part)

    for name, column in zip(ONET_FILES, ["Reported Job Title", "Job Title"]):
        with onet_file(name).open(encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        if not rows or column not in rows[0] or "O*NET-SOC Code" not in rows[0]:
            die(f"{name} does not have the expected columns; found {list(rows[0]) if rows else 'no rows'}")
        if name == "job_titles.csv":
            rows.sort(key=lambda row: (len(row[column]), row[column].lower()))
        for row in rows:
            code = row["O*NET-SOC Code"].split(".")[0]
            add(code, row[column])
            if row.get("Short Title"):
                add(code, row["Short Title"])
    return found


def number(value: object) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        text = value.replace(",", "").strip()
        if re.fullmatch(r"\d+(\.\d+)?", text):
            return float(text)
    return None


def main() -> None:
    path = find_zip()
    year = re.search(r"oesm(\d\d)nat", path.name)
    with zipfile.ZipFile(path) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith(".xlsx")]
        if len(names) != 1:
            die(f"expected one .xlsx inside {path.name}, found {names}")
        workbook = openpyxl.load_workbook(io.BytesIO(archive.read(names[0])), read_only=True, data_only=True)
    sheet = workbook.worksheets[0]
    rows = sheet.iter_rows(values_only=True)
    header = [str(cell).strip().upper() if cell is not None else "" for cell in next(rows)]
    missing = [name for name in REQUIRED if name not in header]
    if missing:
        die(f"columns missing from {names[0]}: {missing}. The layout has changed; update this script.")
    col = {name: header.index(name) for name in header if name}

    aliases = load_aliases()
    jobs, topcoded_any = [], False
    for row in rows:
        if str(row[col["O_GROUP"]]).strip().lower() != "detailed":
            continue
        job: dict[str, object] = {"code": str(row[col["OCC_CODE"]]).strip(), "title": str(row[col["OCC_TITLE"]]).strip()}
        employees = number(row[col["TOT_EMP"]])
        job["employees"] = int(employees) if employees is not None else None
        topcoded = []
        for field, source in FIELDS.items():
            raw = row[col[source]]
            value = number(raw)
            job[field] = int(round(value)) if value is not None else None
            if isinstance(raw, str) and raw.strip() == "#":
                topcoded.append(field)
        if topcoded:
            job["topcoded"] = topcoded
            topcoded_any = True
        job["aliases"] = aliases.get(str(job["code"]), [])
        if job["p50"] is not None:
            jobs.append(job)
    if len(jobs) < 500:
        die(f"only {len(jobs)} detailed occupations with a median; expected about 800. Not writing output.")
    jobs.sort(key=lambda j: str(j["code"]))

    period = f"May 20{year.group(1)}" if year else "unknown"
    out = {
        "country": "us",
        "currency": "USD",
        "period": period,
        "basis": "Annual wage before tax for employees (self-employed people are not counted), as published by BLS. "
        "For most occupations BLS works the annual figure out from the hourly wage as a full-time, year-round "
        "amount (2,080 hours), so part-time workers are compared on a full-time footing. Occupations that "
        "publish hourly wages only (actors, dancers, musicians and a few others) are left out.",
        "source": {
            "name": f"U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, national estimates, {period}. "
            f"Job-title aliases: O*NET {ONET_VERSION.replace('_', '.')} Database.",
            "url": "https://www.bls.gov/oes/tables.htm",
            "licence": "Pay: public domain (U.S. federal government work). Job titles: Creative Commons Attribution 4.0 International.",
            "attribution": f"Source: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, {period}. "
            f"Job titles include information from the O*NET {ONET_VERSION.replace('_', '.')} Database by the U.S. Department of Labor, "
            "Employment and Training Administration (USDOL/ETA), used under the CC BY 4.0 license. O*NET is a trademark of "
            "USDOL/ETA. Salty has modified all or some of this information. USDOL/ETA has not approved, endorsed, or tested "
            "these modifications.",
        },
        "jobs": jobs,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    with_aliases = sum(1 for job in jobs if job["aliases"])
    print(f"us pipeline: wrote {len(jobs)} jobs to {OUT} ({period}); top-coded values present: {topcoded_any}; "
          f"jobs with everyday titles: {with_aliases}")
    for sample in jobs[:: max(1, len(jobs) // 5)][:5]:
        print("  ", sample["code"], sample["title"], sample["p10"], sample["p25"], sample["p50"], sample["p75"], sample["p90"])


if __name__ == "__main__":
    main()
