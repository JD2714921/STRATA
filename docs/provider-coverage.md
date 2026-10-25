# Strata Round 1 — provider discovery

Generated 2026-10-19T21:56:14.412Z. This is a private, bounded discovery record. These receipts prove the listed chat-native reads at the recorded times. They do not prove a hosted Site integration, visitor consent, unattended capability, current positions, or current market data.

## Findings that change implementation

- CMC account discovery found two accounts. The owner then explicitly selected the active GBP Live spread-betting account. Customer-facing wrapper is **SB**. Internal account/product/position identifiers and backend selectors are intentionally omitted.
- On the selected account, **Silver - Cash** matched uniquely. Its delayed price and separate 2-minute and 10-minute historical bar reads succeeded. Five candles of each interval returned. This is actual provider data, not a fixture.
- The Silver quote was observed at **2026-10-19 21:00:00.650 UTC**, received at **21:55:14.121 UTC**: approximately **55 minutes old** despite the declared 15-minute delay. The response separately reported **NotTradable** market status and **Valid** price state. It cannot satisfy a 2-minute entry gate.
- The 2-minute series has source timestamps 20:50–20:58 UTC; the 10-minute series 20:10–20:50 UTC. These are historical snapshots. The source did not provide bar-closed flags, volume, or an explicit definition of whether its timestamp denotes the bar open or close. Do not fabricate these fields.
- The selected account's position response was an empty array. **Zero is known only at that receipt** (2026-10-19T21:54:55.171Z); current position visibility remains unverified without a current hosted read.
- **Sugar Cash** returned no match. Broader Sugar returned four issuer shares, not a commodity. **Crude Oil** returned ETF products; a commodity-filtered Crude query returned none. Do not map the owner labels to those alternatives.
- **iShares Russell 2000 ETF** was found as an SB research candidate with ticker IWM. CMC says NYSE and also returns ARC_IWM metadata; the official fund page says NYSE Arca. Exact broker listing, wrapper and units still need reconciliation. No final mapping was activated.
- Bigdata issuer identity, company earnings/calendar, ETF research, corporate/economic calendars, news search and document fetch all succeeded.
- Financial Datasets returned a **$0.00 credit balance error** on the policy-rate probe, inside an `isError: false` envelope. No macro values were returned. An adapter must validate payloads rather than treating transport success as usable data.
- Newsify transport succeeded but returned an unrelated beauty story with `sourceUrl: null`. Aggregation times were present; original publication and first-seen times were not established. It contributes no market evidence.
- Trading 212 was not connected or called. Official documentation was read; no key was requested. Manual/import portfolio records remain the Round 1 path.
- Tomorrow.io was discovered and its forecast schema inspected. No read was justified because no specific crop/energy location had been resolved. The user's default location was not queried.

## Coverage matrix

Every row's full account/security scope, format, interval/history, delay, timestamps, entitlement, result, rate/cost limits, hosted eligibility, refresh path, fallback and blocker is in [provider-discovery.json](../data/round1/provider-discovery.json). Unknowns remain explicit nulls or unknown text.

