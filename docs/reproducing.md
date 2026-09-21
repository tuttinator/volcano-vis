# Reproducing the work

Run commands from the repository root. No credentials or provider keys are used.
Retained snapshots make the factual build independent of changing provider
websites; live downloads may no longer return the same files.

## 1. Run and check the snapshot

Use Node.js 22.12+ and `npm ci`, then `npm test` and `npm run build`.
`npm run dev` serves <http://127.0.0.1:4178>. Committed imagery is sufficient;
neither satellite Python packages nor raw HSD bands are required. See the README
for browser checks.

## 2. Rebuild factual catalogs offline

Python 3.10+ and its standard library are sufficient:

```sh
npm run data:build
npm test
git diff -- public/data
```

`pipelines/build_data.py` runs the builders in dependency order:

| Builder | Retained inputs | Outputs in `public/data/` |
| --- | --- | --- |
| `build_catalog.py` | Darwin factual extract, GDACS archives, Natural Earth | `catalog.json`, `land.geojson` |
| `build_chronology.py` | Chronology facts and ESDM/BMKG reports | `chronology.json` |
| `build_directory.py` | MAGMA table and BIG locations | `directory.json` |
| `build_event.py` | Catalog, chronology and existing Himawari manifest | `events/anak-krakatau-2026-09/` contracts |
| `build_airports.py` | Retained DGCA airport pages | `airports.json` |

This does not rediscover every source or recreate the human transcription in
the factual extracts. Those inputs are part of the snapshot. For a new event,
preserve source documents and extraction decisions before adapting builders;
event windows and providers are currently specific to these cases.

## 3. Retrieve browse imagery (optional)

```sh
python3 pipelines/fetch_imagery.py    # NASA GIBS daily VIIRS crops
python3 pipelines/fetch_himawari.py  # Ten-minute Himawari Band 13 archive
```

These require network access and write imagery/manifests under `public/data/`.
Review source URLs, timestamps, gaps and hashes after a refetch. Preserve the
existing snapshot in Git to compare results against the article.

## 4. Rebuild Ash RGB (optional, several GB)

Follow the [Ash RGB method and pinned environment](ash-rgb-pipeline.md).
The committed archive has 579 outputs. The full builder resumes verified
outputs and will not recompute them simply because raw bands are absent.

For an independent rerender, use a separate checkout, install
`pipelines/requirements-ash.lock` in a virtual environment, move
`public/data/ash-rgb/` aside there, create an empty replacement directory, and run
`OMP_NUM_THREADS=2 .venv/bin/python pipelines/build_ash_archive.py`.
Keep `ash-rgb.json`: it supplies archive metadata. The builder regenerates
missing outputs, downloads their bands, and retains recorded source gaps.
Compare image hashes and the manifest with the original checkout; dependency
or platform differences must not silently become scientific changes. The pinned
satellite environment has not been validated on every Python/platform combination.

To check original band inputs without rerendering, use the
[restoration command](ash-rgb-pipeline.md#restore-raw-inputs-for-integrity-tests)
then `npm run test:raw`. It requires approximately 6.3 GB of downloads and fails
on missing inputs or checksum differences. It is separate from CI.

## 5. Build the article bundle

Install `cwebp` (for example `brew install webp` on macOS or `apt install webp`
on Debian/Ubuntu), then `npm run site:export`. Output defaults to ignored
`site-export/`; `--output PATH` selects another destination. `--site PATH`
explicitly writes into `PATH/static/data/volcanic-ash/` and requires a Svelte
checkout. Existing export files may be replaced; use a fresh output directory
when comparing exports or changing image quality settings.

WebP quality is 85 for infrared and 80 for Ash RGB; advisory/directory coordinates
are rounded to four decimal places. This is a display export, not a lossless
scientific archive. `--skip-images` exports metadata but not referenced images.

`npm run test:pipelines` checks standalone export, record preservation and
destination errors without a website checkout or WebP. See
[article alignment](article-alignment.md) for the consuming Svelte figures.
