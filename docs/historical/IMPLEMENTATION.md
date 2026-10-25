# Historical Elastication implementation — 21 October 2026

**Readiness: PARTIAL.** Strata now calculates, retains, retrieves and reproduces its own historical features. It compares a dated Silver quote with historical observations and produces explicit, attributable assessments. No method is validated or approved for operational BUY/SELL. All observed-data confluence assessments return STAND DOWN. No broker write, order or scheduled monitoring was introduced.

Existing project: `appgprj_6aa2cfb5d1688191bdf3a8a9ca6365b0`. Site: https://strata-atlas.jaydds2002.chatgpt.site/formula. Baseline: deployed version 22, commit `2291f967342ecf4b72a0fef9103623857e0f71de`. Final commit and deployment identifiers are in the external deployment receipt handed over with this document; a commit cannot contain its own hash.

## Counts and their meaning

| Category | Count | Evidence |
|---|---:|---|
| Prioritised implementation families | 9 | `lib/historical/engine.ts: METHODS` |
| Defined, implemented, executed on provider observations, with retained outputs | 9 in each category | `data/historical/manifest.json`, source/result hashes |
| Families fully validated for execution | 0 | Unapproved definitions, incomplete data/cost/vintage/mapping coverage |
| Priority families still partial for operational use | 9 | Limitations below |
| Original 23 audit families with some research implementation | 15 | H01–H11, H13, H14, H17, H21 |
| Original audit families not implemented | 8 | H12, H15, H16, H18–H20, H22–H23 |
| Completed owner-approved quantitative Elastication formula | 0 | Expected price magnitude, benchmark and calibration undefined |
| Historically validated predictive relationships / probabilities | 0 | No predictive calibration or independent forward study |

These are family counts. ATR periods, pairs, rolling windows, instruments and timeframes are instances. The 60 event/instrument records and 180 measured response windows are not 60 independently validated studies. See `audit-family-reconciliation.json` for all 23 scope items and `validation.json` for measured counts.

## Reconciled execution plan

`lib/historical/plan.ts` and the existing registry/rule evaluator now use Silver Cash, Sugar Raw Cash, Crude Oil Cash (BUY/SELL), and NQ (SELL ONLY). Russell, gold and copper are context only. Old saved decisions retain their original identities and rule snapshots.

The old 2m-only / 10m+ checks were replaced with native 2m/5m execution and 15m+ directional confluence. Multiday confluence is 2H+. Liquidity and gap evidence must be 5m+. ATR is 9 on 5m and 14 on 15m. Minimum proposed reward/risk is 1:5; SL moves to breakeven at TP1. TP1 trigger and fraction remain missing. Maximum one new position per instrument per UK day is distinct from the retained older cap of two simultaneously open positions. Unknown opening history never becomes zero.

The previous entry windows, 08:00–10:00 and 14:00–16:30, start inclusive/end exclusive, remain displayed on the provisional London clock. The historical exchange/broker calendar is not verified. The old ambiguous indicator wording is preserved as historical provenance; the explicit ATR rules supersede it. NQ needs a separate confirmation branch and an exact product. CMC US NDAQ 100 cash is a labelled research comparison, not a confirmed substitution for CME NQ.

## Data sufficiency and retrieval

11 series contain **31,188 actual provider bars**: 8 newly retrieved intraday histories plus 3 daily histories preserved from the audit. All raw source price strings remain in the archived daily source; new numeric inputs preserve bid, ask, mid and source timestamps. No images or imported narratives enter the calculation pipeline. Volume is unavailable in every retrieved bar.

| Series | Interval | Observed period UTC, source timestamps | Bars |
|---|---|---|---:|
| Silver Cash | 2m | 16 Oct 2026 14:54–20 Oct 23:58 | 1,623 |
| Silver Cash | 5m | 7 Sep 2026 07:25–20 Oct 23:55 | 8,713 |
| Silver Cash | 15m | 21 Sep 2026 18:30–20 Oct 23:45 | 1,950 |
| Silver Cash | 2H | 27 Feb 2026 08:00–20 Oct 23:00 | 1,995 |
| US NDAQ 100 cash, unconfirmed NQ comparison | 5m | 8 Sep 2026 01:10–20 Oct 23:55 | 8,840 |
| Same comparison | 15m | 22 Sep 2026 12:30–20 Oct 23:45 | 1,950 |
| Same comparison | 2H | 1 Mar 2026 22:00–20 Oct 23:00 | 1,995 |
| GBP/USD | 15m | 22 Sep 2026 20:00–20 Oct 23:45 | 1,950 |
| GBP/USD / Silver / US NDAQ cash | Daily | Jan 2024–20 Oct 2026; separate endpoint coverage | 727 / 723 / 722 |
| Sugar Raw Cash / Crude Oil Cash | Required intervals | No exact product history retrieved | 0 |
| GBP/CNH, USD/CNH, USD/SGD, DXY, USD/BRL, USD/PKR, Treasuries/gilts/yields | Required aligned history | Unavailable in inspected data | 0 |

