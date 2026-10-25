import {deepFreeze,instantMs,isRecord} from './contracts';
import type {Direction,Provenance,Validation} from './contracts';
export const THREE_CIRCLES=deepFreeze([
  {id:'watchlist',order:1,size:'Smallest',name:'Watchlist',subtitle:'Broad spectrum',description:'Markets, economies, currencies, rates, sectors, portfolio holdings and comparison instruments identify where to look and what relates to what. Being watched never makes an instrument execution eligible.'},
  {id:'expectations',order:2,size:'Middle',name:'News and expectations',subtitle:'What is meant to happen on paper',description:'Timestamped events, macro theory, releases, policy, verified consensus, fundamentals and historical analogues establish an expected response and its assumptions. Freeze expectations before measuring the response.'},
  {id:'behaviour',order:3,size:'Largest',name:'Human behaviour',subtitle:'How participants actually respond',description:'Price reaction, follow-through, rejection, volatility and available volume, positioning or flow are behavioural proxies. Motives are interpretations; unavailable positioning or flow stays unavailable.'},
]);
export const ELASTICATION_SPEC=deepFreeze({version:'R1-research-contract-2026-10-19',status:'unapproved-proposal',formula:null,probability:null,quantityDemanded:null,comparisonStates:['alignment','under-response','over-response','contradiction','unavailable'],reason:'Final methodology, response horizons, benchmark and uncertainty thresholds are not approved. No demand elasticity without a measurable quantity variable; no assumed mean reversion.'});
export type ExpectationKind='verified-consensus'|'published-forecast'|'economic-reasoning'|'owner-hypothesis'|'model-hypothesis';
export interface EventExpectation {id:string;eventId:string;instrumentId:string;horizonMinutes:number;kind:ExpectationKind;expectedDirection:Direction;expectedResponse:number|null;units:string|null;benchmark:string|null;recordedAt:string;frozenAt:string;eventAt:string;sourceIds:string[];sourceAvailableAt:string[];assumptions:string[];methodVersion:string;modelVersion:string|null}
export interface ObservedResponse {id:string;expectationId:string;eventId:string;instrumentId:string;horizonMinutes:number;startAt:string;endAt:string;observedAt:string;direction:Direction;response:number|null;units:string|null;benchmark:string|null;seriesId:string;mappingVersion:string;sourceIds:string[];provenance:Provenance;proxy:'price'|'volatility'|'volume'|'positioning'|'flow';interpretation:string|null}
const stringList=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string'&&x.length>0);
export function validateExpectation(value:unknown):Validation<Readonly<EventExpectation>> {
  const issues:string[]=[];if(!isRecord(value))return {ok:false,value:null,issues:['Expectation must be an object.']};
  for(const key of ['id','eventId','instrumentId','methodVersion'])if(typeof value[key]!=='string'||!value[key])issues.push(`${key} required.`);
  if(!['verified-consensus','published-forecast','economic-reasoning','owner-hypothesis','model-hypothesis'].includes(String(value.kind)))issues.push('Expectation evidence type must remain explicit.');
  if(!['Bullish','Bearish','Neutral','Unknown'].includes(String(value.expectedDirection)))issues.push('Invalid expected direction.');
  if(typeof value.horizonMinutes!=='number'||!Number.isFinite(value.horizonMinutes)||value.horizonMinutes<=0)issues.push('Defined positive horizon required.');
  if(value.expectedResponse!==null&&(typeof value.expectedResponse!=='number'||!Number.isFinite(value.expectedResponse)))issues.push('Expected response must be finite or unavailable.');
  if(value.expectedResponse!==null&&(!value.units||!value.benchmark))issues.push('Quantitative expectation requires units and benchmark.');
  if(value.units!==null&&typeof value.units!=='string'||value.benchmark!==null&&typeof value.benchmark!=='string'||value.modelVersion!==null&&typeof value.modelVersion!=='string')issues.push('Invalid units, benchmark or model version.');
  if(!stringList(value.sourceIds)||value.sourceIds.length===0)issues.push('Expectation source IDs required.');
  if(!Array.isArray(value.assumptions)||!value.assumptions.every(v=>typeof v==='string'))issues.push('Assumptions must be recorded.');
  const recorded=instantMs(value.recordedAt),frozen=instantMs(value.frozenAt),event=instantMs(value.eventAt);
  if(recorded===null||frozen===null||event===null)issues.push('Expectation timestamps require explicit instants.');
  else if(recorded>frozen||frozen>=event)issues.push('Expectation must be recorded and frozen strictly before event release.');
  if(!stringList(value.sourceAvailableAt)||!Array.isArray(value.sourceIds)||value.sourceAvailableAt.length!==value.sourceIds.length)issues.push('One as-of availability timestamp per source required.');
  else if(value.sourceAvailableAt.some(t=>instantMs(t)===null||(frozen!==null&&instantMs(t)!>frozen)))issues.push('Post-freeze or invalid source availability would leak future evidence.');
  return issues.length?{ok:false,value:null,issues}:{ok:true,value:deepFreeze(structuredClone(value)) as unknown as Readonly<EventExpectation>,issues:[]};
}
/** Link only; no unapproved numeric elasticity or categorical response judgement is inferred. */
export function linkResponse(expectation:EventExpectation,response:ObservedResponse,asOf:string){
  const valid=validateExpectation(expectation),issues=valid.ok?[]:[...valid.issues];
  if(response.expectationId!==expectation.id||response.eventId!==expectation.eventId||response.instrumentId!==expectation.instrumentId||response.horizonMinutes!==expectation.horizonMinutes)issues.push('Response must match expectation ID, event, instrument and horizon.');
  if(response.benchmark!==expectation.benchmark||response.units!==expectation.units)issues.push('Expected and observed units/benchmark must match before comparison.');
  const event=instantMs(expectation.eventAt),start=instantMs(response.startAt),end=instantMs(response.endAt),observed=instantMs(response.observedAt),clock=instantMs(asOf);
  if([event,start,end,observed,clock].some(x=>x===null))issues.push('Response instants required.');
  else if(start!>event!||end!==event!+expectation.horizonMinutes*60000||observed!<end!||observed!>clock!)issues.push('Response window or as-of measurement is invalid.');
  if(!response.sourceIds.length||!response.seriesId||!response.mappingVersion)issues.push('Mapped response series and source IDs required.');
  if(response.provenance.origin==='hypothetical')issues.push('Hypothetical evidence is isolated from research observations.');
  if(response.response!==null&&!Number.isFinite(response.response))issues.push('Response must be finite or unavailable.');
  return {linked:issues.length===0,expectationId:expectation.id,responseId:response.id,comparison:'unavailable' as const,calculation:null,issues,reason:'Comparison classification requires a defined, approved method and uncertainty thresholds.'};
}
export interface ImportedResearchRecord {id:string;issues?:string[];verification?:string;raw:{elasticity_value:number|null;middle_circle?:string;outer_circle?:string;notes?:string|null}}
export function researchReadiness(records:ImportedResearchRecord[]){const supplied=records.filter(r=>typeof r.raw.elasticity_value==='number'&&Number.isFinite(r.raw.elasticity_value));return {total:records.length,flagged:records.filter(r=>(r.issues?.length||0)>0).length,suppliedValues:supplied.length,unavailableValues:records.length-supplied.length,pooledValue:null,probability:null,status:'research-only' as const,requirements:['Verified event identity and timestamp precision','Expectation vintage frozen before response','Mapped price series, horizon, benchmark and costs','Separate imported method labels and deduplicate episodes','Owner-approved methodology, uncertainty and holdout validation']}}
