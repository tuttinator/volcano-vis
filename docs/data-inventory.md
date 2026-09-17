# Source inventory — 12 September 2026

The running application now uses real data. The complete 4–8 September event-reconstruction gate remains **open**.

| Input | Retained evidence | Coverage / limitations |
| --- | --- | --- |
| Darwin VAAC | `data/raw/darwin-factual-extract-2026-09-12.json` → `public/data/catalog.json` | 94 source editions, 460 geometries; Krakatau 5–12 September, others 11–12 September; Krakatau, Semeru, Lewotolok, Ibu, Dukono. Factual field extract from the accessible official web page, not byte-identical original TAC. Direct HTTP downloads returned 403. |
| NASA GIBS / Suomi NPP VIIRS | `public/data/imagery.json` and 13 PNGs | Two daily true-colour crops per volcano (11–12 September), plus Krakatau on 5, 6 and 7 September. Full request URL, extent, CRS and SHA-256 per asset. Daily mosaic; exact overpass time not provided. Not an ash-specific RGB product. |
| Natural Earth v5.1.2 | `data/raw/ne_50m_land.geojson` → regional `public/data/land.geojson` | Actual 1:50m coastlines, public domain. Whole polygons intersecting the regional bounds retained, without inventing coastal geometry. |
| GIBS service metadata | `data/raw/gibs-capabilities.xml` | Confirms layer, projection support, daily time dimension and date coverage. |
| Eruption chronology | Preserved official HTML in `data/raw/reports/`, factual input and `public/data/chronology.json` | Six timed markers from ESDM and BMKG. Publication dates and retrospective evidence distinguished from event times. |
| Airports | BMKG 7/8 September reports in the chronology archive | Nine distinct identities across two differing eight-airport lists. Scheduled closure and reported reopening shown separately; actual closure starts remain unknown. |
| GDACS Darwin mirror | `data/raw/gdacs-krakatau-gts.html` | Earlier Krakatau TAC messages. Duplicate rendered continuation suffixes removed; duplicate editions prefer BOM. Archive SHA-256 recorded. Earliest retained issue: 5 September 13:30 WIB. |
| Himawari AHI Band 13 | `public/data/himawari.json` and 579 PNGs | 4 September 15:00 UTC–8 September 17:00 UTC, ten-minute nominal scans, ten published gaps, no failed requests. Every frame retains URL, checksum, extent and CRS. Infrared brightness temperature, not an ash mask. |

Rebuild the catalog and coastlines with `npm run data:build`. Re-fetch imagery with `python3 pipelines/fetch_imagery.py`; existing files are reused. Scientific assets are served locally; runtime does not require the remote providers.

Advisory conversion preserves OBS versus EST, explicit forecast timestamps, altitude components and correction lineage. Source coordinates are converted from degrees/minutes to decimal degrees, rounded to six decimals. Polygon rings are closed without interpolation. The UI selects editions, not an invented continuous validity interval. The event replay now applies the plan’s explicitly derived, end-exclusive 60-minute display window to initial positions, including estimates. It uses only issues available by the selected time and displays forecasts only at exact targets. The edition explorer continues to show individual source products without asserting continuous validity.

The two Krakatau #2026/215 editions expose a corrected position-time typo. Both remain in the catalog; the explorer uses the later correction. The initial uncorrected issue has a position timestamp after its issue time; this is retained rather than silently rewritten.

## Sources

