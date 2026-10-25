import { z } from "zod";
import { REQUIRED_CONFIG_KEYS } from "./strata-v2/rules";
import type { StrataAssessment } from "./strata-v2/contracts";

export const CONFIG_KEYS = [...REQUIRED_CONFIG_KEYS, "timezone", "indicatorInterpretation", "russellConfirmation", "nqConfirmation"] as const;
export const PIE_NAMES = ["The Consumer", "The Spine", "The Ingredients", "The Ninjas", "The NWO"] as const;
export const SOURCE_IDS = ["cmc", "financial-datasets", "bigdata", "trading212", "newsify", "official"] as const;
const shortText = z.string().trim().min(1).max(240);
const note = z.string().trim().max(4000);
const instant = z.string().datetime({ offset: true });
const requestId = z.string().uuid().optional();
export const reviewBindingSchema = z.object({
  token: z.string().uuid(),
  asOf: instant,
  configVersion: z.string().min(1).max(160).nullable(),
  assessmentHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();
export type ReviewBinding = z.infer<typeof reviewBindingSchema>;
export interface IssuedReview extends ReviewBinding {
  expiresAt: string;
  assessment: StrataAssessment;
}

export const configFieldSchema = z.object({
  key: z.enum(CONFIG_KEYS),
  value: z.string().trim().max(4000).nullable(),
  status: z.enum(["confirmed", "proposed", "missing"]),
  note: note.optional(),
}).strict().superRefine((field, ctx) => {
  if (field.status !== "missing" && !field.value) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Confirmed/proposed fields require a non-empty definition." });
  if (field.status === "missing" && field.value !== null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Missing fields must have a null value." });
});

export const portfolioImportRowSchema = z.object({
  pie: z.enum(PIE_NAMES), label: shortText,
  targetWeight: z.number().finite().min(0).max(100),
  observedWeight: z.number().finite().min(0).max(100).nullable(),
}).strict();
const importSchema = z.object({
  kind: z.literal("import"), requestId, sourceLabel: shortText,
  observedAt: instant.nullable(), rows: z.array(portfolioImportRowSchema).min(5).max(500),
}).strict();

/** No ownerId, assessment, fresh, verified, position count or readiness flags are accepted. */
export const round1MutationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("config"), requestId, fields: z.array(configFieldSchema).min(1).max(CONFIG_KEYS.length) }).strict(),
  z.object({ kind: z.literal("decision"), requestId, instrumentId: z.enum(["GOLD_CASH", "SILVER_CASH", "SUGAR_RAW_CASH", "CRUDE_OIL_CASH", "NQ"]), review: reviewBindingSchema, decision: z.enum(["agree", "disagree", "wait"]), thesis: z.string().trim().min(1).max(4000), executionRationale: note }).strict(),
  z.object({ kind: z.literal("refresh"), requestId, sourceId: z.enum(SOURCE_IDS), note: note.optional() }).strict(),
  importSchema,
  z.object({ kind: z.literal("seed"), requestId }).strict(),
]).superRefine((input, ctx) => {
  if (input.kind === "config" && new Set(input.fields.map(f => f.key)).size !== input.fields.length) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Configuration keys must be unique." });
  if (input.kind === "import") {
    const seen = new Set<string>();
    for (const row of input.rows) {
      const key = `${row.pie}:${row.label.toLocaleLowerCase("en-GB")}`;
      if (seen.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate holding in ${row.pie}.` });
      seen.add(key);
    }
    for (const pie of PIE_NAMES) {
      const total = input.rows.filter(row => row.pie === pie).reduce((sum, row) => sum + row.targetWeight, 0);
      if (Math.abs(total - 100) > 0.000001) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${pie} target weights must total 100%; found ${total}.` });
    }
  }
});

export type Round1Mutation = z.infer<typeof round1MutationSchema>;
export type ConfigInputField = z.infer<typeof configFieldSchema>;
export type RecordKind = "config" | "portfolio" | "decision" | "refresh" | "rule" | "review" | "historical";
export interface VersionRecord<T = unknown> {
  id: string; kind: RecordKind; version: string; createdAt: string; payload: T; contentHash: string;
}
export interface PrivateState {
  storage: "durable"; config: VersionRecord | null; portfolio: VersionRecord | null;
  decisions: VersionRecord[]; refreshes: VersionRecord[]; rule: VersionRecord | null;
  serverTime: string; historyLimit: number;
}

export class StoreError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}

export function requireOwnerId(value: string | null | undefined): string {
  if (!value || !value.trim() || value.length > 512) throw new StoreError(401, "authentication_required", "Sign in with ChatGPT to access private durable records.");
  return value;
}

/** Browser writes are same-origin JSON only; service bypass is not a user identity. */
export function validateMutationRequest(request: Request): void {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (!origin || origin !== new URL(request.url).origin || (fetchSite && fetchSite !== "same-origin")) throw new StoreError(403, "origin_rejected", "Private changes must be submitted from this Site.");
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type") || "")) throw new StoreError(415, "json_required", "Use an application/json request.");
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > 256_000) throw new StoreError(413, "payload_too_large", "This request exceeds the bounded import limit.");
}

export async function readMutation(request: Request): Promise<Round1Mutation> {
  validateMutationRequest(request);
  const reader = request.body?.getReader();
  if (!reader) throw new StoreError(400, "invalid_json", "Request body is required.");
  const chunks: Uint8Array[] = []; let bytes = 0;
  while (true) {
    const next = await reader.read(); if (next.done) break;
    bytes += next.value.byteLength;
    if (bytes > 256_000) { await reader.cancel(); throw new StoreError(413, "payload_too_large", "This request exceeds the bounded import limit."); }
    chunks.push(next.value);
  }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder().decode(body)); } catch { throw new StoreError(400, "invalid_json", "Request must contain valid JSON."); }
  const parsed = round1MutationSchema.safeParse(raw);
  if (!parsed.success) throw new StoreError(400, "invalid_request", parsed.error.issues.map(issue => issue.message).slice(0, 8).join(" "));
  return parsed.data;
}
