import {z} from 'zod';
import {requireOwnerId,StoreError} from '../round1-store-contracts';
import {hashPayload,readOwnedHistory,readOwnedRecord} from '../round1-store';
import manifest from '../../data/historical/manifest.json';
import quote from '../../data/historical/current-receipt.json';
import {loadDataset,loadOutput} from './catalog';
import {runFeatures,historicalAssessment} from './engine';
import {asOf} from './simulation';
import type {Feature} from './types';
const ids=manifest.datasets.map(d=>d.id);
export const historicalRequest=z.object({action:z.enum(['run','compare']),datasetId:z.string().refine(x=>ids.includes(x),'Unknown dataset'),requestId:z.string().uuid().optional(),ownerDecision:z.enum(['agree','disagree','wait']).optional(),ownerThesis:z.string().trim().min(1).max(4000).optional()}).strict().superRefine((x,c)=>{if(!!x.ownerDecision!==!!x.ownerThesis)c.addIssue({code:'custom',message:'Owner decision and thesis must be supplied together'});});
export type FeatureOutput={features:Feature[];inputHash:string;definitionVersion:string};
export async function compareHistorical(id:string,now=new Date().toISOString()){
 const series=await loadDataset(id),out=await loadOutput(id) as FeatureOutput,last=out.features.at(-1);if(!last)throw new StoreError(409,'empty_history','Historical features unavailable.');
 const directional=manifest.datasets.find(d=>d.instrumentId===series.instrumentId&&d.timeframe===15),higher=manifest.datasets.find(d=>d.instrumentId===series.instrumentId&&d.timeframe===120);
 const ht=directional?await loadOutput(directional.id) as FeatureOutput:null,hi=higher?await loadOutput(higher.id) as FeatureOutput:null;
 const assessment=historicalAssessment(series,last,asOf(ht?.features||[],last.availableAt),asOf(hi?.features||[],last.availableAt),now);
 const quoteAge=Date.parse(now)-Date.parse(quote.observedAt),receiptAge=Date.parse(now)-Date.parse(quote.receivedAt),quoteApplicable=series.instrumentId===quote.instrumentId&&quoteAge>=0&&receiptAge>=0;
 const prior=series.candles.at(-1)!,atr=last.atr;
 return {assessment,historicalAsOf:last.availableAt,now,comparison:quoteApplicable?{sourceId:quote.sourceId,observedAt:quote.observedAt,receivedAt:quote.receivedAt,ageMinutes:quoteAge/60000,declaredDelayMinutes:quote.declaredDelayMinutes,mid:quote.mid,historicalClose:prior.mid.c,priceChange:quote.mid-prior.mid.c,distanceInHistoricalAtr:atr===null||atr===0?null:(quote.mid-prior.mid.c)/atr,note:'Descriptive distance in last historical ATR; this is not a current ATR or a mean-reversion signal.',eligibleForEntry:false,state:quoteAge>5*60000||receiptAge>5*60000?'stale':'delayed'}:null,currentBars:'unavailable',positions:'unknown',ownerDecision:null,canSubmitOrder:false};
}
export async function saveHistorical(db:D1Database,ownerId:string,raw:unknown,now=new Date().toISOString()){
 requireOwnerId(ownerId);const parsed=historicalRequest.safeParse(raw);if(!parsed.success)throw new StoreError(400,'invalid_history_request',parsed.error.issues.map(i=>i.message).join(' '));const x=parsed.data;
 const requestHash=await hashPayload({action:x.action,datasetId:x.datasetId,ownerDecision:x.ownerDecision??null,ownerThesis:x.ownerThesis??null});
 async function retry(){
  if(!x.requestId)return null;
  const found=await db.prepare('SELECT id FROM round1_records WHERE owner_id = ? AND request_id = ?').bind(ownerId,x.requestId).first<{id:string}>();if(!found)return null;
  const record=await readOwnedRecord(db,ownerId,found.id),payload=record.payload as {requestHash?:string};
  if(record.kind!=='historical'||payload.requestHash!==requestHash)throw new StoreError(409,'historical_request_conflict','This request identity belongs to different saved input. Start a new action.');
  return {id:record.id,version:record.version,createdAt:record.createdAt,payload:record.payload,contentHash:record.contentHash,storage:'durable'};
 }
 const existing=await retry();if(existing)return existing;
 const input=await loadDataset(x.datasetId),inputHash=await hashPayload(input),immutable=await loadOutput(x.datasetId) as FeatureOutput;
 if(inputHash!==immutable.inputHash)throw new StoreError(409,'source_hash_mismatch','Saved source hash differs from result; rerun the release build.');
 let computation:unknown;
 if(x.action==='run'){
  const computed=runFeatures(input),expected=await hashPayload(immutable.features),actual=await hashPayload(computed.features);
  if(expected!==actual)throw new StoreError(409,'replay_mismatch','Recomputed features differ from saved output; no successful run recorded.');
  computation={summary:computed.summary,engineVersion:computed.engineVersion,definitionVersion:computed.definitionVersion,featuresHash:actual,fullOutputs:{path:'private-source:data/historical/results/'+x.datasetId+'.json',retrieval:'/api/historical?kind=features&datasetId='+encodeURIComponent(x.datasetId)+'&inputHash='+inputHash,artifactHash:manifest.artifacts.find(a=>a.file===x.datasetId+'.json')?.sha256,rows:computed.features.length,retainedInVersionedSource:true},sample:computed.features.slice(-10),reproducedExactOutput:true};
 }else computation=await compareHistorical(x.datasetId,now);
 const payload={action:x.action,datasetId:x.datasetId,inputHash,recordedAt:now,computation,...(x.requestId?{requestHash}:{}),ownerDecision:x.ownerDecision?{actor:'J',decision:x.ownerDecision,thesis:x.ownerThesis,recordedAt:now,sharedEvidenceIndependent:false,canOverrideHardGate:false}:null};
 const id=crypto.randomUUID(),contentHash=await hashPayload(payload),version='history-'+id;
 try{await db.prepare('INSERT INTO round1_records (id, owner_id, kind, version, created_at, payload, content_hash, request_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id,ownerId,'historical',version,now,JSON.stringify(payload),contentHash,x.requestId??null).run();}
 catch(error){const recorded=await retry();if(recorded)return recorded;throw error;}
 return {id,version,createdAt:now,payload,contentHash,storage:'durable'};
}
export async function historicalHistory(db:D1Database,ownerId:string,recordId?:string){requireOwnerId(ownerId);return recordId?readOwnedRecord(db,ownerId,recordId):readOwnedHistory(db,ownerId,'historical');}
