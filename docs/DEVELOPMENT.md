# Development and reproduction

The website uses plain HTML, CSS and JavaScript. Node.js 22 or later is required; there are no third-party runtime packages.

```bash
npm ci
npm test
npm run dev
```

`npm test` builds offline, checks syntax and verifies data checksums, deadline parsing and time zones, metadata IDs, source-equivalent journal shards, citation nulls, direction labels, CSV escaping, storage behaviour and static packaging. `npm run build:site` creates the production build in `dist/`.

## Data collection

Python 3 and `curl` are needed only for explicit collection commands:

```bash
python3 scripts/collect-journals.py
python3 scripts/collect-ml-journals.py
python3 scripts/fill-journal-abstracts.py --ids aos,jasa,jrssb,biometrika
npm run deadlines:collect
```

Review the declared cutoff and journal scope before refreshing. Collectors cache responses under ignored `cache/`; API availability and authentication requirements can change. Preserve working snapshots on failed requests. A fresh journal harvest reconstructs source records, so supplements must be rerun after a refresh.

Do not collect while validating a release. After changing data, update provenance and coverage, run `npm run manifest` for the checksums, then run the tests against frozen inputs.

## Static release

GitHub Actions builds and tests `main`, then publishes `dist/` to GitHub Pages. Conference data is split losslessly into static parts; journal JSON parts use gzip and native streaming decompression. Current Chrome, Edge, Firefox or Safari versions are recommended.

Only generated web assets are deployed. Collection caches, credentials and personal reading notes are not part of a release.
