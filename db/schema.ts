import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Append-only, owner-scoped records. No request handler updates or deletes these rows. */
export const round1Records = sqliteTable("round1_records", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  kind: text("kind", { enum: ["config", "portfolio", "decision", "refresh", "rule", "review", "historical"] }).notNull(),
  version: text("version").notNull(),
  createdAt: text("created_at").notNull(),
  payload: text("payload").notNull(),
  contentHash: text("content_hash").notNull(),
  requestId: text("request_id"),
}, table => [
  index("round1_owner_kind_time_idx").on(table.ownerId, table.kind, table.createdAt),
  uniqueIndex("round1_owner_request_idx").on(table.ownerId, table.requestId),
]);

// Separate operational receipts; the original owner decision/history table is unchanged.
export const operationRecords=sqliteTable('operation_records',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),kind:text('kind').notNull(),recordKey:text('record_key').notNull(),createdAt:text('created_at').notNull(),payload:text('payload').notNull(),contentHash:text('content_hash').notNull(),
},t=>[uniqueIndex('operations_record_revision').on(t.ownerId,t.kind,t.recordKey,t.contentHash),index('operations_record_lookup').on(t.ownerId,t.kind,t.recordKey,t.createdAt)]);
export const operationRuns=sqliteTable('operation_runs',{
 ownerId:text('owner_id').notNull(),runId:text('run_id').notNull(),phase:text('phase').notNull(),inputHash:text('input_hash').notNull(),state:text('state').notNull(),attempts:integer('attempts').notNull(),updatedAt:text('updated_at').notNull(),payload:text('payload'),error:text('error'),retryAt:text('retry_at'),
},t=>[uniqueIndex('operations_occurrence_phase').on(t.ownerId,t.runId,t.phase)]);
export const operationLocks=sqliteTable('operation_locks',{
 ownerId:text('owner_id').notNull(),resource:text('resource').notNull(),token:text('token').notNull(),expiresAt:text('expires_at').notNull(),
},t=>[uniqueIndex('operations_owner_lock').on(t.ownerId,t.resource)]);
export const operationOutbox=sqliteTable('operation_outbox',{
 ownerId:text('owner_id').notNull(),recordKey:text('record_key').notNull(),desiredHash:text('desired_hash').notNull(),payload:text('payload').notNull(),state:text('state').notNull(),remoteId:text('remote_id'),updatedAt:text('updated_at').notNull(),error:text('error'),claimToken:text('claim_token'),
},t=>[uniqueIndex('operations_notion_key').on(t.ownerId,t.recordKey)]);
