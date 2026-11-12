# Data guide

## Data availability

The repository and its versioned releases contain the structured metadata used by the web application. Data can be inspected without running the website. No paper PDFs are bundled. Publisher, DOI, repository and source links remain in the records.

| File | Meaning |
| --- | --- |
| `data/library.json` → `papers` | Time-series/spatiotemporal candidate records |
| `data/library.json` → `articles`, `coverage` | Discovery sources and conference/year coverage |
| `data/journals/<journal>.json` → `papers` | Journal records, including subjects outside the thematic collection |
| `data/journals/<journal>.json` → `coverage` | Returned totals, annual counts, pagination receipts and unresolved checks |
| `data/citations.json` | OpenAlex matching evidence and citation snapshot |
| `data/boundary_candidates.json` | Retained topic-boundary candidates |
| `data/journal-scope.json` | Journal identities, ISSNs and declared date range |
| `data/PROVENANCE.json` | Source and processing history |

## Main fields

`id` is the stable record identifier. `doi`, `arxiv`, `official_url`, `pdf_url`, `code_url` and `metadata_evidence_url` identify works or source evidence where available. Missing links remain empty; an empty code field does not establish that code is unavailable.

Journal dates preserve online, print and issued dates in `dates`; `year_basis` records which date was used for display. A DOI-less publisher record keeps its canonical article URL. Author names are taken from the retrieved source metadata, not inferred from titles.

### Abstracts and overviews

- `abstract`: retrieved source abstract. Journal records may use an OpenAlex inverted-index reconstruction when the DOI and normalized title match the same journal.
- `abstract_original_markup`: publisher-deposited markup where retrieved; retained separately from the display text.
- `abstract_gist`: passages extracted from the abstract, not an independent assessment of results.
- `ai_summary`: generated Chinese overview in 81 thematic records. This legacy field name is preserved for compatibility. These overviews are displayed as generated text and must be checked against the paper.
- `abstract_source`, `abstract_evidence_url`, `abstract_match_method`: provenance for supplementary abstract retrieval when present.

Source abstracts, extracted passages and generated overviews must not be treated as interchangeable evidence.

### Classification and quality

Journal `topics` and the thematic direction/causal labels are automatic title/abstract signals. Categories may overlap. The absence of a label may reflect a missing abstract rather than the absence of a research topic.

`article_kind` is a heuristic type signal. Discussions, editorials and corrections are retained; `research-or-unspecified` does not establish that every record is an original research article.

The thematic collection retains 161 flagged extraction fragments for source reconciliation. The default view hides flagged records. Original records and stable IDs remain available.

### Citations and reading status

OpenAlex citation counts belong to the dated thematic snapshot. Unknown or ambiguous counts remain `null`, not zero. Journal `crossref_cited_by_count` is a different source and is not mixed into the OpenAlex ranking. Citations include self-citations and reflect time available to accumulate citations.

Reading lists and notes are browser-local. Collecting a record does not mark it as read. No source record is presented as a completed full-text review.

## Integrity and versioning

`data/MANIFEST.sha256` records hashes of the data files in this release. The public sharing edition updates the hosting URL in provenance metadata; 229 local cache paths are replaced by non-local capture references. Paper records, source URLs, coverage and citation data are unchanged from the October snapshot.

The collections may overlap. Do not report their sum as a deduplicated number of unique papers. Data updates should retain source dates, identifiers, version relations and an explicit change record.
