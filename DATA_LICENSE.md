# Data and imagery

The [MIT license](LICENSE) applies to original project code and documentation.
It does not grant rights to the third-party materials in `data/raw/` or
`public/data/`, including normalized records and derived imagery. There is no
single open-data license for this collection.

| Material | Origin and transformation | Provenance |
| --- | --- | --- |
| Advisory records and outlines | Darwin VAAC / Australian Bureau of Meteorology, including GDACS archive copies; normalized coordinates, times and flight levels | `public/data/catalog.json`, `data/raw/darwin-factual-extract-2026-09-12.json` |
| Infrared and daily true-colour imagery | JMA Himawari and NASA VIIRS products accessed through NASA GIBS | `public/data/himawari.json`, `public/data/imagery.json` |
| Ash RGB composites | JMA HSD via NOAA Open Data; local calibration, resampling and compositing | `public/data/ash-rgb.json`, [recipe](docs/ash-rgb-pipeline.md) |
| Chronology, airport evidence and locations | ESDM/PVMBG, BMKG and DGCA; extracted facts and source-linked summaries | `public/data/chronology.json`, `public/data/airports.json` |
| Volcano classification and locations | PVMBG/MAGMA dated table and BIG location data | `public/data/directory.json`, [inventory](docs/data-inventory.md) |
| Coastlines | Natural Earth v5.1.2; public domain | `data/raw/ne_50m_land.geojson` |

Preserve the provider names, source URLs, dates, transformation notes and
limitations when reusing these materials. NASA or GDACS hosting does not by
itself establish rights to third-party content.

The [retained data reuse review](docs/data-reuse-review.md) records unresolved
questions about redistribution of Darwin advisories and Indonesian-provider
materials. This repository cleanup does not resolve them or claim permission
to redistribute the entire data bundle. Resolve those questions before a
public release of the bundled data, including retained HTML and Git history.
