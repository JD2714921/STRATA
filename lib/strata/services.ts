import {tradingRules,evaluateEntry} from './rules';
import type {MarketSnapshot,MarketEvent,HTFSnapshot,CalculationInput,ElasticityResult,TradingRule,TradingPlan,DecisionState,ProbabilityResult,HistoricalAnalogue,RefreshJob,SystemLog} from './types';
import {events,mockSnapshots,provenance,decision} from './mock';
export interface MarketDataProvider {getSnapshots(revision?:number):Promise<MarketSnapshot[]>}
export interface EventDataProvider {getEvents():Promise<MarketEvent[]>}
export interface HistoricalCorpusProvider extends EventDataProvider {ingestEvents(batch:MarketEvent[]):Promise<{accepted:number;status:string}>}
export interface ScreenshotProvider {getSnapshot(instrumentId:string,timeframe:string):Promise<HTFSnapshot>;ingestHTFSnapshot(snapshot:HTFSnapshot):Promise<{status:string}>}
export interface CalculationProvider {calculate(input:CalculationInput):Promise<ElasticityResult>}
export interface TradingRulesProvider {getRules():Promise<TradingRule[]>;evaluateTradingPlan(plan:TradingPlan):Promise<DecisionState>}
export class MockMarketDataProvider implements MarketDataProvider {async getSnapshots(revision=0){return mockSnapshots(revision)}}
export class FinancialDatasetsProvider implements MarketDataProvider {async getSnapshots():Promise<MarketSnapshot[]>{throw new Error('Financial Datasets is not connected. Configure the server-side adapter in Round 2.')}}
export class UploadedCorpusProvider implements HistoricalCorpusProvider {async getEvents(){return events} async ingestEvents(batch:MarketEvent[]){return {accepted:0,status:`${batch.length} records received at the boundary; use scripts/ingest-corpus.py for validated, source-versioned ingestion; runtime writes are not enabled.`}}}
export class MockScreenshotProvider implements ScreenshotProvider {async getSnapshot(instrumentId:string,timeframe:string):Promise<HTFSnapshot>{return {id:`${instrumentId}-${timeframe}`,instrumentId,timeframe,imageUrl:null,timestamp:null,source:'Not supplied',status:'No Screenshot',bias:'Neutral',levels:[],observations:[],indicators:[],invalidation:null}} async ingestHTFSnapshot(snapshot:HTFSnapshot){return {status:`${snapshot.id}: analysis pipeline is not configured`}}}
export class ElasticityEngine implements CalculationProvider {calculate(input:CalculationInput):Promise<ElasticityResult>;async calculate():Promise<ElasticityResult>{return {value:null,expected:null,observed:null,deviation:null,confidence:{score:null,level:'Unknown'},percentile:null,breakdown:['Reference received: E_d = |%ΔQ_d / %ΔP|.','The definition of Q_d, baseline, sampling window and market interpretation still need confirmation.','No production result calculated.'],status:'Not configured',provenance:{...provenance,kind:'Calculated'}}}}
export class ProbabilityEngine {async calculate():Promise<ProbabilityResult[]>{return []}}
export class SimilarityEngine {compare(event:MarketEvent):Promise<HistoricalAnalogue[]>;async compare():Promise<HistoricalAnalogue[]>{return []}}
export class SignalEngine implements TradingRulesProvider {async getRules(){return tradingRules}async evaluateTradingPlan(plan:TradingPlan){return plan.entryContext?evaluateEntry(plan.entryContext).state:decision}}
export const providers={market:new MockMarketDataProvider(),corpus:new UploadedCorpusProvider(),screenshot:new MockScreenshotProvider(),calculation:new ElasticityEngine(),rules:new SignalEngine()};
export const ingestEvents=(batch:MarketEvent[])=>providers.corpus.ingestEvents(batch);
export const ingestHTFSnapshot=(snapshot:HTFSnapshot)=>providers.screenshot.ingestHTFSnapshot(snapshot);
export const calculateElasticity=(input:CalculationInput)=>providers.calculation.calculate(input);
export const evaluateTradingPlan=(plan:TradingPlan)=>providers.rules.evaluateTradingPlan(plan);
export async function refreshStrata(revision:number):Promise<{job:RefreshJob;snapshots:MarketSnapshot[];logs:SystemLog[]}>{
 const startedAt=new Date().toISOString();let snapshots:MarketSnapshot[]=[];
 const tasks=[{name:'Market data',run:async()=>{snapshots=await providers.market.getSnapshots(revision);return 'Registry checked; no connected market data or invented prices'}},{name:'Market context',run:async()=> 'Mock regime retained'},{name:'Event coverage',run:async()=>{await providers.corpus.getEvents();return `${events.length} source-versioned historical records loaded; unverified`}}];
 const steps:RefreshJob['steps']=[];
 for(const t of tasks){try{steps.push({name:t.name,status:'Complete',message:await t.run()})}catch(e){steps.push({name:t.name,status:'Failed',message:e instanceof Error?e.message:'Module failed'})}}
 for(const name of ['HTF screenshots','Indicators','Elasticity','SMT evaluation','ICT conditions','Corpus matching','Surface probabilities','Scan update','Decision states'])steps.push({name,status:'Skipped',message:'Round 2 integration pending; illustrative state retained.'});
 steps.push({name:'Audit trail',status:'Complete',message:'Refresh outcomes recorded in the session log.'});
 const job:RefreshJob={id:crypto.randomUUID(),startedAt,finishedAt:new Date().toISOString(),steps};
 const logs=steps.map((s,i)=>({id:job.id+'-'+i,timestamp:job.finishedAt!,type:s.status==='Failed'?'Error':i<3?'Data':'System',source:'Mock refresh',action:s.name,instrument:null,previousState:null,newState:s.status,confidence:null,status:s.status,details:s.message}));return {job,snapshots,logs};
}
