import {computeFeatures} from './features';
import {RESEARCH_CONFIG,type HistoricalSeries,type Feature,closeAt} from './types';
import {allowedSide} from './plan';
import {instantMs} from '../strata-v2/contracts';
export const BINDING_VERSION='v25-round2-execution-research-v1';
export const atrPeriodFor=(minutes:number)=>minutes===5?9:minutes>=60?27:14;
export function executionFeatures(s:HistoricalSeries){return computeFeatures(s,RESEARCH_CONFIG,atrPeriodFor(s.intervalMinutes));}
export type CalculatedSeries={series:HistoricalSeries;features:Feature[]};
export function latestFeature(rows:Feature[],at:string,maxAgeMinutes:number){
 const clock=instantMs(at);if(clock===null||!Number.isFinite(maxAgeMinutes)||maxAgeMinutes<0)return null;
 let lo=0,hi=rows.length-1,found:Feature|null=null;
 while(lo<=hi){const mid=(lo+hi)>>1,time=instantMs(rows[mid].availableAt);if(time===null)return null;if(time<=clock){found=rows[mid];lo=mid+1;}else hi=mid-1;}
 const time=instantMs(found?.availableAt);return found&&time!==null&&clock-time>=0&&clock-time<=maxAgeMinutes*60000?found:null;
}
/** Each source row is linked as-of its assumed close. Unknown source anchors stay an explicit hard block. */
export function bindExecution(entry:CalculatedSeries,all:CalculatedSeries[]){
 if(![2,5].includes(entry.series.intervalMinutes))return [];
 const s=entry.series,find=(m:number)=>all.find(x=>x.series.instrumentId===s.instrumentId&&x.series.intervalMinutes===m);
 const five=find(5),direction=find(15),hour=find(60),holding=find(120);
 return entry.features.map((f,i)=>{
  const at=f.availableAt,structure=latestFeature(five?.features||[],at,5),confirmation=latestFeature(direction?.features||[],at,15),hourly=latestFeature(hour?.features||[],at,60),multiday=latestFeature(holding?.features||[],at,120);
  const candidate=structure?.retest||structure?.openingReversal||null;
  const links=[{purpose:'5m structure / sweep / retest / FVG / IFVG / ATR9',datasetId:five?.series.id??null,feature:structure},{purpose:'15m directional confirmation / ATR14',datasetId:direction?.series.id??null,feature:confirmation},{purpose:'1H ATR27',datasetId:hour?.series.id??null,feature:hourly},{purpose:'2H multiday holding context / ATR27',datasetId:holding?.series.id??null,feature:multiday}];
  const blocked=['Research definitions lack operational validation','Directional Q_d unavailable','Historical observations cannot establish current freshness'];
  const selected=[entry,five,direction,hour,holding].filter((x):x is CalculatedSeries=>!!x);
  if(selected.some(x=>x.series.timestampMeaning==='unknown'||!x.series.closedStateVerified||!x.series.calendarVerified))blocked.push('Bar anchors, closed state or historical calendar unverified');
  if(!s.mappingVerified)blocked.push('Exact account-compatible product mapping unresolved');
  for(const l of links)if(!l.feature)blocked.push(l.purpose+' unavailable as of entry');
  if(!candidate)blocked.push('5m structural candidate unavailable');
  if(candidate&&!allowedSide(s.instrumentId,candidate))blocked.push('Direction outside authorised product policy');
  if(candidate&&confirmation?.direction!==(candidate==='BUY'?'Bullish':'Bearish'))blocked.push('15m direction absent or contradictory');
  return {index:i,time:s.candles[i].time,availableAt:at,entryTimeframe:s.intervalMinutes,structure2m:f.direction,structure5m:structure?.direction??'Unknown',candidate,links:links.map(l=>({purpose:l.purpose,datasetId:l.datasetId,availableAt:l.feature?.availableAt??null,index:l.feature?.index??null})),liquidityGrab:structure?.sweep??null,retest:structure?.retest??null,fvg:structure?.fvg??null,ifvg:structure?.ifvg??null,atr9:structure?.atr??null,atr14:confirmation?.atr??null,atr27:hourly?.atr??null,holdingDirection:multiday?.direction??'Unknown',holdingState:multiday?'research-only':'unavailable',openingReversal:structure?.openingReversal??null,judasSwing:'Opening break-and-reentry research proxy; participant intent unmeasured',elastication:'unavailable',state:'STAND DOWN',blocked,canSubmitOrder:false};
 });
}
/** Strict event alignment: unknown bar anchors never produce a measured response. */
export function alignedEventResponse(time:string|null,s:HistoricalSeries,minutes:number){
 if(!time||s.timestampMeaning==='unknown'||!s.closedStateVerified)return {state:'unavailable',response:null,reason:'Release time or verified bar boundaries / closed state unavailable'};
 const t=Date.parse(time),end=t+minutes*60000;
 const pre=s.candles.findIndex(b=>Date.parse(closeAt(s,b))===t),post=s.candles.findIndex(b=>Date.parse(closeAt(s,b))===end);
 if(pre<0||post<0||post-pre!==minutes/s.intervalMinutes)return {state:'unavailable',response:null,reason:'Exact endpoints unavailable'};
 for(let i=pre+1;i<=post;i++)if(Date.parse(s.candles[i].time)-Date.parse(s.candles[i-1].time)!==s.intervalMinutes*60000)return {state:'unavailable',response:null,reason:'Unobserved interval in response window'};
 if(s.candles[pre].mid.c<=0)return {state:'unavailable',response:null,reason:'Invalid price baseline'};
 return {state:'measured',response:s.candles[post].mid.c/s.candles[pre].mid.c-1,baseTime:closeAt(s,s.candles[pre]),endTime:closeAt(s,s.candles[post]),sourceId:s.sourceId,reason:null};
}
