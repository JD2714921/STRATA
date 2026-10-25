# Owner routing and target clarification — 21 October 2026

Round 2 historical acquisition and execution-binding reconciliation is recorded in [V25_ROUND2.md](V25_ROUND2.md). It preserves this routing policy and keeps unresolved mappings/data blocked.

Baseline is version 23, commit `6d0bbe1be29fa4b69fe00e798f6927fdabef33b8`. This update supersedes its four-instrument allowlist and unresolved NQ cash-versus-futures choice. It preserves prior source history, stored assessments, historical calculations, corpus and portfolio seeds. The historical implementation report remains a version-23 record, not the current execution specification.

## Current assignments

| Need | Assigned source | Scope and verification |
|---|---|---|
| Execution-product information and direct market data | CMC Markets only | Gold - Cash, Silver - Cash, Sugar Raw - Cash, Crude Oil - Cash, US NDAQ 100 - Cash |
| Execution permissions | Same five cash products | Gold explicitly restored BUY/SELL by the owner's clarification; Silver/Sugar/Crude BUY/SELL; US NDAQ 100 cash SELL ONLY |
| Other market, security and portfolio information | Trading 212 | Stocks, ETFs, parent-company security identities, Treasuries, UK gilts, FX and other context requested by owner; actual account/catalog/data coverage remains a separate verification requirement |
| News, macro releases, catalysts and interpretation | Separate research layer | Bigdata.com; Investment Banking, Market Research Analyst and Data workflows; Forex Factory, Bloomberg, Yahoo Finance, Reuters, WSJ, BBC, GB News and primary official sources; regional coverage includes China, Middle East, Russia and Africa |

`source-policy.ts` assigns markets deterministically. `assertMarketSource` refuses CMC reads for every market outside the five exact products, and the existing market-data adapter calls that guard. News or Financial Datasets cannot silently substitute as direct price authorities. Older CMC FX and other snapshots remain dated historical evidence; preserving them does not authorise new CMC reads for context markets. A market being present on a watchlist does not grant execution permission.

CMC bounded reads on the previously selected Live GBP spread-betting account returned exact customer-facing SB label matches for Gold, Silver and US NDAQ 100 cash. Gold Weekend is a different product and was not selected. Exact Sugar Raw - Cash and Crude Oil - Cash searches returned zero matches. Broker identifiers are kept out of the handoff and browser. Product lookup success does not validate current bars, units, price freshness, historic calendars or execution readiness. The delayed CMC pricing constraint remains.

## Trading 212 capability distinction

The two local read-only Trading 212 adapter files already present at the start of this update were preserved in the external baseline record before refinement. The adapter now uses documented summary/position/order/metadata GET paths, takes cash from the account summary, refuses automatic Demo/Live probing, validates responses, preserves partial successful reads, and exposes an authenticated connection-status check without exposing secrets. No order-writing method exists.

At inspection, the existing Site's environment revision was 0 and had no configured Trading 212 credentials. No authenticated Trading 212 provider read was therefore performed. A local adapter, installed plugin, secure key stored elsewhere and hosted connection success are different states. Credentials must be configured through secure Site server settings as `TRADING212_API_KEY` and `TRADING212_API_SECRET`; environment selection is explicit or configured as `TRADING212_ENVIRONMENT`. Do not put keys in chat, the browser, source or ordinary logs.

Official public API documentation limits access to Invest/Stocks ISA accounts. Positions expose `currentPrice` for held securities, but no separate quote-observation timestamp: position opening time and response receipt time are not quote times. Instrument metadata includes a FOREX type enum, which does not prove that this account exposes a spot-FX feed. The inspected API has no general unheld-security quote, OHLC-bar or yield-curve endpoint. Bond/ETF availability needs actual catalog resolution; an ETF price is not its underlying bond yield. All such gaps remain unavailable under the owner routing policy, with no fallback to CMC.

Official references inspected: [API overview](https://docs.trading212.com/api), [machine-readable contract](https://docs.trading212.com/_bundle/api.json?download=). Per-account rate limits apply, including 1 request per 50 seconds for the instrument catalog. Connection buttons are on-demand reads and do not schedule refreshes. A failed optional order/catalog read does not convert missing positions into an empty account or discard a successful account read. Returned account data does not automatically reconcile the five pies.

## Targets

TP1, TP2 and TP3 are **suggestions**. In the proposed trade direction, distances from entry must satisfy `0 < d(TP1) < d(TP2) < d(TP3)`. BUY targets increase in price; SELL targets decrease. The validator rejects ties, targets on the wrong side of entry, nonfinite values and a farther target supplied without a nearer one.

The owner has not specified fixed target prices, R multiples, structure-selection methodology or partial-exit fractions. None are inferred. The previous minimum proposed 1:5 and breakeven-at-adopted-TP1 rules are retained. Ordering alone does not qualify reward/risk or authorise execution. Earlier historical 1R/half-position scenarios remain explicitly hypothetical; they are not promoted into this owner target policy.

The Rules screen provides an isolated ordering review. It does not write live evidence, owner holdings or broker instructions. `targets.ts` exposes the typed policy and validator for subsequent structure-based suggestions.

## News and attribution

The Data Health screen displays the current market/news separation, direct-source lookup, product-resolution states, Trading 212 status/read controls and news/region registry. Existing provider-discovery snapshots are labelled historical below this policy.

Investment Banking, Market Research Analyst and Data are research/analysis workflows, not independent publishers or newswires. Each future article requires the original publisher/link, publication, first-seen and receipt timestamps, region, evidence type and syndication-group ID. Syndicated versions count as one event. Commentary and inferred motives remain interpretation; an unverified headline or consensus does not clear a hard gate. Regional names identify coverage needs rather than individual publishers. Listed preferences do not establish subscriptions, runtime connector access or live coverage. No access restriction or paywall is bypassed.

## Verification and limits

Run:

```powershell
node --experimental-strip-types --import ./tests/core-register.mjs --test tests/core.test.mjs tests/historical.test.mjs tests/source-policy.test.mjs tests/persistence.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

Tests cover the five-product allowlist and Gold sides, NDAQ SELL ONLY, CMC denial for FX/equities/ETFs/yields/futures, no alternative direct-price fallback, BUY/SELL target ordering and missing targets, syndicated news grouping, authenticated Trading 212 status, no secret exposure, explicit environments, documented GET-only requests and partial failures. Fixtures for the Trading 212 HTTP contract are not actual provider verification. Source-policy receipts are in `data/round1/source-policy-receipts.json`.

The existing hard freshness, structural, monetary-risk, method-validation and data gates remain. This update does not make historical Elastication execution-ready, add an Agents API/SDK runtime, place orders or activate monitoring. The invoked Agents skill directs existing apps to retain their conventions; the requested routing distinction is implemented in the existing deterministic TypeScript services rather than requiring a new agent runtime or paid model call.
