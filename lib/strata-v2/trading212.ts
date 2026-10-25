import { env } from "cloudflare:workers";
import {z} from 'zod';
import {TRADING212_COVERAGE} from './source-policy';

const API_ROOTS = { demo: "https://demo.trading212.com/api/v0", live: "https://live.trading212.com/api/v0" } as const;
export type Trading212Environment = keyof typeof API_ROOTS;
export type Trading212ReadResult = { environment: Trading212Environment; accountSummary: unknown; cash: unknown; positions: unknown; orders: unknown; instruments: unknown;state:'loaded'|'partial';errors:{part:string;error:string}[] };
type ReadError = { status: number; code: string; message: string };
export function trading212Status(){const e=env as unknown as Record<string,unknown>;return {provider:'Trading 212',credentialsConfigured:typeof e.TRADING212_API_KEY==='string'&&!!e.TRADING212_API_KEY&&typeof e.TRADING212_API_SECRET==='string'&&!!e.TRADING212_API_SECRET,environment:e.TRADING212_ENVIRONMENT==='demo'||e.TRADING212_ENVIRONMENT==='live'?e.TRADING212_ENVIRONMENT:null,readOnly:true,hostedReadVerified:false,automaticEnvironmentFallback:false,coverage:TRADING212_COVERAGE};}

function credentials(): { key: string; secret: string } {
  const values = env as unknown as Record<string, unknown>;
  const key = values.TRADING212_API_KEY, secret = values.TRADING212_API_SECRET;
  if (typeof key !== "string" || !key || typeof secret !== "string" || !secret) throw { status: 503, code: "credentials_unconfigured", message: "Trading 212 credentials are not configured." } satisfies ReadError;
  return { key, secret };
}
async function readJson(root: string, path: string, auth: string): Promise<unknown> {
  const response = await fetch(`${root}${path}`, {method:'GET',headers: { Authorization: auth, Accept: "application/json" },signal:AbortSignal.timeout(15000),redirect:'error'});
  if (!response.ok) throw { status: response.status, code: `trading212_http_${response.status}`, message: `Trading 212 returned HTTP ${response.status}.` } satisfies ReadError;
  return response.json();
}
export async function readTrading212(environment: Trading212Environment | "auto" = "auto"): Promise<Trading212ReadResult> {
  const { key, secret } = credentials();
  const auth = `Basic ${btoa(`${key}:${secret}`)}`;
  const configured=trading212Status().environment as Trading212Environment|null;
  if(environment==='auto'&&!configured)throw {status:409,code:'environment_unresolved',message:'Select Live or Demo explicitly. No environment is chosen automatically.'} satisfies ReadError;
  const candidates: Trading212Environment[] = [environment==='auto'?configured!:environment];
  let lastError: ReadError | null = null;
  for (const candidate of candidates) {
    try {
      const root = API_ROOTS[candidate];
      const accountSummary = z.object({id:z.number().finite(),currency:z.string(),cash:z.object({}).passthrough().optional()}).passthrough().parse(await readJson(root, "/equity/account/summary", auth));
      const reads = await Promise.allSettled([readJson(root, "/equity/positions", auth), readJson(root, "/equity/orders", auth), readJson(root, "/equity/metadata/instruments", auth)]);
      const cash=accountSummary.cash??null;
      const errors:{part:string;error:string}[]=[];
      const schemas=[z.array(z.object({instrument:z.object({ticker:z.string(),name:z.string()}).passthrough(),quantity:z.number().finite(),currentPrice:z.number().finite()}).passthrough()).max(20000),z.array(z.object({}).passthrough()).max(10000),z.array(z.object({ticker:z.string(),name:z.string()}).passthrough()).max(50000)];
      const parts=reads.map((r,i)=>{const part=['positions','orders','instruments'][i];if(r.status==='rejected'){const e=r.reason as Partial<ReadError>;errors.push({part,error:e.code?e.message||'Provider read failed.':'Provider network read failed.'});return null;}const checked=schemas[i].safeParse(r.value);if(!checked.success){errors.push({part,error:'Response failed the '+part+' contract.'});return null;}return checked.data;});
      return { environment: candidate, accountSummary, cash, positions:parts[0],orders:parts[1],instruments:parts[2],state:errors.length?'partial':'loaded',errors };
    } catch (error) { const e=error as Partial<ReadError>;lastError={status:e.status&&e.status>=400&&e.status<=599?e.status:502,code:e.code||'trading212_read_failed',message:e.code?e.message||'Trading 212 read failed.':'Trading 212 network or response validation failed.'};throw lastError; }
  }
  throw lastError ?? { status: 401, code: "trading212_auth_failed", message: "Trading 212 authentication failed." };
}
