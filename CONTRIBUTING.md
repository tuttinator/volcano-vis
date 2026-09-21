# Contributing

For bugs, include the view URL, selected time/volcano, expected behavior and
source record. For data corrections, include the provider URL, issue and valid
times, and whether the change is a source correction or a parsing fix.

Use Node.js 22.12+, `npm ci`, and Python 3.10+ for factual pipelines. Run:

```sh
npm test
npm run test:pipelines
npm run build
```

For pipeline changes, also run `npm run data:build` and review generated diffs.
For presentation changes, install Playwright Chromium and run `npm run test:browser`.
For asset-path changes, also run `npm run build:embed` and `npm run test:embed`.
Raw satellite checks are optional unless the change affects those inputs; see
[reproduction](docs/reproducing.md).

Preserve source URLs, checksums, times, corrections, uncertainty and missing-data
states. Do not invent scans, interpolate outlines, treat forecasts as observations,
or turn missing airport reports into open/closed assertions. Add tests for changes
to these rules. Keep event-specific assumptions visible in the pipelines.

Do not commit credentials, virtual environments, generated export folders or HSD
bands. Review provider terms before adding third-party material; MIT does not
cover those assets. See [DATA_LICENSE.md](DATA_LICENSE.md).

The article has a separate Svelte implementation. Changes to interpretation
rules should identify corresponding site code in the
[alignment guide](docs/article-alignment.md); tests here do not cover that repo.