| Need | Provider/action | Chat-native result | Hosted / unattended | Next gap |
|---|---|---|---|---|
| Account wrapper | CMC get_accounts | Verified; owner selected Live GBP SB | Untested / not activated | Persist scope securely |
| Product / quote | CMC search, details, delayed quote | Silver succeeds; Sugar/Oil unresolved; Russell candidate | Untested / not activated | Exact four products, units and basis |
| 2m / 10m bars | CMC price history | Five Silver candles each; stale at receipt | Untested / not activated | Closure semantics, depth and other products |
| Position visibility | CMC positions | Empty at recorded receipt | Untested / not activated | Fresh reads and count semantics |
| Identity | Bigdata find_securities | Amazon COMPANY; Russell ETF candidates | Untested / not activated | Broker-listing reconciliation |
| Issuer earnings | Bigdata company tearsheet | Amazon sourced earnings/calendar output | Untested / not activated | Basis, as-of and primary audit |
| ETF research | Bigdata ETF tearsheet | IWM candidate; FMP snapshot | Untested / not activated | Field as-of, not document generation time |
| Macro events | Bigdata economic calendar | 13 US/GB high-impact rows, 19–23 Oct | Untested / not activated | Freeze, revisions and coverage |
| Issuer news | Bigdata search/fetch | 19 hits, one issuer release fetched | Untested / not activated | Source clustering and timestamp precision |
| Macro series | Financial Datasets macro | Blocked by credits | Unknown / not activated | Optional entitlement or official fallback |
| Price/fundamentals | Financial Datasets | Schema only; no extra paid calls | Unknown / not activated | Coverage/interval/entitlement tests |
| Broad trends | Newsify | Read works; evidence rejected | Untested / not activated | Original source/time and relevance |
| Portfolio reconciliation | Trading 212 | No API; docs only | Not connected / not activated | Future secure optional read-only path |
| Local weather | Tomorrow.io | Schema only, deferred | Unknown / not activated | Relevant defined location/mechanism |

No production runtime wiring was performed here. Existing hosted integrations must be inspected and tested separately by the Sites workstream; this record does not supersede a working hosted path.

## Useful private research snapshots

### Amazon corporate catalyst

