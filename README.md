# An archipelago of ash

Five source-backed visualization prototypes for an eventual caleb-tutty.com article, built with React, TypeScript, Vite and MapLibre GL JS.

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4178`. Choose **Advisory explorer**, **Editorial story**, **Volcano comparison**, **Event replay**, or **All volcanoes**.

The app contains 104 Darwin VAAC editions and 470 geometries across Anak Krakatau, Merapi, Semeru, Lewotolok, Ibu and Dukono, plus 26 NASA VIIRS daily image crops and 579 ten-minute Himawari infrared frames. All scientific data and real Natural Earth coastlines are served locally. Observed, estimated and forecast positions are distinct; corrections are retained; source timestamps and limitations remain visible. No synthetic scientific data is displayed.

```sh
npm run data:build       # Rebuild advisory, chronology and directory catalogs plus coastlines
npm run build           # Type-check and production build
npm test                # Source/data integrity and temporal rules
npx playwright test     # Presentation browser checks; install Chromium first
```

Run `python3 pipelines/fetch_imagery.py` with network access to retrieve the NASA image requests. `TEST_PRODUCTION=1 npx playwright test` tests the built bundle. An existing Chromium executable can be supplied using `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Rendered imagery is included in Git; the roughly 6.3 GB of downloadable raw satellite bands is excluded. The app and production build work without those bands, but `npm test` verifies their checksums and requires restoring them first using the [raw archive instructions](docs/ash-rgb-pipeline.md#restore-raw-inputs-for-integrity-tests).

**Coverage is partial:** Anak Krakatau advisories cover 5–12 September 2026; Semeru also has a 19–24 November 2025 episode and six daily VIIRS crops; Merapi has a 12–17 March 2023 sequence and seven daily crops; the remaining volcanoes have independent September archive sequences. The event replay defaults to 5 September 00:00 WIB, retains late-4-September context, and includes official chronology and qualified airport evidence. Imagery includes daily true colour and ten-minute infrared brightness temperature, and locally derived four-band Ash RGB. The initial scientific reconstruction gate remains open. See [source inventory](docs/data-inventory.md), [blog options and embedding](docs/blog-options.md), and [implementation plan](plans/indonesia-volcanic-ash-visualisation-plan.md).

The prototype is explanatory, not a warning service. Nothing has been deployed or published to the blog.

Rebuild chronology with `python3 pipelines/build_chronology.py`. Fetch the resumable event imagery archive with `python3 pipelines/fetch_himawari.py`. See [window selection](docs/event-windows.md) for date choices and pending historical cases.

The nationwide directory (`?view=directory`) preserves all 127 entries in MAGMA Indonesia’s 20 September 2021 table, including Type A/B/C classifications and submarine labels. Rebuild it with `python3 pipelines/build_directory.py`. The date is explicit; this is not a live activity or alert-level inventory.

The event replay also supports advisory polygons on its shared clock: explicit 60-minute initial-position display windows, exact forecast targets, altitude filtering and a full-extent camera option. See [completion audit](docs/completion-audit.md) for remaining original-plan work.

An independently selectable **Ash RGB archive** is available in replay; the full event build is complete with 579 frames, 10 source gaps and zero failures across 589 clock slots. It is derived from archived HSD bands; [reproduction instructions](docs/ash-rgb-pipeline.md) include the pinned Python environment, recipe and source attribution.

Blog-subpath integration: `npm run build:embed` then `npm run test:embed`. The strict iframe fixture verifies all five presentations under `/experiments/volcanoes/` without a development-server fallback.

A [working article draft](docs/blog-draft.md) connects the visual essay, paired replay, historical episodes and official classification directory with proposed deployment links.
