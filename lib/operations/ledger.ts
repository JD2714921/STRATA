import {eventSchema,ledgerInputSchema,OperationError,type LedgerEvent,type LedgerInput} from './contracts';
import {localParts,localInstants} from './schedule';
import {OperationsStore} from './store';
import {hashPayload} from '../round1-store';

export const eventKey=(e:LedgerEvent)=>`${e.broker}:${e.accountRef}:${e.grain}:${e.eventId}`;
/** Exact decimal addition. Never aggregate unlike currencies or invent FX conversion. */
export function addDecimal(a:string,b:string){const scale=Math.max((a.split('.')[1]||'').length,(b.split('.')[1]||'').length);const integer=(s:string)=>{const negative=s.startsWith('-'),[whole,fraction='']=s.replace(/^-/,'').split('.');return BigInt(whole+fraction.padEnd(scale,'0'))*(negative?BigInt(-1):BigInt(1));};const sum=integer(a)+integer(b),negative=sum<BigInt(0),raw=(negative?-sum:sum).toString().padStart(scale+1,'0');return (negative?'-':'')+(scale?raw.slice(0,-scale)+'.'+raw.slice(-scale):raw);}
export function monetarySummary(events:LedgerEvent[]){const totals:Record<string,Record<string,string>>={};for(const e of events.filter(e=>e.status==='confirmed')){if(!e.currency)continue;const add=(kind:string,v:string|null)=>{if(v===null)return;const k=e.broker+' / '+e.currency;totals[k]??={};totals[k][kind]=totals[k][kind]===undefined?v:addDecimal(totals[k][kind],v);};if(['deposit','withdrawal','dividend','fee'].includes(e.category))add(e.category,e.amount);add('fees',e.fees);add('realisedPnl',e.realisedPnl);}return totals;}
export function notionShape(kind:'transaction'|'snapshot'|'daily',key:string,payload:Record<string,unknown>){
 const event=payload as Partial<LedgerEvent>,at=String(payload.cutoffAt||payload.observedAt||payload.effectiveAt||payload.receivedAt);
 const properties:Record<string,string|number|string[]|null>={Name:kind+' / '+key,'Record key':key,'Record type':kind,'date:Source at:start':at,'date:Source at:is_datetime':1,Status:String(payload.status||'PARTIALLY RECONCILED'),Broker:event.broker||null,'Account reference':event.accountRef||null,Currency:event.currency||null,'Amount exact':event.amount??null,'Realised P&L exact':event.realisedPnl??null,'Fees exact':event.fees??null};
 if(kind==='transaction')Object.assign(properties,{Instrument:event.instrument||null,'Product type':event.productType||null,Direction:event.direction||null,Category:event.category||null,'Quantity exact':event.quantity??null,'Execution price exact':event.price??null,'Price currency':event.priceCurrency??null,'Broker event ID':event.eventId??null});
 if(kind==='snapshot')Object.assign(properties,{'Cash exact':payload.cash??null,'Portfolio value exact':payload.valuation??null,'Unrealised P&L exact':payload.unrealisedPnl??null,Freshness:payload.observedAt?'OBSERVED':'UNAVAILABLE'});
 if(kind==='daily')Object.assign(properties,{'date:Trading date:start':String(payload.day),'date:Trading date:is_datetime':0,'date:Cutoff:start':String(payload.cutoffAt),'date:Cutoff:is_datetime':1});
 return {kind,key,dailyKey:kind==='daily'?String(payload.day):localParts(at).day,properties,content:'Broker evidence; amounts retain original currency.\n```json\n'+JSON.stringify(payload,null,2)+'\n```'};
}
export async function enqueueNotion(store:OperationsStore,key:string,shape:ReturnType<typeof notionShape>,now:string){
 const hash=await hashPayload(shape);
 // Never replace an uncertain create with another create. Preserve its reservation.
 await store.db.prepare('INSERT INTO operation_outbox (owner_id,record_key,desired_hash,payload,state,remote_id,updated_at,error,claim_token) VALUES (?,?,?,?,?,NULL,?,NULL,NULL) ON CONFLICT(owner_id,record_key) DO UPDATE SET desired_hash=excluded.desired_hash,payload=excluded.payload,state=CASE WHEN operation_outbox.state IN (\'uncertain\',\'writing\') THEN operation_outbox.state WHEN operation_outbox.desired_hash=excluded.desired_hash THEN operation_outbox.state ELSE \'pending\' END,updated_at=excluded.updated_at').bind(store.owner,key,hash,JSON.stringify(shape),'pending',now).run();
}
export async function reconcileDailyTradingLog(store:OperationsStore,cutoffAt:string,read:()=>Promise<LedgerInput>,clock=()=>new Date().toISOString()){
 cutoffAt=new Date(cutoffAt).toISOString();
 const p=localParts(cutoffAt);if(p.time!=='16:45'||Date.parse(cutoffAt)>Date.parse(clock()))throw new OperationError('invalid_cutoff','Bookkeeping cutoff must be a real past 16:45 London occurrence');
 return store.phase('strata:'+p.day+':16:45','ledger',{cutoffAt},async lease=>{
  const input=ledgerInputSchema.parse(await read()),now=clock(),affected=new Set([p.day]);let accepted=0;
  for(const raw of input.events){const e=eventSchema.parse(raw);if(Date.parse(e.effectiveAt)>Date.parse(cutoffAt)||Date.parse(e.receivedAt)>Date.parse(now))continue;
   const key=eventKey(e),day=localParts(e.effectiveAt).day;affected.add(day);
   await store.append('ledger-event',key,e,now,lease);await enqueueNotion(store,'transaction:'+key,notionShape('transaction',key,e),now);accepted++;
  }
  for(const s of input.snapshots){const key=`${s.broker}:${s.accountRef}:${s.observedAt||s.receivedAt}`;await store.append('broker-snapshot',key,s,now,lease);await enqueueNotion(store,'snapshot:'+key,notionShape('snapshot',key,s),now);}
  // Read all distinct event projections with explicit bounded pagination, never just open positions.
  const all:LedgerEvent[]=[];let offset=0;
  while(true){const page=(await store.db.prepare('SELECT * FROM operation_records WHERE owner_id=? AND kind=? ORDER BY rowid DESC LIMIT 500 OFFSET ?').bind(store.owner,'ledger-event',offset).all<{record_key:string;payload:string}>()).results;all.push(...page.map(r=>JSON.parse(r.payload)));if(page.length<500)break;offset+=500;if(offset>100000)throw new OperationError('ledger_paging_bound','Ledger needs a continued batch; no complete reconciliation claimed',true);}
  const latest=new Map<string,LedgerEvent>();for(const e of all)if(!latest.has(eventKey(e)))latest.set(eventKey(e),e);
  const daily=[];
  const replaced=new Set([...latest.values()].filter(e=>e.replacesEventId!==null).map(e=>`${e.broker}:${e.accountRef}:${e.replacesEventId}`));
  for(const day of affected){
   const prior=await store.latest('daily',day),events=[...latest.values()].filter(e=>localParts(e.effectiveAt).day===day&&Date.parse(e.effectiveAt)<=Date.parse(cutoffAt)&&!replaced.has(`${e.broker}:${e.accountRef}:${e.eventId}`));
   const complete=input.coverage.cmcClosedHistory&&input.coverage.trading212History&&input.coverage.paginationComplete;
   const snapshot={cutoffAt,figures:input.snapshots.filter(s=>s.observedAt!==null&&Date.parse(s.observedAt)<=Date.parse(cutoffAt)),receivedAfterCutoff:Date.parse(now)>Date.parse(cutoffAt)};
   const record={day,timezone:'Europe/London',cutoffAt:prior?.value.cutoffAt||localInstants(day,'16:45')[0],status:complete?'RECONCILED':input.snapshots.length||events.length?'PARTIALLY RECONCILED':'BLOCKED',asAtStatus:'PROVISIONAL',originalAsAt:prior?.value.originalAsAt||(day===p.day?snapshot:null),reconciledAt:now,reconciliationCutoff:cutoffAt,knownAmounts:monetarySummary(events),accessibleActivityCount:events.length,totalActivityCount:complete?events.length:null,coverage:input.coverage,issues:input.issues,events:events.map(eventKey),runId:'strata:'+p.day+':16:45',notionStatus:'pending-or-blocked',fullDayStatement:false};
   await store.append('daily',day,record,now,lease);await enqueueNotion(store,'daily:'+day,notionShape('daily',day,record),now);daily.push(record);
  }
  // Incomplete pages never advance a high-watermark as if source history were complete.
  await store.append('history-cursor','trading212:'+cutoffAt,{cursor:input.cursor,complete:input.coverage.paginationComplete,completedCutoff:input.coverage.paginationComplete?cutoffAt:null},now);
  return {cutoffAt,acceptedEvents:accepted,daily,financialWriteMode:'outbox-only',notionWritten:false,blocked:daily.every(d=>d.status==='BLOCKED'),retryPending:!input.coverage.paginationComplete&&input.cursor!==null};
 },clock);
}

