import { getChatGPTUser } from "../../chatgpt-auth";
import { readTrading212,trading212Status, type Trading212Environment } from "../../../lib/strata-v2/trading212";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store, max-age=0",Vary:'Cookie, oai-authenticated-user-id', "X-Content-Type-Options": "nosniff" };
export async function GET(request: Request): Promise<Response> {
  const user = await getChatGPTUser();
  if (!user?.userId) return Response.json({ ok: false, error: "Authentication required.", code: "unauthenticated" }, { status: 401, headers });
  const operation=new URL(request.url).searchParams.get('operation')||'status';
  if(operation==='status')return Response.json(trading212Status(),{headers});
  if(operation!=='account')return Response.json({error:'Unknown read operation.',code:'invalid_operation'},{status:400,headers});
  const requested = new URL(request.url).searchParams.get("environment") ?? "auto";
  if (!["auto", "demo", "live"].includes(requested)) return Response.json({ ok: false, error: "Invalid Trading 212 environment.", code: "invalid_environment" }, { status: 400, headers });
  try { return Response.json({ ok: true, ...(await readTrading212(requested as Trading212Environment | "auto")),receivedAt:new Date().toISOString(),priceObservedAt:null,reconciled:false,readOnly:true,priceNote:'Position opening time and receipt time are not price observation timestamps; no general quote or bar feed is verified.' }, { headers }); }
  catch (error) { const safe = error as { status?: number; code?: string; message?: string }; return Response.json({ ok: false, error: safe.message ?? "Trading 212 read-only connection failed.", code: safe.code ?? "trading212_error" }, { status: safe.status ?? 502, headers }); }
}
