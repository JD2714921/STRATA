import {packetSchema,OperationError,type EvidencePacket} from './contracts';
import {occurrence,scheduleRegister} from './schedule';
import {OperationsStore} from './store';
import {validatePacketAt,CMC_CAPABILITY} from './market';
import {evaluateReadiness,DEFAULT_CONFIG,type OwnerConfig} from '../strata-v2/rules';
import {readPrivateState} from '../round1-store';
import {round1MutationSchema} from '../round1-store-contracts';
import {TRADE_INSTRUMENTS} from '../strata-v2/registry';
import {assessConfluence} from '../historical/confluence';
import type {Feature} from '../historical/types';
import {Q_DEFINITION,calculateElastication} from '../historical/elastication';
import {executionFeatures} from '../historical/execution-binding';
import {portfolioView} from './portfolio';
import index from '../../data/operations/historical-index.json';
import {exchangeContext} from './calendar';

/** One pipeline for all seven occurrences and manual execution; no provider write capability. */
export async function runStrataAssessment(store:OperationsStore,time:string,scheduledAt:string,evidence:unknown={},clock=()=>new Date().toISOString()){
 const run=occurrence(time,scheduledAt);if(Date.parse(scheduledAt)>Date.parse(clock()))throw new OperationError('future_run','Cannot execute a future scheduled occurrence');
 return store.phase(run.id,'assessment',{occurrence:run.id,scheduledAt:run.scheduledAt},async lease=>{
  const now=clock(),packet:EvidencePacket=packetSchema.parse(evidence),sources=validatePacketAt(packet,now),portfolio=await portfolioView(store),previous=await store.records('assessment',undefined,1),privateState=await readPrivateState(store.db,store.owner,now);
  const config:OwnerConfig=structuredClone(DEFAULT_CONFIG),stored=privateState.config?.payload as {fields?:unknown}|undefined;
  if(stored){const p=round1MutationSchema.safeParse({kind:'config',fields:stored.fields});if(!p.success||p.data.kind!=='config')throw new OperationError('config_invalid','Saved owner configuration is invalid; assessment blocked');for(const f of p.data.fields)config[f.key]={...config[f.key],...f};}
  const newWindows=packet.bars.filter(s=>Date.parse(s.receivedAt)<=Date.parse(now)&&s.candles.every(b=>Date.parse(b.time)<=Date.parse(now))).map(series=>({series,features:executionFeatures(series)}));
  for(const x of newWindows)await store.append('bar-window',x.series.id,{series:x.series,features:x.features,incrementalScope:'bounded incoming window only; warmup restarts, saved history not recomputed'},now,lease);
  const markets=TRADE_INSTRUMENTS.map(instrument=>{
   const history=index.rows.filter(x=>x.instrumentId===instrument.id),get=(m:number)=>newWindows.find(x=>x.series.instrumentId===instrument.id&&x.series.intervalMinutes===m)?.features.at(-1)||(history.find(r=>r.timeframe===m)?.feature as Feature|undefined);
   const independent=assessConfluence({instrumentId:instrument.id,asOf:now,feature:get(5)||null,directional:get(15)||null,higher:get(120)||null,circle2:{coverage:sources.news.length>0,vintageVerified:false,contradiction:false,expectedDirection:null},mappingVerified:history.length>0,timingVerified:false,methodsApproved:false,validated:false,fresh:false,riskConfigured:false,positionsKnown:false,newPositionsToday:null,ownerDirection:null,ownerEvidenceComplete:false,invalidation:false,proposedR:null});
   const plan=evaluateReadiness({instrumentId:instrument.id,now,config,executionMinutes:5,thesisMinutes:15}),quote=sources.quotes.find(q=>q.quote?.instrumentId===instrument.id);
   const q=packet.directionalQuantities.find(q=>q.instrumentId===instrument.id&&Date.parse(q.calculatedAt)<=Date.parse(now)),ed=q?calculateElastication(q):null;
   return {instrumentId:instrument.id,label:instrument.ownerLabel,decision:independent.strata.state,analyticalDirection:get(15)?.direction||'Unknown',directionBasis:'Dated historical research only; not a current entry thesis',ownerPlan:{...independent.ownerPlan,readiness:plan.readiness,gates:plan.gates},strata:independent.strata,circles:independent.circles,quote:quote??{state:'UNAVAILABLE',eligibleForEntry:false,quote:null},atr:history.filter(r=>[5,15,60,120].includes(r.timeframe)).map(r=>({minutes:r.timeframe,period:r.feature?.atrPeriod,value:r.feature?.atr,availableAt:r.feature?.availableAt,basis:'persisted research; bar timing unverified'})),historicalInputs:history.map(h=>({datasetId:h.datasetId,inputHash:h.inputHash,resultHash:h.resultHash,observedThrough:h.summary.to})),elastication:ed||{formula:'E_d = |(%ΔQ_d) / (%ΔP)|',qDefinition:Q_DEFINITION,originalInputs:null,pctQ:null,pctP:null,signedRatio:null,magnitude:null,status:'UNAVAILABLE',reason:'No verified directional Q_d observations; no fictional ratio calculated'},proposedSetup:null,setupBlockers:['Current bars, approved structure, risk sizing, costs, TP partial fractions and live entry confirmation unavailable'],supporting:plan.supporting,contradictory:plan.against,missing:plan.unknowns,canSubmitOrder:false};
  });
  const report={version:'round8-operations-v1',runId:run.id,scheduledAt:run.scheduledAt,timezone:run.timezone,session:time,assessmentAt:now,state:'PARTIAL',exchangeContext:[exchangeContext('LSE',now),exchangeContext('NYSE',now)],markets,sources,incomingBarWindows:newWindows.map(x=>({id:x.series.id,rows:x.series.candles.length,last:x.features.at(-1)?.availableAt,timingVerified:x.series.timestampMeaning!=='unknown'&&x.series.calendarVerified&&x.series.closedStateVerified})),configVersion:privateState.config?.version??null,configSnapshot:config,ownerDecision:null,portfolioContext:portfolio,weatherInterpretation:'Location-specific context only; no inferred crop yield or market direction',capabilities:CMC_CAPABILITY,previousRunId:previous[0]?.value.runId??null,changesSincePrevious:previous.length?markets.map(m=>({instrumentId:m.instrumentId,previous:previous[0].value.markets?.find((p:{instrumentId:string})=>p.instrumentId===m.instrumentId)?.decision??null,current:m.decision})):[],statisticalConfidence:null,canSubmitOrder:false};
  await store.append('assessment',run.id,report,now,lease);return report;
 },clock);
}
export async function operationsStatus(store:OperationsStore,now:string){
 const [runs,assessments,daily,portfolio,outbox]=await Promise.all([store.runs(),store.records('assessment',undefined,1),store.records('daily',undefined,1),portfolioView(store),store.db.prepare("SELECT record_key,state,updated_at,error FROM operation_outbox WHERE owner_id=? AND state != ? ORDER BY CASE WHEN record_key LIKE 'daily:%' THEN 0 ELSE 1 END,updated_at LIMIT 100").bind(store.owner,'done').all()]);
 const dailyRecord=daily[0]?.value??null,dailyWrite=dailyRecord?await store.db.prepare('SELECT state,remote_id,error FROM operation_outbox WHERE owner_id=? AND record_key=?').bind(store.owner,'daily:'+dailyRecord.day).first():null;
 return {serverTime:now,schedules:scheduleRegister(now),runs,latestAssessment:assessments[0]?.value??null,dailyLog:dailyRecord?{...dailyRecord,notionStatus:dailyWrite??{state:'not-enqueued'}}:null,portfolio,outbox:outbox.results,unattendedVerified:false,activation:'BLOCKED: source publication / Site MCP / cloud access not verified',liveCapability:CMC_CAPABILITY};
}
