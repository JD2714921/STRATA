# Framework intelligence validation

Engineering scope: add an isolated contextual layer to the existing Strata checkout, not a replacement engine or strategy validation. Baseline: clean `f6448813b1db558e88edffe21572b1f3c8966ecd`. Production publication is explicitly excluded.

## Executed checks

| Check | Result | Evidence / limit |
| --- | --- | --- |
| Before-change existing six-suite baseline | PASS — 94/94 | `../strata-fil-verification/baseline-tests.log` |
| Final seven-suite regression run | PASS — 110/110 | 94 existing plus 16 FIL tests; `../strata-fil-verification/all-tests.log` |
| Repository ESLint | PASS — zero errors/warnings | `../strata-fil-verification/lint.log` |
| TypeScript no-emit | PASS | `../strata-fil-verification/typescript.log` |
| Production build | PASS — exit 0 | `../strata-fil-verification/build.log`; no publication follows |
| Original supplied PDF | PASS — 14 pages read and preserved | SHA-256 `22c1b6d5551ef25f35e1ef6105b2fbde9eae2c1e7bafd09e18b8ef8684ae2850` |
| Protected code/configuration | PASS — 32 file hashes match | `data/framework-intelligence/execution-baseline.json` |
| Baseline deterministic decisions | PASS — 11 confluence cases and five readiness outputs unchanged | Includes BUY, SELL, CAUTION, missing/contradictory evidence, NDAQ BUY rejection, unmapped products, risk and daily limits |
| Server-rendered panel | PASS | Empty, unavailable, insufficient, populated, contradictory, attributed-reference and escaped untrusted-text states |
| Browser interactions / responsive layouts | UNTESTED | Browser automation was unavailable in this session; SSR does not verify clicks, downloads, layout or owner authentication |
| Hosted runtime / persistence / provider reads | NOT RUN | No production or provider changes; existing storage and authentication test coverage passes |
| Historical predictive value of theories | NOT TESTED | No full-book ingestion, hypothesis backtest, calibration, cost simulation or operational feature promotion |

The initial FIL test harness attempted to import an unavailable `esbuild` package and failed before running tests. It was replaced with the repository’s existing TypeScript compiler for server-render testing; no dependency was installed. Lint then found a test-local variable name prohibited by the Next lint rule; it was renamed. Both issues were corrected before the passing final runs. No lint suppression, weakened type or disabled test was used. Raw baseline byte hashes were verified unchanged in this session and are preserved. Portable regression additionally stores LF-normalised hashes so Git’s Windows/Unix line-ending conversion cannot create a false code regression.

## Fifteen requested safeguards

1. Five profiles and 38 concepts validate, with unique IDs, required source pages and checksum matching the original PDF.
2. Every claim is marked secondary-summary, with `original_work_consulted=false`; no illustrative scenario is recorded as a verified historical case.
3. Missing observations, invalid input and absent libraries produce uncertainty/unavailable states. An unmatched scope/horizon can return NO RELEVANT FRAMEWORK APPLIES.
4. Supporting and contradictory observations coexist. Comparisons preserve agreement, contradiction, independent interpretation, missing evidence and non-applicability without forcing resolution.
5. Directional Elastication source is byte-identical; signed changes, signed ratio, absolute magnitude, missing Q_d and zero-denominator safeguards have explicit regression checks.
6. Existing SMT/ICT definitions, core code and baseline outputs remain unchanged.
7. ATR periods remain 9/5m, 14/15m and 27/1H+. Real stored source bars produce identical features before/after context evaluation.
8. No direction/confidence field exists in the strict assessment schema; unexpected execution fields are rejected.
9. Weight and authority are literal 0/false; size/SL/TP fields are rejected. Core files and deterministic outputs match baseline.
10. Static dependency and endpoint checks find no FIL network/order calls, execution imports or new API routes.
11. Before ingestion, no concept or comparison annotations reach historical consumers. Future observations, publications, receipts and revised news are excluded; their content is absent from results.
12. NDAQ SELL ONLY, five-market routing, unresolved product/risk gates and STAND DOWN behaviour remain intact.
13. Corrupt/unsupported library inputs fail within FIL; source-bar processing and independent confluence still run unchanged.
14. Running core decisions before/after FIL and omitting FIL yields the exact pre-change baseline outputs. Inputs remain unmodified; outputs are frozen.
15. Full existing and added tests, lint, TypeScript and production-build checks are required; actual results are recorded above and in the final receipt.

