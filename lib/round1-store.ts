import portfolioSeed from "../data/round1/portfolio-seed.json";
import { createOwnerDecision, DEFAULT_CONFIG, evaluateReadiness, RULEBOOK, RULE_VERSION } from "./strata-v2/rules";
import type { OwnerConfig } from "./strata-v2/rules";
import { TRADE_IDS } from "./strata-v2/registry";
import type { StrataAssessment } from "./strata-v2/contracts";
import { CONFIG_KEYS, PIE_NAMES, requireOwnerId, round1MutationSchema, StoreError } from "./round1-store-contracts";
import type { ConfigInputField, IssuedReview, PrivateState, RecordKind, Round1Mutation, VersionRecord } from "./round1-store-contracts";

type StoredRow = { id: string; owner_id: string; kind: RecordKind; version: string; created_at: string; payload: string; content_hash: string; request_id: string | null };
type NewRow = StoredRow;
type ConfigPayload = { fields: ConfigInputField[]; source: string; previousVersion: string | null; ruleVersion: string };
const HISTORY_LIMIT = 100;
export const REVIEW_TTL_MS = 60_000;
type ReviewPayload = Omit<IssuedReview, "token"> & { instrumentId: string; inputVersion: string; portfolioVersion: string | null; ruleVersion: string };
const columns = "id, owner_id, kind, version, created_at, payload, content_hash, request_id";

function expose(row: StoredRow): VersionRecord {
  return { id: row.id, kind: row.kind, version: row.version, createdAt: row.created_at, payload: JSON.parse(row.payload), contentHash: row.content_hash };
}

export async function hashPayload(payload: unknown): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function latest(db: D1Database, ownerId: string, kind: RecordKind): Promise<VersionRecord | null> {
  const row = await db.prepare(`SELECT ${columns} FROM round1_records WHERE owner_id = ? AND kind = ? ORDER BY created_at DESC, rowid DESC LIMIT 1`).bind(ownerId, kind).first<StoredRow>();
  return row ? expose(row) : null;
}

export async function readOwnedRecord(db: D1Database, ownerId: string, id: string): Promise<VersionRecord> {
  requireOwnerId(ownerId);
  const row = await db.prepare(`SELECT ${columns} FROM round1_records WHERE owner_id = ? AND id = ?`).bind(ownerId, id).first<StoredRow>();
  if (!row) throw new StoreError(404, "record_not_found", "No private record was found for this identity.");
  return expose(row);
}

export async function readOwnedHistory(db: D1Database, ownerId: string, kind: RecordKind, before: string | null = null): Promise<VersionRecord[]> {
  requireOwnerId(ownerId);
  const query = before
    ? db.prepare(`SELECT ${columns} FROM round1_records WHERE owner_id = ? AND kind = ? AND created_at < ? ORDER BY created_at DESC, rowid DESC LIMIT ?`).bind(ownerId, kind, before, HISTORY_LIMIT)
    : db.prepare(`SELECT ${columns} FROM round1_records WHERE owner_id = ? AND kind = ? ORDER BY created_at DESC, rowid DESC LIMIT ?`).bind(ownerId, kind, HISTORY_LIMIT);
  return (await query.all<StoredRow>()).results.map(expose);
}

export async function readPrivateState(db: D1Database, ownerId: string, now = new Date().toISOString()): Promise<PrivateState> {
  requireOwnerId(ownerId);
  const [config, portfolio, rule, decisions, refreshes] = await Promise.all([
    latest(db, ownerId, "config"), latest(db, ownerId, "portfolio"), latest(db, ownerId, "rule"),
    readOwnedHistory(db, ownerId, "decision"), readOwnedHistory(db, ownerId, "refresh"),
  ]);
  return { storage: "durable", config, portfolio, rule, decisions, refreshes, serverTime: now, historyLimit: HISTORY_LIMIT };
}

async function newRow(ownerId: string, kind: RecordKind, payload: unknown, now: string, requestId: string | null = null): Promise<NewRow> {
  const id = crypto.randomUUID();
  return { id, owner_id: ownerId, kind, version: `r1-${kind}-${id}`, created_at: now, payload: JSON.stringify(payload), content_hash: await hashPayload(payload), request_id: requestId };
}

