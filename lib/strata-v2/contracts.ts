/** Vendor-independent boundaries. Imported/provider text is data, never executable instruction. */
export type Direction = 'Bullish' | 'Bearish' | 'Neutral' | 'Unknown';
export type Readiness = 'Blocked' | 'Incomplete' | 'Watch' | 'Conditions met';
export type ConfigStatus = 'confirmed' | 'proposed' | 'missing';
export type DataState = 'loaded' | 'empty' | 'partial' | 'stale' | 'failed' | 'unavailable';
export type TimestampPrecision = 'millisecond' | 'second' | 'minute' | 'day' | 'month' | 'unknown';
export type Validation<T> = {ok:true;value:T;issues:string[]} | {ok:false;value:null;issues:string[]};
export interface ConfigField<T=string> {value:T|null;status:ConfigStatus;source:string;version:string;note?:string}
export interface Provenance {
  sourceId:string;provider:string;sourceFormat:'structured'|'narrative'|'image-seed';
  origin:'provider'|'manual'|'import'|'hypothetical';sourceUrl:string|null;
  observedAt:string|null;receivedAt:string|null;timestampPrecision:TimestampPrecision;
  declaredDelayMs:number|null;scope:string;mappingVersion:string|null;contentHash:string|null;
}
export interface EconomicAsset {id:string;name:string;assetClass:string}
export interface MarketSeries {
  id:string;economicAssetId:string;provider:string;providerSeriesId:string|null;
  basis:string;units:string;currency:string|null;timezone:string|null;calendarId:string|null;
  mappingStatus:'unresolved'|'candidate'|'verified';mappingVersion:string|null;mappingEvidenceIds:string[];
}
export interface BrokerInstrument {
  id:string;ownerLabel:string;economicAssetId:string;tradeEnabled:boolean;
  broker:'CMC Markets';brokerProductId:string|null;wrapper:'Spread Betting'|null;
  basis:string|null;currency:string|null;units:string|null;listing:string|null;isin:string|null;
  mappingStatus:'unresolved'|'candidate'|'verified';mappingVersion:string|null;mappingEvidenceIds:string[];
}
export interface Bar {start:string;end:string;closed:boolean;open:number;high:number;low:number;close:number;volume:number|null}
export interface BarSeries {id:string;series:MarketSeries;intervalMinutes:number;bars:Bar[];provenance:Provenance;state:DataState;lastError:string|null}
export interface FreshnessPolicy {maxEventAgeMs:number;maxReceiptAgeMs:number;maxDelayMs:number;clockSkewToleranceMs:number;status:ConfigStatus;version:string}
export interface Freshness {state:DataState;eligible:boolean;eventAgeMs:number|null;receiptAgeMs:number|null;reasons:string[]}
export interface Gate {id:string;name:string;state:'pass'|'fail'|'unknown';hard:boolean;reason:string;evidenceIds:string[]}
export interface StrataAssessment {
  id:string;actor:'Strata';instrumentId:string;evaluatedAt:string;direction:Direction;readiness:Readiness;
  evidenceHealth:DataState;supporting:string[];against:string[];unknowns:string[];invalidation:string;
  nextConditions:string[];gates:Gate[];evidenceIds:string[];ruleVersion:string;inputVersion:string;
  hypothetical:boolean;canSubmitOrder:false;
}
export interface OwnerDecision {
  id:string;actor:'J';assessmentId:string;recordedAt:string;decision:'agree'|'disagree'|'wait';
  thesis:string;executionRationale:string;evidenceIds:string[];hardGatesAtDecision:Gate[];
  mayExecute:false;note:'A recorded decision does not waive hard risk or data gates.';
}
export interface DecisionSnapshot {id:string;ownerId:string;createdAt:string;assessment:StrataAssessment;ownerDecision:OwnerDecision|null;evidence:unknown[];inputHash:string;ruleVersion:string;mappingVersions:string[];portfolioVersion:string|null}
export interface PositionSnapshot {accountId:string|null;customerFacingType:string|null;technicalSelector:string|null;instrumentId:string;openCount:number|null;observedAt:string|null;receivedAt:string|null;reconciled:boolean;sourceId:string|null}
export interface RefreshReceipt {id:string;sourceId:string;requestedAt:string;completedAt:string|null;state:DataState;path:'chat'|'hosted-request'|'unattended';accountScope:string|null;action:string;error:string|null;lastGoodAt:string|null}
export interface ServiceResult<T> {state:DataState;data:T|null;receivedAt:string|null;lastGood:T|null;error:string|null;receipt:RefreshReceipt|null}

