# Blog presentation prototypes

Designed after inspecting the public caleb-tutty.com homepage: editorial serif typography, restrained green/cream tones, and compact monospaced annotations. The existing site appears to be Svelte-based; this prototype is a standalone React build and requires no change to the site's framework.

1. **Advisory explorer** (`?view=explorer`): edition playback, volcano selector, altitude filtering, initial versus +6/+12/+18 hour positions, NASA daily imagery toggle, exact report times and uncertainty notes. An interactive east–west altitude cross-section intersects the selected polygons at a chosen latitude, marked by a dashed line on the map. Its boxes show reported pressure-altitude bounds, with a schematic SFC baseline. An optional 3D view uses MapLibre extrusion of the same source lower/upper bounds; `dimension=3d` persists in share links. The caption explains that flight levels are pressure-altitude bands, SFC is a flat schematic baseline, and shapes are not measured ash volumes. Best for readers who want to inspect the evidence themselves.
2. **Editorial story** (`?view=story`): light visual essay with four guided chapters and a three-day satellite image comparison. Satellite images can be viewed individually, as a draggable/keyboard-controlled swipe, or side by side. Dates are independently selectable and swappable; identical-date selections are labelled. A swipe is allowed only for matching extents and projections. Best as the main article experience. The chapters distinguish observations, estimates and forecasts, then widen to other volcanoes.
3. **Volcano comparison** (`?view=compare`): six cards on a common approximate kilometre scale, source issue times, initial/forecast footprints, and an inspectable edition table. Best as an overview or article figure. Reports are explicitly asynchronous; neither altitude nor report count is presented as a risk ranking.

4. **Event replay** (`?view=replay`): ten-minute infrared imagery, source gaps, official report markers and qualified airport evidence on one clock. Defaults to 5 September 00:00 WIB, with earlier context available.

The first three derive from one advisory catalog; replay uses a separate image and chronology archive. The comparison's scale is a local equirectangular approximation corrected for latitude; displayed footprints span a few degrees at most. The highest flight-level bound in an edition is not summit elevation or a measured concentration.

5. **All volcanoes** (`?view=directory`): nationwide map and searchable 127-entry directory from PVMBG’s dated Type A/B/C table. Region and type filters, submarine labels and links into the six available volcano advisory collections. Useful as an article companion.

## Embedding for review

The current preview runs at `http://127.0.0.1:4178`. Use `?view=story&embed=1` to hide the surrounding prototype navigation. All remote scientific data has been downloaded; no provider API keys or CORS access are required in the reader's browser. Fonts have local fallbacks.

For a future subpath deployment, build with:

```sh
npm run build -- --base=/experiments/volcanoes/
```

Serve `dist/` at that path. Public data paths use Vite's base URL. Example article markup, once deployed:

```html
<iframe
  src="/experiments/volcanoes/?view=story&embed=1"
  title="Indonesian volcanic ash: observations, estimates and forecasts"
  width="100%"
  height="1600"
  loading="lazy"
  style="border:0"
></iframe>
```

The iframe has its own scrolling; the prototype does not send cross-origin resize messages. A native Svelte port could remove that constraint later. Nothing has been published to the blog.

## Before a finished event article

Anak Krakatau now has selected 5–12 September advisories and ten-minute infrared imagery for late 4–8 September. The other volcanoes retain independent archive windows. Do not title this a complete reconstruction: the earliest recovered 5 September advisory is 13:30 WIB, source image gaps remain, and closure starts are unknown. The full Ash RGB window is processed; original NOTAMs and the early advisories still need sourcing. See `event-windows.md` for episode selection and `data-inventory.md` for source evidence.

## Verified subpath integration

`npm run build:embed` creates `dist-blog/` with `/experiments/volcanoes/` as the base. `npm run test:embed` serves it beneath that exact mount inside an article iframe. The server returns 404 for missing assets and paths outside the mount, so a development-server fallback cannot hide broken URLs.

The integration test passes through all five presentations and verifies the MapLibre worker request, local coastline request, decoded VIIRS image, swipe control, volcano switching, directory classification filter, comparison cards and Ash RGB selection. It checks for browser exceptions, HTTP errors, root-level asset leakage and mobile overflow in both the article and iframe. Prototype navigation and masthead are hidden by embed mode.

To inspect the local article fixture manually after building:

```sh
python3 tests/embed/server.py
```

Open `http://127.0.0.1:4181/article.html`. This is an integration fixture, not a published blog page. The final site's deployment configuration and content integration remain to be applied in the blog repository.

### Paired event replay

In Event replay, enable “Show comparison pane”. Compare infrared with Ash RGB at the same clock time, or select “Same product, two times” and a fixed offset. Each pane shows its own source scan time and clears in gaps. The event time, product, pair mode, offset, altitude band, polygon visibility, full-extent setting and timezone persist in the URL for article links. For example, add `replayBand=100-200&replayAsh=1&replayExtent=1&replayZone=UTC` to open an ash overlay filtered to FL100–FL200 with UTC labels and the full ash extent. Unsupported filter values recover to defaults. Both panes share altitude filters; advisory geometry is selected at each pane’s time. Map navigation is independent.

## Proposed article flow

The [working article draft](blog-draft.md) leads with the visual essay, opens a paired Ash RGB/infrared example at 5 September 13:30 WIB, then connects Merapi and Semeru to the nationwide directory. Its relative links target the proposed `/experiments/volcanoes/` deployment and remain unpublished.

## Directory links

The directory preserves its search, official type, region and selected entry in the URL. For example, `?view=directory&directoryType=B&directoryRegion=Jawa&directorySearch=Merbabu&directoryVolcano=jawa-merbabu` opens Merbabu in the dated Type B inventory. Reset filters removes these parameters. Unsupported types or regions fall back to the full inventory; they never create inferred categories such as “dormant”.
