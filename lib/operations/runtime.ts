import {env} from 'cloudflare:workers';
import {readTrading212,trading212Status} from '../strata-v2/trading212';
import {readHistory,type HistoryKind} from './trading212-history';
import {normaliseTrading212,exactNumber} from './trading212-normalise';
import {hashPayload} from '../round1-store';
import {OperationsStore} from './store';
import {OperationError,decimal,type LedgerInput,type LedgerEvent} from './contracts';

export async function dashboardRead(environment:'live'|'demo'){return readTrading212(environment);}
/** Accounting-only reads never write the on-command dashboard snapshot. */
export async function accountingRead(store:OperationsStore,cutoffAt:string):Promise<LedgerInput>{
 const status=trading212Status(),secrets=env as unknown as Record<string,string|undefined>,now=new Date().toISOString();
 if(!status.credentialsConfigured||!status.environment)return {events:[],snapshots:[],coverage:{cmcClosedHistory:false,trading212History:false,paginationComplete:false},cursor:null,issues:['Trading 212 hosted credentials/environment absent: BLOCKED / NOT RECONCILED','CMC current positions do not establish closed-trade history; full activity source required']};
 const accountLock=await store.lease('trading212-accounting',now);
 try{
  const root=`https://${status.environment}.trading212.com`,headers={Authorization:'Basic '+btoa(secrets.TRADING212_API_KEY+':'+secrets.TRADING212_API_SECRET),Accept:'application/json'};
  const r=await fetch(root+'/api/v0/equity/account/summary',{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new OperationError('accounting_account','Trading 212 account read unavailable',r.status===429||r.status>=500);
  const summary=await r.json() as {id?:number;currency?:string;totalValue?:number};if(!Number.isSafeInteger(summary.id))throw new OperationError('account_scope','No safely resolved Trading 212 account');
  const accountRef='t212-'+(await hashPayload(String(summary.id))).slice(0,16),cursorRecord=await store.latest('history-cursor','trading212:'+cutoffAt),cursors=JSON.parse(cursorRecord?.value.cursor||'{}') as Partial<Record<HistoryKind,{path:string|null;complete:boolean}>>;
  const events:LedgerEvent[]=[],issues=['CMC closed history is not exposed by the inspected connection; NOT RECONCILED'];let pagesComplete=true,mappingComplete=true;const next:Partial<Record<HistoryKind,{path:string|null;complete:boolean}>>={};
  for(const kind of ['orders','transactions','dividends'] as const){
   if(cursors[kind]?.complete){next[kind]=cursors[kind];continue;}
   const read=await readHistory({environment:status.environment as 'live'|'demo',key:secrets.TRADING212_API_KEY!,secret:secrets.TRADING212_API_SECRET!,kind,cursor:cursors[kind]?.path,maxPages:1}),receivedAt=new Date().toISOString();const converted=normaliseTrading212(kind,read.items,accountRef,receivedAt);events.push(...converted.events);pagesComplete&&=read.complete;mappingComplete&&=converted.complete;next[kind]={path:read.nextPagePath,complete:read.complete};if(read.error)issues.push(kind+': '+read.error);if(converted.unmapped.length)issues.push(kind+': '+converted.unmapped.length+' unclassified source records retained');await store.append('broker-raw-history',cutoffAt+':'+kind+':'+(cursors[kind]?.path||'head'),{items:read.items,unmapped:converted.unmapped,receivedAt,complete:read.complete,nextPagePath:read.nextPagePath},receivedAt);
  }
  const pos=await fetch(root+'/api/v0/equity/positions',{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(15000)}),positions=pos.ok?await pos.json():null;
  const number=(x:unknown)=>{if(typeof x!=='number')return null;const value=exactNumber(x);if(value!==null&&decimal.safeParse(value).success)return value;issues.push('Unsupported source numeric precision retained in raw accounting evidence; derived field unavailable');return null;};
  const holdings=Array.isArray(positions)?positions.map(p=>({instrument:p.instrument?.name||p.instrument?.ticker||'Unresolved holding',productType:null,direction:null,quantity:number(p.quantity),entry:number(p.averagePricePaid),unrealisedPnl:number(p.walletImpact?.unrealizedProfitLoss),evaluationAt:null,sourceId:'trading212-positions-accounting'})):null;
  const accountReceivedAt=new Date().toISOString();await store.append('broker-raw-accounting',cutoffAt,{summary,positions,receivedAt:accountReceivedAt,observedAt:null},accountReceivedAt);
  // The ledger procedure commits this continuation only AFTER financial rows are durable.
  return {events,snapshots:[{broker:'Trading 212',accountRef,observedAt:null,receivedAt:accountReceivedAt,currency:summary.currency??null,cash:null,valuation:number(summary.totalValue),unrealisedPnl:null,positions:holdings,complete:Array.isArray(positions),sourceId:'trading212-accounting-summary'}],coverage:{cmcClosedHistory:false,trading212History:pagesComplete&&mappingComplete,paginationComplete:pagesComplete},cursor:JSON.stringify(next),issues:[...issues,'Provider quote/evaluation timestamps and total-cash semantics unavailable; receipt time is not an exact 16:45 valuation']};
 }finally{await store.release(accountLock);}
}
