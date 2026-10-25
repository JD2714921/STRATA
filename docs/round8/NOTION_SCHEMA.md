# Actual Strata Notion destination

> Public export: all Notion destination identifiers and related links below are placeholders. The actual owner-private bindings remain in the private baseline.

Private-draft parent: **Strata’s Reasoning**, page `00000000-0000-4000-8000-000000000001`, https://app.notion.com/p/00000000000040008000000000000001. Created after explicit owner instruction. These are new personal databases, not Albion commercial records.

| Database | Database URL | Authoritative data source |
|---|---|---|
| Daily Trading & Portfolio Log | https://app.notion.com/p/00000000000040008000000000000002 | collection://00000000-0000-4000-8000-000000000005 |
| Trade & Transaction Ledger | https://app.notion.com/p/00000000000040008000000000000003 | collection://00000000-0000-4000-8000-000000000006 |
| Portfolio Snapshot Ledger | https://app.notion.com/p/00000000000040008000000000000004 | collection://00000000-0000-4000-8000-000000000007 |

All three schemas were fetched natively. Bounded native row queries subsequently returned `results=[]`, `has_more=false` for each. Zero financial rows were written. Creating empty schemas demonstrates chat-authorised setup capability; it is not evidence of a working unattended financial sync or a separate ACL inspection API.

Common actual properties: `Name:title`, `Record key:text`, `Record type:select`, `Source at:date`, `Status:select`, `Broker:select`, `Account reference:text`, `Currency:text`, `Amount exact:text`, `Realised P&L exact:text`, `Fees exact:text`, `Trading date:date`, `Cutoff:date`, `Reconciliation references:text`.

Transaction additions: `Instrument:text`, `Product type:text`, `Direction:select`, `Category:text`, `Quantity exact:text`, `Execution price exact:text`, `Price currency:text`, `Broker event ID:text`, `Daily log:relation` to the daily data source.

Snapshot additions: `Cash exact:text`, `Portfolio value exact:text`, `Unrealised P&L exact:text`, `Freshness:select`, `Daily log:relation` to the same daily source.

Broker options are CMC / Trading 212 / Consolidated. Record types are transaction / snapshot / daily. Status options include PROVISIONAL / PARTIALLY RECONCILED / RECONCILED / BLOCKED and confirmed / manual / reversed / cancelled. Snapshot freshness options are CACHED / STALE / UNAVAILABLE / OBSERVED. Exact decimal fields use text deliberately to retain currency-specific decimal observations without JavaScript floating-point aggregation. They are not automatically comparable monetary totals.

Native write dates use expanded fields such as `date:Source at:start`, `date:Source at:is_datetime`, `date:Trading date:start`, `date:Cutoff:start`. Relations use actual Notion page URLs after the daily parent write succeeds. Fields without legitimate values remain null; audit JSON content preserves all coverage, unknowns, timestamps and revisions. `Reconciliation references` is available for future view-specific formatting; complete source/run references are already retained in record content/D1 rather than invented into empty columns.

Write protocol: fetch current schema → query exact Record key → reserve via authenticated Site tool → call the actual native Notion create/update → acknowledge actual URL and receipt → read back. Strata's reservation/unique keys supply idempotency that Notion schema alone does not. Duplicate matches block writes; uncertain creates are not blindly repeated. The Site acknowledgement is task-reported provenance, not an independent fetch by the Site.
