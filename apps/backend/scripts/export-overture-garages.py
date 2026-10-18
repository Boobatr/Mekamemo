"""
Exports every Canadian car-repair business from Overture Maps (free, open data) into a
compact gzipped NDJSON file that `prisma/import-garages.js` loads into the garages table.

Why: OpenStreetMap barely lists garages outside big cities (none in Beaupré, for example),
while Overture — built from Meta, Microsoft and Foursquare business listings — knows
most of them, with address and phone number.

Run it a few times a year to refresh the data, then commit the new file:

    pip install duckdb
    python scripts/export-overture-garages.py                      # latest release below
    python scripts/export-overture-garages.py --release 2026-12-17.0 --min-confidence 0.5

Release list: https://overturemaps-us-west-2.s3.amazonaws.com/?prefix=release/&delimiter=/
Data © Overture Maps Foundation (places: CDLA Permissive 2.0).
"""
import argparse
import gzip
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

import duckdb

DEFAULT_RELEASE = "2026-09-23.1"
DEFAULT_OUT = Path(__file__).resolve().parent.parent / "prisma" / "data" / "garages-ca.ndjson.gz"

# Rough bounding box of Canada: lets DuckDB skip the parts of the file for the rest of the world.
CANADA_BBOX = {"xmin": -141.1, "xmax": -52.5, "ymin": 41.6, "ymax": 83.3}

GARAGE_FILTER = """
  addresses[1].country = 'CA'
  AND (array_to_string(taxonomy.hierarchy, ' > ') ILIKE '%automotive_repair%'
       OR taxonomy.primary IN ('automotive_service', 'auto_body_shop', 'tire_shop', 'tire_dealer_and_repair'))
  AND coalesce(operating_status, 'open') NOT IN ('closed', 'permanently_closed')
  AND taxonomy.primary NOT IN ('trailer_repair', 'motorsport_vehicle_repair')
  AND names.primary IS NOT NULL
"""


# A garage is kept only if another garage with the same postal-code area lies this close.
CORROBORATION_KM = 50


def distance_km(a_lat, a_lng, b_lat, b_lng) -> float:
    return math.hypot((a_lat - b_lat) * 111, (a_lng - b_lng) * 111 * math.cos(math.radians(a_lat)))


def postal_area(postcode):
    """'g0a 1e0' -> 'G0A' (the first three characters of a Canadian postal code), else None."""
    code = (postcode or "").replace(" ", "").upper()[:3]
    ok = len(code) == 3 and code[0].isalpha() and code[1].isdigit() and code[2].isalpha()
    return code if ok else None


def drop_uncorroborated(rows):
    """
    The source data has a small share of garages whose coordinates contradict their own postal
    code (a Sherbrooke garage placed in Vancouver, a Québec City garage with a Montérégie postal
    code). They would show up as "the nearest garage" in the wrong region, so drop a garage when
    its postal-code area has other garages but none within CORROBORATION_KM of it. A remote village
    whose neighbours share its postal area is kept; an area with fewer than three garages can't be
    checked and is kept as is.
    """
    by_area = defaultdict(list)
    for row in rows:
        by_area[postal_area(row[6])].append(row)

    kept = []
    for area, group in by_area.items():
        if area is None or len(group) < 3:
            kept.extend(group)
            continue
        for row in group:
            if any(other is not row and distance_km(row[10], row[11], other[10], other[11]) <= CORROBORATION_KM for other in group):
                kept.append(row)
    return kept


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", default=DEFAULT_RELEASE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--min-confidence", type=float, default=0.5)
    args = parser.parse_args()

    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
    path = f"s3://overturemaps-us-west-2/release/{args.release}/theme=places/type=place/*"
    box = CANADA_BBOX

    print(f"Reading Overture {args.release} (this takes a few minutes)...", file=sys.stderr)
    rows = con.execute(
        f"""
        SELECT id, names.primary, taxonomy.primary,
               addresses[1].freeform, addresses[1].locality, addresses[1].region, addresses[1].postcode,
               phones[1], emails[1], websites[1], bbox.ymin, bbox.xmin, confidence
        FROM read_parquet('{path}', hive_partitioning=1)
        WHERE bbox.xmin BETWEEN {box['xmin']} AND {box['xmax']}
          AND bbox.ymin BETWEEN {box['ymin']} AND {box['ymax']}
          AND confidence >= {args.min_confidence}
          AND {GARAGE_FILTER}
        """
    ).fetchall()

    found = len(rows)
    rows = drop_uncorroborated(rows)
    print(f"Dropped {found - len(rows)} of {found} garages whose position contradicts their postal code.", file=sys.stderr)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with gzip.open(args.out, "wt", encoding="utf-8", compresslevel=9) as out:
        out.write(json.dumps({"release": args.release, "minConfidence": args.min_confidence}) + "\n")
        for (pid, name, category, street, city, region, postcode, phone, email, website, lat, lng, conf) in rows:
            out.write(
                json.dumps(
                    {
                        "id": pid,
                        "name": name.strip(),
                        "category": category,
                        "street": street,
                        "city": city,
                        "region": region,
                        "postcode": postcode,
                        "phone": phone,
                        "email": email,
                        "website": website,
                        "lat": round(lat, 6),
                        "lng": round(lng, 6),
                        "confidence": round(conf, 2),
                    },
                    ensure_ascii=False,
                    separators=(",", ":"),
                )
                + "\n"
            )

    size_mb = args.out.stat().st_size / 1_000_000
    print(f"{len(rows)} garages written to {args.out} ({size_mb:.1f} MB)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
