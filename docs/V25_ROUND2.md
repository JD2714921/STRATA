# V25 Round 2: historical data and execution binding

Implementation is local and research-only. Operational state remains **STAND DOWN**. This is a bounded acquisition with explicit remaining coverage gaps, not a claim that the entire historical mission is complete.

## Reconciliation and routing

The clean starting checkout was `bedbe6bf54e1f89adb6a5ff5460ad814d7f15446`. Native Sites history confirmed saved version 25 at that exact commit and deployment `appgdep_6ad8ec26706c81919dc4e2d7391853a3` succeeded. The existing custom access policy is revision 1: one allowed owner, no editors, groups or external visitors. Runtime environment revision was 0 with zero configured entries. Project identity and DB binding are unchanged.

`SOURCE_ROUTING_UPDATE.md`, source guards, account-aware lookup receipts, the V25 deployment receipt and existing tests were reconciled before edits. CMC reads in this round concern only the five permitted cash-product lookups and the three resolved products' bars/session information. Context market/portfolio data remains assigned to Trading 212. Separate Bigdata and primary publications supply event research. Older CMC FX archives are preserved without authorising new FX reads.

Gold - Cash, Silver - Cash and US NDAQ 100 - Cash were re-resolved on the previously selected Live GBP spread-betting account. Authoritative customer-facing category is SB; technical selectors are retained in the server-side receipt, not returned to the browser. Gold Weekend was excluded. Gold/Silver retain BUY/SELL policy; NDAQ retains SELL ONLY. Mapping does not establish current operational readiness.

Sugar Raw - Cash and Crude Oil - Cash each returned zero exact matches. Broader cash-only, non-forward Sugar/Crude searches returned shares/ETFs rather than either permitted commodity cash product. No alternative was selected and neither product receives historical execution data or operational approval. A broker-confirmed exact account-compatible cash mapping is still required. All five overview markets remain present.

TP1–TP3 ordering, target validator and existing presentation are unchanged. No partial-close fractions, fixed target multiples or broker-side stop actions were inferred. Legacy simulations remain labelled hypothetical.

## Historical coverage

Requested acquisition bounds were 2026-09-01 00:00 UTC through 2026-10-21 16:00 UTC. No resampling or interpolation was used. Counts below are newly retained Round 2 observations; older source datasets and outputs remain unchanged. All non-2H series end at the source timestamp 2026-10-21 16:00 UTC; 2H series end at 15:00 UTC. These are source timestamps, not verified closing times.

| Product | Minutes | Bars | First source timestamp UTC | Discontinuities | ATR period / available rows |
|---|---:|---:|---|---:|---|
| Gold Cash | 2 | 1,953 | 2026-10-16 19:56 | 3 | ancillary 14 / 1,901 |
| Gold Cash | 5 | 8,906 | 2026-09-07 07:25 | 32 | 9 / 8,642 |
| Gold Cash | 15 | 1,995 | 2026-09-22 00:30 | 21 | 14 / 1,709 |
| Gold Cash | 60 | 843 | 2026-09-01 00:00 | 36 | 27 / 0 |
| Gold Cash | 120 | 439 | 2026-09-01 01:00 | 8 | 27 / 220 |
| Silver Cash | 2 | 1,952 | 2026-10-16 19:58 | 3 | ancillary 14 / 1,900 |
| Silver Cash | 5 | 8,906 | 2026-09-07 07:25 | 32 | 9 / 8,642 |
| Silver Cash | 15 | 1,995 | 2026-09-22 00:30 | 21 | 14 / 1,709 |
| Silver Cash | 60 | 843 | 2026-09-01 00:00 | 36 | 27 / 0 |
| Silver Cash | 120 | 439 | 2026-09-01 01:00 | 8 | 27 / 220 |
| NDAQ Cash | 2 | 1,953 | 2026-10-18 22:56 | 0 | ancillary 14 / 1,940 |
| NDAQ Cash | 5 | 8,982 | 2026-09-08 05:25 | 7 | 9 / 8,918 |
| NDAQ Cash | 15 | 1,995 | 2026-09-22 17:30 | 4 | 14 / 1,930 |
| NDAQ Cash | 60 | 866 | 2026-09-01 00:00 | 11 | 27 / 575 |
| NDAQ Cash | 120 | 438 | 2026-09-01 01:00 | 8 | 27 / 220 |

Total: **42,505 bars**. Sugar/Crude: zero bars at every required timeframe because mapping is unresolved. Trading 212 context OHLC: unavailable, not replaced with CMC data. Follow-up 2m requests ending before each retained start returned zero observations; see `older-2m-probes.json`. Gold 5m was expanded with a second 10,000-maximum request; both request receipts are retained.

