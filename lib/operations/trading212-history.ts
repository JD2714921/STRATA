import {z} from 'zod';
import {OperationError} from './contracts';
const page=z.object({items:z.array(z.record(z.unknown())).max(100),nextPagePath:z.string().nullable()}).passthrough();
export type HistoryKind='orders'|'transactions'|'dividends';
/** GET-only exact paths. Continuation URLs cannot redirect credentials to another host or API. */
export async function readHistory(options:{environment:'live'|'demo';key:string;secret:string;kind:HistoryKind;cursor?:string|null;fetcher?:typeof fetch;maxPages?:number;now?:()=>number}){
 const root=`https://${options.environment}.trading212.com`,base='/api/v0/equity/history/'+options.kind,fetcher=options.fetcher||fetch;
 let path=options.cursor||base+'?limit=50';const seen=new Set<string>(),items:Record<string,unknown>[]=[],clock=options.now||Date.now;
 const retryAt=(r:Response)=>{const reset=Number(r.headers.get('x-ratelimit-reset')),seconds=Number(r.headers.get('retry-after'));return new Date(Number.isFinite(reset)&&reset>0?reset*1000:clock()+(seconds>0?seconds:60)*1000).toISOString();};
 for(let i=0;i<(options.maxPages??5);i++){
  const u=new URL(path,root);if(u.origin!==root||u.pathname!==base||u.hash||u.username||u.password)throw new OperationError('unsafe_cursor','History cursor escaped the authorised GET endpoint');
  if([...u.searchParams.keys()].some(k=>!['limit','cursor','ticker','time'].includes(k)))throw new OperationError('unsafe_cursor','Unexpected history cursor parameter');
  if(seen.has(u.href))throw new OperationError('cursor_loop','Provider repeated a continuation cursor');seen.add(u.href);
  const response=await fetcher(u.href,{method:'GET',headers:{Authorization:'Basic '+btoa(options.key+':'+options.secret),Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(response.status===429||response.status>=500)return {items,complete:false,nextPagePath:path,retryAt:retryAt(response),error:'Provider rate limit / transient error'};
  if(!response.ok)throw new OperationError('history_http_'+response.status,'Trading 212 history read rejected');
  const p=page.parse(await response.json());items.push(...p.items);if(p.nextPagePath===null)return {items,complete:true,nextPagePath:null,retryAt:null,error:null};
  path=p.nextPagePath;
  if(response.headers.get('x-ratelimit-remaining')==='0')return {items,complete:false,nextPagePath:path,retryAt:retryAt(response),error:'Rate-limit budget exhausted; durable continuation required'};
 }
 return {items,complete:false,nextPagePath:path,retryAt:null,error:'Bounded page batch exhausted; continue from durable cursor'};
}