`dataset-coverage.csv` supplies exact ranges, input hashes, ATR warmup/missingness, discontinuities, volume and timestamp/mapping states per series. Requested history bounds were substantially wider than returned coverage; the engine records actual observations. It does not claim completeness of the larger request. No daily data was resampled into intraday bars.

CMC metadata probes returned inconsistent current versus typical session times. Historical bar-open/close anchoring, closed state, DST/session calendars and source price units remain unverified. Research calculations explicitly assume the source timestamp is bar open; availability is source time plus interval. This assumption cannot pass an operational gate. All interval discontinuities reset ATR, pivot context and gap tracking conservatively. Consequently daily ATR has zero warmed-up values because weekly gaps reset it. This is visible missingness, not a silent interpolation.

Bigdata.com returned 20 US/UK calendar events for 1–20 October, attributed to FXStreet. Some events lack actual/consensus values. Retrospective consensus and first-release actual vintages are unverified. The engine calculates natural-unit differences and observed responses, with **zero** point-in-time verified event instances. It cannot infer an expected price direction from a CPI sign or a publisher's “better” flag.

## Deterministic methods and assumptions

All definitions below are **research version 1, unapproved for execution**. Qualitative interpretation is not a detector input.

| Family / source | Formula and parameters | Outputs / limits |
|---|---|---|
| ATR / volatility — `features.ts` | TR=max(H−L, abs(H−previous C), abs(L−previous C)); seed mean first n TR, Wilder ATR=((n−1)previous ATR+TR)/n. 5m n=9, 15m n=14. Other intervals use n=14 as research helpers. ATR percentile compares only prior 100 ATR observations, minimum 20; ≤20% low, ≥80% high. | Per-bar ATR, warmup, percentile/regime. Missing intervals reset warmup. Regimes are observed volatility, not forecasts. |
| Structure / sweep / retest — `features.ts` | Strict pivot with two bars left/right; available after right-bar close. Last two confirmed highs/lows define HH+HL bullish, LL+LH bearish. A sweep breaches a previously confirmed level and closes back through it. Both-side sweep is conflict. Retest is a later bar within 10 bars, level ±0.1 ATR, closing on the reclaimed side. | Confirmed pivot, direction, sweep, later retest and timestamps. Exact owner pivot/sweep definitions still require approval. |
| FVG / IFVG — `features.ts` | Three contiguous 5m+ candles: low[i]>high[i−2] bullish gap, high[i]<low[i−2] bearish. Full fill reaches far boundary; inversion requires a close beyond it. A fill does not erase a later inversion. Tracking ends after 200 bars or a discontinuity. | Gap bounds, full-fill and inversion dates. No invented displacement, volume or intent filter. Expired/unobserved gaps are censored, not successes. |
| SMT proxy — `statistics.ts` | Confirmed pivot extremes on a selected direct/inverse comparison; latest confirmations within four intervals. New source HH/LL without comparison extreme yields a research divergence. No future pivot access. | Dated, deduplicated divergence events. Pair/direction approval missing; shared FX exposure is not independent confirmation. |
| Rolling correlation — `statistics.ts` | Align common timestamps first; log returns between common endpoints; Pearson on 20/60/120/252 observations. Abs(r60−r252)≥0.3 marks a proposed descriptive dislocation. Zero variance/nonfinite inputs produce unavailable correlation. | Direct/inverse signs, windows, aligned prior endpoint, availability, dislocation. Variable missing-calendar gaps remain explicit; no causality or stability claim. |
| Release surprise / response — `statistics.ts` | actual−consensus, K/M/B/T scaling; percent-rate differences are percentage points. Pre/post mid-close returns at 15/60/120 minutes require exact contiguous endpoint windows. | 60 event/instrument records, 180 observed post windows. Actuals and consensus are not point-in-time validated. Response becomes evidence only after its horizon completes. |
| Opening reversal — `features.ts` | First 30 minutes at the retained UK 08:00/14:00 windows form a range. Close outside followed by close back inside within 90 minutes yields one reversal event per opening. | Observable break/reentry proxy for a potential Judas swing; no claim of manipulation, intent or exchange-open equivalence. |
| Entry / outcome replay — `simulation.ts` | 5m retest candidate, contemporaneous 15m structure, permitted side/window, next contiguous bar entry; stop at adverse recent 10-bar bid/ask extreme, target 5R. One entry/day and one position at a time in the research replay. | Every candidate, rejection reason, stop/target, outcome and regime/partition. Native 2m features exist; cross-timeframe 2m entry binding to 5m structure is still deferred, rather than qualifying a 2m sweep. |
| Three-circle confluence — `confluence.ts`, `engine.ts` | Current/past feature availability, direction, volatility, as-of descriptive correlation/SMT and event response context feed hard gates. STAND DOWN for missing/invalidated/contradictory mandatory evidence. CAUTION for high volatility only after hard gates pass. BUY/SELL require a qualifying permitted side and every hard gate. | Separate Strata and owner-plan assessment, J's recorded decision, hard gates, disagreement and next conditions. Confidence=null; cannot submit orders. Fixture tests exercise all four states; real observations do not clear operational gates. |

