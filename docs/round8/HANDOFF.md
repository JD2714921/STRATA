# Round 8 implementation and activation handoff

> Public export: all Notion destination identifiers and related links below are placeholders. The actual owner-private bindings remain in the private baseline.

Verdict: **PARTIAL — local implementation verified; publication and unattended operation blocked.**

No source push, saved version, deployment, environment edit, native schedule activation, broker write or financial Notion row was performed in this round. The private Notion parent and three empty ledger databases were created following the owner's explicit instruction. Task blueprints are prepared, not registered jobs.

## Source and production reconciliation

Local starting HEAD was `fd506174a6f055c3e2f9b2f2e85213640041cfd1`, a clean descendant of the Round 6 and Framework Intelligence changes. The repository was inspected before implementation; Round 6 handoff was found, but no completed Round 7 visual handoff was found. No previous Round 8 scheduler/ledger implementation existed. Existing historical calculations, provider routing, private storage, rules and FIL were reused.

Native reads still identify production as:

| Field | Verified value |
|---|---|
| Site | https://strata-atlas.jaydds2002.chatgpt.site |
| Project | appgprj_6aa2cfb5d1688191bdf3a8a9ca6365b0 |
| Saved version / rollback | 25 |
| Version ID | appgprj_6aa2cfb5d1688191bdf3a8a9ca6365b0~appgver_8ad19d50a77c819181446986066c962c |
| Production commit | bedbe6bf54e1f89adb6a5ff5460ad814d7f15446 |
| Deployment | appgdep_6ad8ec26706c81919dc4e2d7391853a3 — previously verified succeeded |
| Access | Revision 1, custom owner-only, one allowed owner, zero external visitors |
| Runtime environment | Revision 0; no environment entries or Trading 212 credentials |
| Manifest binding | d1=DB, r2=null |
| Linked native schedules | [] |

`NATIVE_READ_RECEIPTS.json` contains sanitized observations; no token, bypass credential, technical CMC identifier or secret is included. A local build is not a pushed source state or saved Site version. The exact final local commit is supplied in the engineering handoff, since a document cannot include its own containing commit hash.

## Implemented modules

| Module | Responsibility |
|---|---|
| `lib/operations/contracts.ts` | Strict timestamps, bounded evidence, five-product allowlist, broker-event and snapshot contracts |
| `schedule.ts`, `calendar.ts` | Seven London clock definitions, unique occurrence IDs, real timezone transitions, bounded official LSE/NYSE context |
| `runner.ts` | Shared historical/context assessment runner; existing confluence and owner rule evaluators; attributable separate assessments |
| `market.ts` | Observation versus receipt timestamps, delayed/live capability, stale/future/invalid bid-ask rejection |
| `store.ts` | Owner-scoped durable records, occurrence/phase idempotency, expiring overlap locks, stale-worker fencing, retry states |
| `portfolio.ts` | On-command T212 refresh, cooldown, last-good retention, partial and failed snapshot evidence |
| `trading212-history.ts`, `trading212-normalise.ts`, `runtime.ts` | Server-only GET account/history, pagination, fill grain, exact decimal strings, durable continuation and raw unmapped records |
| `ledger.ts`, `notion-bridge.ts` | Financial event projections, original daily cutoffs, late revisions, Notion outbox, lookup/reservation/actual receipt protocol |
| `app/api/operations/route.ts` | Authenticated manual/status endpoints using existing private ownership and mutation checks |
| `app/mcp/route.ts` | Five authenticated Site tools for future native cloud tasks; MCP discovery/list contain descriptors only |
| `app/operations.tsx` | Existing Portfolio/Data Health panels: on-command refresh, actual attempts, blocked registrations, saved assessment/outbox status |
| `data/operations/historical-index.json` | Compact index of 15 existing genuine saved historical results; not a new study or full recalculation |

The `.openai/hosting.json` change adds only the supported `mcp` capability. Project identity and DB/R2 bindings are unchanged. It does not claim that the unpublished Site MCP is provisioned or connected. No dependencies were added.

The hosted boundary is deliberately explicit: an authorised native cloud task would acquire its own connector evidence and call the authenticated Site writer. The Site does not embed a builder token or pretend chat MCP data is a runtime feed. The Notion bridge accepts scoped write reservations and records task-reported actual tool receipts; it is not independent server-side verification that a remote page exists. Unattended consent, connection and readback must be exercised after publication.

## Task Schedule Register

All seven use Europe/London, the shared assessment function and one unique key per UK date and clock time. Production remains V25. Every row has **native task ID=null, enabled=false, previous hosted execution=none, unattended receipt=none**. The trigger design is Sites native cloud task → authenticated Site MCP. Local definitions and next *planned* real occurrences are in `samples/schedule-register.json`; self-contained draft task prompts are in `samples/task-blueprints.json`.

