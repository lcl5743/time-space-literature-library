# Time × Space Literature Library

A bilingual literature index for time-series analysis, spatiotemporal modelling, causal methods and statistics. This repository includes the structured records, browsing interface, collection scripts and validation tests.

[Browse the library](https://lcl5743.github.io/time-space-literature-library/) · [Statistics journals](https://lcl5743.github.io/time-space-literature-library/journals.html) · [Submission deadlines](https://lcl5743.github.io/time-space-literature-library/deadlines.html) · [中文说明](README.zh-CN.md) · [Download a release](https://github.com/lcl5743/time-space-literature-library/releases)

## Collections

| Collection | Records | With abstracts | Snapshot |
| --- | ---: | ---: | --- |
| Time-series and spatiotemporal research | 8,556 | 7,934 | 13 November 2026 |
| Statistics and related journals, 52 titles | 104,889 | 30,552 | 25 October 2026 |
| Core four statistics journals, included above | 7,648 | 7,453 | 25 October 2026 |

The core four—*The Annals of Statistics*, *JASA*, *JRSS Series B* and *Biometrika*—retain all subjects. The journal collection covers 2010 onward and includes discussions, reviews and corrections where returned by the source. Collections may overlap; their counts are not a deduplicated combined total.

## Browse and export

- Search titles, authors, abstracts, tasks and methods.
- Filter by year, venue, research direction and causal category.
- Open publisher pages, source evidence, abstracts and available code/PDF links.
- Export filtered records as CSV or RIS.
- Explore citation rankings for the thematic collection, using a dated OpenAlex snapshot.
- Save reading lists locally in the browser. Personal notes do not synchronize between devices.
- Check abstract, paper, rebuttal and decision dates for 27 conferences on the deadlines page, with a venue × year table and a calendar export.

Chinese and English interfaces are available. Journal data loads only when selected. The site is hosted on GitHub Pages and requires no login.

## Run locally

Node.js 22 or later is required. The web application has no third-party runtime dependencies.

```bash
git clone https://github.com/lcl5743/time-space-literature-library.git
cd time-space-literature-library
npm ci
npm test
npm run dev
```

Open `http://127.0.0.1:5173`. `npm run build` produces the development build; `npm run build:site` prepares the compressed static release. Collection scripts are separate commands and never run during build or tests.

## Repository layout

| Path | Contents |
| --- | --- |
| `data/library.json` | Thematic records, original source index and coverage records |
| `data/journals/*.json` | Complete journal metadata inventories and request receipts |
| `data/citations.json` | OpenAlex citation counts, matches and evidence |
| `data/journal-scope.json` | Journal names, ISSNs and declared collection scope |
| `data/deadlines.json` | Conference deadlines by edition, copied from a community-maintained list |
| `data/deadline-scope.json` | Conferences tracked on the deadlines page and their source files |
| `data/PROVENANCE.json` | Snapshot provenance and processing history |
| `data/MANIFEST.sha256` | Checksums for the included data files |
| `web/` | HTML, CSS and JavaScript source |
| `scripts/` | Collection, audit, build and local-server scripts |
| `tests/` | Data integrity, classification, exports, storage and packaging checks |
| `docs/` | Data dictionary, coverage tables and collection methods |

See [the data guide](docs/DATA.md), [coverage](docs/COVERAGE.md) and [methods](docs/METHODS.md) before using the records for a review. [Deadlines](docs/DEADLINES.md) describes the deadline data and how to refresh it.

## Interpretation

Collection is not evidence of full-text reading or complete publication verification. Publisher issue reconciliation and some abstracts remain incomplete. Topic labels are automatic search aids. Source abstracts, extracted passages and generated Chinese overviews are stored separately; overviews are not source evidence. Citation counts include self-citations, are snapshot-specific and do not measure scientific quality.

Bibliographic metadata and abstracts retain their original rights; see [NOTICE.md](NOTICE.md). Release `v1.0.0` is the public sharing edition dated 12 November 2026, not a new literature harvest. The 13 November 2026 update added 114 records from 13 newly indexed articles: 32 EMNLP 2026 papers and 82 ICLR 2027 submissions that are still under review.