Bigdata resolved Amazon.com Inc. as a public company. The Quartr-backed corporate calendar returned **Q3 2026 earnings call on 29 October 2026 at 21:00 UTC**, retrieved **2026-10-19T21:52:06.345Z**. [Source event](https://quartr.com/companies/amazoncom-inc_4762?utm_source=api&utm_medium=25).

This is a dated provider calendar observation. It is not an owner-approved expected price response. Keep expectation, observed response, horizon and benchmark empty until supplied and frozen.

### Amazon material news

A fetched issuer-authored statement, distributed by Public Technologies on **19 October 2026 at 12:46 UTC**, describes an agreement with X-energy and AEP to explore an Indiana nuclear project targeting 960 MW. It is a development plan, not delivered capacity. [Source document](https://app.bigdata.com/documents/29110395FA2D773A0888898385C97796).

Search results include several versions of this event and several reports about the same analyst action. These are event clusters, not independent confirmations. One unrelated result was also returned. Relevance filtering is mandatory.

### Macroeconomic events

The JSON preserves all 13 returned FXStreet-backed economic events, including null consensus/actual values, units, magnitude, reference period and release time. Future actual values are correctly null. Receipt: **2026-10-19T21:52:24 UTC** (exact milliseconds in JSON). This window is not a completeness guarantee. Provider consensus is distinct from economic reasoning, published forecasts and owner hypotheses.

### ETF quality flags

The Bigdata lookup's matching-name Russell ETF row has a description referring to SPDR Gold Trust. The ETF tearsheet itself describes IWM correctly, and the [official iShares page](https://www.ishares.com/us/products/239710/ishares-russell-2000-etf) identifies IWM, NYSE Arca and the Russell 2000 benchmark. Preserve the conflicting source description rather than silently repairing it.

The tearsheet's overall 19 October generation time is not a reliable timestamp for every field: the same NAV of 270.43 is explicitly dated 16 October on the issuer page. Its quoted price, holdings and derived daily risk metrics must not become an intraday broker feed.

## Newsify returned item — rejected as market evidence

The connector returned one item. Its full summary is retained below as a one-card source grid; no interactive grid resource was returned by the connector to this execution.

| Returned story |
|---|
| **[Ashley Graham Glows After Using No98 Beauty At VS Show](https://newsify.today/english/GB/article/ashley-graham/797bcd4c-154c-405f-9d33-2125c3f6ef2e/ashley-graham-glows-after-using-no98-beauty-at-vs-show)** |
| No98 Beauty gained significant momentum following Zendaya's endorsement, with its debut skincare product The Mask being used backstage at the 2026 Victoria's Secret Fashion Show. Facialist Michaella Bolder applied the £14 treatment to supermodel Ashley Graham before she walked the runway displaying glowing skin that drew attention away from her lingerie and wings. While British influencer Lorna Luxe established the brand, it does not feature prominently in its marketing strategy. The product has also been used by Zendaya's stylist on various red carpet appearances and is being adopted across different age groups. |

The source's aggregation created/updated time is 2026-10-19T21:33:08.197Z. Original source URL, original publication time and first-seen time are unknown. Its content has no demonstrated material relationship to the specified market/portfolio task.

## Source routing and safeguards

1. **CMC operational scope:** selected account → exact public product/wrapper → metadata → price, bars and positions as separate contracts. No capability is inferred across instruments. Never expose internal identifiers in the UI. Preserve source decimal strings, session timezone and separate market/price states.
2. **Bigdata research scope:** identify first; use COMPANY and ETF workflows separately. Corporate calendar supports portfolio horizon; economic calendar supports macro context; search then fetch supplies narrative evidence. Research relevance/sentiment is not price confirmation.
3. **Financial Datasets:** retain any independently verified existing hosted path. This chat's macro probe was blocked. Official central-bank/statistical sources are valid gap-specific fallbacks; purchasing credits is not a Round 1 prerequisite.
4. **Trading 212:** use versioned manual/import membership and target weights. The [official API](https://docs.trading212.com/api) is beta, covers Invest/Stocks ISA, uses per-account limits and lists Pies as deprecated. A future adapter must keep pie membership replaceable and credentials server-side. Linked endpoint documentation could not be retrieved by the web tool because it returned an unsupported text/markdown content type.
5. **Newsify:** optional headline discovery only; reject irrelevant/unsourced trends, cluster syndication, and retain original-versus-aggregation times.
6. **Official sources:** issuer/exchange for identity and releases; central banks/statistical agencies for macro gaps. Do not scrape around restrictions.
7. **Weather:** only when explicitly tied to a resolved relevant geography and transmission mechanism. A city forecast is neither a crop-yield forecast nor a market-direction signal.

## Round 2 probes and owner choices

- Preserve the owner's explicit Live spread-betting account choice. Verify hosted visitor/account ownership and consent before future reads.
- Resolve Sugar Cash and Crude Oil product availability/basis with the selected account. Confirm Russell exact listing/wrapper and verify Silver price unit/basis.
- Verify per-instrument 2m and 10m historical coverage, timestamp anchoring, closed state, partial-bar behaviour, history depth and session gaps. Do not turn daily observations into intraday bars.
- Test request-scoped hosted connector eligibility, authenticated visitor consent, refresh/cache/error behaviour and private storage. This workstream did not test any Site path.
- Evaluate position count semantics against non-empty positions before using the two-position gate. Keep missing/stale counts unknown.
- Freeze source-backed expectations before observing responses; method/horizon/benchmark remain explicitly unapproved where undefined.
- Audit Bigdata calendar revisions, event IDs, consensus provenance, first-seen times and common-origin story groups.
- Test FD entitlement/coverage only if selected for a real gap; do not force a purchase.
- Trading 212 setup is optional and deferred. No keys belong in chat, source, browser storage or logs.
- No unattended monitoring, order placement, rebalance or provider-side writes were activated.

## Data sources and reproducibility

CMC Markets connected tools; Bigdata.com identity catalogue, FMP company/ETF data, Quartr corporate events, FXStreet economic events, and issuer content distributed by Public Technologies; Financial Datasets error response; Newsify aggregation output; Trading 212 official API documentation; iShares official fund page. Each connector receipt is timestamped in JSON. Source-data retrieval does not imply independent verification of every statement or value.

The JSON contains 14 coverage rows, 22 sanitized receipts, two narrative research examples and two real historical Silver bar examples. No credentials or internal CMC account/product/position identifiers are stored.

