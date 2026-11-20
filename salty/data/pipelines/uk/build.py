#!/usr/bin/env python3
"""Build data/out/uk.json for Salty: UK annual gross pay by occupation.

Source: ONS Annual Survey of Hours and Earnings (ASHE), Table 14
(occupation, 4-digit SOC 2020), Table 14.7a "Annual pay - Gross",
"Full-Time" sheet. Job-title aliases come from the ONS SOC 2020 Volume 2
coding index.

Usage (stdlib + openpyxl only; -I because it parses downloaded files):

    python3 -I build.py            # download if missing, build, verify
    python3 -I build.py --offline  # never touch the network

Downloads are cached in ./raw/ and are treated as untrusted data: they are
only ever parsed (zip + xlsx), never executed. The output is deterministic
for a given pair of input files: no timestamps, jobs sorted by code.

Nothing is interpolated or estimated. A value ONS suppressed is null.
"""

from __future__ import annotations

import collections
import hashlib
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
RAW = HERE / "raw"
OUT = HERE.parent.parent / "out" / "uk.json"

# ONS's fair use policy asks automated clients to identify themselves, so this
# does not pose as a browser. It fetches two files, once, and caches them. The
# policy also asks for a contact: set SALTY_USER_AGENT to a string that includes
# one (for example a project email) before running this on a schedule.
USER_AGENT = os.environ.get("SALTY_USER_AGENT") or (
    "salty-pay-data/0.1 (open pay statistics pipeline; fetches two files per year)"
)

ONS = "https://www.ons.gov.uk"
DATASET_PAGE = (
    ONS + "/employmentandlabourmarket/peopleinwork/earningsandworkinghours"
    "/datasets/occupation4digitsoc2010ashetable14"
)
YEAR = 2026
EDITION = "provisional"

ASHE = {
    "file": "ashetable142026provisional.zip",
    "url": ONS + "/file?uri=/employmentandlabourmarket/peopleinwork"
    "/earningsandworkinghours/datasets/occupation4digitsoc2010ashetable14"
    "/2026provisional/ashetable142026provisional.zip",
    # Hash of the file as downloaded on 2026-11-19. A mismatch is reported,
    # not fatal: ONS does reissue editions with corrections.
    "sha256": "4719f364d596739679d1bb492a1fc42e4c8e980a5b93ffc791e350f4ba8f4f1d",
}
SOC_INDEX = {
    "file": "soc2020volume2thecodingindexexcel20260827v3.xlsx",
    "url": ONS + "/file?uri=/methodology/classificationsandstandards"
    "/standardoccupationalclassificationsoc/soc2020"
    "/soc2020volume2codingrulesandconventions"
    "/soc2020volume2thecodingindexexcel20260827v3.xlsx",
    "sha256": "25dbe51cf21d4c3bb74b7e087aaa748eda1d443bade76a4e801685cee5966a57",
}
SOC_INDEX_PAGE = (
    ONS + "/methodology/classificationsandstandards"
    "/standardoccupationalclassificationsoc/soc2020"
    "/soc2020volume2codingrulesandconventions"
)

# Table 14.7a layout, checked against the file rather than assumed.
MEMBER_RE = re.compile(r"Table 14\.7a\s+Annual pay - Gross \d{4}\.xlsx$")
SHEET = "Full-Time"
PERCENTILES = (10, 20, 25, 30, 40, 60, 70, 75, 80, 90)
EXPECTED_HEADER = (
    "Description", "Code", "(thousand)", "Median", "change", "Mean", "change",
) + PERCENTILES
# Markers documented in the workbook's key. All mean "no usable value".
#   x  = CV > 20%, unreliable   .. = disclosive
#   :  = not applicable         -  = nil or negligible
SUPPRESSED = {"x", "..", ":", "-"}

FIELD_ORDER = (
    "code", "title", "employees",
    "p10", "p20", "p25", "p30", "p40", "p50", "p60", "p70", "p75", "p80", "p90",
    "mean", "aliases",
)
PCT_FIELDS = tuple(f for f in FIELD_ORDER if re.fullmatch(r"p\d\d", f))

MAX_ALIASES = 25
CORE_ALIASES = 15  # how many of the 25 come from the "core vocabulary" ranking


# --------------------------------------------------------------------------
# download
# --------------------------------------------------------------------------

