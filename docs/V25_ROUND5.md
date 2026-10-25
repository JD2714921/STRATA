# V25 Round 5: lint and regression cleanup

Verified locally on 21 October 2026 against clean baseline commit `ec9b468173ffc4fadfbabe69918ecbfd2f4dd805`. No deployment, source push, broker operation or access-policy change was performed.

## Actual baseline and final checks

| Check | Baseline | Final |
| --- | --- | --- |
| Repository lint | 9 errors, 9 warnings | 0 errors, 0 warnings |
| Strict TypeScript, no emit | Pass | Pass |
| Core, source-policy and SQLite persistence integration tests | 53/53 | 53/53 |
| Historical calculation, Round 2 and observed-data tests | 35/35 | 36/36 |
| Unique tests across all six suites | 88/88 | 89/89 |
| Repository production build | Pass | Pass |
| Offline Round 2 recalculation | Existing artifacts captured | All historical/data hashes unchanged |

The earlier seven-error and 71-test figures were not the current baseline. ESLint reported nine errors, including two navigation diagnostics for the same brand link. No ESLint configuration, TypeScript configuration, dependency, existing test or assertion was weakened or disabled.

## Individual repairs

| File | Repair |
| --- | --- |
| `app/corpus.tsx` | Reset pagination on a guarded change of the supplied event array, rather than synchronously inside an effect. |
| `app/execution-history.tsx` | Clear loading/error state in dataset, view and pagination handlers. Keep asynchronous response updates and cancellation in the fetch effect. |
| `app/globe.tsx` | Initialise rotation from the selected event and use a guarded selection-ID change for recentering. Preserve manual rotation/zoom and coordinate clamps; remove the incomplete effect dependency. |
| `app/workspace-v2.tsx` | Separate the private read from response/error callbacks so initial state updates follow the asynchronous server response. Retain server time, the 30-second clock, reload/save behaviour and unmount cleanup. Replace the brand anchor with `Link`, retaining the existing navigation handler and disabling prefetch. |
| `app/workspace-views.tsx` | Reset Memory pagination in filter handlers. Initialise and reconcile settings drafts on guarded configuration changes, preserving saved values/statuses, unsaved fields absent from a partial response, and reset on missing private state. |
| `lib/historical/round2-catalog.ts` | Replace the parsed-JSON loader's `Promise<any>` with `Promise<unknown>`. |
| `app/api/execution-history/route.ts` | Give the trusted, hash-checked static outputs explicit comparison/dataset types and narrow the same five allowed view names. Authentication, dataset/page bounds, cache headers, response values and Stand Down restrictions remain intact. |
| `scripts/run-round2.mjs` | Emit `Promise<unknown>` so regeneration retains the loader repair. Calculation and serialization expressions are unchanged. |
| `lib/strata/mock.ts` | Remove two unused type imports. Preserve the optional revision call signature with an overload while removing the unused implementation parameter. |
| `lib/strata/rules.ts` | Remove the unused registry lookup/import; leave every gate, threshold and returned decision unchanged. |
| `lib/strata/services.ts` | Remove an unused import. Preserve calculation/similarity call signatures through overloads; their unconfigured/null/empty results remain unchanged. |
| `tests/round2-data.test.mjs` | Add one functional loader test covering every stored dataset, comparisons, events and unknown-output rejection. Existing tests are retained. |

This report is the thirteenth changed file. The twelve code/test files contain the targeted repairs; unrelated modules were not refactored.

## Quantitative and operational regression evidence

- All **13 historical calculation modules** other than the generated loader are byte-identical to baseline, including `elastication.ts`, `features.ts`, `execution-binding.ts`, `statistics.ts`, `simulation.ts`, `confluence.ts` and `plan.ts`.
- All **83 tracked files under `data/historical` and `data/round2`** are byte-identical after the offline calculation command. This includes retained observations, calculation clock, manifests, persisted signed inputs, missingness/provenance and derived outputs.
- Round 2 still contains 15 datasets and 42,505 candles; **0 valid / 85,010 unavailable directional E_d windows**; **32,652 execution links, all STAND DOWN**; 36 event records and zero complete point-in-time consensus/actual vintages. Missing Q_d is not filled with volume or a proxy.
- **No mathematical correction was made.** `E_d = |(%ΔQ_d) / (%ΔP)|`, signed changes, signed ratio, source attribution, aligned-window checks and unavailable-data guards are unchanged.
- The five CMC cash products and V25 source-policy/registry code are unchanged: Gold/Silver BUY/SELL, NDAQ SELL ONLY, Sugar/Crude blocked pending exact mappings. Trading 212 remains a separate context/portfolio lane with no execution fallback.
- TP1–TP3 ordering, minimum proposed 5R, TP1 breakeven policy, unapproved/null partial-close multiples/fractions, 2m/5m execution, 15m+/2H+ confluence, one new position per instrument per UK day, and ATR(9)/5m, ATR(14)/15m, ATR(27)/1H+ remain unchanged.
- The owner-private auth modules, persistence contracts, hosting manifest, V25 rules and source-routing configuration are unchanged. A read-only Sites check confirmed access revision 1: one allowed owner, zero external visitors and zero allowed groups.

These checks verify software regression and reproducibility, not a trading edge. They do not approve any research definition or enable BUY/SELL execution.

## Commands and evidence

Run from `strata-round1` with the existing Node 24 installation and dependencies:

```powershell
npm.cmd run lint
node node_modules/typescript/bin/tsc --noEmit
node --experimental-strip-types --import ./tests/core-register.mjs --test --test-reporter=tap tests/core.test.mjs tests/source-policy.test.mjs tests/persistence.test.mjs
node --experimental-strip-types --import ./tests/core-register.mjs --test --test-reporter=tap tests/historical.test.mjs tests/round2.test.mjs tests/round2-data.test.mjs
node --experimental-strip-types --import ./tests/core-register.mjs scripts/run-round2.mjs
npm.cmd run build
```

The existing portable Sites execution profile was checked and required no change. Production builds use the actual package build script; there was no dependency installation or framework upgrade. Vinext's existing route-classification/plugin-timing advisories remain non-fatal. Browser interaction and compiled Worker HTTP checks were not performed in this scoped round.

Baseline/final command logs, file hashes, invariant comparisons, hosted-access receipt and final commit receipt are in the sibling `strata-round5-cleanup-2026-10-21` directory. The cleanup is committed locally; deployment awaits explicit authorisation.