function insert(db: D1Database, row: NewRow): D1PreparedStatement {
  return db.prepare("INSERT INTO round1_records (id, owner_id, kind, version, created_at, payload, content_hash, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(row.id, row.owner_id, row.kind, row.version, row.created_at, row.payload, row.content_hash, row.request_id);
}

/** The final configuration check and append happen in one SQL statement, so another
 * tab cannot change the reviewed configuration between validation and persistence. */
function insertReviewedDecision(db: D1Database, row: NewRow, configVersion: string | null): D1PreparedStatement {
  return db.prepare("INSERT INTO round1_records (id, owner_id, kind, version, created_at, payload, content_hash, request_id) SELECT ?, ?, ?, ?, ?, ?, ?, ? WHERE COALESCE((SELECT version FROM round1_records WHERE owner_id = ? AND kind = 'config' ORDER BY created_at DESC, rowid DESC LIMIT 1), '') = ?").bind(row.id, row.owner_id, row.kind, row.version, row.created_at, row.payload, row.content_hash, row.request_id, row.owner_id, configVersion || "");
}

function configFromRecord(record: VersionRecord | null): OwnerConfig {
  const config = structuredClone(DEFAULT_CONFIG);
  if (!record) return config;
  const payload = record.payload as ConfigPayload;
  // Schema-validated at write time; validate again before making old storage an input.
  const check = round1MutationSchema.safeParse({ kind: "config", fields: payload.fields });
  if (!check.success || check.data.kind !== "config") throw new StoreError(503, "stored_config_invalid", "Stored configuration failed validation; readiness is blocked.");
  for (const field of check.data.fields) config[field.key] = { value: field.value, status: field.status, note: field.note, source: "Authenticated owner configuration; definition only", version: record.version };
  return config;
}

function configFields(config: OwnerConfig): ConfigInputField[] {
  return CONFIG_KEYS.map(key => ({ key, value: config[key].value, status: config[key].status, ...(config[key].note ? { note: config[key].note } : {}) }));
}

/** Issues owner-bound, persisted review tokens. The UI must display these assessments
 * and return only their binding fields when J records a decision. */
export async function issueReviewAssessments(db: D1Database, ownerId: string, now = new Date().toISOString(), state?: Pick<PrivateState, "config" | "portfolio">): Promise<IssuedReview[]> {
  requireOwnerId(ownerId);
  const [configuration, portfolio] = state ? [state.config, state.portfolio] : await Promise.all([latest(db, ownerId, "config"), latest(db, ownerId, "portfolio")]);
  const config = configFromRecord(configuration);
  const configVersion = configuration?.version || null;
  const portfolioVersion = portfolio?.version || null;
  const inputVersion = `server-unresolved-v1:${configVersion || RULE_VERSION}:${portfolioVersion || "seed-not-saved"}`;
  const expiresAt = new Date(Date.parse(now) + REVIEW_TTL_MS).toISOString();
  const rows: NewRow[] = [];
  const reviews: IssuedReview[] = [];
  for (const instrumentId of TRADE_IDS) {
    const assessment = evaluateReadiness({ instrumentId, now, config, sourceInputVersion: inputVersion });
    const assessmentHash = await hashPayload(assessment);
    const payload: ReviewPayload = { instrumentId, asOf: now, expiresAt, configVersion, portfolioVersion, inputVersion, ruleVersion: RULE_VERSION, assessmentHash, assessment };
    const row = await newRow(ownerId, "review", payload, now);
    rows.push(row);
    reviews.push({ token: row.id, asOf: now, expiresAt, configVersion, assessmentHash, assessment });
  }
  await db.batch(rows.map(row => insert(db, row)));
  return reviews;
}

/** Compare decision-relevant state, not timestamp-only wording such as clock display. */
function assessmentConditions(assessment: StrataAssessment) {
  return { direction: assessment.direction, readiness: assessment.readiness, evidenceHealth: assessment.evidenceHealth, gates: assessment.gates.map(gate => ({ id: gate.id, state: gate.state, hard: gate.hard })) };
}

/** Durable mutations use authenticated ownership and server-generated timestamps/assessments.
 * The hypothetical lab has no path into this API. Provider and broker data are not writable here.
 */
export async function savePrivateMutation(db: D1Database, ownerId: string, raw: unknown, now = new Date().toISOString()): Promise<VersionRecord> {
  requireOwnerId(ownerId);
  const parsed = round1MutationSchema.safeParse(raw);
  if (!parsed.success) throw new StoreError(400, "invalid_request", parsed.error.issues.map(issue => issue.message).slice(0, 8).join(" "));
  const input: Round1Mutation = parsed.data;
  if (input.requestId) {
    const row = await db.prepare(`SELECT ${columns} FROM round1_records WHERE owner_id = ? AND request_id = ?`).bind(ownerId, input.requestId).first<StoredRow>();
    if (row) throw new StoreError(409, "request_already_recorded", `This request was already recorded as ${row.id}. Reload private state before retrying.`);
  }
  if (input.kind === "seed") {
    // A repeat seed never overwrites a later manual/imported portfolio version.
    const [existing, existingRule] = await Promise.all([latest(db, ownerId, "portfolio"), latest(db, ownerId, "rule")]);
    const rows: NewRow[] = [];
    let portfolio = existing;
    if (!portfolio) {
      const row = await newRow(ownerId, "portfolio", { ...portfolioSeed, source: "Owner-provided PDF and portfolio images; capture time unknown", reconciliationState: "not-reconciled", importedAt: now }, now, input.requestId || null);
      rows.push(row);
      portfolio = expose(row);
    }
    if (!existingRule || (existingRule.payload as { ruleVersion?: string }).ruleVersion !== RULE_VERSION) rows.push(await newRow(ownerId, "rule", { ruleVersion: RULE_VERSION, rulebook: RULEBOOK, configuration: DEFAULT_CONFIG, source: "Owner Round 1 instruction supersedes older PDF and source rules" }, now, existing ? input.requestId || null : null));
    if (rows.length) await db.batch(rows.map(row => insert(db, row)));
    return portfolio;
  }
  let kind: RecordKind;
  let payload: unknown;
  if (input.kind === "config") {
    const previous = await latest(db, ownerId, "config");
    const merged = configFromRecord(previous);
    for (const field of input.fields) merged[field.key] = { value: field.value, status: field.status, note: field.note, source: "Authenticated owner", version: RULE_VERSION };
    kind = "config";
    payload = { fields: configFields(merged), source: "Authenticated owner configuration", previousVersion: previous?.version || null, ruleVersion: RULE_VERSION } satisfies ConfigPayload;
  } else if (input.kind === "decision") {
    const [configuration, reviewRecord] = await Promise.all([latest(db, ownerId, "config"), readOwnedRecord(db, ownerId, input.review.token)]);
    if (reviewRecord.kind !== "review" || reviewRecord.contentHash !== await hashPayload(reviewRecord.payload)) throw new StoreError(409, "review_invalid", "This assessment review is invalid. Refresh and review the current assessment.");
    const reviewed = reviewRecord.payload as ReviewPayload;
    if (reviewed.instrumentId !== input.instrumentId || reviewed.asOf !== input.review.asOf || reviewed.configVersion !== input.review.configVersion || reviewed.assessmentHash !== input.review.assessmentHash) throw new StoreError(409, "review_mismatch", "The submitted review does not match the assessment issued for this instrument.");
    const age = Date.parse(now) - Date.parse(reviewed.asOf);
    if (!Number.isFinite(age) || age < 0 || age >= REVIEW_TTL_MS || Date.parse(now) >= Date.parse(reviewed.expiresAt)) throw new StoreError(409, "review_expired", "This assessment review has expired. Refresh and review the current assessment before saving.");
    if ((configuration?.version || null) !== reviewed.configVersion || reviewed.ruleVersion !== RULE_VERSION) throw new StoreError(409, "review_configuration_changed", "Configuration or rules changed after this assessment was reviewed. Refresh and review it again.");
    const config = configFromRecord(configuration);
    const inputVersion = reviewed.inputVersion;
    const assessment = evaluateReadiness({ instrumentId: input.instrumentId, now: reviewed.asOf, config, sourceInputVersion: inputVersion });
    if (await hashPayload(assessment) !== reviewed.assessmentHash) throw new StoreError(409, "review_assessment_changed", "The captured assessment no longer reproduces exactly. Refresh and review the current assessment.");
    const currentAssessment = evaluateReadiness({ instrumentId: input.instrumentId, now, config, sourceInputVersion: inputVersion });
    if (await hashPayload(assessmentConditions(currentAssessment)) !== await hashPayload(assessmentConditions(assessment))) throw new StoreError(409, "review_conditions_changed", "A session or assessment gate changed after this review. Refresh and review the current assessment.");
    const ownerDecision = createOwnerDecision(assessment, { id: crypto.randomUUID(), recordedAt: now, decision: input.decision, thesis: input.thesis, executionRationale: input.executionRationale });
    kind = "decision";
    payload = {
      assessment, ownerDecision, evidence: [], inputVersion, inputHash: await hashPayload({ instrumentId: input.instrumentId, config, now: reviewed.asOf, bars: null, positions: null }),
      review: input.review, reviewedAt: reviewed.asOf, configVersion: reviewed.configVersion, configSnapshot: config, portfolioVersion: reviewed.portfolioVersion,
      ruleVersion: RULE_VERSION, rulebookSnapshot: RULEBOOK, mappingVersions: [],
      evidenceState: "No verified runtime market/position evidence attached to this assessment. Chat research is not current execution evidence.",
      independence: "J and Strata can share evidence; agreement is not an independent confirmation.",
    };
  } else if (input.kind === "refresh") {
    kind = "refresh";
    payload = {
      id: crypto.randomUUID(), sourceId: input.sourceId, requestedAt: now, completedAt: now,
      state: "unavailable", path: "hosted-request", accountScope: null, action: "Runtime refresh availability check",
      attemptedProviderRead: false, lastGoodAt: null,
      error: "No production runtime adapter is configured for this source in Round 1. Existing chat-native receipts remain separately timestamped research; this action does not refresh them.",
      ownerNote: input.note || null,
    };
  } else {
    if (input.observedAt && Date.parse(input.observedAt) > Date.parse(now)) throw new StoreError(400, "future_observation", "Imported observation time cannot be in the future.");
    const previous = await latest(db, ownerId, "portfolio");
    kind = "portfolio";
    payload = {
      schemaVersion: "r1-private-portfolio-import", source: input.sourceLabel, importedAt: now, observedAt: input.observedAt,
      previousVersion: previous?.version || null, reconciliationState: "not-reconciled", sourceFormat: "manual/import", lineCount: input.rows.length,
      pies: PIE_NAMES.map((name, pieIndex) => ({
        id: `import-pie-${pieIndex}`, name, targetTotalPct: 100, accountCapital: null, wholeAccountWeightPct: null, brokerPieId: null,
        lines: input.rows.filter(row => row.pie === name).map((row, rowIndex) => ({
          id: `import-${pieIndex}-${rowIndex}`, displayedLabel: row.label,
          observedAllocationPct: row.observedWeight, intendedTargetWeightPct: row.targetWeight,
          observedCapturedAt: input.observedAt, observedSourceId: input.sourceLabel,
          quantity: null, monetaryValue: null, brokerReconciledHolding: null, identityStatus: "unresolved",
        })),
      })),
    };
  }
  const row = await newRow(ownerId, kind, payload, now, input.requestId || null);
  if (input.kind === "decision") {
    const result = await insertReviewedDecision(db, row, input.review.configVersion).run();
    if (result.meta.changes !== 1) throw new StoreError(409, "review_configuration_changed", "Configuration changed while this decision was being saved. Refresh and review the current assessment.");
  } else await insert(db, row).run();
  return expose(row);
}
