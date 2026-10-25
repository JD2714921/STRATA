# Private persistence and API

Round 1 uses the Sites `DB` D1 binding and an additive `round1_records` table. `db/schema.ts` owns the schema; `npm run db:generate` generated `drizzle/0000_elite_typhoid_mary.sql` and its Drizzle metadata. The migration contains schema and indexes only. The 58-line portfolio seed is an application snapshot, saved through an authenticated action, not migration SQL.

`app/api/round1/route.ts` calls the existing Sites `getChatGPTUser()` helper. The trusted dispatch user ID scopes every SQL read and write. The browser cannot supply an owner ID. Missing identity returns 401; reading another identity's record returns 404. Service bypass access does not substitute for a visitor identity. Writes require a same-origin JSON request, a bounded body, and a strict Zod schema. No arbitrary provider URLs, account identifiers, broker writes, submitted freshness flags or submitted assessments are accepted. Responses are private/no-store, and failures do not print SQL, user IDs or imported content.

## Endpoints

`GET /api/round1` returns the latest configuration, portfolio and rule version, up to 100 decision records, up to 100 refresh records, the server clock and `storage: "durable"`. It also issues and persists four owner-scoped assessment reviews in `reviews`, one per execution instrument. Each item is `{token,asOf,expiresAt,configVersion,assessmentHash,assessment}`. The UI displays that issued assessment and keeps its binding unchanged. Empty storage returns null configuration/portfolio versions and empty decision/refresh lists, with conservative reviews based on the captured defaults. A missing binding returns 503 and never falls back to browser storage. `GET ?recordId=<uuid>` returns a complete owner-scoped record for replay. `GET ?history=<config|portfolio|decision|refresh|rule>&before=<ISO instant>` loads older owner-scoped history, capped at 100 records.

`POST /api/round1` accepts one of these bodies:

- `{kind:"seed"}` saves the original portfolio seed when no portfolio snapshot exists, and independently ensures the current captured rulebook is saved. Necessary writes are atomic. An import-first workflow retains the imported portfolio while saving its missing rulebook; it never overwrites a manual/imported version.
- `{kind:"config",fields:[{key,value,status,note?}]}` saves a complete merged configuration version. Keys come from the known rule configuration. Status is `confirmed`, `proposed` or `missing`; confirmed/proposed definitions require text, while missing values must be null. Confirmation of text never supplies actual market, mapping, position or structural evidence.
- `{kind:"decision",instrumentId,review:{token,asOf,configVersion,assessmentHash},decision,thesis,executionRationale}` binds J's agree/disagree/wait decision to the exact server-issued assessment displayed for review. No browser-supplied assessment is accepted. The server checks the persisted owner-bound token, instrument, captured time, configuration version and hash, then reconstructs the assessment at its reviewed time. It preserves that exact assessment alongside J's later recording time, configuration/rulebook snapshots, hashes, evidence identifiers, hard gates, mapping versions and captured portfolio version. Round 1 has no verified runtime bars/positions in this path, so these remain unavailable. Agreement never waives gates or counts as independent evidence.
- `{kind:"refresh",sourceId,note?}` records a runtime refresh availability check. It explicitly says `attemptedProviderRead:false`, `state:"unavailable"` when no runtime adapter is configured. It does not claim to refresh chat-native research receipts.
- `{kind:"import",sourceLabel,observedAt,rows:[{pie,label,targetWeight,observedWeight}]}` saves a provenance-preserving manual/import portfolio snapshot. All five named pies must total 100%; observed weights may be null, and observation time may be unknown but never future. Quantities, money values, exact identities and broker reconciliation remain unknown. No whole-account allocation is inferred.

All mutation forms may include an optional UUID `requestId`. Reusing an already recorded ID for the same owner returns 409. Stored records are append-only through the API: there are no edit/delete endpoints. Content hashes are SHA-256 of the exact JSON payload representation. A later configuration change does not rewrite an earlier assessment or disagreement. Imported strings remain data and render as escaped text; they are never executed or forwarded as instructions. The isolated hypothetical lab has no durable mutation path.

Reviews expire after 60 seconds, using the server clock. Expired/future reviews, changed configuration/rules, and a session or gate transition within that interval return 409 and require an explicit fresh review. The server never silently attaches an old agreement to a new assessment. The final decision insert also checks the current configuration version in the same SQL statement, preventing another tab's concurrent configuration change from slipping between validation and append. A token is not standalone authentication: every read and write still requires the matching Sites user. The review window is a UI/audit binding limit, not evidence of market-data freshness or trading eligibility.

## Deployment and rollback

The source manifest must retain project identity/audience and declare `"d1":"DB"`. Sites provisions the logical binding and applies pending schema migrations before deployment. After building a local preview, the supported local migration command is:

```text
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_elite_typhoid_mary.sql
```

Apply it once per local database. Local preview data and hosted D1 data are separate. Never replay or modify an applied migration. A source rollback to the retained prior commit must leave this additive table intact; do not drop owner history to roll back presentation code. The source and deployment baseline are recorded in the main Round 1 handoff.

## Verification evidence and limits

`node --test tests/persistence.test.mjs` passed 15 tests against the generated migration and production SQL executed by Node SQLite. Tests close/reopen a file-backed database, verify cross-owner denial, test the actual route handlers with explicitly mocked dispatch headers, reject forged flags/cross-origin writes, preserve disagreement and previous versions, validate import totals and unknowns, assert refresh honesty and hypothetical isolation, reject duplicate request IDs, and verify atomic seed rollback on a forced failure. They also verify exact captured assessment persistence, expiry/future/hash/instrument/owner rejection, configuration changes, session-boundary changes, the final insert's concurrent-configuration guard, and import-first rulebook persistence.

The review record kind uses the existing unconstrained SQL text column. `npm run db:generate` was rerun after its TypeScript enum annotation was added and reported no schema changes; no applied migration was modified.

These are source and local SQL tests. They are not proof of hosted D1 availability, Sites identity-header sanitisation, or a real authenticated browser persistence round trip. The main handoff must distinguish any later local Worker and deployed-browser checks. No provider connection or trading performance is verified by these tests.
