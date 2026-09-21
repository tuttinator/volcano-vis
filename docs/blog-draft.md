# Reading Indonesia’s volcanic skies

> Historical draft. The current article lives in the website repository; see
> [article alignment](article-alignment.md) for its three native figures.

*Working article draft for caleb-tutty.com. The links below use the proposed deployment path; they are not published URLs. Data snapshot: 12 September 2026.*

A satellite image gives us a view of a volcanic cloud. An advisory gives us an interpretation tied to a time. Reading them together means keeping track of what each source actually says.

This visualisation follows that distinction through six Indonesian volcanoes: Anak Krakatau, Merapi, Semeru, Lewotolok, Ibu and Dukono. It combines archived Darwin volcanic ash advisories with satellite imagery and a nationwide directory using Indonesia’s official Type A, B and C classifications.

[Start with the visual essay](/experiments/volcanoes/?view=story).

## Start with a time

The Anak Krakatau replay opens at midnight on 5 September, Jakarta time. Earlier context remains available. Each image shows both the selected clock time and its nominal satellite scan time, because the nearest available image may be a few minutes earlier or later.

[Compare infrared and Ash RGB at 13:30 WIB on 5 September](/experiments/volcanoes/?view=replay&time=1788589800000&replayProduct=ash&replayPair=1&replayComparison=products).

The infrared scale includes negative Celsius values. It represents brightness temperature: the temperature of an ideal emitter that would produce the measured infrared signal. High cloud tops can be very cold, even when the material began its journey at a hot volcanic vent. Ordinary weather clouds also produce cold signals. [JMA explains how infrared imagery works](https://www.data.jma.go.jp/sat_info/himawari/satobs.html).

Ash RGB combines four infrared bands. Its colours offer additional clues about cloud constituents, but the composite is not a direct measurement of ash concentration. The prototype preserves the original band inputs and documents the calibration and colour recipe for every processed frame.

## Read the qualifiers

Advisories distinguish observed positions from estimated positions and forecasts. The map gives each a different line style. Forecasts belong to an edition and a target time; overlapping outlines do not represent accumulated ashfall.

Merapi makes the qualifiers especially important. Several retained March 2023 advisories say ash was not identifiable in satellite data. The map leaves those positions empty and retains the wording. An empty outline is not evidence that the atmosphere contained no ash. [Inspect Merapi’s editions](/experiments/volcanoes/?view=explorer&volcano=263250&event=263250-2023-03), or read the [archived Darwin messages](https://www.gdacs.org/gts.aspx?eventid=1000062&eventtype=VO).

The episode windows differ. Merapi’s retained sequence starts after the activity increase reported on 11 March. Semeru’s November 2025 sequence has its own dates and daily satellite context. [Explore Semeru](/experiments/volcanoes/?view=explorer&volcano=263300&event=263300-2025-11).

## Follow the reports to the ground

Airport reports add another kind of evidence. The replay shows a reported scheduled closure window, its expiry, and separately reported reopening times. It does not turn the schedule into a measured closure interval. When evidence is missing, the status returns to unknown.

Eight airport locations are drawn from official transport-ministry reference points. The reported name “Atungbusu” remains unmapped because its identity has not been resolved. The two airport reports also contain different lists; the visualisation preserves that discrepancy.

## Widen the view

[Browse the national directory](/experiments/volcanoes/?view=directory) to see all 127 entries in the dated MAGMA classification table. Type A, B and C are official classifications, separate from current alert levels or whether a volcano is erupting now. The source date stays visible because classifications can change. [Read the official table](https://magma.esdm.go.id/v1/edukasi/tipe-gunung-api-di-indonesia-a-b-dan-c).

The archive remains incomplete as an event reconstruction. The full satellite window includes documented source gaps; early Krakatau advisories and original airport NOTAMs remain missing. Source links and uncertainty are part of the visualisation, alongside the imagery and polygons.

---

Editor’s checks before publication: confirm the final deployment path, complete the remaining source/reuse review in `completion-audit.md` and `data-reuse-review.md`, and verify the final article in the blog repository. The timestamped example above should show the first retained Krakatau advisory alongside the selected satellite scans.
