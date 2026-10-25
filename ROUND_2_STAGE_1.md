# STRATA Round 2 / Stage 1 — owner rules captured

## Design evidence

Read-only Shopify inspection confirmed Albion OS at albionos.co.uk, published Dawn theme, and the homepage's custom Liquid “NOCTURNE” section. The homepage overrides Dawn defaults: black #000 / #0A0A0A, white #FFF, text #C4C4C4 / #8A8A8A, restrained red #E4302A / #FF4A42, white hairline borders, Instrument Serif, Archivo, IBM Plex Mono. STRATA adopts this editorial typography, numbered labels, square framing and restrained red actions, preserving its working globe and all eight routes. No Shopify content was changed.

## Code and behaviour

- `registry.ts`: 42 owner/context references, including USDSGD required by the correlation thesis. Five cash instruments are trade-eligible. All provider symbols remain null/pending. Exact FX quote direction is preserved. Strategy remains a named company reference until an exchange/ticker is verified. COIN and Strategy are equities. US/UK/DE yield references are yields, not prices of cash bonds.
- `rules.ts`: versioned owner rulebook, typed evidence and entry contexts, pure correlation and entry evaluators. The 6/10 rung applies only to Silver. The 7/10 and above rungs apply to commodities. All conditions invert for bearish. Maximum is a label with no invented numeric score. Contradictory evidence blocks readiness. Missing/neutral/stale/unverified/demo or misaligned evidence cannot satisfy a confirmation rung.
- Entry checks: CMC Markets spread betting, five-instrument allowlist, two open positions per instrument total across directions, 08:00–10:00 and 14:00–16:30 Europe/London, 2m entry and 10m+ thesis, qualifying liquidity and optional FVG/IFVG confluence, correlation support and verified market/product mapping. Multiple instruments are allowed; each needs its own qualifying thesis.
- `SignalEngine` exposes these owner rules and accepts an optional typed EntryContext. Without evidence, the response stays Stand Aside. Even when Stage 1 checks pass, result is Watch because the full plan is incomplete. canSubmitOrder is always false. No order-placement API exists.
- `app/rulebook.tsx`: Rulebook, hypothetical Thesis lab and complete registry within SMT. The lab uses transient scenario inputs, does not mutate live market evidence or holdings, and keeps provider readiness false. No persisted positions are represented.
- Scan now uses actual owner references and null quotes, unknown regime and Stand Aside until evidence arrives. Illustrative historical events/probabilities remain explicitly demo and never feed live entry checks.

## Interpretation decisions awaiting confirmation

1. LST is provisionally Europe/London local clock (GMT/BST), not fixed UTC/GMT. Window start inclusive, end exclusive.
2. USDPRK is provisionally USDPKR, consistent with the explicit watchlist. USDSGD added as a required context reference.
3. RSI `15m> = 9, 15m–1H = 14, 1H+ hard to compute` and ATR “same” are captured literally. A possible 9-period below-15m / 14-period 15m-through-1H reading is displayed as inactive. Exact boundary ownership, lookback-vs-level interpretation, thresholds and gate/advisory role await confirmation.
4. Liquidity below 5m is low relevance; 5–9m contextual; 10m+ supports the thesis. A sub-10m observation is not promoted into thesis evidence. Gaps are optional, but qualifying gaps require 10m+ and liquidity alignment.
5. Strict correlation evidence comparison currently requires the same timeframe and observations within one timeframe of the GBPUSD anchor. This conservative alignment rule is an implementation assumption, not a claimed trading rule; configure it when final SMT definitions arrive.
6. Source evidence freshness/verification flags must be assigned by the future validated ingestion adapter, not inferred from a chart upload. Live stale thresholds still await data integration.
7. Objective bullish/bearish definition, SMT swing/pivot relationships, risk sizing, stops/targets/invalidation rules, maximum portfolio exposure, missing-data policy and weekend policy remain incomplete. No extra execution rule is invented.

## Excluded material

Trading 212 holdings are separate. Tax assertions are not encoded in rules, deductions or reporting. This stage does not verify the user's tax interpretation, authorise trades, or produce live investment advice.

## Validation

TypeScript check and production build required. Bounded rule tests cover bullish/bearish tiers, Silver-only scope, stale/contradictory/misaligned evidence, London DST/boundaries, instrument/mode restrictions, per-instrument capacity, and 2m/10m/FVG constraints. Browser and WebMCP validation are unavailable unless explicitly requested under the Sites preview policy.