export const isRecord=(x:unknown):x is Record<string,unknown>=>typeof x==='object'&&x!==null&&!Array.isArray(x);
export const isFiniteNumber=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
/** Only instants with an explicit timezone qualify; date-only corpus precision is never intraday evidence. */
export function instantMs(value:unknown):number|null {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))return null;
  const year=Number(value.slice(0,4)),month=Number(value.slice(5,7)),day=Number(value.slice(8,10));
  if(month<1||month>12||day<1||day>new Date(Date.UTC(year,month,0)).getUTCDate()||Number(value.slice(11,13))>23||Number(value.slice(14,16))>59||Number(value.slice(17,19))>59)return null;
  const time=Date.parse(value);return Number.isFinite(time)?time:null;
}
export function assessFreshness(provenance:Pick<Provenance,'observedAt'|'receivedAt'|'declaredDelayMs'|'origin'|'timestampPrecision'>|null,now:string,policy:FreshnessPolicy):Freshness {
  const result:Freshness={state:'unavailable',eligible:false,eventAgeMs:null,receiptAgeMs:null,reasons:[]};
  const clock=instantMs(now);if(clock===null){result.reasons.push('Invalid evaluation clock.');return result}
  if(!provenance){result.reasons.push('No observation received.');return result}
  if(![policy.maxEventAgeMs,policy.maxReceiptAgeMs,policy.maxDelayMs,policy.clockSkewToleranceMs].every(n=>Number.isFinite(n)&&n>=0)){result.reasons.push('Freshness policy is invalid.');return result}
  const event=instantMs(provenance.observedAt),receipt=instantMs(provenance.receivedAt);
  if(event===null||receipt===null){result.reasons.push('Event and receipt timestamps must be explicit instants.');return result}
  result.eventAgeMs=clock-event;result.receiptAgeMs=clock-receipt;
  if(event>clock+policy.clockSkewToleranceMs||receipt>clock+policy.clockSkewToleranceMs||event>receipt+policy.clockSkewToleranceMs){result.state='failed';result.reasons.push('Future or impossible event/receipt ordering.');return result}
  if(!['millisecond','second','minute'].includes(provenance.timestampPrecision)){result.reasons.push('Timestamp precision cannot support intraday evidence.');return result}
  if(provenance.declaredDelayMs===null||!Number.isFinite(provenance.declaredDelayMs)||provenance.declaredDelayMs<0){result.reasons.push('Provider delay is unknown.');return result}
  if(result.eventAgeMs>policy.maxEventAgeMs)result.reasons.push('Observation exceeds event-age policy.');
  if(result.receiptAgeMs>policy.maxReceiptAgeMs)result.reasons.push('Receipt exceeds refresh-age policy.');
  if(provenance.declaredDelayMs>policy.maxDelayMs)result.reasons.push('Declared provider delay exceeds this use horizon.');
  if(provenance.origin==='hypothetical')result.reasons.push('Hypothetical observations cannot qualify as production evidence.');
  result.state=result.reasons.length?'stale':'loaded';result.eligible=result.state==='loaded';return result;
}
/** Runtime shape and OHLC checks, with bar geometry checked independently of refresh time. */
export function validateBarSeries(input:unknown,now:string):Validation<BarSeries> {
  const issues:string[]=[];
  if(!isRecord(input))return {ok:false,value:null,issues:['BarSeries must be an object.']};
  const clock=instantMs(now);if(clock===null)issues.push('Invalid validation clock.');
  if(typeof input.id!=='string'||!input.id)issues.push('Series snapshot ID required.');
  if(!isFiniteNumber(input.intervalMinutes)||input.intervalMinutes<=0)issues.push('Positive intervalMinutes required.');
  const series=input.series;
  if(!isRecord(series)||!['id','economicAssetId','provider','basis','units'].every(k=>typeof series[k]==='string'&&!!series[k]))issues.push('Market series needs identity, provider, basis and units.');
  if(isRecord(series)){
    if(!['unresolved','candidate','verified'].includes(String(series.mappingStatus)))issues.push('Invalid mapping status.');
    if(!['providerSeriesId','currency','timezone','calendarId','mappingVersion'].every(k=>series[k]===null||typeof series[k]==='string'))issues.push('Series nullable metadata fields required.');
    if(!Array.isArray(series.mappingEvidenceIds)||!series.mappingEvidenceIds.every(x=>typeof x==='string'))issues.push('Mapping evidence IDs required.');
    if(series.mappingStatus==='verified'&&(!series.providerSeriesId||!series.mappingVersion||!Array.isArray(series.mappingEvidenceIds)||!series.mappingEvidenceIds.length))issues.push('Verified mapping requires provider identity, version and evidence.');
  }
  const p=input.provenance;
  if(!isRecord(p)||!['sourceId','provider','scope'].every(k=>typeof p[k]==='string'&&!!p[k])||!['provider','manual','import','hypothetical'].includes(String(p.origin)))issues.push('Valid provenance required.');
  if(isRecord(p)&&(p.sourceFormat!=='structured'||!['millisecond','second','minute'].includes(String(p.timestampPrecision))))issues.push('Bars require structured observations with intraday timestamp precision.');
  if(isRecord(p)&&(instantMs(p.observedAt)===null||instantMs(p.receivedAt)===null))issues.push('Bars require explicit event and receipt instants.');
  if(isRecord(p)){
    if(!['sourceUrl','mappingVersion','contentHash'].every(k=>p[k]===null||typeof p[k]==='string'))issues.push('Provenance nullable metadata fields required.');
    if(p.declaredDelayMs!==null&&(!isFiniteNumber(p.declaredDelayMs)||p.declaredDelayMs<0))issues.push('Declared delay must be nonnegative or unknown.');
  }
  if(!['loaded','empty','partial','stale','failed','unavailable'].includes(String(input.state)))issues.push('Explicit data state required.');
  if(input.lastError!==null&&typeof input.lastError!=='string')issues.push('lastError must be string or null.');
  if(!Array.isArray(input.bars))issues.push('bars must be an array.');
  else {let previousEnd:number|null=null;for(const [i,raw] of input.bars.entries()){
    if(!isRecord(raw)){issues.push(`Bar ${i}: invalid object.`);continue}
    const start=instantMs(raw.start),end=instantMs(raw.end);
    if(start===null||end===null||end<=start){issues.push(`Bar ${i}: invalid boundaries.`);continue}
    if(isFiniteNumber(input.intervalMinutes)&&end-start!==input.intervalMinutes*60000)issues.push(`Bar ${i}: boundaries do not match interval; no synthetic lower-timeframe bars.`);
    if(previousEnd!==null&&start<previousEnd)issues.push(`Bar ${i}: duplicate/overlapping/out-of-order bars.`);
    if(previousEnd!==null&&start>previousEnd&&input.state==='loaded')issues.push(`Bar ${i}: missing interval requires partial state or separate session series.`);
    previousEnd=end;
    if(typeof raw.closed!=='boolean')issues.push(`Bar ${i}: closed state required.`);
    if(raw.closed===true&&clock!==null&&end>clock)issues.push(`Bar ${i}: future bar cannot be closed.`);
    if(!['open','high','low','close'].every(k=>isFiniteNumber(raw[k])))issues.push(`Bar ${i}: OHLC must be finite.`);
    else if((raw.high as number)<Math.max(raw.open as number,raw.close as number,raw.low as number)||(raw.low as number)>Math.min(raw.open as number,raw.close as number))issues.push(`Bar ${i}: inconsistent OHLC bounds.`);
    if(raw.volume!==null&&(!isFiniteNumber(raw.volume)||raw.volume<0))issues.push(`Bar ${i}: volume must be nonnegative or unavailable.`);
  }}
  if(Array.isArray(input.bars)&&input.state==='loaded'&&!input.bars.length)issues.push('Loaded series must contain bars.');
  return issues.length?{ok:false,value:null,issues}:{ok:true,value:input as unknown as BarSeries,issues:[]};
}
export function deepFreeze<T>(value:T):Readonly<T>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child)}return value}
