# Conference deadlines

The deadlines page (`deadlines.html`) shows abstract, paper, rebuttal and decision dates for the conferences that appear in the thematic collection: the 15 systematically screened venues and 12 further venues, 27 in total.

## Source and limits

Dates are copied from [ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines), a community-maintained list under the MIT licence. They are not checked edition by edition against the calls for papers, so the official link stored with every edition is the authority. Editions that the source has not listed yet are absent, and dates the source marks `TBD` are shown as “to be announced”.

Journals are listed with their official links only. No per-journal submission policy or special-issue deadline is recorded.

## Files

| File | Contents |
| --- | --- |
| `data/deadline-scope.json` | The tracked venues: display name, area, whether the venue is one of the 15 screened venues, and its file in the source repository |
| `data/deadlines.json` | The snapshot: source commit, retrieval time and, per venue, every edition with its official link, time zone, conference dates and rounds |
| `scripts/collect-deadlines.mjs` | The collector |
| `web/deadline-utils.js`, `web/deadlines.js` | Page logic |

Each round keeps the published wall-clock time (`local`), the edition's time zone and the same instant in UTC (`utc`). `AoE` is UTC−12; named zones such as `PT` follow daylight saving. A date without a published time is stored with `local: null` and the source text in `note`.

## Refreshing

```bash
npm run deadlines:collect -- --dry-run
npm run deadlines:collect
npm test
```

The collector resolves the current source commit, reads only the files named in the scope, and prints the editions that were added or changed. It stops without writing when a request fails, a file cannot be parsed, a time zone cannot be resolved, or an edition that is in the current snapshot is missing from the source. Pass `--allow-removals` after checking such a removal by hand. A successful run also rewrites `data/MANIFEST.sha256`.

To track another conference, add it to `data/deadline-scope.json` with its file path in the source repository and run the collector.

## Automation

No scheduled job is enabled. The collector is written so that one can be added later: it needs no credentials, pins the source commit, never overwrites data on failure, and reports its changes as JSON. A scheduled workflow would run the collector and the tests and open a pull request when `data/deadlines.json` changes, so that a person reviews the dates before the site is rebuilt.
