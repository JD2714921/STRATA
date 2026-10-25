import {getChatGPTUser} from '../../chatgpt-auth';
import {requireOwnerId,StoreError} from '../../../lib/round1-store-contracts';
import {loadRound2} from '../../../lib/historical/round2-catalog';
import manifest from '../../../data/round2/manifest.json';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store, max-age=0',Vary:'Cookie, oai-authenticated-user-id','X-Content-Type-Options':'nosniff'};
type Comparison={a:string;b:string;timeframe:number;rows:unknown[];latestSMT:unknown[];relationship:string;timingVerified:boolean};
type DatasetOutput={summary:unknown;features:unknown[];bindings:unknown[];elastication:{rows:unknown[]};gaps:unknown[];chart:unknown[]};
export async function GET(request:Request){try{
 requireOwnerId((await getChatGPTUser())?.userId);
 const p=new URL(request.url).searchParams,kind=p.get('kind')||'manifest',id=p.get('datasetId')||'',page=Number(p.get('page')||0),size=50;
 if(!Number.isInteger(page)||page<0||page>10000)throw new StoreError(400,'invalid_page','Invalid page');
 if(kind==='manifest')return Response.json({manifest},{headers});
 if(kind==='events')return Response.json({data:await loadRound2(kind)},{headers});
 if(kind==='comparisons'){const pairs=await loadRound2(kind) as Comparison[];return Response.json({data:pairs.map(x=>({...x,rows:undefined,rollingRowCount:x.rows.length,latest:x.rows.at(-1)}))},{headers});}
 if(!manifest.datasets.some(x=>x.id===id))throw new StoreError(400,'invalid_dataset','Select a known Round 2 dataset');
 const output=await loadRound2(id) as DatasetOutput;
 if(kind!=='features'&&kind!=='bindings'&&kind!=='elastication'&&kind!=='gaps'&&kind!=='chart')throw new StoreError(400,'invalid_kind','Unknown view');
 const rows=kind==='elastication'?output.elastication.rows:output[kind];
 const ed=output.elastication;
 return Response.json({datasetId:id,kind,page,size,total:rows.length,summary:output.summary,rows:rows.slice(page*size,page*size+size),chart:kind==='gaps'?undefined:output.chart.slice(page*size,page*size+size),elastication:kind==='elastication'?{...ed,rows:undefined}:undefined,state:'STAND DOWN',canSubmitOrder:false},{headers});
 }catch(e){if(e instanceof StoreError)return Response.json({error:e.message,code:e.code},{status:e.status,headers});return Response.json({error:'Execution history unavailable; no confluence inferred',code:'history_unavailable'},{status:503,headers});}}
