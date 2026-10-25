# STRATA — visual upgrade handoff

This is the finished engineering candidate exported from private source commit **387742eab62c7bbe480aaa10fdd4a88db435bf63**. It is a research workspace, with unfinished integrations and execution gates deliberately visible. The private baseline passed 148 tests, TypeScript, zero-error/zero-warning lint and a production build. Passing software checks is not evidence of a trading edge.

The owner requests a **visual upgrade only** at this stage. Do not deploy, connect broker credentials, activate schedules, write financial records or place trades. Production remains private Sites V25 at commit bedbe6bf54e1f89adb6a5ff5460ad814d7f15446. The owner will return for redeployment, integration completion, then soft and live testing as separate steps.

## Scope for the visual upgrade

Improve clarity, visual hierarchy, responsive layouts, chart readability, accessibility and the existing Strata/Albion identity. Keep Today useful before requiring research navigation. Preserve the Three Circles, the Atlas list alternative, portfolio horizon separation, source provenance, data age, unknown/error/blocked states and separate owner versus Strata decisions. No heavy animation is necessary.

Use existing services and contracts. Do not replace working historical features with invented demo data, calculate a fictional E_d or make delayed quotes appear live. Runtime-disconnected mode must remain visibly disconnected.

## Preserve these boundaries

* CMC only: Gold Cash, Silver Cash, Sugar Raw Cash, Crude Oil Cash, US NDAQ 100 Cash. NDAQ SELL ONLY. Sugar/Crude remain blocked until exact mapping and validation. Wider context and portfolio use the separate Trading 212 branch.
* E_d = |(%ΔQ_d) / (%ΔP)|. Preserve measured/proxy provenance, signed input changes and unavailable states. Do not replace Q_d with total volume, sentiment or ATR.
* Existing SMT/ICT definitions, ATR(9) 5m, ATR(14) 15m, ATR(27) 1H+, risk gates, suggestive TP1–TP3 ordering and human control remain unchanged. Framework Intelligence remains context only, zero execution authority.
* STAND DOWN is the default. Delayed CMC prices cannot confirm an immediately executable 2m/5m entry. No unvalidated feature or visual confidence score may override a failed gate.
* Trading 212 dashboard refresh is on command. Scheduled 16:45 accounting is separate. No background dashboard price polling.
* The seven London times are prepared definitions, not active native tasks. The UI must not claim unattended execution without actual receipts. The spring missing 01:15 and autumn repeat are explicitly handled.

## Code map and checks

UI: `app/workspace-views.tsx`, `app/workspace-v2.tsx`, `app/operations.tsx`, existing historical/source-routing/framework panels, and existing styles/components. Keep backend calls and validated response contracts intact.

Backend: `lib/strata-v2`, `lib/historical`, `lib/framework-intelligence`, `lib/operations`, authenticated `app/api/*`, `app/mcp`, `db/schema.ts` and additive migrations. The operations handoff, actual source coverage, tests and limitations are in `docs/round8/`.

```sh
pnpm install --frozen-lockfile
node --experimental-strip-types --import ./tests/core-register.mjs --test --test-reporter=tap tests/core.test.mjs tests/source-policy.test.mjs tests/persistence.test.mjs tests/historical.test.mjs tests/round2.test.mjs tests/round2-data.test.mjs tests/framework-intelligence.test.mjs tests/operations.test.mjs
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
pnpm run dev
```

Use Node 24 for the current Node test harness and pnpm 11.25.0 as specified by `packageManager`; the repository has a pnpm lockfile. Development uses the existing Vinext/Cloudflare stack. A browser session without the private Sites dispatch identity and D1 binding cannot prove hosted persistence or broker connectivity. Do not forge owner identity in production or expose a bypass token for preview.

## Public export and return handoff

Only tracked source was exported. No old private Git history, environment files, local databases, node_modules, access tokens or private runtime storage is included. Private Notion page/database identifiers are replaced by UUID placeholders; the schemas and integration contracts are retained. `PUBLIC_EXPORT.json` records the source and privacy-only differences. Placeholder identifiers are not configured destinations. Source research datasets and the owner-supplied portfolio target seed remain research/intentions, not verified current balances.

Before a later redeployment, restore the real Notion bindings from the owner's private baseline and review visual changes against that baseline. Preserve the existing Sites project identity, owner-only access, database binding, existing data and source-routing rules. No GitHub push should trigger a Sites deployment.

Return the exact visual commit/branch, changed UI files, responsive/browser checks, build/test results and remaining defects. Keep changes reviewable and avoid unrelated backend refactoring. The next integration and test stages are not authorised by this visual handoff.
