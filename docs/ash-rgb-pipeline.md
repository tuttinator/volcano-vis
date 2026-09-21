# Ash RGB archive pipeline

The pipeline started with three actual Himawari-9 scans at 04:00, 04:10 and 04:20 UTC on 5 September 2026 (11:00–11:20 WIB). A resumable build now extends that sample across the 589 ten-minute clock slots from 4 September 15:00 UTC through 8 September 17:00 UTC. The full build completed with 579 rendered frames and 10 documented source gaps, accounting for all 589 slots with zero processing failures. These are locally derived scientific composites, not generated illustrations or an official JMA image product.

## Reproduce

The commands below bootstrap the original three-frame sample in a checkout
without a full archive manifest. On a normal clone, use the full-window builder
below; the sample builder deliberately refuses to overwrite the full archive.
See [independent rerendering](reproducing.md#4-rebuild-ash-rgb-optional-several-gb)
to recompute committed outputs rather than resume them.

```sh
python3 -m venv .venv
.venv/bin/pip install -r pipelines/requirements-ash.lock
.venv/bin/python pipelines/fetch_ash_sample.py
OMP_NUM_THREADS=2 .venv/bin/python pipelines/build_ash_sample.py
```

The fetcher downloads the four 2-km HSD bands B11, B13, B14 and B15, segment 06 of 10, for each nominal scan. The relevant southern-hemisphere segment covers the complete target crop. Source URLs, byte sizes and SHA-256 values are retained in `data/raw/ahi-ash/sources.json` and the output manifest. Missing or corrupt downloads fail rather than becoming placeholder data.

Satpy 0.60.0 reads each source header, calibrates digital counts to brightness temperature in kelvin and resamples with nearest neighbours (5 km radius) onto a common 640×564 EPSG:3857 grid covering 101–109°E, 9–2°S. All 579 output crops have 100% finite pixel coverage. Calibration warnings occur for invalid/off-Earth source pixels; no such pixels remain in these cropped outputs.

The recipe follows Satpy 0.60.0's [`ahi.yaml`](https://github.com/pytroll/satpy/blob/v0.60.0/satpy/etc/composites/ahi.yaml) and [`generic.yaml`](https://github.com/pytroll/satpy/blob/v0.60.0/satpy/etc/enhancements/generic.yaml):

| Channel | Calibrated input | Fixed stretch |
| --- | --- | --- |
| Red | BT15 − BT13 | −4 to +2 K |
| Green | BT14 − BT11 | −4 to +5 K |
| Blue | BT13 | 243 to 303 K |

Channels are clipped to [0,1], scaled to 255, rounded, and written as RGBA PNG with transparent invalid pixels. Gamma is 1. No image-dependent contrast enhancement or temporal interpolation is applied. These choices are explicitly recorded; they are not presented as identical to every published JMA RGB variant.

## Full-window build

After the initial manifest exists, run:

```sh
OMP_NUM_THREADS=2 .venv/bin/python pipelines/build_ash_archive.py
```

Use `--limit N` for a bounded batch. Completed images are verified by checksum and reused. Four raw bands download concurrently, with at most two scans in flight. Each successful frame checkpoints the manifest atomically. Source HTTP 404 responses are recorded separately from processing or transient download failures; a resumed run retries failed scans. No failed request is counted as a completed image. Full completion requires every clock slot to contain a rendered frame or an explicit source-absence record and zero failures.

The full build retains several gigabytes of compressed source bands. The crop-before-resampling optimization reduced the three-frame processing benchmark to 3.59 seconds and produced pixel-identical PNG checksums for all three comparison frames. It adds a 0.1-degree spatial margin around the output bounds before nearest-neighbour resampling. The production recipe and output grid are unchanged. The sample-only manifest builder refuses to run when the manifest contains an event archive, before writing any images or metadata. Resume with the full-window command.

## Restore raw inputs for integrity tests

Git includes rendered images and provenance manifests, but excludes downloadable `data/raw/ahi-ash/*.DAT.bz2` source bands. The default `npm test` verifies committed outputs and input metadata without these bands. Restore them before running the separate `npm run test:raw` (about 6.3 GB of downloads). The archive builder reuses completed images and does not restore missing raw inputs. This command downloads the manifest URLs and verifies checksums without changing the rendered archive:

```sh
python3 - <<'PY'
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

archive = json.loads(Path('public/data/ash-rgb.json').read_text())
for frame in archive['frames']:
    for source in frame['inputs']:
        path = Path(source['path'])
        if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256']:
            continue
        with urlopen(source['url'], timeout=120) as response:
            raw = response.read()
        if hashlib.sha256(raw).hexdigest() != source['sha256']:
            raise ValueError(f'Checksum mismatch: {path}')
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix('.part')
        temporary.write_bytes(raw)
        temporary.replace(path)
PY
```

## Interpretation and reuse

Ash RGB can help separate ash-like and gas-like signatures from the surrounding scene. It does not establish concentration, plume height or ash extent by itself. Clouds, ice, low/thin plumes and viewing geometry can confound the colours. See the [JMA Ash RGB quick guide](https://www.jma.go.jp/jma/jma-eng/satellite/VLab/QG/RGB_QG_Ash_en.pdf).

Raw data is served by the [NOAA public Himawari archive](https://registry.opendata.aws/noaa-himawari/). [JMA's reuse terms](https://www.jma.go.jp/jma/en/copyright.html), retained in `data/raw/jma-reuse-terms.html`, require source attribution and disclosure of modifications, and exclude material with separate third-party rights. The UI and manifest identify the product as locally derived from JMA data via NOAA and do not imply JMA endorsement. This records the applicable source guidance; it does not resolve reuse of every other dataset in the application.

## Coverage and checks

`public/data/ash-rgb.json` lists each source input, recipe, crop geometry, output checksum, pixel coverage and per-band temperature ranges. Default tests verify output PNGs and input metadata, band membership, dates, dimensions and finite cropped coverage. `npm run test:raw` additionally verifies every raw band checksum. Coverage tests check that images, source gaps and failures have unique clock slots, reconcile with totals, stay within event bounds and agree with the completion flag. Browser tests cover switching, paired products/times, missing images and failed requests.

The broader 4–8 September Ash RGB animation is processed: 579 frames, 10 source gaps and zero failures. Partial coverage is not treated as continuous coverage: the ordinary ±7-minute nearest-frame policy applies, and the image layer clears outside tolerance. The existing Band 13 imagery remains available independently.