The six-FX owner conviction ladder remains separate from structural SMT. Missing exact FX series means no historical verification of that full ladder. NQ never inherits it automatically. No demand-elasticity quantity, imported numerical “elasticity”, narrative probability, media sentiment or inferred motive is treated as measured quantitative evidence.

## Historical evaluation

Parameters were set before the first calculation run and were not tuned against outcomes. Final 20% of each chronological series is the holdout; 72 bars before its boundary are purged. Features may warm up on older history; outcomes crossing the development boundary are excluded. A chronological engineering holdout is not independent validation or a pre-registered forward study.

Replay prices use historical ask for long entry/bid for exit, the reverse for shorts. If stop and target are touched in one bar, stop wins. Adverse gap opens worsen the stop fill. TP1 breakeven becomes active on the next bar because OHLC cannot reveal tick order. Unobserved intervals and dataset endings are unscored/censored. Funding uses 17:00 New York with DST. Unknown funding cost across a cutoff leaves net R unavailable. Monetary risk and product conversion remain unresolved.

Owner TP1 is not defined. The explicit, inactive comparison scenario takes half at 1R and the remainder at 5R; its maximum weighted target is **3R**, before costs. Baseline scenario slippage/commission are zero assumptions, not verified zero costs. A second run applies one observed first-100-bar maximum spread of slippage per fill. These assumptions do not become owner configuration. No result here establishes that a complete trading plan with real fees can achieve 1:5.

| Research replay | Candidates / rejected | Scored outcomes | Holdout n / mean scenario R | 5R final target reached |
|---|---:|---:|---|---:|
| Silver 5m | 1,347 / 1,330 | 17 | 4 / −1.00 | 0 |
| US NDAQ cash comparison, SELL ONLY | 1,170 / 1,161 | 9 | 3 / −0.50 | 0 |

The sample is too small and insufficiently mapped/costed to establish predictive validity. Low/normal/high/warmup results, slippage sensitivity, calendar-year correlation buckets, rolling sign changes and all rejected cases are retained in `validation.json` and the full outputs. No probabilities were fitted. The 8 matched-pair/timeframe correlation instances are descriptive and regime dependent; missing CNH/SGD/yield histories cannot be represented by these results.

All **17,553** saved confluence instances are STAND DOWN. Some include already-observed linked event responses and market comparisons, but these cannot clear missing expectation vintage, expected price direction, method approval, risk or freshness gates. This is working gated evaluation, not a successful trading backtest.

## Module, persistence and replay map

- `types.ts`: validated OHLC/series contracts, versioned research parameters and time semantics.
- `plan.ts`, existing `strata-v2/{registry,rules}.ts`: latest owner execution specification; old narratives and stored decisions preserved.
- `features.ts`, `statistics.ts`, `simulation.ts`, `confluence.ts`: deterministic methods and gates.
- `engine.ts`: orchestrates sources, as-of links, research replays and assessments.
- `scripts/run-historical.mjs`: complete offline reproduction; writes all result artifacts, SHA-256 manifest and private server catalog.
- `scripts/report-historical.mjs`: coverage, regimes, costs, counts and original 23-family reconciliation.
- `data/historical/`: validated observation snapshots and full immutable result artifacts. These are private server modules, not public static files or browser fixtures.
- `/api/historical`: authenticated manifest, paginated source/features/events/replay/confluence/comparisons; recalculation verifies exact saved feature hash before recording success; receipt comparison uses server time.
- `private-store.ts`: append-only owner-scoped D1 calculation records and J's attributable view. Input/result hashes and retained full-artifact references allow replay; prior versions are recoverable from source history. A source-version mismatch is rejected rather than silently replaying different evidence.
- `app/historical-engine.tsx`: existing Three Circles screen, dataset/view selectors, pagination/export, recalculation/save, gate/evidence inspection and owner disagreement. Existing portfolio and research screens retained.

