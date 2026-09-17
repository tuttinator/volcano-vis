# Indonesia Volcanic Ash Explorer

## Codex implementation plan

**Implementation status:** Data feasibility must pass before this is presented as an event reconstruction. A separate, visibly labelled synthetic interaction prototype may be developed while source access is unresolved. Synthetic fixtures must never satisfy the scientific data gate.

**Real-data prototype update (12 September 2026):** Five presentations now include 94 Darwin editions / 460 geometries for five volcanoes, 13 VIIRS crops, 579 ten-minute Himawari infrared frames, sourced chronology and airport evidence, and a 127-entry PVMBG Type A/B/C directory. The event replay synchronizes advisory polygons with the image clock using explicitly derived 60-minute initial-position windows and exact forecast target times. Infrared Band 13 is not Ash RGB, and the source gate remains open. See `docs/completion-audit.md`, `docs/data-inventory.md` and `docs/blog-options.md`.

**Initial demonstrator:** Anak Krakatau eruption, 4–8 September 2026  
**Expansion target:** other monitored Indonesian volcanoes  
**Primary experience:** a time-controlled map showing how observed and forecast volcanic ash changes by date, time and altitude

## 1. Goal

Build an interactive web visualisation that lets a user:

- play through the Anak Krakatau eruption on a map;
- drag a date/time slider to inspect conditions at a particular moment;
- distinguish satellite-observed ash, advisory polygons, forecasts, volcanic gas and ground observations;
- select an altitude or flight level;
- understand which places, airports and populations may have been affected;
- inspect the evidence and timestamp behind every displayed layer;
- later switch to other volcanoes and eruption periods without changing the core application.

This is an explanatory and exploratory product. It must not present itself as an operational aviation or public-safety warning service.

## 2. Recommended scope

### POC

The first version should reconstruct one well-documented event: Anak Krakatau from `2026-09-04T15:00:00Z` through `2026-09-08T17:00:00Z` (4–9 September in western Indonesia, depending on the selected time).

Include:

1. A regional map covering southern Sumatra, the Sunda Strait and western Java.
2. A time slider with playback, stepping and event markers.
3. Himawari-9 Ash RGB imagery or a pre-generated equivalent animation.
4. Volcanic Ash Advisory/Graphic polygons by altitude and validity time.
5. Eruption observations from PVMBG or the Smithsonian/USGS event chronology.
6. One or two high-resolution Landsat/VIIRS snapshots.
7. Airports and their known closure/reopening periods.
8. Optional Sentinel-5P SO2 and NASA FIRMS thermal layers, clearly labelled as not being direct ash measurements.
9. A source/evidence panel for the selected time.

### Deferred until after the POC

- live operational monitoring;
- predictive ash-concentration modelling;
- push alerts;
- nationwide historical ingestion;
- user accounts;
- a mobile-native application;
- claims about ground-level ash concentration where no direct measurement exists.

## 3. User experience

### Main layout

Use a desktop-first layout with four regions:

1. **Header:** event/volcano selector, current alert status, UTC/WIB toggle and About/Methodology link.
2. **Map:** the dominant canvas, with satellite imagery, ash polygons, airports and observations.
3. **Layer and altitude controls:** compact panel on the left or right.
4. **Timeline:** a persistent control along the bottom, with the evidence/details drawer opening above it.

The selected date and time must always be prominent. Default to WIB for the Anak Krakatau event, with UTC shown secondarily because aviation products use UTC.

### Time-slider device

The slider is the central interaction. Implement it as a shared application clock rather than separate controls for each dataset.

#### Controls

- play/pause;
- jump to beginning/end;
- step backward/forward one frame;
- playback speeds of 0.5×, 1×, 2× and 4×;
- date and time readout;
- draggable scrubber;
- optional date picker for long events;
- UTC/WIB toggle;
- “snap to event” toggle;
- keyboard controls: Space to play/pause, arrow keys to step, Shift+arrow to jump to the previous/next major event.

#### Timeline tracks

Display aligned tracks beneath the slider:

- eruption reports;
- satellite acquisitions;
- ash advisories/SIGMET periods;
- airport closures;
- ground ash observations;
- notable milestones such as the beginning and end of continuous lava fountaining.

Use distinct symbols rather than implying that every source is a continuous time series.

#### Slider resolution

- Default POC frame interval: **10 minutes**, matching Himawari full-disk observations.
- Keep the canonical clock moving through missing imagery. Clear the unavailable scientific layer and show a data-gap state; never jump past other layers’ events to hide a gap.
- Do not interpolate advisory boundaries unless a layer is explicitly marked as modelled/interpolated.
- When the user stops between source observations, show the most recent valid record according to that source's validity rules.

#### Temporal validity rules

Each layer adapter must implement:

```ts
interface LayerSelection {
  frame: LayerFrame;
  selectionMethod: "exact" | "valid-period" | "nearest" | "nearest-prior";
  offsetMinutes: number; // source time minus selected time; positive means future
}

interface TemporalLayerAdapter {
  getFrameAt(time: string): LayerSelection | null;
  getAvailableTimes(range: TimeRange): string[];
  getValidity(frame: LayerFrame): {
    validFrom: string;
    validTo: string | null;
  };
}
```

Rules by source:

| Source | Selection rule |
| --- | --- |
| Himawari imagery | Exact timestamp, otherwise nearest within ±7 minutes; ties prefer the earlier frame. Label future selections explicitly. This retrospective policy is not an as-known-at-the-time view. |
| VAA/VAG observed polygon | Observation is an instant, not a supplied validity interval. For this retrospective POC, hold from max(observation time, issue time) until a newer eligible observation or observation time + 60 minutes, whichever comes first. Select only issues available by the selected time. Label this derived display window and age; never treat NXT ADVISORY as expiry. |
| SIGMET | Use the explicit validity interval, end exclusive; apply corrections/cancellations by product identity and issue time. |
| VAA forecast polygon | Display at its explicit forecast valid timestamp. Leads are relative to OBS/EST VA DTG, not issue time. For a shared target timestamp, select the latest issued cycle available by that target time, then its latest revision; preserve every altitude component. Never carry a forecast forward. |
| PVMBG eruption event | Display as a point event; optionally leave a marker in the event log. |
| Landsat, VIIRS or Sentinel snapshot | Nearest within ±7 minutes, earlier on ties, with acquisition timestamp and snapshot badge. |
| Airport status | Display over the documented closure/reopening interval. |
| Ground ash test | Show as a timestamped point, not a continuous measurement. |
| SO2 | Use the acquisition/coverage interval; never interpolate it as ash. |

Playback and stepping visit the sorted union of ten-minute ticks, source observation/forecast instants, and timeline events. Thus off-grid point events remain reachable. Intervals are [start, end); null ends mean unknown, not indefinitely confirmed. A selection result carries selection method and signed offset because these depend on the requested time, not just the frame.

Show a freshness badge such as “Image: 4 min before selected time” whenever the map is not displaying an exact observation.

### Altitude control

Provide two related modes:

- **2D mode:** filter ash polygons by flight-level band.
- **3D mode:** extrude or position polygons at their reported lower and upper flight levels.

Suggested filters:

- all levels;
- surface–FL150;
- FL150–FL200;
- FL200–FL300;
- FL300–FL500;
- custom flight level.

The map legend must update with the selected altitude. Where a product only supplies a plume top, render it as an uncertain vertical extent rather than a precise solid volume.

### Map layers

Separate the layer controls into the following groups.

**Ash evidence**

- Himawari Ash RGB;
- true-colour satellite imagery;
- observed aviation ash polygon;
- forecast aviation ash polygon;
- confirmed ashfall or positive airport paper test.

**Related signals**

- Sentinel-5P SO2;
- VIIRS/MODIS thermal anomalies;
- visible eruption plume;
- wind direction at the selected pressure/flight level.

**Exposure and context**

- airports and status;
- administrative boundaries;
- population density;
- towns and cities;
- optional air-quality stations;
- volcano exclusion zone.