Build completed with nonfatal plugin-timing/bundle-size advisories and the existing unknown root-route static classification warning. A successful build does not verify hosted authentication or browser behaviour. Machine receipt: `data/framework-intelligence/verification.json`.

## Coverage and limits

The populated and contradictory FIL assessments are synthetic software fixtures, never current market observations or proof of a theory. A genuine stored CMC Silver series is used only to verify unchanged deterministic feature processing. Existing historical validation limitations, unavailable Q_d and operational gates are preserved. No empirical validation count has increased.

Topic relevance is not complete applicability testing: it does not prove a proposed mechanism or automatically verify every listed observational requirement. A future audited evidence adapter must supply exact instrument/event scope, source provenance, verification and point-in-time vintages. Existing unverified imported narratives and bar timing are deliberately not upgraded. Consequently the actual new UI panels currently show no-relevant/insufficient evidence while allowing reference inspection.

All framework assessments remain Level 1, weight 0, execution authority false. No Level 2 hypothesis is generated or promoted; no Level 3 quantitative feature is implemented or authorised. No measured participant motivation, predictive probability, new risk setting or trade permission is asserted.

## Reproduce

Run from the existing checkout with its installed Node dependencies:

```powershell
node scripts/export-framework-ingestion.mjs
node --experimental-strip-types --import ./tests/core-register.mjs --test --test-reporter=tap tests/core.test.mjs tests/source-policy.test.mjs tests/persistence.test.mjs tests/historical.test.mjs tests/round2.test.mjs tests/round2-data.test.mjs tests/framework-intelligence.test.mjs
npm.cmd run lint
node node_modules/typescript/bin/tsc --noEmit
npm.cmd run build
git diff --check
```

No new dependency, secret, database schema, access-policy field, hosting binding or trading rule is introduced. There is no source push, saved Site version, production deployment or trade. The baseline commit is the rollback reference.

## Changed files

- `app/workspace-v2.tsx`: passes the existing workspace review timestamp to Three Circles.
- `app/workspace-views.tsx`: mounts the read-only panel for selected Tape instrument and selected historical event review.
- `app/framework-intelligence.tsx`: contextual/reference UI using existing styles, evidence/limitations/source display and deliberate local JSON export.
- `lib/framework-intelligence/contracts.ts`: validated contracts and zero-influence literals.
- `lib/framework-intelligence/engine.ts`: scoped/as-of context evaluator and comparison register.
- `data/framework-intelligence/registry.json`: five secondary-source profiles and 38 concepts.
- `data/framework-intelligence/comparative-source.pdf`: original supplied synthesis bytes.
- `data/framework-intelligence/source-pages.json`: all extracted source pages and checksum.
- `data/framework-intelligence/execution-baseline.json`: pre-change protected hashes and synthetic decision receipts.
- `data/framework-intelligence/verification.json`: final machine-readable validation receipt.
- `scripts/export-framework-ingestion.mjs`: checksum-checked documentation generator.
- `tests/framework-fixtures.mjs`: isolated synthetic confluence scenarios.
- `tests/framework-intelligence.test.mjs`: 16 deterministic isolation/provenance/SSR tests.
- `FRAMEWORK_INGESTION.md`, `FRAMEWORK_RECONCILIATION.md`, `FRAMEWORK_INTEGRATION.md`, `VALIDATION_REPORT.md`: requested source overview, disagreements, architecture, changes and test report.

Engineering acceptance is scoped to contextual ingestion and isolation. Current market applicability and empirical predictive validation remain unestablished. Production remains unchanged.