def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(spec: dict, offline: bool) -> Path:
    """Return the cached file, downloading it first if it is not there."""
    RAW.mkdir(parents=True, exist_ok=True)
    path = RAW / spec["file"]
    if not path.exists():
        if offline:
            sys.exit(f"missing {path} and --offline was given")
        print(f"downloading {spec['url']}")
        req = urllib.request.Request(spec["url"], headers={"User-Agent": USER_AGENT})
        tmp = path.with_name(path.name + ".part")
        with urllib.request.urlopen(req, timeout=120) as resp, tmp.open("wb") as f:
            while chunk := resp.read(1 << 16):
                f.write(chunk)
        tmp.replace(path)
    digest = sha256(path)
    note = "matches pinned hash" if digest == spec["sha256"] else (
        f"DIFFERS from pinned {spec['sha256']} - ONS may have reissued the "
        "file; re-check the output")
    print(f"{path.name}: sha256 {digest} ({note})")
    return path


# --------------------------------------------------------------------------
# ASHE Table 14.7a
# --------------------------------------------------------------------------

def to_pounds(value, where: str):
    """Whole pounds, rounding half up. None for a suppressed/missing cell."""
    if value is None:
        return None
    if isinstance(value, str):
        marker = value.strip()
        if marker in SUPPRESSED or marker == "":
            return None
        raise ValueError(f"unexpected text {value!r} at {where}")
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"unexpected cell type {type(value).__name__} at {where}")
    if value < 0:
        raise ValueError(f"negative value {value!r} at {where}")
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def to_jobs(value, where: str):
    """Number of jobs is published in thousands; return a whole number."""
    if value is None:
        return None
    if isinstance(value, str):
        if value.strip() in SUPPRESSED or value.strip() == "":
            return None
        raise ValueError(f"unexpected text {value!r} at {where}")
    return int((Decimal(str(value)) * 1000).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def read_ashe(zip_path: Path):
    with zipfile.ZipFile(zip_path) as z:
        members = [n for n in z.namelist() if MEMBER_RE.search(n)]
        if len(members) != 1:
            raise ValueError(f"expected exactly one Table 14.7a file, found {members}")
        member = members[0]
        data = z.read(member)
    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    if SHEET not in wb.sheetnames:
        raise ValueError(f"no {SHEET!r} sheet in {member}: {wb.sheetnames}")
    rows = list(wb[SHEET].iter_rows(values_only=True))
    wb.close()

    title = str(rows[0][0] or "")
    for needle in ("Annual pay - Gross", "full-time employee jobs", "United Kingdom", str(YEAR)):
        if needle.lower() not in title.lower():
            raise ValueError(f"sheet title {title!r} does not mention {needle!r}")

    hdr_i = next((i for i, r in enumerate(rows[:20]) if r and r[0] == "Description"), None)
    if hdr_i is None:
        raise ValueError("header row (starting 'Description') not found")
    header = tuple(rows[hdr_i][: len(EXPECTED_HEADER)])
    if header != EXPECTED_HEADER:
        raise ValueError(f"unexpected header {header!r}")
    above = " ".join(str(r[2] or "") for r in rows[max(0, hdr_i - 2):hdr_i])
    if "Number" not in above or "of jobs" not in above:
        raise ValueError(f"column C is not 'Number of jobs': {above!r}")

    col = {"title": 0, "code": 1, "employees": 2, "p50": 3, "mean": 5}
    for i, p in enumerate(PERCENTILES):
        col[f"p{p}"] = 7 + i

    jobs, dropped, seen = [], [], set()
    n_rows = 0
    for n, r in enumerate(rows[hdr_i + 1:], start=hdr_i + 2):
        raw_code = r[1]
        if raw_code is None:
            continue  # "All employees", "Not Classified", footnotes
        code = str(raw_code).strip().lstrip("'").strip()
        if not re.fullmatch(r"\d{1,4}", code):
            raise ValueError(f"unexpected code {raw_code!r} at row {n}")
        n_rows += 1
        if len(code) != 4:
            continue  # major / sub-major / minor summary groups
        if code in seen:
            raise ValueError(f"duplicate code {code} at row {n}")
        seen.add(code)
        job = {"code": code, "title": re.sub(r"\s+", " ", str(r[0])).strip()}
        job["employees"] = to_jobs(r[col["employees"]], f"row {n} jobs")
        for f in PCT_FIELDS + ("mean",):
            job[f] = to_pounds(r[col[f]], f"row {n} {f}")
        job["aliases"] = []
        if job["p50"] is None:
            dropped.append(job)
        else:
            jobs.append(job)
    jobs.sort(key=lambda j: j["code"])
    meta = {"member": member, "title": title, "coded_rows": n_rows,
            "unit_groups": len(seen), "dropped": dropped}
    return jobs, meta


# --------------------------------------------------------------------------
# aliases from the SOC 2020 coding index
# --------------------------------------------------------------------------

ALIAS_OK = re.compile(r"[a-z][a-z' -]*[a-z]")
# "Accountant (qualified)" and "Engineer, electrical (professional)" are how
# the index tells a professional unit group from its non-professional default.
PROFESSIONAL_QUALIFIERS = {"professional", "qualified"}


def _words(title: str):
    return re.findall(r"[a-z']+", title)


def _dedupe_key(title: str) -> str:
    """'book keeper' / 'bookkeeper' / 'book-keepers' count as one alias."""
    return "".join(w[:-1] if len(w) > 3 and w.endswith("s") else w for w in _words(title))


def read_aliases(xlsx_path: Path, wanted: dict) -> dict:
    """code -> up to MAX_ALIASES everyday job titles, lower-case.

    Two kinds of index entry are used:

    * entries that map a title to a code with no qualifier at all (no
      "additional", "industry" or "see" term), so the bare title is how ONS
      codes that job. A bare title given to more than one code is dropped.
    * entries whose only qualifier is "professional" or "qualified". ONS codes
      a bare "accountant" to book-keepers (4122) and "accountant (qualified)"
      to chartered accountants (2421); both jobs get the alias "accountant",
      so these aliases are deliberately NOT unique across jobs.

    Everything else (industry or material qualifiers, grades, cross-references,
    titles with brackets, digits, slashes or ampersands, post-nominal style
    abbreviations of four letters or more) is skipped.

    The index has no frequency information, so "common" is approximated:
    first the titles built from the words that recur most among that unit
    group's own entries (its core vocabulary: 'software developer' before
    'drupal developer'), then the shortest remaining titles, with titles that
    use a word found nowhere else in the index, and 2-3 letter abbreviations,
    last.
    """
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    sheet = "SOC2020 coding index"
    if sheet not in wb.sheetnames:
        raise ValueError(f"no {sheet!r} sheet: {wb.sheetnames}")
    it = wb[sheet].iter_rows(values_only=True)
    header = [str(h) if h is not None else "" for h in next(it)]
    need = {"code": "SOC_2020", "occ": "INDEXOCC", "add": "ADD", "ind": "IND",
            "see": "SEE", "natural": "INDEXOCC_-_natural_word_order"}
    try:
        ix = {k: header.index(v) for k, v in need.items()}
    except ValueError as e:
        raise ValueError(f"coding index header changed: {header}") from e

    bare = collections.defaultdict(set)   # title -> codes, no qualifier
    prof = collections.defaultdict(set)   # title -> codes, professional/qualified
    abbreviations = set()
    global_df = collections.Counter()
    for r in it:
        code = r[ix["code"]]
        if isinstance(code, bool) or not isinstance(code, int):
            continue  # '}}}}' rows are cross-references, not codes
        code = f"{code:04d}"
        t = re.sub(r"\s+", " ", str(r[ix["natural"]] or "")).strip().lower()
        t = t.replace("\N{RIGHT SINGLE QUOTATION MARK}", "'")
        if not t:
            continue
        global_df.update(set(_words(t)))
        if r[ix["ind"]] or r[ix["see"]]:
            continue
        qualifier = str(r[ix["add"]] or "").strip().lower()
        if qualifier and qualifier not in PROFESSIONAL_QUALIFIERS:
            continue
        if not ALIAS_OK.fullmatch(t) or len(t) > 40:
            continue
        occ = str(r[ix["occ"]] or "").strip()
        if occ.isupper() and " " not in occ and "," not in occ:
            if len(occ) >= 4:
                continue  # FRCP, RSCN, TEFL ...
            abbreviations.add(t)  # GP, CEO, PA: kept, ranked last
        (prof if qualifier else bare)[t].add(code)
    wb.close()

    by_code = collections.defaultdict(set)
    for table in (bare, prof):
        for t, codes in table.items():
            if len(codes) == 1:
                by_code[next(iter(codes))].add(t)

    out = {}
    for code, title in wanted.items():
        cands = {t for t in by_code.get(code, ()) if t != title.lower()}
        df = collections.Counter(w for t in cands for w in set(_words(t)))

        def core_key(t):
            ws = _words(t)
            return (t in abbreviations, -min(df[w] for w in ws), len(ws), len(t), t)

        def short_key(t):
            ws = _words(t)
            return (t in abbreviations, min(global_df[w] for w in ws) < 2,
                    len(ws), len(t), t)

        chosen, keys = [], set()

        def take(ranked, limit):
            for t in ranked:
                if len(chosen) >= limit:
                    break
                k = _dedupe_key(t)
                if k in keys:
                    continue
                keys.add(k)
                chosen.append(t)

        take(sorted(cands, key=core_key), CORE_ALIASES)
        take(sorted(cands, key=short_key), MAX_ALIASES)
        out[code] = chosen
    return out


# --------------------------------------------------------------------------
# output + verification
# --------------------------------------------------------------------------

def render(doc: dict) -> str:
    """Stable JSON: fixed key order, one job per line."""
    head = {k: v for k, v in doc.items() if k != "jobs"}
    lines = json.dumps(head, indent=2, ensure_ascii=False)
    if not lines.endswith("\n}"):
        raise ValueError("unexpected JSON head")
    lines = lines[:-2]
    job_lines = [
        "    " + json.dumps({k: j[k] for k in FIELD_ORDER}, ensure_ascii=False,
                            separators=(", ", ": "))
        for j in doc["jobs"]
    ]
    return lines + ',\n  "jobs": [\n' + ",\n".join(job_lines) + "\n  ]\n}\n"


def verify(jobs, meta) -> int:
    print(f"\nsheet: {meta['title']}")
    print(f"file:  {meta['member']}")
    print(f"coded rows {meta['coded_rows']}, of which 4-digit unit groups {meta['unit_groups']}")
    print(f"dropped (median suppressed): {len(meta['dropped'])}")
    for j in meta["dropped"]:
        print(f"   {j['code']} {j['title']}")
    print(f"jobs written: {len(jobs)}")
    print("non-null coverage:")
    for f in FIELD_ORDER:
        if f == "aliases":
            n = sum(1 for j in jobs if j["aliases"])
        else:
            n = sum(1 for j in jobs if j[f] is not None)
        print(f"   {f:<9} {n:>4} / {len(jobs)}")
    print(f"   aliases total {sum(len(j['aliases']) for j in jobs)}")
    seen = collections.Counter(a for j in jobs for a in j["aliases"])
    shared = sorted(a for a, n in seen.items() if n > 1)
    print(f"   aliases distinct {len(seen)}, appearing under more than one job: {len(shared)}")

    strict = ("p10", "p25", "p50", "p75", "p90")
    bad_strict, bad_any = [], []
    complete = 0
    for j in jobs:
        vals = [j[f] for f in strict]
        if all(v is not None for v in vals):
            complete += 1
            if not all(a < b for a, b in zip(vals, vals[1:])):
                bad_strict.append((j["code"], vals))
        present = [(f, j[f]) for f in PCT_FIELDS if j[f] is not None]
        for (fa, a), (fb, b) in zip(present, present[1:]):
            if a > b:
                bad_any.append((j["code"], fa, a, fb, b))
    print(f"p10<p25<p50<p75<p90 where all five present: {complete} jobs checked, "
          f"{len(bad_strict)} violations")
    for v in bad_strict:
        print("   VIOLATION", v)
    print(f"non-decreasing across every present percentile: {len(bad_any)} violations")
    for v in bad_any:
        print("   VIOLATION", v)
    return len(bad_strict) + len(bad_any)


def main(argv) -> int:
    offline = "--offline" in argv
    ashe_path = fetch(ASHE, offline)
    soc_path = fetch(SOC_INDEX, offline)

    jobs, meta = read_ashe(ashe_path)
    aliases = read_aliases(soc_path, {j["code"]: j["title"] for j in jobs})
    for j in jobs:
        j["aliases"] = aliases.get(j["code"], [])

    doc = {
        "country": "uk",
        "currency": "GBP",
        "period": f"{YEAR} ({EDITION})",
        "basis": "Annual gross pay, full-time employees",
        "source": {
            "name": (
                "Office for National Statistics, Annual Survey of Hours and Earnings "
                f"(ASHE) Table 14.7a: Annual pay - Gross, full-time employee jobs, "
                f"United Kingdom, {YEAR} {EDITION}. Job-title aliases: ONS SOC 2020 "
                "Volume 2 coding index."
            ),
            "url": DATASET_PAGE,
            "licence": "Open Government Licence v3.0",
            "attribution": (
                "Source: Office for National Statistics licensed under the Open "
                "Government Licence v.3.0"
            ),
        },
        "jobs": jobs,
    }
    text = render(doc)
    json.loads(text)  # must round-trip as valid JSON
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_name(OUT.name + ".part")
    tmp.write_text(text, encoding="utf-8", newline="\n")
    tmp.replace(OUT)
    print(f"wrote {OUT} ({len(text.encode('utf-8'))} bytes, "
          f"sha256 {hashlib.sha256(text.encode('utf-8')).hexdigest()})")
    problems = verify(jobs, meta)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
