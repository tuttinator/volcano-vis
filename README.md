# Reading Indonesia’s volcanic skies

Data pipelines, retained source evidence and a standalone interactive explorer
behind [Reading Indonesia’s volcanic skies](https://caleb-tutty.com/posts/indonesia-volcanic-ash).
Replay Anak Krakatau’s September 2026 satellite scans alongside ash advisories
and airport reports, compare six volcanoes, and explore a dated national directory.

The article uses native Svelte figures in
[caleb-tutty.com](https://github.com/tuttinator/caleb-tutty.com/tree/main/src/lib/vis/volcanic-ash).
This repository contains the Python processing pipeline and React/TypeScript
research interface. You can run it without the website checkout, API keys, or
downloading the original satellite bands. See the [article alignment guide](docs/article-alignment.md)
for the figure-to-code mapping and differences between the interfaces.

## Run locally

Use Node.js 22.12 or newer (Node 22 is recorded in `.nvmrc`) and npm.

```sh
git clone https://github.com/tuttinator/volcano-vis.git
cd volcano-vis
npm ci
npm run dev
```

Open <http://127.0.0.1:4178/?view=replay>. The navigation also offers the advisory
explorer, editorial story, volcano comparison and national directory. Rendered
imagery is included: `public/` is approximately 238 MB. Scientific assets and
coastlines are served locally.

This is a retrospective explanation, not an operational warning service.
An absent polygon does not establish that the air was clear of ash; Ash RGB
does not measure ash concentration. Source times, gaps and corrections remain explicit.

## Reproduce and verify

```sh
npm test                 # Rules, contracts, provenance and committed image checksums
npm run build            # Type-check and build the standalone app
npm run data:build       # Rebuild factual catalogs offline; requires Python 3.10+
npm run test:pipelines   # Export integration checks; Python standard library only
```

Default tests work on a fresh clone. For optional raw-band checksum verification,
[restore approximately 6.3 GB of inputs](docs/ash-rgb-pipeline.md#restore-raw-inputs-for-integrity-tests),
then run `npm run test:raw`. Default tests still verify every committed Ash RGB
PNG and its input metadata; the raw test fails if any recorded band is absent or corrupt.

For browser checks:

```sh
npx playwright install chromium
npm run test:browser
npm run build:embed
npm run test:embed
```

`TEST_PRODUCTION=1 npm run test:browser` checks an existing production build.
Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an installed Chromium executable.

The [reproduction guide](docs/reproducing.md) distinguishes rebuilding retained
facts, retrieving provider images, processing satellite data, and exporting the
article bundle. The pinned satellite Python environment is only needed for Ash RGB processing.

## Export the article data

Install WebP command-line tools (`cwebp` on PATH), then:

```sh
npm run site:export                         # Writes site-export/ in this repository
npm run site:export -- --output /tmp/volcanic-ash
# Optional: explicitly target a local website checkout
npm run site:export -- --site ../caleb-tutty.com
```

The approximately 22 MB bundle contains replay, comparison and directory JSON,
coastlines, a legend and WebP frames. `--skip-images` exports metadata only and
does not produce a complete viewable bundle. Coordinates are rounded and WebP
is lossy; use original manifests and PNGs for analysis.

## What is included

| Material | Coverage |
| --- | --- |
| Darwin VAAC advisories | 104 editions, 470 geometries, six volcanoes; corrections retained |
| Himawari Band 13 and derived Ash RGB | 579 frames each, 10 source gaps across 589 ten-minute slots, 4–8 September 2026 |
| VIIRS daily crops | 26 images, including Merapi in March 2023 and Semeru in November 2025 |
| National directory | All 127 rows of MAGMA’s Type A/B/C table, updated 20 September 2021 |

Coverage is partial and asynchronous. The earliest retained Krakatau advisory
is 5 September 2026 at 13:30 WIB; imagery begins before it. Original airport
NOTAMs are missing: the track distinguishes scheduled closure, expiry and
reported reopening using report-level evidence. The directory is a historical
classification table, not a current alert inventory.

## Repository guide

| Path | Purpose |
| --- | --- |
| `apps/web/src/` | React interface and temporal selection rules |
| `pipelines/` | Factual builders, imagery retrieval, Ash RGB processing, article export |
| `data/raw/` | Retained snapshots and provenance; downloaded HSD bands are ignored |
| `public/data/` | Built catalogs, event contracts, imagery and checksums |
| `schemas/`, `tests/` | Data contracts, scientific display rules, browser and pipeline checks |
| `docs/`, `plans/` | Methods, inventories and historical design records |

Start with [reproduction](docs/reproducing.md), [article alignment](docs/article-alignment.md),
[source inventory](docs/data-inventory.md), and [Ash RGB methods](docs/ash-rgb-pipeline.md).
Earlier [blog options](docs/blog-options.md), [article draft](docs/blog-draft.md),
and [completion audit](docs/completion-audit.md) are historical design records;
the website repository holds the current article text.

## Contributing and reuse

See [CONTRIBUTING.md](CONTRIBUTING.md) for checks and source-data conventions.
Original code and documentation are [MIT licensed](LICENSE). Third-party data,
source pages and imagery are **not covered by MIT**; see [DATA_LICENSE.md](DATA_LICENSE.md).
The retained [reuse review](docs/data-reuse-review.md) records unresolved
redistribution questions. Code licensing does not clear the bundled data for public release.
