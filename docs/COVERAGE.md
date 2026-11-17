# Coverage and snapshot dates

The sharing edition was prepared on 12 November 2026 from the October snapshot. The thematic collection was then updated on 13 November 2026 from 13 newly published source articles and on 14 November 2026 from a key-paper check and a screen of AISTATS, UAI and TMLR; the journal collection is limited to 25 October 2026.

## Thematic collection

9,030 candidate records; 8,323 abstracts; 4,843 OpenAlex citation matches. The 588 records added on 13 and 14 November 2026 have no citation count yet. The citation snapshot is dated 21 October 2026. Conference/year source coverage and discovery receipts are included in `data/library.json`. 161 extraction fragments are retained for reconciliation and hidden by default.

### Update of 13 November 2026

The source article directory grew from 229 to 242 articles. Eight of the 13 new articles are in scope.

| Source articles | Papers listed | Added | Basis |
| --- | ---: | ---: | --- |
| EMNLP 2026 time series; spatio-temporal | 33 | 32 | ACL Anthology records matched by ID and title; one paper was already present and was re-dated from 2025 to 2026 |
| ICLR 2027 time series (three articles); spatio-temporal (two articles) | 82 | 82 | Submissions under review before rebuttal: title, OpenReview link and keywords only |

The ICLR 2027 entries are not accepted papers. They carry the status “投稿/抢先清单；未确认录用”, no authors and no abstracts; review scores quoted in the articles are not stored. EMNLP is outside the 15 systematically screened venues, so only the listed papers were added. Five articles on LLMs and graphs and one model announcement are indexed without paper records.

### Key-paper check of 14 November 2026

Three reading lists were compared with the collection: two researcher-supplied tutorial lists (time series; causal inference, with a module table), the reference list of the survey arXiv:2603.19899v2, and a list of 95 widely used papers compiled for this check.

| List | Papers | Already present | Added |
| --- | ---: | ---: | ---: |
| Tutorial lists | 70 | 40 | 30 |
| Survey references with a parsed title | 252 | 141 | 52 |
| Key-paper list | 95 | 50 | 40 |

122 records were added in total. Three papers appear in two lists and are counted once, in the first list that names them.

The missing papers follow from how the collection was built: source articles plus a title screen of 15 conferences.

| Why the paper was missing | Added |
| --- | ---: |
| Journal article (20 of them already in the journal collection, which the main search does not cover) | 75 |
| Preprint or workshop paper | 20 |
| Conference outside the 15 screened venues (AISTATS, UAI, CLeaR, ICASSP, SIGIR, workshops) | 15 |
| Screened conference, but the title has no time-series or spatio-temporal term, or the paper is in a separately published track | 12 |

98 of the added records are confirmed by a publisher DOI record or an official proceedings page, 4 by an official conference listing only, and 20 are preprints with the arXiv record as their evidence. 93 have an abstract. 14 causal-inference papers without a time-series signal are in scope because the researcher's lists name them as key papers, and 6 were placed in scope after a manual title check; each carries a `scope` note in its evidence.

Not added: 53 survey references that are general background (for example sequence-model and generative-model papers), predate 2010, or have no topic term in the title; and 4 titles for which no matching record was found in Crossref, arXiv or official listings.

This check is a list comparison, not a systematic screen. AISTATS, UAI and TMLR were screened systematically afterwards (next section); other journals outside the journal collection have not been.

### AISTATS, UAI and TMLR screen of 14 November 2026

The complete official paper list of every available year was screened with the title pattern of the original conference screen (`scripts/screen-venues.py`).

| Venue | Lists screened | Papers listed | Title matches | Already present | Added |
| --- | --- | ---: | ---: | ---: | ---: |
| AISTATS | 2010–2026, PMLR volumes | 5,201 | 121 | 7 | 114 |
| UAI | 2011, 2013–2018 official site; 2019–2026 PMLR | 2,340 | 56 | 1 | 55 |
| TMLR | 2022–2026, official accepted-paper directory (journal collection) | 4,967 | 199 | 15 | 183 |

- 352 records added; 314 are in scope by the collection's scope rule and 38 are boundary records (mostly change-point, temporal point process and time-varying bandit titles), hidden by default like other boundary records.
- Abstracts: 114 AISTATS and 44 UAI from the PMLR paper pages, 10 UAI from the official UAI pages, and 128 TMLR from the arXiv version with the same title. 56 records have no abstract (55 TMLR without an exact arXiv match, 1 UAI 2014).
- Venue and year come from the official list. PMLR and TMLR records are marked as verified publications; records from the older UAI pages as listed on the official site.
- Of the 23 matches already present, 9 are stored under NeurIPS, ICML or ICLR (TMLR papers also presented at a conference, or the same title) and were left unchanged.
- One near-duplicate was not added: "When Does Multimodality Lead to Better Time Series Forecasting?" (TMLR 2026) is close to an existing record without a venue, "Does Multimodality Lead to Better Time Series Forecasting?".
- One added TMLR record shares arXiv 2502.14045 with an existing preprint record under an earlier title ("Position: There are no Champions in Long-Term Time Series Forecasting"). The two are kept apart with a note in `conflicts` until the versions are checked.
- Not screened: UAI 2010 and 2012, for which no official paper list is online. TMLR years before 2022 are marked as before the journal existed.

The coverage table on the website now shows 18 rows: the original 15 conferences plus AISTATS, UAI and TMLR.

## Journal inventory