Use different visual grammar for observations and forecasts. Recommended styling:

- observed ash: warm brown/purple fill with solid outline;
- forecast ash: transparent fill with dashed outline;
- SO2: blue/cyan scale;
- thermal anomaly: red point;
- confirmed ground ash: black/grey observation marker;
- uncertain or stale data: reduced opacity plus a visible warning.

### Evidence panel

Clicking a feature or stopping the timeline should expose:

- dataset and provider;
- observation, issue and validity times;
- observed versus forecast status;
- altitude or flight-level range;
- original wording where legally reusable, otherwise a concise summary;
- link to the source product;
- processing method;
- known limitations.

## 4. Data sources

Prioritise authoritative sources and preserve their provenance.

| Priority | Source | Initial use |
| --- | --- | --- |
| 1 | BMKG and aviation volcanic-ash products | SIGMET/advisory context, plume height/direction and airport impacts. |
| 1 | PVMBG/Badan Geologi | Eruption times, plume observations, seismic summaries and alert status. |
| 1 | Himawari-9 AHI | Ten-minute Ash RGB animation. |
| 1 | Darwin VAAC products or a reliable official archive/mirror | Observed and forecast ash geometry and flight levels. |
| 2 | NASA Earthdata/GIBS, VIIRS and Landsat | Regional and high-resolution satellite snapshots. |
| 2 | Copernicus Sentinel-5P | SO2 and aerosol-index context. |
| 2 | GFS or ERA5 | Wind fields by altitude. |
| 2 | Smithsonian Global Volcanism Program | Normalised volcano identifiers and historical eruption chronology. |
| 3 | NASA FIRMS | Thermal anomalies near the vent. |
| 3 | BMKG/KLHK air-quality observations | Contextual ground measurements, with attribution caveats. |
| 3 | WorldPop and OpenStreetMap | Population and place/airport context. |

Starting references:

- [BMKG Anak Krakatau update, 7 September 2026](https://www.bmkg.go.id/siaran-pers/imbas-sebaran-abu-vulknaik-anak-krakatau-8-bandara-ditutup-sementara-bmkg-minta-waspada-dan-tenang)
- [NASA Earth Observatory event imagery](https://science.nasa.gov/earth/earth-observatory/anak-krakatau-rumbles-again/)
- [Smithsonian/USGS Weekly Volcanic Activity Report](https://volcano.si.edu/reports_weekly.cfm)
- [Smithsonian GVP web services](https://volcano.si.edu/database/webservices.cfm)
- [JMA Himawari-8/9 imager specification](https://www.data.jma.go.jp/mscweb/en/himawari89/space_segment/spsg_ahi.html)
- [Copernicus Sentinel-5P collection](https://dataspace.copernicus.eu/data-collections/copernicus-sentinel-missions/sentinel-5p)
- [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)

## 5. Data model

Normalise source material into a small number of domain entities.

```ts
type EvidenceKind =
  | "satellite-ash"
  | "advisory-observed"
  | "advisory-forecast"
  | "eruption-report"
  | "ashfall-observation"
  | "sulfur-dioxide"
  | "thermal-anomaly"
  | "air-quality"
  | "airport-status";

interface TimeEstimate {
  earliest: string;
  latest: string;
  precision: "exact" | "minute" | "hour" | "day" | "range";
}

interface EvidenceRecord {
  id: string;
  volcanoId: string;
  eventId: string;
  kind: EvidenceKind;
  observedAt: string | null; // populated only when a canonical instant is justified
  observationTimeEstimate: TimeEstimate | null;
  reconciliationNotes: string[];
  supportingSourceIds: string[];
  issuedAt: string | null;
  validFrom: string;
  validTo: string | null;
  forecastLeadHours: number | null;
  forecastValidAt: string | null;
  productType: "VAA" | "SIGMET" | "other";
  productId: string;
  revision: number;
  componentId: string;
  supersedesId: string | null;
  lowerFlightLevel: number | null;
  upperFlightLevel: number | null;
  geometry: GeoJSON.Geometry | null;
  rasterAssetUrl: string | null;
  value: number | null;
  unit: string | null;
  confidence: "confirmed" | "probable" | "modelled" | "unknown";
  sourceName: string;
  sourceUrl: string;
  sourceRecordId: string | null;
  licence: string | null;
  processingNotes: string[];
}
```

Additional entities:

- `Volcano`: identifiers, names, coordinates, elevation and aliases;
- `EruptionEvent`: start/end, summary, alert levels and significant milestones;
- `SourceProduct`: provider, volcano, product number/year, revision, original asset hash and provenance; unique independently of derived evidence.
- `AirportStatus`: stable airport identifier, reported status, effective start/end estimates, actual versus scheduled reopening, evidence sources and reconciliation notes. Unknown reopening is explicit; it must not imply confirmed closure forever. Conflicting reports remain inspectable.
- `TimelineEvent`: UI-ready event marker with importance and category;
- `RasterFrame`: source asset, timestamp, bounds, projection and rendering recipe.

Store all canonical timestamps in UTC. Format them as WIB or UTC only at the presentation layer.

## 6. Technical architecture

### Recommended stack

- **Frontend:** React with TypeScript.
- **Mapping:** MapLibre GL JS for the default 2D map; deck.gl for raster overlays, time-dependent polygons and optional 3D extrusion.
- **Application state:** Zustand or a small reducer-based store containing one canonical `selectedTime`.
- **API:** NestJS, matching the existing TypeScript stack.
- **Geospatial database:** PostgreSQL/PostGIS once multiple events are supported.
- **ETL and scientific processing:** Python using `xarray`, `rasterio`, `rioxarray`, `geopandas`, `shapely`, `pyproj` and `satpy` where appropriate.
- **Raster delivery:** Cloud-Optimized GeoTIFFs or pre-rendered XYZ/PMTiles for the POC.
- **Vector delivery:** GeoJSON for the POC; vector tiles or PMTiles when national scale makes GeoJSON too large.

### POC simplification

For the first event, avoid building a full operational ingestion platform. Preprocess immutable source data into versioned static assets:

```text
data/
  catalog.json
  volcanoes.geojson
  events/anak-krakatau-2026-09/
    event.json
    timeline.json
    advisories.geojson
    airport-status.json
    observations.geojson
    rasters.json
    sources.json
```

The frontend can load these assets directly. Introduce NestJS/PostGIS after the interaction and data model are validated.

## 7. Repository structure

```text
volcanic-ash-explorer/
  apps/
    web/
      src/components/
      src/features/map/
      src/features/timeline/
      src/features/evidence/
      src/lib/time/
    api/
      src/events/
      src/evidence/
      src/volcanoes/
  pipelines/
    himawari/
    vaac/
    pvmbg/
    sentinel5p/
    winds/
    common/
  data/
  docs/
    methodology.md
    data-provenance.md
  tests/
    fixtures/
    visual/
```

## 8. Codex work plan

### Phase 0 — Resolve data access and licensing

Codex should:

1. Confirm the exact spatial and temporal bounds of the demonstration.
2. Inventory every retrievable product for 4–8 September 2026.
3. Record source URLs, timestamps, formats, licences and redistribution constraints.
4. Obtain representative files before choosing the raster pipeline.
5. Check whether aviation advisories are available as IWXXM/XML, TAC text, PNG/PDF graphics, or only archived web products.
6. Determine whether Himawari source data can be redistributed or whether derived tiles should be generated locally with attribution.

**Deliverable:** `docs/data-inventory.md` and a small set of sample files.

**Exit criterion:** three usable timestamped ash raster frames, one advisory containing observed and forecast components, one eruption report, and sourced airport closure/reopening evidence are locally reproducible with documented reuse constraints. If unavailable, report the gap and continue only as an explicitly synthetic interaction prototype; do not claim a reconstructed event.

**Required sequence:** Phase 0 → representative Phase 1 chronology and fixtures → Section 11 vertical slice → full Phase 1/2 ingestion → remaining UI phases. Phase numbers group work; this dependency order controls execution.

### Phase 1 — Establish the event chronology

1. Extract the eruption chronology from PVMBG, BMKG and GVP.
2. Reconcile WIB and UTC timestamps.
3. Represent uncertainty explicitly where reports conflict or give approximate times.
4. Encode airport closure/reopening intervals.
5. Create `event.json`, `timeline.json` and automated schema validation.

**Exit criterion:** a human-readable timeline and machine-readable timeline agree, and all displayed claims have a source.

### Phase 2 — Build the temporal data pipeline

1. After the representative vertical slice passes, download or retrieve Himawari frames for the event bounds.
2. Generate an Ash RGB product using a documented band recipe, or retain a provider-generated product when licensing permits.
3. Reproject and crop rasters consistently.
4. Create lower-resolution preview tiles for fast scrubbing.
5. Parse VAA/SIGMET products into GeoJSON with altitude and validity attributes.
6. Import Landsat/VIIRS snapshots.
7. Optionally process Sentinel-5P SO2 and wind fields.
8. Generate a single `catalog.json` containing all available timestamps.

**Exit criterion:** a script can rebuild the POC dataset from source inputs without manual editing of generated files.

### Phase 3 — Implement the map shell

1. Initialise the React/TypeScript application.
2. Add the regional base map and volcano marker.
3. Add the canonical time store.
4. Implement raster and vector layer adapters.
5. Add altitude filters and legend.
6. Add feature inspection and evidence links.

**Exit criterion:** changing `selectedTime` updates every enabled layer consistently.

### Phase 4 — Implement and harden the time slider

1. Build the timeline tracks and scrubber.
2. Add play/pause, stepping, speed controls and keyboard operation.
3. Implement valid-period and nearest-frame selection.
4. Prefetch the next and previous raster frames.
5. Show missing, approximate and stale states visibly.
6. Add event snapping and major-event annotations.
7. Prevent rapid dragging from issuing unbounded network requests.

Implementation guidance:

- render a low-resolution frame while scrubbing;
- load the full-resolution frame after a short debounce;
- cancel obsolete requests with `AbortController`;
- cache a sliding window around the current frame;
- keep UI animation time separate from dataset validity time;
- do not silently carry a frame beyond its permitted maximum age.

**Exit criterion:** smooth playback on a typical laptop and deterministic results when selecting the same timestamp repeatedly.

### Phase 5 — Add impact and explanatory layers

1. Add airports and status intervals.
2. Add affected places and optional population density.
3. Add the eruption chronology drawer.
4. Add comparison explanations for ash, SO2, heat and PM2.5.
5. Add a methodology page and safety disclaimer.

**Exit criterion:** a non-specialist can explain what moved where, at which altitude, and which claims are observations versus forecasts.

### Phase 6 — Add 3D and comparison modes

Only after the 2D timeline is stable:

1. Extrude aviation polygons by flight level with deck.gl or migrate the relevant view to CesiumJS.
2. Add an altitude cross-section.
3. Add before/after swipe for selected satellite images.
4. Add a split-screen comparison between two timestamps.

**Exit criterion:** the 3D view clarifies vertical wind shear and does not imply unsupported volumetric precision.

### Phase 7 — Generalise to other volcanoes

1. Replace event-specific assumptions with adapters and configuration.
2. Import GVP identifiers and Indonesian volcano aliases.
3. Add a volcano/event selector.
4. Test with one frequent ash emitter, preferably Dukono or Ibu.
5. Test with a different hazard profile, preferably Merapi.
6. Add per-volcano default camera bounds and layer availability.

**Exit criterion:** adding an event requires data/configuration changes but no frontend component changes.

## 9. Testing strategy

### Unit tests

- UTC/WIB conversion across date boundaries;
- frame-selection rules;
- advisory validity intervals;
- flight-level filtering;
- source freshness calculation;
- missing-frame behaviour;
- parsing of representative VAA/IWXXM/TAC fixtures.

### Data-validation tests

- valid GeoJSON geometries;
- coordinates within plausible bounds;
- `validTo >= validFrom`;
- forecast issue time precedes forecast valid time;
- no unexplained source records;
- raster bounds and CRS match catalog metadata;
- duplicate source products are rejected by provider/volcano/product/revision;
- multiple derived records may share a source product; derived IDs include kind, valid timestamp, altitude component and revision;
- corrected cycles supersede earlier revisions without dropping other altitude bands;
- uncertain observation times and unknown reopening boundaries survive ingestion unchanged.

### End-to-end tests

- moving the slider changes raster and vector layers together;
- pause freezes the canonical time;
- altitude changes do not alter the selected time;
- clicking an ash polygon shows its evidence and validity period;
- UTC/WIB toggling changes labels but not the underlying instant;
- missing imagery produces a visible data-gap state;
- shared URLs restore event, time, altitude and enabled layers.

### Visual-regression tests

Capture at least these states:

1. eruption beginning;
2. plume reaching high altitude;
3. simultaneous east/west movement at different levels;
4. detached high-level ash cloud;
5. airport closure period;
6. data-gap state;
7. mobile layout.

### Accessibility tests

- complete keyboard control of the slider;
- screen-reader announcement of selected time and major events;
- colour-independent distinction between observed and forecast layers;
- adequate contrast;
- reduced-motion mode that disables automatic playback animation.

## 10. Definition of done for the POC

The POC is complete when:

- the Anak Krakatau event can be played from beginning to end;
- the user can drag, step and play the 10-minute timeline;
- the map clearly communicates the selected date, time and timezone;
- ash can be filtered by altitude/flight level;
- observations and forecasts are visually and textually distinct;
- every displayed scientific layer includes provenance and timestamp;
- missing or stale data are never silently presented as current;
- at least one airport-impact interval is visible;
- the application loads quickly enough for smooth scrubbing after initial prefetch;
- automated tests cover the core temporal rules;
- the methodology warns that SO2, heat and PM2.5 are not direct substitutes for measured ash concentration.

## 11. Suggested implementation order for the first Codex session

After the Phase 0 data gate and representative chronology pass, Codex should build the smallest vertical slice. Before that gate passes, the same interaction work may use separately named synthetic fixtures with persistent on-screen labels and no claims of historical accuracy:

1. Scaffold the React application and static event catalog.
2. Display a base map centred on Anak Krakatau.
3. Implement the canonical clock and a basic 10-minute slider.
4. Load three representative timestamped raster frames.
5. Load one observed and one forecast ash polygon.
6. Connect all layers to the same clock.
7. Add a source timestamp/freshness panel.
8. Add tests for exact, nearest-prior and validity-period selection.

Do not ingest the full event until this vertical slice proves that the time model and visual transitions work correctly.

## 12. Key risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Operational data are difficult to download or redistribute | Begin with documented static products and store source metadata; publish derived data only when licensing permits. |
| Clouds obscure visible ash | Use infrared Ash RGB and advisory polygons; show uncertainty rather than inventing coverage. |
| SO2 is mistaken for ash | Put it in a separate “Related signals” group and label it continuously. |
| A time slider suggests false precision | Show source timestamps, validity intervals, selection method and freshness. |
| Polygon extrusion suggests a measured 3D volume | Treat lower/upper levels as advisory bounds and use uncertainty styling. |
| Large rasters make scrubbing slow | Crop, tile, pre-render previews, prefetch adjacent frames and cancel obsolete requests. |
| Indonesian source pages or formats change | Preserve original files and implement provider-specific adapters with fixtures. |
| A POC is mistaken for a safety service | Add an always-accessible disclaimer and links to BMKG/PVMBG official information. |

## 13. Future extensions

- nationwide current-activity map;
- eruption comparison by plume height, duration and affected population;
- animated wind-field and trajectory reconstruction;
- probabilistic ash-dispersion ensembles;
- flight-route intersection analysis;
- downloadable event snapshots and GeoJSON;
- classroom mode explaining satellite bands and volcanic hazards;
- bilingual Indonesian/English interface;
- a story mode covering Anak Krakatau, Ruang, Lewotobi, Semeru, Dukono and Merapi.