| UK time | Purpose | Registered / operational |
|---|---|---|
| 01:15 | Overnight / Asian intelligence | BLOCKED / no |
| 07:45 | London / European opening context | BLOCKED / no |
| 10:15 | European review | BLOCKED / no |
| 13:30 | US data and pre-market | BLOCKED / no |
| 14:25 | US opening preparation | BLOCKED / no |
| 16:45 | Market assessment + separate ledger phase | BLOCKED / no |
| 21:15 | US review / next session | BLOCKED / no |

No local Codex heartbeat or laptop process is substituted for the requested hosted scheduler. The [Sites recurring-update instructions](C:/Users/jaydd/.codex/plugins/cache/openai-curated-remote/sites/1.1.1/skills/sites/references/recurring-updates.md) require independently verified source access and an unattended authorised writer before activation. These conditions are not satisfied.

UK spring 01:15 is a nonexistent local time on the clock-change date. The implementation skips that occurrence rather than changing the requested time. The autumn repeated 01:15 is canonicalised to the first occurrence and deduplicated. A spring fallback time requires owner policy. LSE/NYSE calendars are context only, with explicit coverage bounds and separate US/UK daylight saving; they do not establish a CMC product trading calendar. Sources: [NYSE](https://www.nyse.com/trade/hours-calendars), [LSE business days](https://www.londonstockexchange.com/en/resources/markets-products/business-days).

## Source routing matrix

| Path | Configured / authenticated / tested | Actual operational status |
|---|---|---|
| T212 manual dashboard refresh | Local secure GET path; source and fixture tests pass; hosted credentials absent | BLOCKED; no successful hosted account read |
| T212 16:45 accounting | Separate local path; history pagination/normalisation/cursor fixtures tested | BLOCKED; never refreshes dashboard snapshots |
| CMC account/product discovery | Bounded native chat reads succeeded on previously selected Live SB account | Chat-only receipt; not hosted unattended access |
| CMC delayed quotes | Current schema says 15-minute delay; actual bounded native read failed account_id validator | UNAVAILABLE; no new quote obtained; no repeated same failed probe |
| CMC live quote | Current tool description explicitly says disabled | DISABLED; handler not invoked |
| CMC OHLC | Existing genuine historical results indexed; bounded incoming native-bar boundary implemented/tested | No fresh OHLC read in this round; timing/completeness/calendar limits preserved |
| CMC positions / history | Native current-position read returned zero open positions | Does not establish closed positions, fills, realised P&L or cash history |
| Bigdata/news/research | Existing adapters/routing preserved; source-linked scheduled/unscheduled evidence packet added | No new provider retrieval this round; hosted and unattended access unverified |
| Weather | Material-relevance/location/source/timestamp boundary implemented | No new provider retrieval; no crop yield or direction inferred |
| Historical Elastication | Existing engine and 15 saved results reused; optional original-Q inputs call existing function | Valid Q_d absent in current sample; E_d explicitly unavailable; no new validated edge claimed |
| Notion read/write | Native private parent + 3 schemas created, fetched, empty-row reads succeeded | Setup write and reads verified in chat; financial writer and unattended access unverified |
| Site MCP | Implemented and local auth tests pass; capability added to candidate manifest | Unpublished/unprovisioned; production has no current MCP publication |

CMC requests remain restricted to Gold Cash, Silver Cash, Sugar Raw Cash, Crude Oil Cash and US NDAQ 100 Cash. Exact Gold/Silver/NDAQ SB metadata were resolved; Sugar/Crude remain unresolved and blocked. NDAQ remains SELL ONLY. No wider-watchlist CMC queries or broker mutations were added.

Official [Trading 212 API documentation](https://docs.trading212.com/api) was checked. Account/positions/metadata are not proof of a historical candle service. History uses actual `order` / `fill` records, fill identifiers distinct from order identifiers, and original wallet/price currencies. GET cursors cannot escape the selected API origin/path. Rate exhaustion preserves continuation; bounded batches can be resumed. No export-generation POST or order endpoint is used. Returned JSON numbers are preserved without arbitrary rounding; amounts outside the local 12-decimal contract remain unmapped/raw, not zero.

## Notion schema and bookkeeping

See `NOTION_SCHEMA.md` and exact native types in `data/operations/notion-destination.json`. The authoritative parent is [Strata’s Reasoning](https://app.notion.com/p/00000000000040008000000000000001), created as a private draft. No unrelated Albion financial database was modified. Three bounded native queries returned empty results with `has_more=false`.

The outbox key is owner + broker + account alias + source grain + event ID. Orders are not executions; open positions and snapshots are not transactions. Each UK date has one authoritative daily projection and an immutable original as-at snapshot. Late events update their original effective date through a new revision. Deposits/withdrawals, dividends, fees and broker-reported realised P&L remain separate. Currencies are never combined with invented FX rates. Missing values remain null; zero only survives when supplied by a source.

Notion itself does not enforce unique keys: Strata owns uniqueness, per-write reservations, duplicate lookup conflicts and acknowledgements. A write with an uncertain create result cannot be blindly retried merely because a lookup finds nothing. Parent daily records are queued before child relations. Daily and transaction revisions remain in D1 even when a Notion page displays a later projection. Coverage is never complete from open CMC positions alone. A 16:45 record is provisional, not a full-day statement.

## Samples and reproducibility

`samples/assessment.json`: locally executed shared assessment, empty current-source packet, dated genuine historical research, all five decisions STAND DOWN, Q_d/E_d unavailable. No live quote or immediately executable setup is represented.

`samples/ledger-would-write.json`: exact generated property/content shapes for the five requested financial fixture examples. Synthetic prices/amounts/IDs are labelled SIMULATED. Child `Daily log` relations require the actual returned parent URL before a write. **These records were not sent to Notion and are not real broker activity.**

Commands (repository root):

```powershell
node --experimental-strip-types --import ./tests/core-register.mjs --test --test-reporter=tap tests/core.test.mjs tests/source-policy.test.mjs tests/persistence.test.mjs tests/historical.test.mjs tests/round2.test.mjs tests/round2-data.test.mjs tests/framework-intelligence.test.mjs tests/operations.test.mjs
npx.cmd tsc --noEmit
npm.cmd run lint
npm.cmd run build
node --experimental-strip-types --import ./tests/core-register.mjs scripts/generate-operations-samples.mjs
```

The generated migration `drizzle/0001_fast_johnny_storm.sql` adds only four operations tables. Actual migration SQL runs in the Node SQLite integration harness, including the existing private-record migration. Runtime handlers never issue schema DDL. Production migrations have not been applied. Rollback retains V25 and all existing data; revert candidate source if needed and leave new additive tables intact rather than dropping audit history.

## Activation blockers and next exact actions

1. **Source transport:** sandbox source-helper DNS failed at `git.chatgpt-team.site`; outside-sandbox read-only DNS resolved. Automatic approval then rejected passing the repository bearer through stdin to the external network-enabled helper, citing token exposure outside the managed proxy. No credential was sent in that rejected call. No workaround or repeated transport attempt was made. A new explicit approval or a platform-supported transport correction is required before publication.
2. After approved source transport, obtain fresh native repo access; verify remote branch provenance and push the exact reviewed candidate. Reconcile saved versions/deployments before retrying. Preserve access rev 1, env rev 0 and DB binding; use native owner-private publishing. Do not treat build output as pushed source.
3. Publish the supported MCP capability, connect the native Site plugin, then verify a fresh cloud task can call the writer with true owner identity, persist one isolated receipt and read it back. No bypass credential or forged visitor identity is suitable. Check actual cloud source availability and connector consent separately.
4. T212 needs approved server secrets `TRADING212_API_KEY`, `TRADING212_API_SECRET` and `TRADING212_ENVIRONMENT` (live/demo), least-privilege read permissions and a successful account read. Do not send keys in chat or source. Environment rev 0 was deliberately not edited. The prompt already authorises the separate 16:45 history sync once hosted configuration and access are valid.
5. Resolve the CMC delayed-price connector validator incompatibility using provider support/current schema; do not choose another account to bypass it. Verify source timestamps, bar intervals/closed state/calendar, exact Sugar/Crude mappings, and legitimate closed-trade/fill/fee/statement history. Delayed data never provides a 2m/5m live entry confirmation.
6. Exercise the real Notion write protocol against isolated nonfinancial test data and read it back; verify the fresh cloud task sees the exact schemas/relations. Keep financial records blocked/partial when broker evidence is incomplete.
7. Only then refresh native `get_site.automations`, reuse any matching task and create missing schedules through Sites using its returned opaque request IDs. Verify saved timezone/enabled state and real unattended persistence; do not claim completion from definitions. Observe each pipeline component independently.
8. Valid directional quantity, point-in-time event vintages, empirical validation, risk sizing, partial-close approval and live confirmation remain required before operational recommendations. FIL, narrative imports, ATR and delayed prices cannot waive those gates. No rule or formula was changed here.

This is a research workspace implementation, not validation of trading performance. Genuine scheduled execution, production persistence of these new tables, authenticated browser/device QA, real T212 requests and actual financial Notion writes remain untested.

History continuation is durable within each cutoff backfill. No unverified date filter or descending-order guarantee is assumed to skip older pages; a new cutoff currently begins a bounded rescan with deduplication. Large-account backfill runtime, provider rate budgets, D1 query limits and late-correction coverage require real hosted load verification before activation. Unclassified source records keep reconciliation incomplete. These limits are not hidden by a successful fixture run.