| Journal | Records | Abstracts | Coverage basis |
| --- | ---: | ---: | --- |
| The Annals of Statistics (core four) | 1970 | 1956 | Crossref enumeration; publisher issues pending |
| Journal of the American Statistical Association (core four) | 3231 | 3164 | Crossref enumeration; publisher issues pending |
| Journal of the Royal Statistical Society Series B Statistical Methodology (core four) | 1175 | 1071 | Crossref enumeration; publisher issues pending |
| Biometrika (core four) | 1272 | 1262 | Crossref enumeration; publisher issues pending |
| The Annals of Applied Statistics | 1970 | 1878 | Crossref enumeration; publisher issues pending |
| Statistical Science | 780 | 633 | Crossref enumeration; publisher issues pending |
| Bernoulli | 1774 | 1765 | Crossref enumeration; publisher issues pending |
| Bayesian Analysis | 902 | 812 | Crossref enumeration; publisher issues pending |
| Electronic Journal of Statistics | 2088 | 1981 | Crossref enumeration; publisher issues pending |
| Journal of the Royal Statistical Society Series A Statistics in Society | 1896 | 1013 | Crossref enumeration; publisher issues pending |
| Journal of the Royal Statistical Society Series C Applied Statistics | 1073 | 965 | Crossref enumeration; publisher issues pending |
| Biometrics | 3007 | 2304 | Crossref enumeration; publisher issues pending |
| Biostatistics | 909 | 411 | Crossref enumeration; publisher issues pending |
| Journal of Computational and Graphical Statistics | 1635 | 0 | Crossref enumeration; publisher issues pending |
| Technometrics | 1113 | 0 | Crossref enumeration; publisher issues pending |
| Statistics and Computing | 1817 | 421 | Crossref enumeration; publisher issues pending |
| Statistica Sinica | 1512 | 1 | Crossref enumeration; publisher issues pending |
| Scandinavian Journal of Statistics | 1061 | 947 | Crossref enumeration; publisher issues pending |
| Environmetrics | 1068 | 895 | Crossref enumeration; publisher issues pending |
| Spatial Statistics | 948 | 0 | Crossref enumeration; publisher issues pending |
| Journal of Time Series Analysis | 1019 | 785 | Crossref enumeration; publisher issues pending |
| Journal of Causal Inference | 277 | 263 | Crossref enumeration; publisher issues pending |
| Econometrica | 1650 | 551 | Crossref enumeration; publisher issues pending |
| Journal of Econometrics | 3000 | 0 | Crossref enumeration; publisher issues pending |
| Econometric Theory | 941 | 704 | Crossref enumeration; publisher issues pending |
| Journal of Business & Economic Statistics | 1293 | 0 | Crossref enumeration; publisher issues pending |
| Computational Statistics & Data Analysis | 3686 | 0 | Crossref enumeration; publisher issues pending |
| Journal of Multivariate Analysis | 2506 | 0 | Crossref enumeration; publisher issues pending |
| International Journal of Forecasting | 1767 | 0 | Crossref enumeration; publisher issues pending |
| TEST | 861 | 100 | Crossref enumeration; publisher issues pending |
| Journal of Forecasting | 1396 | 1372 | Crossref enumeration; publisher issues pending |
| Journal of Statistical Software | 1227 | 0 | Crossref enumeration; publisher issues pending |
| Journal of Applied Statistics | 3205 | 0 | Crossref enumeration; publisher issues pending |
| Statistical Papers | 1603 | 187 | Crossref enumeration; publisher issues pending |
| Statistics & Probability Letters | 4743 | 0 | Crossref enumeration; publisher issues pending |
| Communications in Statistics - Theory and Methods | 7188 | 0 | Crossref enumeration; publisher issues pending |
| Communications in Statistics - Simulation and Computation | 4640 | 0 | Crossref enumeration; publisher issues pending |
| Journal of Statistical Computation and Simulation | 3121 | 0 | Crossref enumeration; publisher issues pending |
| Journal of Nonparametric Statistics | 823 | 0 | Crossref enumeration; publisher issues pending |
| Statistical Methods & Applications | 754 | 175 | Crossref enumeration; publisher issues pending |
| Metrika | 756 | 64 | Crossref enumeration; publisher issues pending |
| Annals of the Institute of Statistical Mathematics | 723 | 9 | Crossref enumeration; publisher issues pending |
| The Annals of Probability | 1341 | 1328 | Crossref enumeration; publisher issues pending |
| The Annals of Applied Probability | 1717 | 1701 | Crossref enumeration; publisher issues pending |
| Probability Theory and Related Fields | 1256 | 250 | Crossref enumeration; publisher issues pending |
| Stochastic Processes and their Applications | 3047 | 0 | Crossref enumeration; publisher issues pending |
| Journal of Machine Learning Research | 3463 | 0 | Public publisher directory |
| Machine Learning | 1994 | 578 | Crossref enumeration; publisher issues pending |
| IEEE Transactions on Pattern Analysis and Machine Intelligence | 7677 | 0 | Crossref enumeration; publisher issues pending |
| Transactions on Machine Learning Research | 4967 | 0 | Public publisher directory |
| Annual Review of Statistics and Its Application | 280 | 275 | Crossref enumeration; publisher issues pending |
| SIAM Review | 767 | 731 | Crossref enumeration; publisher issues pending |

The first 49 requested journals are supplemented by explicitly marked entries for Journal of Causal Inference, Econometrica and Econometric Theory. The core four retain all subjects. Full machine-readable year-by-year counts, source URLs and request receipts are contained in the per-journal JSON files.

## Remaining checks

- Publisher issue-by-issue reconciliation is incomplete. Enumerating a database is not equivalent to verifying every published article.
- JMLR coverage is bounded by the official index retrieved at collection time; current-year completeness is not asserted.
- Some source abstracts and publication fields are missing. Missing abstracts can reduce topic-label recall.
- Journal types and topic labels are search signals, not expert inclusion decisions.
- Substantive preprint/journal version relationships and record conflicts require source checks before merging.
- The two collections can overlap; do not add their totals as unique works.
