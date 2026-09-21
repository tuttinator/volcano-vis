# Data reuse review — 12 September 2026

> Retained review: publication-status statements describe that review date.
> The September 21 cleanup did not reverify provider terms or resolve the questions below.
> Original code is now MIT licensed; see [data license scope](../DATA_LICENSE.md).

This review records provider guidance and the evidence still needed for public republication. It does not assign one licence to the entire prototype. Source access, attribution and permission to redistribute are different questions.

| Material used | Provider guidance reviewed | Publication treatment |
| --- | --- | --- |
| NASA GIBS VIIRS daily imagery | [NASA Earthdata guidance](https://www.earthdata.nasa.gov/engage/open-data-services-software-policies/data-use-guidance) supports factual informational use without implying endorsement, asks for citations, and distinguishes non-NASA or restricted material. [GIBS guidance](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api) requests service acknowledgment. | Preserve the named VIIRS product, dates, request URLs and NASA GIBS credit. Review any specific product restriction before publication. Do not infer a blanket licence merely from hosting on NASA infrastructure. |
| Himawari Band 13 browse imagery and locally derived Ash RGB | Himawari originates with JMA. [JMA terms](https://www.jma.go.jp/jma/en/copyright.html), previously retained in `data/raw/jma-reuse-terms.html`, describe attribution, disclosure of modifications and third-party exceptions. | Credit JMA as originator and NASA GIBS or NOAA Open Data as the access service. Identify local calibration, resampling and compositing. Retain the existing statement that the RGB is not an official JMA product. |
| Darwin VAAC advisories from BOM and mirrored by GDACS | [BOM copyright guidance](https://www.bom.gov.au/copyright) requires checking the content-specific terms. Its default provision covers personal/internal use and restricts supply to others; separate media provisions exist. The presence of a CC BY attribution example does not place every product under that licence. | **Unresolved:** establish the applicable Darwin advisory terms for this public article and its downloadable normalized data. Retain source attribution and transformation notes. Do not claim a CC BY licence or permission that has not been established. |
| GDACS archive presentation | GDACS links to the [European Commission legal notice](https://commission.europa.eu/legal-notice_en): EU-owned content is generally CC BY 4.0 unless otherwise indicated, with third-party works excluded from that general grant. | The mirrored Darwin messages remain third-party source material. GDACS hosting alone does not establish their republication licence. |
| PVMBG/MAGMA classification table; ESDM/BMKG report facts; DGCA airport reference points | Individual official source pages and their dates are retained. This pass has not established a dataset-specific redistribution licence for each Indonesian provider. | **Unresolved:** distinguish factual values and summaries from reproducing page text, graphics or a substantial table; document applicable provider terms before the final publication decision. Do not attach an invented open-data licence. |
| Natural Earth coastlines | The existing inventory records Natural Earth v5.1.2 as public domain. | Retain Natural Earth credit and the exact dataset/version in the source notes. |

## Credit text prepared for the article

Imagery supplied by NASA Global Imagery Browse Services (GIBS), part of NASA’s Earth Science Data and Information System (ESDIS). Himawari data originate with the Japan Meteorological Agency; Ash RGB was calibrated, resampled and composited locally from HSD bands accessed through NOAA Open Data. These are locally derived visualisations, with no provider endorsement implied.

Advisory facts and outlines originate with Darwin VAAC / Bureau of Meteorology, with archive access through BOM and GDACS. Coordinates, time fields and altitude bounds were normalized for the visualisation; observations, estimates, unavailable data and forecasts remain distinct. This credit identifies provenance and does not claim that advisory republication has been cleared.

Classification records: PVMBG / MAGMA Indonesia, table updated 20 September 2021. Airport reference points: Directorate General of Civil Aviation, Kementerian Perhubungan, retrieved 12 September 2026. Chronology and airport statements: the linked ESDM/PVMBG and BMKG reports. Coastlines: Natural Earth v5.1.2.

## Evidence and next action

`data/raw/reuse/sources.json` records this pass’s downloaded policy pages, checksums and any download failures. Browser-read guidance can remain verified even when a direct-download attempt is rejected; a failed download must not be represented as preserved source HTML.

The remaining advisory and Indonesian-provider questions stay open in `completion-audit.md`. No permission request has been sent to a provider and nothing has been published. Continue source-specific verification before deciding whether the planned public article and downloadable datasets are covered.
