# Relationship to the article

Reviewed against `src/routes/posts/indonesia-volcanic-ash/+page.svx` and
`src/lib/vis/volcanic-ash/` in the sibling website checkout on 21 September 2026.
The title is **Reading Indonesia’s volcanic skies** and the local frontmatter
has no `draft: true` flag. This reviews local source, not deployed status or provider permissions.

## Figure-to-code map

| Article figure | Native website component | Standalone equivalent | Exported inputs |
| --- | --- | --- | --- |
| Fig. 01, satellite/advisory/airport replay | `AshReplay.svelte`, `ReplayPane.svelte` | `apps/web/src/EventReplay.tsx`, `AirportMap.tsx`; `?view=replay` | `replay.json`, `ir/`, `ash/`, `ir-legend.png`, `land.geojson` |
| Fig. 02, six volcanoes at a common distance scale | `FootprintMultiples.svelte` | Comparison in `apps/web/src/main.tsx`; `?view=compare` | `comparison.json` |
| Fig. 03, 127-entry classification directory | `VolcanoDirectory.svelte` | `apps/web/src/Directory.tsx`; `?view=directory` | `directory.json`, `land.geojson` |

`pipelines/export_site.py` consumes `public/data/` and builds the smaller article
bundle. The Svelte components live in the website repository; they are not
generated from React. The advisory explorer, altitude section, 3D extrusion and
daily VIIRS story remain additional research views here.

## Shared interpretation rules

- Images display within ±7 minutes of a nominal scan; otherwise clear the layer.
- Initial advisory positions display for 60 minutes from their position time.
- Forecasts display only at their exact target times; they are not accumulated ashfall.
- Advisory issue times constrain which revisions are available on the replay clock.
- Scheduled closure expiry becomes unknown without explicit reopening evidence.
- Chronology uses occurrence times: it is retrospective, not what was known live.
- Missing or unidentifiable ash stays distinct from a positive observation of clear air.

React rules live in `apps/web/src/lib/replayAdvisories.ts` and
`apps/web/src/data/event.ts`; the site has a separate `replay-logic.ts`.
Changes to these semantics need review in both repositories. CI here does not
validate the separate Svelte implementation.

## Presentation differences

The article opens at **5 September 2026, 13:30 WIB** (`06:30 UTC`), the first
recovered advisory. Its Svelte component hardcodes that opening time. The
standalone event configuration opens at **00:00 WIB** the same day, retaining
earlier satellite/chronology context. Both use the archive from 4 September
15:00 UTC through 8 September 17:00 UTC. Exported `preferredStart` retains the
standalone value; it does not control the article opening.

The article opens with paired images on wider screens and Ash RGB on small
screens. The standalone replay has more exploration controls. These presentation
differences do not require changing the scientific archive.

Comparison exports select the latest non-superseded edition per volcano across
retained episodes; they do not synchronize all six to one event time. The
standalone catalog additionally supports historical episodes.

## Keeping the article reproducible

The review found one data correction made only in the website: “Atungbusu” was
identified as Atung Bungsu Airport in Pagar Alam. That correction is now in the
retained chronology and airport builder here. The [DGCA profile](https://hubud.kemenhub.go.id/bandara/302)
was retrieved on 21 September 2026 and retained as `data/raw/airports/atungbusu.html`
with a generated checksum. Its reference coordinates match the website export;
its reopening remains unknown. Older airport profiles retain their original
retrieval dates. This restores export parity without inferring operating status.

1. Update evidence or builders here and run `npm run data:build`.
2. Review generated diffs and run integrity and temporal-rule tests.
3. Export to a standalone directory and inspect the bundle.
4. Export explicitly with `--site`, review that repository’s data diff, and run
   its `npm run check` and `npm run build` commands there.
5. Review all three figures and captions, including the initial clock, missing
   scans, corrections, forecast targets and unknown airport states.

The website holds the current editorial text. Older drafts, prototype options
and completion audits here explain development decisions, not publication
status. Removal of a draft flag is not evidence of a redistribution grant.
