#!/usr/bin/env python3
"""Export a compact dataset for the native caleb-tutty.com article.

Reads the built prototype assets in public/data and writes
<site>/static/data/volcanic-ash/:

  replay.json       event config, frame times, advisories, chronology, airports
  comparison.json   latest retained edition for each advisory volcano
  directory.json    dated MAGMA Type A/B/C table
  land.geojson      Natural Earth coastlines
  ir/*.webp         Himawari Band 13 frames (lossy WebP)
  ash/*.webp        locally derived Ash RGB frames (lossy WebP)

Times, source gaps and advisory revisions are retained. Coordinates are rounded
to four decimal places and browse images use lossy WebP: these exports are for
display, not quantitative pixel analysis. Requires `cwebp` on PATH.

Usage: python3 pipelines/export_site.py [--output site-export | --site PATH] [--skip-images]
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "public" / "data"
EVENT = DATA / "events" / "anak-krakatau-2026-09"
QUALITY = {"ir": 85, "ash": 80}


def load(path: Path):
    return json.loads(path.read_text())


def dump(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"{path.name}: {path.stat().st_size / 1024:.0f} KB")


def stamp(frame: dict) -> str:
    return Path(frame["url"]).stem


def encode(job: tuple[Path, Path, int]) -> None:
    source, target, quality = job
    if target.exists() and target.stat().st_mtime >= source.stat().st_mtime:
        return
    subprocess.run(
        ["cwebp", "-quiet", "-q", str(quality), "-m", "6", str(source), "-o", str(target)],
        check=True,
    )


def slim_product(p: dict) -> dict:
    return {
        "id": p["id"],
        "productId": p["productId"],
        "number": p["number"],
        "issuedAt": p["issuedAt"],
        "observedAt": p["observedAt"],
        "estimated": p["estimated"],
        "supersededBy": p["supersededBy"],
        "sourceUrl": p["sourceUrl"],
        "flags": p["flags"],
        "leadStates": p["leadStates"],
        "components": [
            {
                "id": c["id"],
                "lower": c["lower"],
                "upper": c["upper"],
                "leadHours": c["leadHours"],
                "validAt": c["validAt"],
                "kind": c["kind"],
                "coordinates": [[round(x, 4), round(y, 4)] for x, y in c["coordinates"]],
            }
            for c in p["components"]
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    destination = parser.add_mutually_exclusive_group()
    destination.add_argument("--site", type=Path, help="Write into a Svelte site checkout")
    destination.add_argument("--output", type=Path, help="Standalone output directory (default: site-export/)")
    parser.add_argument("--skip-images", action="store_true", help="Export metadata only; images must already exist for rendering")
    args = parser.parse_args()
    if args.site:
        if not (args.site / "svelte.config.js").exists():
            raise SystemExit(f"{args.site} does not look like the site repository")
        out = args.site / "static" / "data" / "volcanic-ash"
    else:
        out = args.output or ROOT / "site-export"
    if not args.skip_images and not shutil.which("cwebp"):
        raise SystemExit("cwebp is required. Install WebP tools or use --skip-images for metadata only.")
    if args.skip_images:
        print("Metadata-only export: referenced WebP images and the legend are not copied.")
    for sub in ("ir", "ash"):
        (out / sub).mkdir(parents=True, exist_ok=True)

    config = load(EVENT / "event.json")
    infrared = load(DATA / "himawari.json")
    ash = load(DATA / "ash-rgb.json")
    timeline = load(EVENT / "timeline.json")
    status = load(EVENT / "airport-status.json")
    airports = {a["id"]: a for a in load(DATA / "airports.json")["airports"]}
    catalog = load(DATA / "catalog.json")

    if not args.skip_images:
        jobs = [
            (DATA / f["url"].lstrip("/").removeprefix("data/"), out / kind / f"{stamp(f)}.webp", QUALITY[kind])
            for kind, archive in (("ir", infrared), ("ash", ash))
            for f in archive["frames"]
        ]
        with ThreadPoolExecutor() as pool:
            list(pool.map(encode, jobs))
        shutil.copy(DATA / "himawari-legend.png", out / "ir-legend.png")

    sources = {s["id"]: s for s in [*status["sources"], *timeline["sources"]]}
    dump(
        out / "replay.json",
        {
            "id": config["id"],
            "volcanoId": config["volcanoId"],
            "title": config["title"],
            "timeZone": config["timeZone"],
            "start": config["start"],
            "end": config["end"],
            "preferredStart": config["preferredStart"],
            "presentation": config["presentation"],
            "volcano": next(
                {"name": v["name"], "coordinates": v["coordinates"]}
                for v in catalog["volcanoes"]
                if v["id"] == config["volcanoId"]
            ),
            "imagery": {
                kind: {
                    "provider": archive["provider"],
                    "layer": archive["layer"],
                    "bounds": archive["bounds"],
                    "frames": [stamp(f) for f in archive["frames"]],
                    "limitations": archive["limitations"],
                }
                for kind, archive in (("ir", infrared), ("ash", ash))
            },
            "gaps": infrared["unavailableTimes"],
            "ashAttribution": ash["attribution"],
            "ashTermsUrl": ash["termsUrl"],
            "ashRecipe": ash["recipe"],
            "advisories": [
                slim_product(p) for p in catalog["products"] if p["volcanoId"] == config["volcanoId"]
            ],
            "advisorySourceUrl": catalog["sourceUrl"],
            "events": timeline["events"],
            "sources": [
                {k: s[k] for k in ("id", "provider", "publishedDate", "url")} for s in sources.values()
            ],
            "airports": [
                {
                    **a,
                    "coordinates": airports.get(a["id"], {}).get("coordinates"),
                    "locationSourceUrl": airports.get(a["id"], {}).get("sourceUrl"),
                }
                for a in status["airports"]
            ],
            "closureReport": status["closureReport"],
            "limitations": status["limitations"],
            "retrievedAt": catalog["retrievedAt"],
        },
    )

    cards = []
    for v in catalog["volcanoes"]:
        editions = sorted(
            (p for p in catalog["products"] if p["volcanoId"] == v["id"] and not p["supersededBy"]),
            key=lambda p: p["issuedAt"],
        )
        cards.append(
            {
                "id": v["id"],
                "name": v["name"],
                "region": v["region"],
                "coordinates": v["coordinates"],
                "editions": len(editions),
                "latest": slim_product(editions[-1]),
            }
        )
    dump(out / "comparison.json", {"retrievedAt": catalog["retrievedAt"], "volcanoes": cards})

    directory = load(DATA / "directory.json")
    directory.pop("inputSha256", None)
    for v in directory["volcanoes"]:
        v["coordinates"] = [round(n, 4) for n in v["coordinates"]]
    dump(out / "directory.json", directory)
    shutil.copy(DATA / "land.geojson", out / "land.geojson")

    total = sum(f.stat().st_size for f in out.rglob("*") if f.is_file())
    print(f"{out}: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
