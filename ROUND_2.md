# STRATA Round 2 integration map

This is a Round 1 mock-only shell. All market records are illustrative; none are ingested historical facts. No production inference, scheduling or execution runs.

- `lib/strata/types.ts`: shared contracts for all required domain models, provenance, confidence and freshness.
- `lib/strata/mock.ts`: coherent demo records, instrument registry, watchlists, relationship definitions and illustrative distributions.
- `lib/strata/services.ts`: provider interfaces and replaceable Elasticity, Probability, Similarity and Signal modules. Ingestion boundaries intentionally accept zero production records until persistence and validation are implemented.
- `app/workspace.tsx`: eight screens with common filters, decision component, inspector and preferences. Route entry points at /atlas, /corpus, /surface, /scan, /smt, /tape, /formula and /log; /settings holds device-local preferences.
- `app/globe.tsx`: orthographic canvas globe using geographic coordinates, drag and keyboard rotation, zoom, event selection and optional arcs.
- `public/map.json`: simplified country outlines derived from datasets/geo-countries (Natural Earth). Borders are geographic reference, not a political assertion. Source: https://github.com/datasets/geo-countries .

## Replace providers, preserve contracts

Implement server-side adapters and durable per-user/tenant repositories before ingesting customer data. Keep credentials out of client code. Add validation, duplicate handling, source citations, ingestion batch IDs, failed-item retry and explicit unknowns. The current provider hub lives in services.ts and is intentionally mock-only.

`refreshStrata` isolates module failures and records step statuses. It currently checks demo market/context/events and records audit outcomes and explicitly skips 9 production modules. Replace stages individually, enforce timestamp freshness and avoid promoting demo or stale evidence into live conclusions.

`ingestEvents`, `ingestHTFSnapshot`, `calculateElasticity`, `evaluateTradingPlan` are explicit boundaries. Screenshot preview is browser-local and discarded; capture time is not inferred from upload time. No PDF parser or image-analysis pipeline is implemented.

## Formula reference

Owner supplied E_d = | %ΔQ_d / %ΔP |. This reference is preserved in the UI. Define Q_d in the intended market model, percentage-change convention, baseline, sampling horizon, time alignment, units and zero-denominator handling before activating any calculation. No trading formula has been invented.

## UI state

Demo context is anchored to 2026-09-10 18:00 UTC. The horizon filters event dates; quotes are a single mock snapshot. All demo probabilities and SMT reliability values are independent illustrative fixtures, not computed from the eight event records. Settings are local preferences only. Confidence/freshness settings are staged for Round 2 enforcement. Audit log and formula inputs reset on reload. Custom geography currently lasts only for the session. Production persistence is intentionally absent.

## Hand-off requirements

Supply exact instruments, watchlists, trading rules and execution windows. Wire vendor adapters only after account/payment/access confirmation. Ingest the approximately 900 historical records in validated batches. Supply screenshot capture timestamps and explicit sources. Add rule versions and explainable calculation traces. Enable scheduled refresh only after those stages are validated.
