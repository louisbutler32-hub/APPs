#!/usr/bin/env python3
"""Build out/us.json from the BLS Occupational Employment and Wage Statistics national file.

BLS does not allow automated downloads from www.bls.gov, so this script never fetches
anything. Download the national file yourself in a browser and put the zip in raw/:

    https://www.bls.gov/oes/tables.htm  ->  "National" (XLS), e.g. oesm25nat.zip

then run:  python3 -I build.py

NOT YET RUN AGAINST A REAL FILE. It was written from the published OEWS layout
(columns OCC_CODE, OCC_TITLE, O_GROUP, TOT_EMP, A_MEAN, A_PCT10 ... A_PCT90, with
"*" for unavailable and "#" for a wage above the published ceiling). It stops with
a clear message if the file it finds does not look like that. Check the first
output by eye against the spreadsheet before trusting it.
"""
from __future__ import annotations

import io
import json
import re
import sys
import zipfile
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OUT = HERE.parent.parent / "out" / "us.json"

FIELDS = {"p10": "A_PCT10", "p25": "A_PCT25", "p50": "A_MEDIAN", "p75": "A_PCT75", "p90": "A_PCT90", "mean": "A_MEAN"}
REQUIRED = ["OCC_CODE", "OCC_TITLE", "O_GROUP", "TOT_EMP", *FIELDS.values()]


def die(message: str) -> "None":
    sys.exit(f"us pipeline: {message}")


def find_zip() -> Path:
    zips = sorted(RAW.glob("oesm*nat.zip"))
    if not zips:
        die(f"no oesm*nat.zip in {RAW}. See the note at the top of this script.")
    return zips[-1]  # the latest year sorts last


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
        job["aliases"] = []
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
        "basis": "Annual wage before tax for employees, full-time and part-time together, as published by BLS "
        "(annual figures are the hourly wage multiplied by 2,080 hours for most occupations).",
        "source": {
            "name": f"U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, national estimates, {period}",
            "url": "https://www.bls.gov/oes/tables.htm",
            "licence": "Public domain (U.S. federal government work)",
            "attribution": f"Source: U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics, {period}.",
        },
        "jobs": jobs,
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"us pipeline: wrote {len(jobs)} jobs to {OUT} ({period}); top-coded values present: {topcoded_any}")
    for sample in jobs[:: max(1, len(jobs) // 5)][:5]:
        print("  ", sample["code"], sample["title"], sample["p10"], sample["p25"], sample["p50"], sample["p75"], sample["p90"])


if __name__ == "__main__":
    main()
