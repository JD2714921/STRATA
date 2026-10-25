# Round 8 validation report

Result: **148 source/integration/fixture tests passed, 0 failed**, comprising 110 existing tests plus 38 operations tests. TypeScript no-emit passed. Repository ESLint passed with zero errors and zero warnings. Production build completed successfully and includes `/api/operations` and `/mcp`. No new packages were installed.

Build warnings: Vinext reports that some routes cannot be classified through static analysis and prints plugin timing diagnostics. These did not fail the build. They are not proof of hosted behavior.

Exact reproducible commands are in `HANDOFF.md`. Session logs are retained outside the source repository at `C:/Users/jaydd/OneDrive/Desktop/Products/strata-round8-verification/`: `all-tests.log`, `typescript.log`, `lint.log`, `build.log`, `migration.log`, `samples.log`. The initial standalone test command omitted the repository's TS import resolver and failed module loading; it was corrected to the documented command. An earlier run of the new suite found seven response-serialization equality failures and one mock-identity fixture omission. Those were fixed and the full final suite passed. Failed intermediate runs were not presented as success.

## Mandatory scenario coverage

| Scenario | Evidence / result |
|---|---|
| Each of the seven sessions | Seven separate shared-runner dry runs; private SQLite persistence and idempotent readback; five Stand Down results each |
| Successful pipeline | Source-level runner and financial projection fixtures pass; no genuine hosted run claimed |
| Missing T212 credentials | Actual env-empty accounting branch returns blocked, no balance/snapshot invented; blocked phase can be retried after configuration |
| Manual T212 success / failure / partial | Stubbed legitimate return fields persist; repeated request ID does not reread; failure/partial preserves last complete snapshot as stale |
| CMC delayed response | Fixture retains quote observation versus current market-status timestamp, and remains ineligible for entry |
| Disabled live / future / falsely current quote | Explicit rejection tests; native current tool description says live disabled; handler never called |
| Missing/stale OHLC and news/weather/Q | Empty inputs stay unavailable, no synthetic bars or fabricated E_d; core freshness tests remain passing |
| Contradictory evidence | Existing confluence returns Stand Down; targets do not clear live/data/risk gates |
| Research setup without live confirmation | Ordered suggestive targets are not RR-qualified or executable; delayed price never grants entry |
| Missing Notion property | Blocks before provider write; exact destination/schema restrictions tested |
| Duplicate 16:45 | One provider read, one event projection and daily revision; separate phase idempotency |
| Late transaction | Original effective day receives revision; original cutoff snapshot remains identical |
| Deposit | Capital contribution remains separate from realised profit; exact arithmetic/currency separation checked |
| Position closes after cutoff | Excluded until later reconciliation, assigned original effective date |
| CMC closed history unavailable | Explicit partial completeness; current positions never substitute for closed history |
| Notion error/retry | Lost create response uses found page update; unknown outcome + no found page blocks another create |
| Partial broker history | Durable continuation, financial rows committed before cursor; retry ledger phase separately |
| UK/US clock changes | Real zones, spring missing 01:15, autumn single canonical occurrence, different NYSE opening UTC in mismatch weeks |
| Laptop-independent hosted execution | **BLOCKED / UNTESTED**, not satisfied by local tests or schedule definitions |
| Security / isolation | Actual route code with mocked dispatch identity rejects anonymous and cross-origin writes; cross-owner records isolated |
| Concurrency | Overlap lock, lease expiry, and stale worker unable to overwrite a replacement receipt |
| Unsupported money precision | Tiny value cannot become a fabricated zero; unclassified source data preserved |
| Notion queue dependency | Daily parents remain visible before >100 queued child writes |

## Implementation repairs during verification

* Canonical JSON roundtrip makes first successful output and cached retry output identical, including optional owner-config fields.
* Failed/partial portfolio reads retain last complete holdings instead of replacing them with a missing-position snapshot.
* Scientific-notation monetary numbers are expanded without rounding; unsupported precision remains raw/unmapped.
* Phase result writes and failure updates are fenced by current lock token/expiry. A stale worker cannot change a replacement run's state.
* Daily outbox rows sort ahead of dependent transactions; pending-parent starvation is prevented.
* A blocked ledger phase is not frozen as a permanent successful read; it can be explicitly retried when configuration changes.
* Autumn clock folds use one canonical occurrence and cannot advertise an already-past next run.
* Accounting receipt times are captured after source responses; they are never represented as broker quote or exact cutoff evaluation times.
* A known Notion page conflicting with a lookup blocks updates. Even different URL representations require reconciliation rather than an assumed match.
* Test harness now supplies both required authenticated ID and email in its authorised fixture. This is test-only and never injects identity into production requests.

The original FIL baseline-hash test was updated solely for the explicitly authorised MCP manifest capability. It still asserts the exact project ID, DB and R2 bindings; other protected source hashes, execution comparison outputs, formula, ATR, routing and rules checks remain enforced. No baseline quantitative/trading module was changed. Unit tests are not evidence of a trading edge.

## Real provider verification and limitations

Native Sites metadata, saved version, empty environment and linked schedule register were read. Native CMC account/product/current-position checks succeeded; one actual delayed-price request failed connector argument validation. Notion private-parent/database creation, schema fetches and empty-row queries succeeded. No new Bigdata/news/weather/OHLC read, real T212 account call, closed CMC history retrieval, financial Notion write, or unattended run was verified.

New operations persistence tests execute actual generated SQLite migration SQL, owner filters, ledger projections, phase tables and outbox state changes. They do not prove production D1 migrated, deployment restart durability, production identity forwarding or a connected cloud task. Existing persistence regressions continue to pass; the new operations harness itself uses in-memory SQLite. Source mocks use fixture credentials only and do not place orders.

No authenticated browser/mobile/tablet QA was completed in this round. Earlier browser automation was unavailable; no fabricated owner session or bypass identity was used. Operational data/rules/validation remain insufficient for Buy/Sell recommendations, and the shared runner preserves Stand Down.

Publication was stopped at the automatic approval rejection of repository credential transport to the outside-sandbox source helper. No duplicate save, deploy, scheduling attempt or credential workaround followed. Final status remains **PARTIAL**, with production V25 unchanged.
