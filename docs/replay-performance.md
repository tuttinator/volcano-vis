# Replay interaction measurement — 12 September 2026

`tests/browser/performance.spec.ts` runs against a production build in local Chromium. It applies 200 successive clock changes to two infrared panes separated by one hour, waits for an animation frame after each input, and verifies that both image layers finish on the requested source scans. The test records JavaScript errors, browser long tasks and raster request events, and attaches `scrubbing-metrics.json` to its Playwright result.

Observed run:

| Metric | Result |
| --- | --- |
| Clock changes | 200 |
| Measured interval | 12.46 seconds |
| Median input + Playwright transport + next animation frame | 61 ms |
| 95th percentile of that interval | 74 ms |
| Final pair settling after the last update | 6 ms |
| Browser long tasks reported | 0 |
| Raster request events, including prefetch | 808 |
| Aborted or failed raster request events | 0 |
| JavaScript errors | 0 |

This is a reproducible local interaction check, not a frame-rate benchmark, mobile performance guarantee or prolonged memory-leak audit. Request events include prefetch and do not establish transferred byte counts. Physical mobile-device, cold-start, long-session and memory measurements remain outstanding. A separate throttled mobile-viewport check is recorded below. Separate raster tests deliberately delay responses and return HTTP failures to exercise cancellation, stale-image protection and recovery.

Run after `npm run build` with `TEST_PRODUCTION=1 npx playwright test tests/browser/performance.spec.ts`; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if using an existing Chromium installation. Do not rebuild `dist` while the production test server is running.

## Throttled mobile viewport

`tests/browser/mobile-network.spec.ts` uses a 390×844 viewport, 150 ms network latency, 1.5 Mbps download throughput, disabled network cache and a 4× CPU slowdown. It first loads the application shell, then changes the paired replay clock 20 times to scans outside the initial prefetch window. It verifies that each map is empty or already on its selected scan during final loading, then verifies both final source URLs and absence of horizontal overflow or JavaScript errors.

Observed run on 12 September 2026:

| Metric | Result |
| --- | --- |
| Clock changes | 20 |
| Median input and Playwright transport | 86 ms |
| 95th percentile input and Playwright transport | 237 ms |
| Final pair settling after inputs | 1,318 ms |
| Encoded bytes from completed requests during measurement | 366,692 |
| JavaScript errors | 0 |

The Playwright attachment is `mobile-network-metrics.json`. Bytes exclude unfinished/aborted transfers and are not a total bandwidth accounting. CPU/network emulation on desktop Chromium does not establish performance on physical mobile hardware. The application shell is warm, so this does not measure initial download or startup.

Reproduce after building with `TEST_PRODUCTION=1 npx playwright test tests/browser/mobile-network.spec.ts` and the appropriate Chromium executable environment variable.
