# Collection methods

## Thematic collection

The time-series/spatiotemporal collection combines a retained source spreadsheet, article indexes, official conference listings, publisher metadata and supplementary discovery sources. Conference/year coverage is stored with the dataset. Title screening covers the declared 2010–2026 conference range; this is not a claim of exhaustive abstract-level screening or verified acceptance for every candidate.

Official conference and publisher pages take precedence for publication status. Crossref, arXiv and other bibliographic sources supply metadata and links. Missing or conflicting information remains explicit. Original abstracts and source pointers are retained independently of generated overviews.

### Source article updates

New articles in the retained article index are read in a browser session and their numbered entries are parsed mechanically. A listed paper is added with official metadata when the article links an official record and the titles match after normalization; otherwise it stays a title-level candidate with the article as its only evidence. Submissions under review are labelled as such, and no authors, abstracts or review scores are inferred for them.

## Conference deadlines

Deadlines are copied from the community-maintained ccfddl/ccf-deadlines list at one pinned commit and are not checked edition by edition. See [DEADLINES.md](DEADLINES.md).

## Journal collection

The scope file contains 49 requested journals and three marked supplements. All subjects are retained, including in the four core statistics journals.

- Crossref inventories use journal ISSNs, `type:journal-article` and publication-date filters from 2010-01-01 through 2026-10-25. Journal identity is checked before pagination. Unique DOIs are reconciled against the returned total.
- JMLR uses linked official volume directories because its Crossref query returned no records. Only the volumes available in the retrieved index are asserted enumerated; 2026 coverage remains unconfirmed.
- TMLR uses its official accepted-paper directory because the Crossref ISSN lookup was unavailable. An OpenReview supplement returned HTTP 403; no submissions were inferred to be accepted.
- Missing abstracts in the core four are supplemented from OpenAlex only after matching the journal, DOI and normalized title. Existing abstracts are not overwritten.

Request URLs, result counts, source hashes and dates are retained in the per-journal coverage records. Database pagination completion is distinct from publisher issue-by-issue reconciliation. Zero returned records do not establish that a journal published no articles that year.

## Record identity and topic labels

DOIs and official IDs are preferred over titles. DOI-less publisher entries use canonical article URLs. Similar titles alone are insufficient grounds to merge works, and substantive journal extensions should remain separately identifiable.

Time-series, spatial, spatiotemporal, causal and broader statistical tags use explicit title/abstract keyword rules. They are navigation aids. They do not establish causal identification, methodological validity, research quality or relevance to a particular proposal.

## Sources

- [Crossref metadata retrieval](https://www.crossref.org/documentation/retrieve-metadata/rest-api/)
- [JMLR paper directory](https://jmlr.org/papers/)
- [TMLR accepted papers](https://jmlr.org/tmlr/papers/)
- [OpenAlex](https://openalex.org/)
- [Paper-Notes discovery index](https://github.com/zhaoyang97/Paper-Notes)
- [ACL Anthology metadata](https://github.com/acl-org/acl-anthology)
- [ccfddl/ccf-deadlines](https://github.com/ccfddl/ccf-deadlines)

Individual records retain the specific paper and evidence URLs used for their fields.
