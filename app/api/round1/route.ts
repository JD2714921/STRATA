import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import { readMutation, requireOwnerId, StoreError } from "../../../lib/round1-store-contracts";
import type { RecordKind } from "../../../lib/round1-store-contracts";
import { issueReviewAssessments, readOwnedHistory, readOwnedRecord, readPrivateState, savePrivateMutation } from "../../../lib/round1-store";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, oai-authenticated-user-id", "X-Content-Type-Options": "nosniff" };

function database(): D1Database {
  if (!env.DB) throw new StoreError(503, "storage_unavailable", "Private D1 storage is unavailable. No durable save occurred.");
  return env.DB;
}

function errorResponse(error: unknown): Response {
  if (error instanceof StoreError) return Response.json({ error: error.message, code: error.code }, { status: error.status, headers });
  return Response.json({ error: "Private storage could not complete this operation. Preserve your unsaved input and retry after checking Data Health.", code: "storage_error" }, { status: 503, headers });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const ownerId = requireOwnerId((await getChatGPTUser())?.userId);
    const params = new URL(request.url).searchParams;
    const recordId = params.get("recordId");
    if (recordId) {
      if (!/^[0-9a-f-]{36}$/i.test(recordId)) throw new StoreError(400, "invalid_record_id", "Invalid record identifier.");
      return Response.json({ record: await readOwnedRecord(database(), ownerId, recordId) }, { headers });
    }
    const kind = params.get("history");
    if (kind) {
      if (!["config", "portfolio", "decision", "refresh", "rule"].includes(kind)) throw new StoreError(400, "invalid_history_kind", "Unknown record kind.");
      const before = params.get("before");
      if (before && (!/^\d{4}-\d{2}-\d{2}T/.test(before) || !Number.isFinite(Date.parse(before)))) throw new StoreError(400, "invalid_cursor", "History cursor must be an ISO timestamp.");
      return Response.json({ records: await readOwnedHistory(database(), ownerId, kind as RecordKind, before), limit: 100 }, { headers });
    }
    const db = database();
    const state = await readPrivateState(db, ownerId);
    const reviews = await issueReviewAssessments(db, ownerId, state.serverTime, state);
    return Response.json({ ...state, reviews }, { headers });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const ownerId = requireOwnerId((await getChatGPTUser())?.userId);
    const input = await readMutation(request);
    const record = await savePrivateMutation(database(), ownerId, input);
    return Response.json({ record }, { status: 201, headers });
  } catch (error) { return errorResponse(error); }
}
