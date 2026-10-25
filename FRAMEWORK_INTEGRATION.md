# Framework integration

Baseline: local clean `f6448813b1db558e88edffe21572b1f3c8966ecd`. This is a local-only extension. No source push, Sites save/deploy, broker request, secret configuration, scheduled job or database migration is part of this change.

## One-way boundary

Existing market/event/behaviour evidence → reviewed `FrameworkContext` → `assessFrameworks` → explanatory panel / explicit JSON export.

The existing execution engine remains a separate path: historical/current observations → three-circle Elastication → SMT/ICT and ATR → deterministic risk/data gates → separate Strata/owner assessment. FIL has no input into this path, cannot receive mutable execution state and has no order or persistence endpoint. It is interpretive context across the existing three circles, not a fourth execution circle.

| Module | Responsibility |
| --- | --- |
| `data/framework-intelligence/registry.json` | Five profiles, 38 concepts, source pages, limitations and explicit zero authority |
| `data/framework-intelligence/comparative-source.pdf` | Original supplied bytes retained in source; not placed in public assets |
| `data/framework-intelligence/source-pages.json` | All 14 extracted pages and source checksum |
| `lib/framework-intelligence/contracts.ts` | Strict Zod contracts, literal level 1 / weight 0 / authority false; rejects execution fields |
| `lib/framework-intelligence/engine.ts` | As-of, scope and topical applicability filtering; unresolved comparisons; graceful unavailable state |
| `app/framework-intelligence.tsx` | Existing panel/toolbar/details styles, read-only reference browsing and assessment export |
| `app/workspace-views.tsx`, `app/workspace-v2.tsx` | Tape selected-instrument panel and Three Circles selected-event present-day contextual review |
| `tests/framework-intelligence.test.mjs` | Isolation, provenance, as-of, invalid input, SSR and regression checks |
| `data/framework-intelligence/execution-baseline.json` | Pre-change outputs for 11 synthetic confluence scenarios, five instrument readiness outputs and 32 protected-file hashes |
| `scripts/export-framework-ingestion.mjs` | Checksum-verified reproduction of the complete ingestion document |

## Contract and evidence hierarchy

`assessFrameworks(unknown, optionalLibrary)` validates the complete input. `FrameworkContext` identifies instrument, optional event, review timestamp, horizon, requested topics and up to 200 evidence records. Every evidence record has ID, source/locator, exact instrument/event scope, circle, kind, verification status, supporting/contradictory role, observation/publication/receipt/revision timestamps and optional validity expiry. Expected releases and realised releases retain different kinds; narrative and interpretation are never accepted as observed evidence.

Timestamp comparisons use parsed instants including timezone offsets. Evidence unavailable at the review time, future revisions, impossible receipts, expired validity and mismatched instrument/event scope are excluded with reasons. Revised records must not be substituted for first-release records by an upstream adapter; FIL does not reconstruct missing vintages. Current retrospective prose is not a historical annotation.

Each assessment exposes framework/concept IDs, secondary provenance, paraphrased claim, applicability, circles/horizon, observed and contradictory evidence, missing evidence, limitations, explicit STRATA interpretation, evidence status, version and as-of. `hypothesis` remains null. `influence_level=1`, `quantitative_signal_weight=0`, `execution_authority=false` are schema literals. Strict contracts reject extra confidence, direction, size, stop and target fields. Outputs are deeply frozen.

Topic tags and verification must come from an audited upstream evidence adapter. A topical match means a lens may help question an observation; it does not establish the mechanism, causality, statistical relevance or complete satisfaction of the listed data requirements. Imported free text is never classified by keyword into verified observations.

## Current wiring and honest limitations

Tape uses its selected instrument and existing assessment timestamp. Three Circles uses the selected historical event ID and the workspace review timestamp, explicitly as a **present-day contextual review**. Neither inserts annotations into an old replay. These panels currently receive **no reviewed observable framework inputs**: dated narrative material and unverified bars are not silently promoted. They therefore offer reference browsing and honest no-applicable/insufficient states. The service and panel accept reviewed evidence through the typed read-only boundary; loaded and contradictory states are demonstrated by labelled fixtures, not claimed live integrations.

No model API is required or called. There is no continuous ingestion, framework-based direction, score, probability or automatic hypothesis/feature promotion. A future Level 2 research request needs explicit review and separate data/baseline/holdout/cost methodology. A future Level 3 proposal additionally needs independent validation and owner authorisation. This change does neither.

## Preserved mathematics and controls

`lib/historical/elastication.ts` remains byte-identical: `E_d = |(%ΔQ_d) / (%ΔP)|`, signed changes/ratio retained, equal observation windows, original units/source IDs, 0.001% denominator safeguard and unavailable Q_d handling. No volume, sentiment, theory, volatility or order-flow proxy is inserted. Q_d remains unavailable where not measured. The legacy imported event-response operationalisation remains historical narrative, separate from this directional formula; this task does not reconcile or pool it.

All existing core historical and rule files are hash checked against baseline. This includes SMT/ICT research definitions, ATR(9)/5m, ATR(14)/15m, ATR(27)/1H+, five-CMC allowlist, NDAQ SELL ONLY, unresolved Sugar/Crude gates, Trading 212 separation, session/risk/position limits, TP1–TP3 suggestive rules and STAND DOWN default. Source policies, private route protection, hosting manifest and storage services are unchanged. No credentials or dependencies are added.

## Security, persistence and reversibility

Source text is data. React escapes it; no HTML injection, dynamic evaluation, LLM prompts or network operations exist in FIL. The original PDF/extraction are source artifacts, not public downloads. Registry updates are versioned Git changes with a checksum; UI selections are ephemeral controls, not claimed durable audit storage. Existing private persistence remains unchanged. JSON export is a deliberate local download of the review result.

Rollback is the baseline commit above. Alternatively remove the two panel mounts/import and revert the Formula timestamp prop to remove FIL from the UI; core execution behaviour is identical with or without it. No data migration or deletion is needed. Do not deploy this change without a subsequent authorised release task.