No SQL table alteration is required: `round1_records.kind` was already unrestricted TEXT. The TypeScript enum adds `historical`; old owner rows remain intact. No destructive migration, account reconciliation or imported rule overwrite occurred. Owner configuration gains TP1 and NQ confirmation slots while retaining legacy fields for old saved versions. Restore by selecting baseline Sites version 22 with the same private audience, or prepare a new supported source deployment from the preserved baseline commit. Never force-reset later work.

## Reproduction and checks

From repository root, Node 24 and installed dependencies:

```powershell
node --experimental-strip-types scripts/run-historical.mjs
node scripts/report-historical.mjs
node --experimental-strip-types --import ./tests/core-register.mjs --test tests/core.test.mjs tests/historical.test.mjs
node --test tests/persistence.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js app/historical-engine.tsx app/api/historical lib/historical scripts/run-historical.mjs scripts/report-historical.mjs tests/historical.test.mjs
```

Use the supported Sites `build-site.mjs` and `site-workflow.mjs` for release packaging and source history. `preview-owner-local.mjs` is strictly a loopback QA identity simulator for local Wrangler; it does not authenticate to production.

Source/fixture checks cover exact allowlist and inversion, Silver-only conviction, latest timeframe gates, ATR arithmetic, prefix invariance and pivot delay, FVG fill/inversion, correlation alignment, future SMT exclusion, contiguous release windows/vintage separation, purged chronological holdout, bid/ask ordering, partial TP1, costs/funding, daily openings, missing data, four states and disagreement. SQLite integration tests exercise actual production SQL, durable reopen, cross-owner isolation, forged evidence rejection, paginated loaded/empty states, unavailable storage and the authenticated route boundary. These do not prove hosted provider connectivity.

62 source and integration tests pass. A second full historical run reproduced all 15 artifact byte hashes exactly. Drizzle reports no schema changes. The production build passes. Full-project lint retains **7 pre-existing React effect errors** in the baseline's corpus, globe and workspace components; linting those exact files from baseline HEAD reproduced all 7. New engine files are checked separately. Do not interpret that baseline lint failure as a successful full-project lint run.

Local browser QA observed: source/features load, real 8,713-bar recomputation persisted, separate Strata/owner-plan Stand Down, delayed/stale comparison, and a clearly labelled synthetic QA disagreement saved under a local-only test identity. Mobile 390px and tablet 768px DOM checks found no horizontal document overflow. Screenshot capture was unavailable, so visual appearance is not verified by screenshots. Hosted sign-in and provider runtime remain separate verification limits; see the final deployment receipt for hosted checks.

## Sources and next requirements

| Source | Actually used here | Remaining gap |
|---|---|---|
| CMC, owner-selected Live GBP spread betting | 8 intraday history reads, existing 3 daily series, product/metadata probes, individual delayed Silver quote after failed batch read | Exact Sugar/Crude product; NQ cash vs futures decision; unit/boundary/calendar verification; historical costs; fresh current bars and position-opening history |
| Bigdata.com / FXStreet | 20 dated economic calendar records; retrospective actual/consensus/unit fields | Archived consensus, first-release actual and revision vintages; release completeness; frozen expected-price response definitions |
| Official CMC, BLS, BEA, ONS, ALFRED | Contract research and vintage/calendar gap analysis in `METADATA_CONTRACT_RESEARCH.md` | Exact releases and vintage datasets need bounded verification; contracts alone do not prove access |
| Financial Datasets | Existing integration contracts preserved; no substitute history presented as a new successful read | Exact-market entitlement, interval, timestamp and coverage confirmation for specific missing series |
| Trading 212 | Existing portfolio/pie seed and persistence retained | API remains deferred; no keys requested, no broker writes |
| News connections | Existing dated source-linked research retained | Not a point-in-time economic wire, consensus archive or price confirmation |

Highest-priority next work is to resolve exact tradable identities and bar/calendar semantics, supply TP1 trigger/fraction and risk sizing/loss/blackout rules, approve or replace research structural definitions, obtain aligned FX/yield and Sugar/Crude history, and verify release vintages and cost records. Then bind native 2m entries to 5m+ structures, validate each method across longer held-out regimes, and calibrate any proposed combined predictive claim. Do not add the eight deferred families indiscriminately. Demand elasticity, probabilities, motives and a final numerical Elastication formula remain unavailable unless separately defined and validated.
