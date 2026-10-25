# Strata V2 — Round 1 handoff

Round 1 provides the working research and decision-review shell in the existing Strata project. It preserves the owner's Three Circles, historical memory, captured rulebook and portfolio intentions. Current execution readiness remains blocked or incomplete: missing mappings, risk definitions, structural rules and fresh operational observations are displayed as missing rather than supplied by demonstrations.

This record is complete for the implementation and bounded research described below. Final source, saved-version and deployment identifiers are recorded in the delivery receipt produced after the supported Sites operation. A successful source build does not establish a live integration or trading performance.

## Site, identity and recoverable baseline

| Item | Record |
|---|---|
| Existing Site | [strata-atlas.jaydds2002.chatgpt.site](https://strata-atlas.jaydds2002.chatgpt.site) |
| Existing project ID | `appgprj_6aa2cfb5d1688191bdf3a8a9ca6365b0` |
| Audience | Existing owner-private audience; retain without broadening access |
| Opened baseline source HEAD | `49ab2e3e17176a85d0f9c05f57a5d52306847c7e` |
| Prior saved Site version | 21 |
| Final Round 1 source commit | See exact pushed commit in the delivery receipt |
| Final Round 1 saved version | See supported Sites save receipt in the delivery |
| Final deployment ID/status | See supported Sites deployment receipt in the delivery |
| Final deployed URL check | Same destination above; result recorded in the delivery receipt |

The current opened source and Site, rather than an assumption from the older audit, supplied the baseline. The checked-out baseline happens to have the same hash as the earlier audit reference. Current chat-native provider discovery is substantially broader than the earlier audit. Its successful reads are preserved as dated research receipts. No hosted provider read was established by those chat receipts, and no new production runtime provider connection was installed in Round 1. This distinction does not claim that all data available to the owner is disconnected.

Source history retains the baseline commit. Original corpus bytes and historical images remain in the repository; they were not replaced with regenerated records. The project identity remains in [the hosting manifest](../.openai/hosting.json). The migration is additive: [the generated migration](../drizzle/0000_elite_typhoid_mary.sql) creates the private `round1_records` table and indexes. It does not rewrite the corpus or populate broker holdings.

For rollback, retain the final source/save/deployment receipts and return the UI to the retained baseline through the supported Sites workflow in this same project. Preserve the private audience, the `DB` binding and all existing `round1_records` data. Do not drop owner history or reverse an applied migration to roll back presentation code. Before a hosted rollback, verify the platform's database retention and export/backup procedure; a local SQL test is not proof of hosted recovery. Local preview D1 and hosted D1 are separate stores. Details and the local migration procedure are in [Private persistence and API](./ROUND1_PERSISTENCE.md).

## Delivered application

| Flow | Implemented behaviour |
|---|---|
| Today / Scan | Exactly four execution cards, direction/readiness/evidence-health distinctions, unknown current positions, relevant dated macro/company research, broad context-only watchlist, Three Circles and J's decision form |
| Instrument / Tape | Instrument, interval and source selectors; strict operational BarSeries boundary; real dated CMC Silver 2m/10m research samples; explicit unavailable states for unsupported selections; source times, price basis and structural gates |
| Portfolio | Five pies and 58 original displayed lines; per-pie observed versus intended weights; unknown values/quantities/identities; versioned seed and manual/import snapshots; issuer research, earnings and material-news slots |
| Atlas / Memory | Shared historical records with geography/year/text/review filters, globe and accessible list, pagination and source inspector; `/surface` remains an alias for Memory |
| Rules | Captured commodity conviction ladder, bearish inversion, separate structural SMT/ICT requirements, raw ambiguous owner text and a visibly isolated hypothetical lab |
| Three Circles | Smallest Watchlist, middle News and expectations, largest Human behaviour; linked imported expectation/reported-response panels, source inspection and unavailable quantitative/classification states |
| Data Health / Log | Provider selector, source-coverage matrix, event intelligence, complete sanitized receipts, explicit refresh availability failures and private decision/refresh audit records |
| Settings | Versioned confirmed/proposed/missing owner definitions with validation; no credential fields, order submission or broker writes |

The screen layer retains Strata/Albion identity and consolidates related flows. The active routes use the V2 workspace. Historical source and legacy assets remain recoverable, but chart uploads, screenshot freshness checks, image interpretation and screenshot replacement are absent from the operational flow. Portfolio images are only provenance for the seed.

### Departures from the older PDF

- The owner's later four-instrument list supersedes the PDF's five-instrument list: **Sugar Cash, Silver Cash, Crude Oil, iShares Russell 2000 ETF**. Gold and copper are context-only. Russell index, ETF, future and broker derivative are not interchangeable.
- The owner's named Three Circles and separate Strata/J decisions are explicit. The broad watchlist never expands execution eligibility.
- The provider scope includes Bigdata.com, CMC, Financial Datasets, Trading 212, Newsify, official evidence and a justified weather boundary. Additional connectors were not called merely because installed.
- The previous chart-screenshot workflow is removed. No dedicated archive destination was added; existing image bytes/history remain preserved.
- The PDF's proposed event-response methodology remains an unapproved research specification. No new elasticity formula, probability, numeric Maximum conviction score or mean-reversion assumption was invented.

## Architecture and module map

| Module | Responsibility and boundary |
|---|---|
| [app/workspace-v2.tsx](../app/workspace-v2.tsx), [app/workspace-views.tsx](../app/workspace-views.tsx), [app/v2.css](../app/v2.css) | Navigation, responsive research views, honest empty/stale/error states, private state loading and issued-assessment review UI |
| [lib/strata-v2/contracts.ts](../lib/strata-v2/contracts.ts) | Vendor-independent economic assets, market series, broker instruments, provenance, BarSeries, freshness, positions, assessments and owner decisions; timestamp/OHLC validation |
| [lib/strata-v2/registry.ts](../lib/strata-v2/registry.ts) | Four-entry execution allowlist; preserved wider context registry; unresolved exact broker identities |
| [lib/strata-v2/rules.ts](../lib/strata-v2/rules.ts) | Deterministic conviction, sessions, liquidity/timeframe checks and hard gates; captured rule version `R1-three-circles-owner-2026-10-19`; no execution authority |
| [lib/strata-v2/research.ts](../lib/strata-v2/research.ts) | Three Circles, frozen expectation contracts, observed-response linkage, research readiness and unavailable calculations |
| [lib/strata-v2/interpretation.ts](../lib/strata-v2/interpretation.ts) | Schema-validated future explanation boundary; known evidence IDs and deterministic numeric facts only; no rule/readiness override or paid model call |
| [lib/strata-v2/services.ts](../lib/strata-v2/services.ts) | Typed market, event, account, portfolio, research, rules, interpretation and audit service interfaces; authenticated request scope separated from vendor adapters |
| [lib/strata-v2/providers.ts](../lib/strata-v2/providers.ts) | Validated immutable provider registry and real bounded research snapshots; separate historical sample access and unavailable operational-bars result; no production network loop |
| [lib/round1-store-contracts.ts](../lib/round1-store-contracts.ts), [lib/round1-store.ts](../lib/round1-store.ts) | Strict mutation contracts; private append-only config, portfolio, rule, review, decision and refresh records; hashes, versions and owner-scoped queries |
| [app/api/round1/route.ts](../app/api/round1/route.ts) | Authenticated same-origin read/write API using the existing Sites user helper and D1 `DB`; no anonymous fallback and no browser-asserted owner IDs |
| [db/schema.ts](../db/schema.ts), [drizzle migration](../drizzle/0000_elite_typhoid_mary.sql) | Additive private persistence schema and indexes |
| [data/round1/portfolio-seed.json](../data/round1/portfolio-seed.json) | All five pies, 58 source-linked lines, photo/PDF checksums and separate observed/target/unresolved fields |
| [data/round1/provider-discovery.json](../data/round1/provider-discovery.json), [provider-ui.json](../data/round1/provider-ui.json) | Full capability matrix/receipts and normalized UI research data; no credentials or internal CMC account/product/position identifiers |
| [data/corpus](../data/corpus), [lib/strata/historical.ts](../lib/strata/historical.ts), [app/corpus.tsx](../app/corpus.tsx) | Preserved original corpus, stable IDs, checksums, repair notes, narrative expectations/outcomes and inspection flow |

### Decision attribution and persistence

The server issues four owner-bound assessment reviews containing a token, as-of time, expiry, configuration version, assessment hash and the exact assessment. The UI displays that assessment. J records agree/disagree/wait, a thesis and an execution or stand-aside rationale. The API accepts the review binding, not a browser-supplied assessment. It reconstructs and checks the captured assessment, rejects changed configuration/rules/session conditions, and stores the unchanged assessment beside J's later recording time and hard gates. A final atomic configuration check prevents a concurrent tab change from slipping into the append. Reviews expire after 60 seconds; this is a review-binding limit, not a market-freshness claim.

Records retain configuration/rule snapshots, input versions/hashes and provenance. Agreement does not count shared evidence twice. Disagreement is preserved. Neither decision grants order authority. The hypothetical lab has no durable mutation path and cannot change evidence or holdings. Failed private reads clear the active private state rather than claiming browser memory is durable storage.

## Reconciled data and evidence

The current corpus retains **907 records, 422 review-flagged records and 54 supplied numeric elasticity claims**. The four imported method counts remain separate: `reaction_vs_expectation` 34, `volume_proxy` 16, `OI_proxy` 2, `positioning_proxy` 2. No supplied value is pooled or converted into a probability. The 46 legacy static chart references/assets remain historical material, not fresh structure inputs. Date repairs and original text remain inspectable; an imprecise historical date is not promoted to an intraday instant.

The portfolio seed contains Consumer 12, Spine 10, Ingredients 4, Ninjas 8 and NWO 24 lines. Every pie's intended targets total 100%. Observed percentages are separate: Consumer totals 100.00%; Spine 99.98% reflects displayed rounding; the other three pies display zeros. Capture time, quantities, money values and broker-reconciled holdings remain unknown. Zero shown allocation does not establish permanent absence. No whole-account exposure is calculated from within-pie percentages. `Amundi`, `SpaceX`, `WisdomTree Uranium and Nu...` and `Taiwan Semiconductor Manu...` remain unresolved as displayed; no ticker or wrapper was guessed.

The full [provider/coverage matrix and 22 sanitized read receipts](../data/round1/provider-discovery.json) preserve 14 information needs, two narrative research examples and two real historical Silver bar snapshots. The [provider report](./provider-coverage.md) explains their limitations and exact source links. These are actual bounded chat-native reads, not fixtures and not live feeds.

## Readiness manifest

Here **verified** means the specific stated source check or read passed. **Implemented with fixtures** means deterministic code was tested using isolated synthetic inputs, not empirically validated market performance. **Configured but untested** identifies a contract or declared path lacking the relevant runtime proof. **Blocked** means a known prerequisite is missing. **Unsupported** means the requested use cannot be satisfied by the available capability. None of these labels silently transfers verification from chat to hosted execution.

### Rules and research

| Rule/module | Status | Evidence and operational limit |
|---|---|---|
| Four execution entries; broad context separated | Verified in source/tests | Exactly four; gold/copper context-only; Russell ETF separate; exact broker mappings unresolved |
| Commodity conviction ladder and bearish inversion | Implemented with fixtures | 6/10 Silver only; 7/10 and 8/10 commodity branch; Maximum has no numeric score; contradiction/missing-evidence tests; not a win probability |
| Structural SMT / ICT and Russell confirmation | Blocked | Direction/pivot/sweep/gap/synchronisation definitions and separate Russell branch remain missing |
| Sessions and timezone | Implemented with fixtures; owner policy blocked | 08:00–10:00 and 14:00–16:30, start inclusive/end exclusive, London DST tested; fixed GMT versus London remains unresolved; confirming another zone cannot clear the London-policy gate |
| Entry, thesis, liquidity and optional gaps | Implemented with fixtures | Entry 2m; thesis 10m+; liquidity below 5m low, 5–9m context, 10m+ thesis; optional qualifying gaps need 10m+ and liquidity alignment |
| Position cap | Implemented with fixtures; current input blocked | Maximum two across both directions per instrument; requires correct fresh reconciled scope; missing/stale positions remain unknown |
| Monetary risk, stops, targets, loss limits, calendar/news policy | Blocked | Mandatory definitions/configuration absent; text confirmation cannot supply missing operational inputs or implemented structural checks |
| Freshness and BarSeries | Implemented with fixtures | Event and receipt time, precision, declared delay, partial/future bars, OHLC geometry and selected economic asset checked; exact product reconciliation still required |
| Three-circle evidence separation and freeze/link contracts | Implemented with fixtures | Instrument/event/horizon/timestamps/source linkage; historical narratives visibly unverified; no measured behavioural motive inferred |
| Elastication calculation and demand elasticity | Blocked | Final method, quantity variable where applicable, baseline, horizon and uncertainty unapproved; no calculation or classification invented |
| Strata/J attribution and hard-gate preservation | Implemented with fixtures/local SQL | Issued review binding, immutable disagreement, expiry/session/config checks and ownership tests; authenticated hosted end-to-end round trip pending |
| Interpretation boundary | Implemented with fixtures | Strict cited schema and deterministic numeric facts; no model call, no rule override |
| Private storage | Verified in local SQL and local Worker; hosted untested | D1 migration and owner checks implemented; anonymous API returns 401; trusted test identity saves/reloads an exact assessment and disagreement locally; real authenticated hosted persistence still needs verification |
| Isolated lab | Verified in source and fixtures | Local scenario inputs only; no API mutation, no actual evidence or holdings changes |

### Integrations and source routing

| Provider / role | Observed chat status | Hosted status | Round 1 use and next blocker |
|---|---|---|---|
| CMC accounts, exact products, bars, quote, positions | Verified bounded reads on owner-selected Live GBP **SB** | Configured boundary; eligibility/consent/read untested | Silver match and separate 2m/10m samples; Sugar/Oil unresolved; Russell candidate only; current positions unknown |
| CMC 2m entry pricing | Unsupported by the observed delayed quote path | Unverified; no runtime feed | Tool declares 15m delay/live pricing disabled; observed Silver quote was about 55m old at receipt; cannot clear a 2m entry gate |
| Bigdata identity and company/ETF research | Verified bounded reads | Configured boundary; eligibility/read untested | Resolve identity first; company and ETF workflows remain distinct; Amazon earnings/catalyst/news and macro calendar snapshots shown |
| Financial Datasets macro | Blocked | Unknown/unverified | Probe returned a zero-credit error inside a successful transport envelope; no macro values accepted; purchase is not required for this shell |
| Financial Datasets prices/fundamentals/other coverage | Configured but untested | Unknown/unverified | Schema availability alone does not establish entitlement, interval or geography; targeted tests only for a selected gap |
| Trading 212 portfolio/history/pies | No API connected; documentation only | Not connected | Versioned manual/import path implemented; no key requested; eventual secure optional account read and replaceable pie membership |
| Newsify headlines | Read verified; evidence rejected | Configured boundary; eligibility/read untested | Returned item unrelated, original URL/time unavailable; contributes no market confirmation; discovery only |
| Official issuer/exchange/agency evidence | Selected identity/documentation reads verified | No automated runtime path | Gap-specific authoritative fallback; exact publication/as-of/source links required |
| Tomorrow.io relevant weather | Schema inspected; read deferred | Unknown/unverified | Requires a specific relevant location and mechanism; no default-location call, yield inference or direction signal |

No unattended capability was activated or established for any provider. Hosted eligibility discovery was unavailable in this session; source inspection did not establish a runtime declaration for these newly explored paths. A future hosted adapter should use eligible authenticated request-scoped Site connectors, with visitor consent/account scope checked separately. No copied session token, one-time response or builder credential may become an integration.

CMC supplies operational product/account evidence when the exact scope and timeliness qualify. Bigdata supplies issuer/ETF, corporate-calendar and macro/news context. Financial Datasets is a candidate for structured gaps only after entitlement and coverage testing. Trading 212 remains optional portfolio reconciliation. Newsify is optional broad discovery, not a complete calendar, consensus source or low-latency wire. Official sources resolve specific identity/release gaps. Weather is justified only by a resolved geographic question. Multiple syndicated reports of one event are one evidence cluster, not independent confirmation.

## Verification performed and limits

| Check | Recorded result at handoff drafting | Limit |
|---|---|---|
| Core source tests | 24 passed | Isolated fixtures validate code and contracts, not trading performance or live feeds |
| Persistence/API tests | 15 passed | Generated migration and production SQL run against local Node SQLite; identity headers explicitly mocked for route tests |
| TypeScript checks | Final check passed | Source/type correctness only |
| Production build | Passed before the final small globe declutter adjustment | Build emitted a chunk-size warning above 500 kB and a Vinext route-classification warning; no fatal build error in that run. Record any later final-build result before deployment |
| Local Worker / map | Actual HTTP 200 for application and map asset on current local server | Earlier transient map 404 during the build was retested successfully on port 5174; not a hosted result |
| Local D1 migration | Three migration statements passed | Local database only; not hosted migration verification |
| Local persistence HTTP flow | Trusted test identity received durable state and four reviews; saved disagreement and reloaded the exact assessment successfully | Local Worker with test identity, not real hosted visitor authentication; no production test decision was saved |
| Browser desktop / tablet / mobile | Actual 1280px, 820px and 390px screenshots inspected; no horizontal overflow observed | Final deployed browser pass pending |
| Portfolio / navigation browser flow | Mobile menu, 12 Consumer lines, five pie tabs and 58 total lines functional | No broker reconciliation or account values verified |
| Atlas browser flow | Map loaded; list alternative and empty search state exercised | Historical source data, not current events |
| Tape / Data Health browser flow | Dated Silver 2m sample source selector, OHLC display, readiness gates and Trading 212 coverage filter exercised | Historical sample cannot qualify current structure; filter test is not a Trading 212 account read |
| Anonymous private API | Actual browser API response 401 and unavailable private state shown | Confirms unauthenticated rejection, not a real authenticated hosted owner round trip |
| Provider probes | 22 bounded sanitized receipts retained | Chat-native reads only; timestamps and coverage differ per source |
| Read-only code review | Reported defects fixed and source rechecked | Not a substitute for hosted authorization/storage verification |

Core checks cover allowlists, ladder tiers/inversion/contradiction/missing inputs, missing mandatory rules, London session/DST boundaries, asset binding, stale/future/partial data, unknown positions, Three Circles, expectation freezing, decision attribution, lab isolation, interpretation constraints and pie totals/unknown fields. Persistence checks cover ownership, restart durability, strict inputs/same-origin requests, append-only versions, atomic seed and import-first rulebook preservation, honest refresh failures, review binding/expiry/session/config changes and a concurrent-config guard.

The source suites total **39 passing tests (24 core + 15 persistence/API)**. Material unverified paths at drafting: authenticated deployed persistence; hosted D1 migration/recovery; actual request-scoped provider eligibility/visitor consent; new runtime connector refreshes; final deployed QA. Local test identities are not production owner-authentication proof. No screenshot observation, mock quote, empty position receipt, source test or build result is treated as current execution evidence. The separate delivery receipt records final deployment checks and any failures.

## Exact Round 2 decisions and capability probes

### Owner decisions still required

1. **Session clock:** confirm Europe/London including GMT/BST or fixed GMT; define holiday, weekend, early-close, rollover and exceptional-session policy. Existing boundary convention remains start inclusive/end exclusive.
2. **Exact products:** reconcile all four owner labels to the selected CMC spread-betting account. Resolve Sugar Cash's basis/product, Crude Oil's benchmark/cash basis, Silver units/quote basis and Russell ETF listing/wrapper. The IWM research candidate is not final approval.
3. **Direction and structure:** define bullish/bearish/neutral direction, pivots, comparison pairs, synchronisation tolerance, sweeps, gap/FVG/IFVG formation/mitigation/inversion and structural invalidation. Do not activate the legacy one-bar alignment assumption by default.
4. **Russell branch:** supply its separate equity/ETF confirmation logic; commodity currency conviction must not be inherited.
5. **Indicators:** resolve the preserved raw wording, `RSI: 15m> = 9, 15m-1H = 14, 1H+ hard to compute; ATR same as RSI`—timeframe boundaries, lookbacks, thresholds and advisory versus gate role remain undefined.
6. **Risk:** define risk per trade, total open risk, daily loss limit, stop/target policies, sizing inputs, currency conversions and treatment of unknown data. Two positions per instrument is not a monetary risk model.
7. **Calendar/news/freshness:** define news blackout/reopening rules, event coverage required, interval-specific freshness and tolerated delay/clock skew, partial-bar handling and account/position reconciliation scope. Current engineering freshness defaults are proposed, not owner-approved policy.
8. **Research method:** approve event definitions, expectation types/vintages and freezing, response windows, benchmark, uncertainty, overlap/revision handling, sampling and method/model versions. Demand elasticity additionally requires a measurable quantity variable. Leave unsupported classifications/calculations unavailable.
9. **Portfolio reconciliation:** resolve displayed/truncated holdings using broker/import identifiers when available, retain target versus observed versus actual holdings, and supply whole-account capital weights only if account-level exposure is wanted. Trading 212 API setup remains optional and must not be forced.

### Technical/data probes, in dependency order

1. Discover supported Sites connector eligibility and the authenticated request-scoped invocation contract. Test visitor consent and ownership independently from installed chat availability. Keep account/security scope private and verify hosted storage round trips without weakening the audience.
2. Retain the already selected CMC Live spread-betting account choice. Resolve exact public product metadata before account-specific market reads. Do not arbitrarily switch accounts or conflate technical backend selectors with the customer-facing wrapper.
3. Probe each resolved product's historical 2m and 10m intervals separately: history depth, rate limits, timestamps/open-close anchoring, partial/closed bars, gaps, session/calendar behaviour and receipt/error semantics. Verify timestamp-based age independently of declared delay. Do not manufacture intraday bars from daily observations.
4. Establish a permitted timely market-data path suitable for the intended horizon; the observed CMC delayed path cannot satisfy 2m freshness. Test last-good/stale/error transitions and exact series-to-broker basis/units/version mapping before any operational use.
5. Verify positions against non-empty and mixed-direction snapshots, reconciliation time, missing/partial responses and exact selected account/instrument scope. The October 19 empty array remains historical only.
6. For Bigdata, re-resolve the issuer or ETF, then use the matching workflow. Audit calendar IDs/revisions, consensus basis/vintage, original publication/first-seen times and syndication groups. Preserve the Russell lookup description conflict and ETF field-as-of caveat until resolved.
7. Test Financial Datasets only for a selected gap after entitlement is known. Verify geographic coverage, intervals and timestamp semantics. A zero-credit/embedded error must remain a failed data read; official sources are a valid fallback and no purchase is assumed.
8. If the owner later opts into Trading 212, use a secure server-side credential/connector flow, never chat keys. Verify supported account/product types, portfolio/history pagination, rate limits and replaceable deprecated pie contracts; reconcile imported membership/targets without erasing provenance.
9. Admit Newsify or other headlines only with relevance and original-source/time checks; deduplicate common-origin events. Use issuer, exchange, central-bank, statistical, energy or agricultural sources for a specific remaining gap. Weather needs a resolved location and causal research question.
10. Select and validate final quantitative/rule implementations only after the definitions and measurements exist. Full system/research challenge testing remains Round 3. Do not interpret this handoff as authorization for continuous monitoring, execution or rebalancing.

## Stop condition

Round 1 ends after the completed save/deployment handoff. No Round 2 production integration, unattended monitoring, provider watchlist edits, broker writes, trades, rebalancing or paid data upgrades are initiated by this work. The owner will provide the next engagement prompt after reviewing this build.