- [Darwin advisory archive](https://www.bom.gov.au/products/Volc_ash_recent.shtml)
- [Darwin product specification](https://www.bom.gov.au/aviation/data/education/volcanic-ash-advisories.pdf)
- [NASA GIBS API documentation](https://nasa-gibs.github.io/gibs-api-docs/access-basics/)
- [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/)
- [Natural Earth v5.1.2 input](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_land.geojson)
- [BMKG closure report, 7 September](https://www.bmkg.go.id/berita/utama/imbas-sebaran-abu-vulknaik-anak-krakatau-8-bandara-ditutup-sementara-bmkg-minta-waspada-dan-tenang)
- [BMKG reopening report, 8 September](https://www.bmkg.go.id/berita/utama/bmkg-ungkap-abu-vulkanik-negatif-8-bandara-beroperasi-kembali-dan-pemerintah-terus-laksanakan-omc)

## Remaining event-reconstruction gate

Recover the missing morning advisories; retrieve ash-specific imagery and acquisition metadata; obtain original NOTAM intervals and resolve differing airport lists; review reuse constraints. The current real-data prototypes do not substitute daily true colour for Ash RGB or claim to reconstruct the full event.

## Nationwide directory

`data/raw/magma-volcano-types.html` preserves the complete [PVMBG / MAGMA table](https://magma.esdm.go.id/v1/edukasi/tipe-gunung-api-di-indonesia-a-b-dan-c), updated 20 September 2021, retrieved 12 September 2026. `pipelines/build_directory.py` extracts all 127 rows into `public/data/directory.json`, with the input checksum and source date. Names, regions, coordinates and classifications are retained, including the two Sumbing entries in different regions. Five explicit name mappings connect to the existing advisory catalog; they do not alter the source labels.

Counts: 76 Type A, 30 Type B, 21 Type C. These are historical classifications, not current alert levels. A July 2026 Badan Geologi summary has different category totals (77/29/21) without identifying which entries explain the difference; the UI discloses that discrepancy. BNPB already reported 77/29/21 in December 2020, so it does not establish a recent reclassification. The retained BIG atlas inventory also conflicts (80/27/20 including submarine entries); see `classification-review.md`. The 127-entry scope is the official table, not every extinct volcanic landform.

The exploratory BIG atlas download is retained in `data/raw/big-*` but is **not used**: its table contained unnamed entries and older classifications, including Sinabung as Type B. No guessed corrections or merged duplicate identities are displayed.

## Ash RGB event archive

The event archive contains 579 locally calibrated Ash RGB crops, each with four preserved NOAA-hosted JMA HSD band inputs, across 4 September 15:00 UTC–8 September 17:00 UTC. Ten source gaps complete the 589-slot accounting; zero processing failures remain. The event replay offers these separately from Band 13, clears outside tolerance, and shows attribution and recipe. See [processing and reuse notes](ash-rgb-pipeline.md). Full-window imagery coverage and provenance checks pass; the other source-gate requirements remain open.

## Semeru historical advisories

`data/raw/gdacs-semeru-2025-gts.html` preserves the GDACS Darwin mirror; the catalog includes its 30 editions issued 19–24 November 2025 and records the HTML checksum. Explicit forecast statuses (NOT AVBL and NO VA EXP) are retained with their supplied target times, separately from polygon geometry. `catalog.events` provides distinct November 2025 and September 2026 windows, preventing an edition slider from silently spanning the nine-month archive gap. Source SUMMIT ELEV and SOURCE ELEV variants are normalized without inferring heights.

### Event advisory GeoJSON

`public/data/events/anak-krakatau-2026-09/advisories.geojson` is rebuilt by `pipelines/build_event.py`. It includes editions issued within the replay window and all their polygon components, including forecast targets beyond the window. The collection’s `editions` member preserves empty lead assessments and correction metadata. Geometry coordinates are longitude/latitude; timestamps are Unix milliseconds UTC; vertical bounds are flight levels. These records need the documented temporal selection rules before display and do not supply continuous validity intervals. The replay links to this inspectable asset. Source reuse review still applies.

### Event airport-status contract

`events/anak-krakatau-2026-09/airport-status.json` preserves the report identities, scheduled closure bounds, unknown actual closure start, reopening instants, source records and limitations from the retained chronology. The event configuration points to this asset separately from airport coordinates and the eruption timeline. `schemas/airport-status.schema.json` accepts a null closure report and an empty airport list; these mean unavailable evidence, not open airports. The replay loads this asset and merges its source references with the eruption timeline. Multiple closure cycles are not yet represented.

### Observation records

`events/anak-krakatau-2026-09/observations.geojson` preserves the six source-linked chronology events as inspectable GeoJSON features. Each retains its reported time, precision, original time wording, qualification notes, source URL and publication date. Geometry is null because the chronology supplies no observation coordinates; in particular, the two airport paper-test summaries are not replicated as measured observations at individual airport reference points. The replay links to the asset. Contract checks compare every feature with its timeline marker and source.
