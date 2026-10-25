import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {requireOwnerId,StoreError,validateMutationRequest} from '../../../lib/round1-store-contracts';
import {saveHistorical,historicalHistory,compareHistorical} from '../../../lib/historical/private-store';
import {loadOutput,loadDataset} from '../../../lib/historical/catalog';
import manifest from '../../../data/historical/manifest.json';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0',Vary:'Cookie, oai-authenticated-user-id','X-Content-Type-Options':'nosniff'};
function db(){if(!env.DB)throw new StoreError(503,'storage_unavailable','Private durable storage unavailable.');return env.DB;}
function failure(error:unknown){return error instanceof StoreError?Response.json({error:error.message,code:error.code},{status:error.status,headers}):Response.json({error:'Historical calculation read failed. Last saved outputs are preserved.',code:'history_failed'},{status:503,headers});}
export async function GET(request:Request){try{
 const owner=requireOwnerId((await getChatGPTUser())?.userId),p=new URL(request.url).searchParams,kind=p.get('kind')||'manifest',id=p.get('datasetId')||'',page=Number(p.get('page')||0),size=50;
 if(!Number.isInteger(page)||page<0||page>10000)throw new StoreError(400,'invalid_page','Invalid page.');
 if(kind==='manifest')return Response.json({manifest},{headers});
 if(kind==='history')return Response.json({records:await historicalHistory(db(),owner,p.get('recordId')||undefined)},{headers});
 if(!manifest.datasets.some(x=>x.id===id))throw new StoreError(400,'invalid_dataset','Select a known historical dataset.');
 if(p.has('inputHash')&&p.get('inputHash')!==manifest.datasets.find(x=>x.id===id)?.inputHash)throw new StoreError(409,'historical_version_changed','This reference belongs to a different input version. Restore its saved source version to replay it.');
 if(kind==='compare')return Response.json(await compareHistorical(id),{headers});
 let rows:unknown[]=[],gateDictionary:string[]|null=null;
 if(kind==='features'){const output=await loadOutput(id) as {features:unknown[]};rows=output.features;}
 else if(kind==='bars')rows=(await loadDataset(id)).candles;
 else if(kind==='events')rows=(await loadOutput('events') as {instrumentId:string}[]).filter(x=>x.instrumentId===manifest.datasets.find(x=>x.id===id)!.instrumentId);
 else if(kind==='replay'||kind==='confluence'){const data=await loadOutput(kind) as {id:string;rows:unknown[];gateDictionary?:string[]}[];const entry=data.find(x=>x.id===id);rows=entry?.rows||[];gateDictionary=entry?.gateDictionary||null;}
 else if(kind==='comparisons'){const data=await loadOutput('comparisons') as {id:string;a:string;b:string;correlation:unknown[];smt:unknown[]}[];rows=data.filter(x=>x.a===id||x.b===id).map(x=>({id:x.id,pair:[x.a,x.b],latest:x.correlation.at(-1),rollingRows:x.correlation.length,smtCount:x.smt.length,recentSMT:x.smt.slice(-5)}));}
 else throw new StoreError(400,'invalid_kind','Unknown historical view.');
 return Response.json({kind,datasetId:id,page,total:rows.length,size,rows:rows.slice(page*size,page*size+size),gateDictionary,state:rows.length?'loaded':'empty',basis:'CMC source mid/bid/ask bars; bar-open anchoring is an unverified research assumption.'},{headers});
 }catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const owner=requireOwnerId((await getChatGPTUser())?.userId);validateMutationRequest(request);const reader=request.body?.getReader();if(!reader)throw new StoreError(400,'empty_request','Request required.');let bytes=0;const chunks:Uint8Array[]=[];while(true){const n=await reader.read();if(n.done)break;bytes+=n.value.length;if(bytes>8000){await reader.cancel();throw new StoreError(413,'request_too_large','Historical request exceeds 8KB.');}chunks.push(n.value);}const b=new Uint8Array(bytes);let offset=0;for(const c of chunks){b.set(c,offset);offset+=c.length;}let raw:unknown;try{raw=JSON.parse(new TextDecoder().decode(b));}catch{throw new StoreError(400,'invalid_json','Valid JSON required.');}
 return Response.json({record:await saveHistorical(db(),owner,raw)},{status:201,headers});
 }catch(e){return failure(e);}}
