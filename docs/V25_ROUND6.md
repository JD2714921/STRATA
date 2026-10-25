# Round 6 reconciliation and contained repairs — 22 October 2026

Local repair baseline: `7bac07e725b482f68a7d1f835586b701259ac751`. Native production remains version25 at `bedbe6bf54e1f89adb6a5ff5460ad814d7f15446`, access revision1 owner-only, environment revision0 with no Trading212 credentials, d1=DB, r2=null, no Site schedules. Local repair completion is not publication or authenticated hosted QA.

## Confirmed repairs

- Confluence rejects nonfinite reward/risk, invalid daily-opening counts, invalid/future timestamps and malformed event/comparison values. Timestamp ordering uses parsed explicit instants; differing UTC offsets cannot admit future features. Existing risk thresholds and allowable sides are unchanged.
- Execution binding, simulation as-of lookup and SMT pivot filtering use actual instants, reject invalid clocks and exclude future evidence. Normal canonical-UTC observations retain their original numerical results. Current historical wrappers still force Stand Down; no operational order bypass was demonstrated before this repair.
- Historical saves accept an optional request UUID. An exact owner-scoped retry returns its original record; reuse for different input conflicts. The existing unique database index handles concurrent retries. No schema migration or historical-record rewrite is required. The UI retains a pending key after an uncertain failure and clears it after success; a new intentional action gets a new key. Old requests without a key remain compatible.
- Chronological partitioning no longer asserts untouched validation: the current helper returns an unknown untouched flag and explicit not-established status. Partition boundaries are unchanged. Frozen/legacy outputs remain original evidence; the historical view now explains that their old split flags are not validation receipts.
- Shared plan/rulebook metadata now includes the already-approved ATR27 on1H+. The Round2 wrapper already calculates it. Legacy hourly-plus outputs retain their recorded ATR14 definition and must not be relabelled as ATR27.

There is no change to `E_d = |(%ΔQ_d) / (%ΔP)|`, directional quantity definition, observation provenance, signed changes, denominator safeguards, target fractions, monetary risk, five-product source routing or private access. No missing quantity was replaced with volume.

## Quantitative interpretation

The nine consolidated research families have implementations, observed-data execution and versioned outputs; none is operationally validated. The separately versioned E_d arithmetic calculator is implemented and unit tested, but has zero valid measured historical outputs. Round2 retains15 datasets/42,505 bars and42,505 physical E rows representing85,010 unavailable BUY/SELL windows. All32,652 execution bindings remain Stand Down. Events:36 records, nine first-actual vintages, zero complete point-in-time vintages and zero verified response windows.

The external Round3 study has743 study/capability cells,739 implemented/reproducible,380 historically tested,365 blocked and378 inconclusive. These are not independent methods. Untouched validations and operational approvals are zero. Total-activity/BVC proxies are not measured directional order flow. Short, previously exposed samples and cost sensitivities do not establish a trading edge. No holdout/backtest was rerun for this audit.

## Verification and retained limits

Tests cover malformed risk/counts, timezone-offset look-ahead, invalid clocks, future pivots/events/comparisons, concurrent retry collision, changed-input conflict, owner isolation and intentional new saves. Existing tests retain NDAQ BUY denial, conflicting/missing circles, source policy, target ordering, ATR, private ownership and unavailable states. The original test failure during repairs was a changed diagnostic string; its existing wording was restored without weakening the assertion.

The full Round2 offline generator was rerun against retained observations; final audit evidence records data hashes and check/build outcomes. Original observations, source outputs and frozen study artifacts are preserved. Software checks are not historical validation.

Fresh CMC chat reads found exact SB products for Gold/Silver/US NDAQ100 and returned11 Silver2m bars in the bounded sample. Sugar/Crude exact searches returned zero. Product specifications were returned; the delayed-price request failed connector parameter validation. Declared delayed pricing is15minutes and cannot qualify2m/5m entry freshness. Bigdata document retrieval and a location-specific Tomorrow.io read succeeded in chat; these are not hosted feeds or crop-yield evidence.

Hosted database metadata has55 review records and zero historical/owner-decision rows. Payload cells are truncated by the native viewer, so full stored-payload integrity and browser/session persistence remain unverified. Browser service recovery timed out. Access was not bypassed or forged. Current hosted Trading212 reads remain blocked by absent credentials; wider chart/yield capabilities are not inferred from its account API.

The Round6 handoff, subsystem matrix, contradiction register, coverage and native receipts are retained externally in `../strata-round6-2026-10-22` relative to the repository folder. This candidate is a research workspace repair, not an approval for operational recommendations, monitoring or real-money execution.
