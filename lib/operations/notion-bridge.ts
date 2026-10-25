import {z} from 'zod';
import destination from '../../data/operations/notion-destination.json';
import {OperationsStore} from './store';
import {OperationError,instant} from './contracts';
import type {notionShape} from './ledger';
const request=z.object({key:z.string().min(1).max(500),dataSource:z.string(),schema:z.record(z.string()),schemaReadAt:instant,foundPageUrls:z.array(z.string().url()).max(2)}).strict();
function notionUrl(value:string){const u=new URL(value);return u.protocol==='https:'&&['notion.so','www.notion.so','app.notion.com'].includes(u.hostname);}
/** A cloud task uses its own authorised Notion MCP connection. No session token is copied into the Site. */
export async function prepareNativeNotionWrite(store:OperationsStore,raw:unknown,now:string){
 const x=request.parse(raw),lock=await store.lease('notion-claim',now);
 try{
  const row=await store.db.prepare('SELECT * FROM operation_outbox WHERE owner_id=? AND record_key=?').bind(store.owner,x.key).first<{state:string;payload:string;desired_hash:string;remote_id:string|null}>();if(!row)throw new OperationError('missing_outbox','Outbox item unavailable');
  const shape=JSON.parse(row.payload) as ReturnType<typeof notionShape>,db=destination.databases[shape.kind];if(db.id!==x.dataSource)throw new OperationError('notion_destination','Write target differs from the authorised Strata data source');
  if(Date.parse(x.schemaReadAt)>Date.parse(now)||Date.parse(now)-Date.parse(x.schemaReadAt)>300000)throw new OperationError('notion_schema_stale','Fetch current destination schema before writing');
  for(const [name,type] of Object.entries(db.properties))if(x.schema[name]!==type)throw new OperationError('notion_schema','Missing or changed Notion property: '+name);
  if(x.foundPageUrls.some(u=>!notionUrl(u))||x.foundPageUrls.length>1)throw new OperationError('notion_duplicate','Conflicting or invalid destination lookup');
  if(row.state==='done')return {action:'none',remoteId:row.remote_id};
  if(row.remote_id&&x.foundPageUrls[0]&&row.remote_id!==x.foundPageUrls[0])throw new OperationError('notion_duplicate','Lookup conflicts with the saved page reference; reconcile identity before writing');
  const remote=row.remote_id||x.foundPageUrls[0]||null;if(!remote&&['writing','uncertain'].includes(row.state))throw new OperationError('notion_uncertain','Uncertain create must be found or manually reconciled before another create');
  if(shape.kind!=='daily'){const parent=await store.db.prepare('SELECT state,remote_id FROM operation_outbox WHERE owner_id=? AND record_key=?').bind(store.owner,'daily:'+shape.dailyKey).first<{state:string;remote_id:string|null}>();if(!parent?.remote_id||parent.state!=='done')throw new OperationError('notion_dependency','Write the daily parent record first',true);shape.properties['Daily log']=[parent.remote_id];}
  const claimToken=crypto.randomUUID();await store.db.prepare('UPDATE operation_outbox SET state=?,claim_token=?,updated_at=? WHERE owner_id=? AND record_key=?').bind('writing',claimToken,now,store.owner,x.key).run();
  return {action:remote?'update':'create',key:x.key,dataSource:db.id,remoteId:remote,claimToken,desiredHash:row.desired_hash,properties:shape.properties,content:shape.content,requiresActualNotionToolWrite:true,notionWriteVerified:false};
 }finally{await store.release(lock);}
}
const receipt=z.object({key:z.string().min(1),claimToken:z.string().uuid(),desiredHash:z.string().regex(/^[a-f0-9]{64}$/),remoteUrl:z.string().url().nullable(),outcome:z.enum(['written','not-sent','uncertain']),toolReceiptId:z.string().min(1).max(200)}).strict();
export async function finishNativeNotionWrite(store:OperationsStore,raw:unknown,now:string){
 const r=receipt.parse(raw);if(r.remoteUrl&&!notionUrl(r.remoteUrl))throw new OperationError('invalid_notion_receipt','Receipt is not a Notion page URL');if(r.outcome==='written'&&!r.remoteUrl)throw new OperationError('missing_notion_receipt','Written result requires the actual page URL');
 const row=await store.db.prepare('SELECT desired_hash,state,claim_token,remote_id FROM operation_outbox WHERE owner_id=? AND record_key=?').bind(store.owner,r.key).first<{desired_hash:string;state:string;claim_token:string|null;remote_id:string|null}>();if(!row)throw new OperationError('missing_outbox','Unknown outbox record');if(row.state==='done'&&row.claim_token===r.claimToken)return {state:'done',remoteId:row.remote_id};if(row.claim_token!==r.claimToken)throw new OperationError('notion_claim_mismatch','Receipt belongs to a different write reservation');
 const state=r.outcome==='written'?(row.desired_hash===r.desiredHash?'done':'pending'):r.outcome==='not-sent'?'pending':'uncertain';
 await store.db.prepare('UPDATE operation_outbox SET state=?,remote_id=COALESCE(?,remote_id),error=?,updated_at=? WHERE owner_id=? AND record_key=? AND claim_token=?').bind(state,r.remoteUrl,r.outcome==='written'?null:'Native Notion write '+r.outcome,now,store.owner,r.key,r.claimToken).run();await store.append('notion-write-receipt',r.key,{...r,state,recordedAt:now,verification:'Authenticated cloud-task tool receipt; not independently fetched by the Site'},now);return {state,remoteId:r.remoteUrl};
}