Provider mid/bid/ask numeric strings and original timestamps are retained in `data/round2/raw`; normalised candles are in `series`. Manifest input/raw/artifact SHA-256 values support replay. Every source row is tested against its retained original. Source receipt times are recorded per dataset, approximately 17:37–17:38 UTC, with the later expanded Gold receipt recorded separately.

Current/upcoming session intervals were requested from CMC with Europe/London timezone. They do **not** establish a historical holiday/session calendar. Timestamp-open/close meaning and per-bar closed flags remain unverified. Every cadence discontinuity is retained as unclassified; expected-slot counts are not claims of missing tradable observations. ATR warmup resets at discontinuities. This produces no 1H ATR(27) values for Gold/Silver; it is deliberately unavailable rather than bridged across an unverified session break.

## Directional Elastication

The central formula is unchanged: `E_d = |(%ΔQ_d) / (%ΔP)|`.

The implemented input definition is a research contract: Q_d is the nonnegative quantity explicitly attributed to direction d over a fixed window; BUY and SELL have separate series. The authorised OHLC results do not supply that quantity, its units or a verified attribution method. Q_d definition, units=null, unavailable measurement state and reason are persisted. NDAQ volume observations are retained as volume only. Candle colour and total volume never become signed flow or demand.

The calculator preserves original Q/P inputs, source/units/instrument/timeframe, baseline/current windows, availability/calculation timestamps, signed percentage changes, signed ratio and absolute magnitude. It checks equal contiguous Q/P windows, valid availability, positive baselines, nonnegative directional quantities, finite arithmetic and a documented research price-change floor of **0.001%**. This floor is a numerical safeguard, not a trading threshold. Research proxies remain labelled and cannot authorise trades.

The stored source candles have unverified anchoring, so their timing is explicitly blocked too. Compact output rows include original P, null Q, signed P changes, null Q changes, null ratio/magnitude and dictionary-coded reasons. Shared headers retain both directional labels, source metadata and definition. Count: **0 valid / 85,010 unavailable directional windows** (42,505 candles × two directions). Valid historical E_d sample size is zero; comparison median/percentile remain null. Synthetic arithmetic tests are never included in these counts.

## Events and vintages

There are **36 retained records: 34 scheduled, 2 unscheduled**. Sixteen new bounded source observations supplement the original 20 retrospective Bigdata/FXStreet calendar rows. Original previous and revised-previous values are retained. There are **9 verified first-release actual vintages**, **0 complete point-in-time consensus/actual vintages** and **0 verified event-price response windows**.

The dated BLS archives establish release clocks and first-release actuals for four US CPI metrics, two final-demand PPI metrics, payrolls and unemployment. A dated Fed statement establishes the federal-funds upper-bound decision. The BoE, ONS and China NBS observations add sourced policy/inflation context but their exact original release clocks or vintage timestamps are not established here. Null timestamps are not filled with midnight or inferred publication times.

Sources inspected:

- [BLS CPI, September 2026](https://www.bls.gov/news.release/archives/cpi_10142026.htm)
- [BLS PPI, September 2026](https://www.bls.gov/news.release/archives/ppi_10152026.htm)
- [BLS employment, September 2026](https://www.bls.gov/news.release/archives/empsit_10022026.htm)
- [Fed September 18, 2024 statement](https://www.federalreserve.gov/newsevents/pressreleases/monetary20240918a.htm)
- [BoE August 2024 decision](https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes/2024/august-2024)
- [ONS September 2026 CPI](https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/consumerpriceinflation/september2026)
- [China NBS CPI](https://www.stats.gov.cn/english/PressRelease/202610/t20261015_1965500.html), [PPI](https://www.stats.gov.cn/english/PressRelease/202610/t20261015_1965499.html)
- [HM Treasury budget transcript](https://www.gov.uk/government/speeches/autumn-budget-2024-speech)
- [OPEC production announcements](https://opec.org/pr-detail/63-03-apr-2023.html)
- [UN Ukraine statement](https://press.un.org/en/2022/sgsm21158.doc.htm)

Bigdata research located an FXStreet pre-CPI forecast document, retained as numeric/source metadata rather than copying the article. Its search timestamp lacks a UTC offset, so it does not establish a verified pre-release consensus timestamp. No subscription restriction was bypassed. OPEC and geopolitical reports are explicitly unscheduled; their reporting dates do not stand in for first market disclosure times.

The vintage schema stores original release date/time precision, reference period, actual, consensus, previous, revised previous, units/multiplier, publisher/link, receipt/publication/vintage timestamps, revision linkage and syndication group. Historical selection rejects future publications and preserves separate revisions. It reconstructs documented public information as-of; it does not claim the application possessed it contemporaneously. Complete original-vintage chains and broad multi-year USA/UK/China, fiscal, rates/yields and geopolitical/commodity chronology remain incomplete. Event responses require verified candle boundaries and exact contiguous endpoints; all acquired series fail the timing verification and remain unavailable.

## Execution and chart bindings

**32,652 stored entry rows** cover every acquired 2m/5m candle. Each links, as-of its explicitly assumed research close, to the most recent nonfuture, nonstale 5m, 15m, 1H and 2H feature indices. 2m structure does not supply 5m liquidity grabs/retests/FVG/IFVG. ATR uses the requested periods on 5m, 15m and 1H+. Higher context never creates 2m candles.

The Formula screen contains a separate Round 2 coverage/analysis panel, observed-candle chart and paginated evidence. Chart and entry/feature indices/timestamps are tested for identical dataset/page alignment. Source gaps are shown separately. Private `/api/execution-history` authenticates before reads, bounds dataset/page/kind selections, returns no-store responses and exposes no broker selectors. Results are retained in versioned private server source, not local browser storage or public assets. Existing owner-scoped D1 audit behaviour is unchanged.

Confirmed pivots, sweeps/retests, FVG/IFVG and opening break/reentry remain unapproved research definitions. Opening tests use the retained 08:00/14:00 Europe/London research windows, not an inferred exchange calendar or measured participant intent. Judas swings are labelled a proxy. Cross-market correlations use common contiguous source endpoints, reset windows across discontinuities and retain confirmed-pivot SMT as a research assumption. These features never independently authorise BUY/SELL. All entry rows remain STAND DOWN with missing Q_d, freshness, timing/calendar and validation reasons visible.

## Trading 212 and secure setup

Native hosted environment inspection confirmed revision 0 and no credentials. The existing authenticated GET-only adapter and secret-safe connection status were preserved. Local process key/secret presence was checked using booleans only; an explicit local environment was absent, so no Live/Demo probe was inferred. Local presence does not establish valid credentials, account capability or hosted configuration.

The [official public API](https://docs.trading212.com/api) supplies Invest/Stocks ISA account/position/instrument paths. Held-security currentPrice lacks an independent quote-observation timestamp. The inspected contract has no general historical OHLC, unheld-security quote or yield-curve endpoint. Historical account events are not historical candlesticks; metadata type enums do not prove actual account access.

Remaining hosted setup: configure `TRADING212_API_KEY` and `TRADING212_API_SECRET` as secret runtime entries for this existing Site, and `TRADING212_ENVIRONMENT` explicitly as `live` or `demo`; deploy a verified saved version to apply the new environment revision, then use the authenticated status/account read. Native Sites configuration takes secret values directly; it provides no local-environment-reference transfer in the exposed schema. No value was copied into chat, source, logs or browser code. Owner must use the secure runtime settings or an authorised direct secret provisioning path. A configured account still cannot supply an undocumented candle feed.

## Reproduction, validation and deployment

Reproduce offline after ingestion:

```powershell
node --experimental-strip-types --import ./tests/core-register.mjs scripts/run-round2.mjs
node --experimental-strip-types --import ./tests/core-register.mjs --test tests/core.test.mjs tests/historical.test.mjs tests/source-policy.test.mjs tests/persistence.test.mjs tests/round2.test.mjs tests/round2-data.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/run-framework.mjs build
```

The generation clock is retained per input hash, so unchanged inputs reproduce the same artifacts. Source acquisition uses retained exact responses, not fixtures. Tests distinguish synthetic calculator inputs from actual provider observations, compare every normalised OHLC value, verify artifact hashes, chart/entry binding, explicit unavailable states, as-of selection and the private API. Prior corpus/history, source routing, owner-private authentication, five-market registry and TP1–TP3 policy have no content changes.

The supported Sites source helper could not connect to `git.chatgpt-team.site:443`. Escalated execution could not launch in this Windows environment (Access denied). No source push or new deployment is claimed. The original V25 owner-private deployment remains the production baseline. The standard build helper also encountered a missing pnpm shim/Corepack cache permission; the project's direct Vinext build passed, as did TypeScript. There are 88 verified passing tests across the suites (the final targeted rerun passed all 38 tests after a secret-scanner assertion was corrected). Wrangler's compiled Worker smoke test was blocked twice by a sandbox ancestor-directory access error, including from the output directory with no-bundle. The browser inventory returned no enabled browsers, so visual browser QA and compiled Worker HTTP verification are unverified. Final commit/reproducibility status is recorded in the delivery receipt.

The remaining acceptance blockers are exact Sugar/Crude account mappings; documented historical bar boundaries/closed flags/calendar; direction-attributed Q_d with units and provenance; complete consensus/actual/revision vintages; unsupported Trading 212 context histories; hosted secrets/account verification; operational method validation; and source-host connectivity for publication. Missing inputs remain visible and blocked.