export interface NotionGateway {schema():Promise<Record<string,string>>;find(key:string):Promise<string[]>;create(shape:ReturnType<typeof notionShape>):Promise<string>;update(id:string,shape:ReturnType<typeof notionShape>):Promise<void>}
export async function flushNotionRow(store:OperationsStore,key:string,gateway:NotionGateway,clock=()=>new Date().toISOString()){
 const lock=await store.lease('notion-writer',clock());
 try{
  const row=await store.db.prepare('SELECT * FROM operation_outbox WHERE owner_id=? AND record_key=?').bind(store.owner,key).first<{state:string;payload:string;desired_hash:string;remote_id:string|null}>();if(!row)throw new OperationError('missing_outbox','No ledger outbox record');if(row.state==='done')return {state:'done',remoteId:row.remote_id};
  const schema=await gateway.schema();for(const [name,type] of Object.entries({'Name':'title','Record key':'rich_text','Record type':'select','Source at':'date','Status':'select'}))if(schema[name]!==type&&!(type==='rich_text'&&schema[name]==='text'))throw new OperationError('notion_schema','Notion schema missing or mismatched: '+name);
  const shape=JSON.parse(row.payload) as ReturnType<typeof notionShape>,found=await gateway.find(shape.key);if(found.length>1)throw new OperationError('notion_duplicate','Conflicting Notion records require owner review');
  if(row.remote_id&&found[0]&&row.remote_id!==found[0])throw new OperationError('notion_duplicate','Lookup conflicts with the saved Notion page reference');
  const existing=row.remote_id||found[0];if(!existing&&['uncertain','writing'].includes(row.state))throw new OperationError('notion_uncertain','Prior create outcome uncertain; absence in a lookup is not permission to duplicate');
  if(shape.kind!=='daily'){const daily=await store.db.prepare('SELECT remote_id,state FROM operation_outbox WHERE owner_id=? AND record_key=?').bind(store.owner,'daily:'+shape.dailyKey).first<{remote_id:string|null;state:string}>();if(!daily?.remote_id||daily.state!=='done')throw new OperationError('notion_dependency','Write the authoritative daily record before its child relation',true);if(schema['Daily log']!=='relation')throw new OperationError('notion_schema','Daily log relation is unavailable');shape.properties['Daily log']=[daily.remote_id];}
  await store.db.prepare('UPDATE operation_outbox SET state=?,claim_token=?,updated_at=? WHERE owner_id=? AND record_key=?').bind('writing',lock.token,clock(),store.owner,key).run();
  try{let id=existing;if(id)await gateway.update(id,shape);else id=await gateway.create(shape);await store.checkLease(lock,clock());await store.db.prepare('UPDATE operation_outbox SET state=CASE WHEN desired_hash=? THEN ? ELSE ? END,remote_id=?,error=NULL,updated_at=? WHERE owner_id=? AND record_key=? AND claim_token=?').bind(row.desired_hash,'done','pending',id,clock(),store.owner,key,lock.token).run();return {state:'done-for-written-revision',remoteId:id};}
  catch(e){await store.db.prepare('UPDATE operation_outbox SET state=?,error=?,updated_at=? WHERE owner_id=? AND record_key=?').bind(e instanceof OperationError&&e.code==='notion_not_sent'?'pending':'uncertain','Notion write failed; reconcile before retrying a create',clock(),store.owner,key).run();throw e;}
 }finally{await store.release(lock);}
}
