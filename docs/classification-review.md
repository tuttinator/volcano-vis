# Official classification source comparison — 12 September 2026

The directory retains the individual labels in the [MAGMA classification table](https://magma.esdm.go.id/v1/edukasi/tipe-gunung-api-di-indonesia-a-b-dan-c), whose stated update date is 20 September 2021. Its 127 rows yield 76 A, 30 B and 21 C. That page date does not prove each row was reviewed then.

The [BNPB report dated 30 December 2020](https://www.bnpb.go.id/index.php/berita/erupsi-gunung-ili-lewotolok-paling-signifikan-di-tahun-2020) already reports 77 A, 29 B and 21 C. The same totals appear in the [July 2026 Badan Geologi summary](https://geologi.esdm.go.id/index.php/media-center/belajar-hidup-berdampingan-dengan-bencana-strategi-siaga-di-daerah-cincin-api). These summaries do not identify the individual entries behind the discrepancy. It would be unsupported to describe the difference as a recent reclassification.

The [BIG national atlas service](https://geoservices.big.go.id/gis/rest/services/PTRA/Atlas_Sebaran_GunungApi/MapServer?f=pjson) describes its use in the 2021 e-atlas. Its queried layer contains 127 points: 75 terrestrial A, five submarine A, 26 terrestrial B, one submarine B and 20 C. Combined totals are 80/27/20. Named examples include Sinabung B, Merbabu A and Sempu A; MAGMA lists these as A, B and B respectively. This is another conflicting inventory, not evidence for replacing individual MAGMA labels or claiming a current national classification.

Retained BNPB HTML and the complete BIG query response are in `data/raw/classification-review/`; `sources.json` records URLs and SHA-256 hashes. The BIG response does not indicate truncation. No labels or coordinates from it are merged into the directory.

A current, dated PVMBG inventory with named entries or explicit classification decisions is still needed to resolve the conflicts. The directory identifies its source date and presents Type A/B/C separately from live alert levels.
