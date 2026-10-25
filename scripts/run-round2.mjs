// Deterministic, offline reproduction from retained provider observations.
import '../tests/core-register.mjs';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {seriesSchema,closeAt} from '../lib/historical/types.ts';
import {Q_DEFINITION,calculateElastication,ELASTICATION_VERSION} from '../lib/historical/elastication.ts';
import {executionFeatures,bindExecution,alignedEventResponse,BINDING_VERSION} from '../lib/historical/execution-binding.ts';
import {eventVintageSchema,eventVintageStatus} from '../lib/historical/event-vintages.ts';
import {rollingCorrelations,smtDivergence} from '../lib/historical/statistics.ts';
const root=resolve('data/round2'),read=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const files=readdirSync(resolve(root,'series')).filter(x=>x.endsWith('.json')).sort();
if(files.length!==15)throw Error('All 15 acquired instrument/timeframe receipts must be present before generation');
const calculated=files.map(file=>{const series=seriesSchema.parse(read('series/'+file));return {series,features:executionFeatures(series)};});
const receipts=read('receipts.json'),source=read('event-sources.json');
const clockPath=resolve(root,'calculation-clock.json'),inputsHash=hash({series:calculated.map(x=>x.series),receipts,source});
const previousClock=existsSync(clockPath)?read('calculation-clock.json'):null;
const clock=previousClock?.inputsHash===inputsHash?previousClock:{inputsHash,calculatedAt:new Date().toISOString()};
writeFileSync(clockPath,JSON.stringify(clock,null,2));
const legacy=JSON.parse(readFileSync(resolve('data/historical/releases.json'),'utf8'));
const events=source.observations.map(e=>eventVintageSchema.parse({eventId:e.id,kind:'scheduled',referencePeriod:null,releaseTimePrecision:e.releaseAt?'minute':'day',publishedAt:e.releaseAt??null,receivedAt:source.receivedAt,consensus:null,previous:null,revisedPrevious:null,multiplier:1,vintagePublishedAt:e.vintage==='first-release'?e.releaseAt:null,consensusPublishedAt:null,consensusSourceUrl:e.consensus!=null?source.consensusEvidence.url:null,consensusTimeZoneVerified:false,revisionOf:null,syndicationGroupId:e.id,notes:e.consensus!=null?'Consensus discovered via Bigdata / FXStreet; source timestamp timezone unverified.':'Missing consensus and revision metadata remain null.',...e}));
// Retrospective calendar rows retain their original unverified vintage and raw source archive.
for(const e of legacy.events)events.push(eventVintageSchema.parse({id:e.id,eventId:e.id,kind:'scheduled',country:e.country==='GB'?'GB':'US',category:e.name.includes('Consumer Price')?'CPI':e.name.includes('Producer Price')?'PPI':e.name.includes('Unemployment')?'unemployment':/Payroll|Employment|Earnings|Claimant/.test(e.name)?'employment':/Fed|FOMC|BoE/.test(e.name)?'monetary-policy':'other',name:e.name,referencePeriod:e.raw?.period_date??null,releaseDate:e.time.slice(0,10),releaseAt:e.time,releaseTimePrecision:'minute',publishedAt:null,receivedAt:e.receivedAt,actual:e.actual,consensus:e.consensus,previous:e.raw?.previous??null,revisedPrevious:e.raw?.revised??null,units:e.unit,multiplier:e.multiplier,sourceUrl:'https://www.fxstreet.com/economic-calendar',publisher:'FXStreet via Bigdata calendar',vintage:'unknown',vintagePublishedAt:null,consensusPublishedAt:null,consensusSourceUrl:null,consensusTimeZoneVerified:false,sourceEvidence:'Original retrospective provider calendar archive: data/historical/releases.json',revisionOf:null,syndicationGroupId:e.id,notes:'Retained original calendar values. Revised-previous field does not prove a first-release or revision vintage.'}));
const statuses=events.map(eventVintageStatus),out=resolve(root,'results');mkdirSync(out,{recursive:true});
const artifacts=[];
const write=(name,data)=>{const bytes=JSON.stringify(data);writeFileSync(resolve(out,name+'.json'),bytes);artifacts.push({name,sha256:hash(bytes),bytes:Buffer.byteLength(bytes)});};
const summaries=[];
for(const entry of calculated){
 const s=entry.series,dt=s.intervalMinutes*60000;
 const gaps=s.candles.slice(1).flatMap((b,i)=>{const elapsed=Date.parse(b.time)-Date.parse(s.candles[i].time);return elapsed===dt?[]:[{before:s.candles[i].time,after:b.time,elapsedMinutes:elapsed/60000,missingExpectedSlots:Number.isInteger(elapsed/dt)?elapsed/dt-1:null,classification:'unclassified; historical calendar not verified'}];});
 // Compact rows preserve original P and explicit null Q values; shared headers retain units, definition, safeguards and provenance.
 const reasonDictionary=[],reasonIds=rs=>rs.map(r=>{let n=reasonDictionary.indexOf(r);if(n<0){n=reasonDictionary.length;reasonDictionary.push(r);}return n;});
 const elastication=s.candles.map((b,i)=>{
  const p=s.candles[i-1],start=p?.time??new Date(Date.parse(b.time)-dt).toISOString(),pEnd=p?closeAt(s,p):b.time,end=closeAt(s,b);
  const obs=(value,start,end)=>({value,start,end,availableAt:s.receivedAt,sourceId:s.sourceId});
  const r=calculateElastication({instrumentId:s.instrumentId,timeframeMinutes:s.intervalMinutes,direction:'BUY',calculatedAt:clock.calculatedAt,timingVerified:s.timestampMeaning!=='unknown'&&s.closedStateVerified,priceUnits:'provider USD price points',priceSource:s.sourceId,qDefinition:{definition:Q_DEFINITION.definition,units:null,kind:'unavailable',directionAttributed:false,method:Q_DEFINITION.reason},q0:obs(null,start,pEnd),q1:obs(null,b.time,end),p0:obs(p?.mid.c??null,start,pEnd),p1:obs(b.mid.c,b.time,end)});
  return [b.time,start,pEnd,end,p?.mid.c??null,b.mid.c,null,null,r.pctP,r.pctQ,r.signedRatio,r.magnitude,reasonIds(r.reasons)];
 });
 const bindings=bindExecution(entry,calculated);
 const summary={id:s.id,instrumentId:s.instrumentId,displayName:s.displayName,timeframe:s.intervalMinutes,bars:s.candles.length,from:s.candles[0]?.time,to:s.candles.at(-1)?.time,receivedAt:s.receivedAt,sourceTimestamp:s.candles.at(-1)?.time,sourceId:s.sourceId,inputHash:hash(s),rawHash:hash(readFileSync(resolve(root,'raw',s.id+'.json'),'utf8')),atrPeriod:entry.features[0]?.atrPeriod,atrAvailable:entry.features.filter(f=>f.atr!==null).length,gaps:gaps.length,calendarVerified:s.calendarVerified,mappingVerified:s.mappingVerified,timestampMeaning:s.timestampMeaning,closedStateVerified:s.closedStateVerified,volumeObserved:s.candles.filter(b=>b.volume!==null).length,volumeIsDirectional:false,edValid:0,edUnavailable:s.candles.length*2,executionRows:bindings.length,state:'STAND DOWN'};
 summaries.push(summary);
 write(s.id,{version:BINDING_VERSION,summary,calendar:{state:'unverified',sessionReceipt:'data/round2/receipts.json',note:'Current/upcoming local sessions do not verify historical holidays.'},gaps,features:entry.features,bindings,elastication:{version:ELASTICATION_VERSION,definition:Q_DEFINITION,priceUnits:'provider USD price points',calculatedAt:clock.calculatedAt,sourceReceivedAt:s.receivedAt,sourceId:s.sourceId,timeframeMinutes:s.intervalMinutes,window:'Adjacent equal-length source candles under explicitly unverified open-time anchoring',minimumAbsPriceChangePct:0.001,directions:['BUY','SELL'],directionsShareRowsBecauseBothQdUnavailable:true,comparison:{state:'unavailable',validHistoricalSample:0,median:null,percentile:null,reason:'No valid directional E_d history'},columns:['sourceTime','baselineWindowStart','baselineWindowEnd','currentWindowEnd','p0','p1','q0','q1','pctP','pctQ','signedRatio','absoluteEd','reasonIds'],reasonDictionary,rows:elastication},chart:s.candles.map((b,i)=>({time:b.time,open:b.mid.o,high:b.mid.h,low:b.mid.l,close:b.mid.c,index:i}))});
}
const comparisons=[];
for(let i=0;i<calculated.length;i++)for(let j=i+1;j<calculated.length;j++){
 const a=calculated[i],b=calculated[j];if(a.series.intervalMinutes!==b.series.intervalMinutes||a.series.instrumentId===b.series.instrumentId)continue;
 // Reject returns spanning any missing interval. Re-start rolling windows after each discontinuity.
 const common=new Map(b.series.candles.map(x=>[x.time,x]));let segmentA=[],segmentB=[],rows=[];
 const flush=()=>{if(segmentA.length>1)rows.push(...rollingCorrelations({...a.series,candles:segmentA},{...b.series,candles:segmentB}));segmentA=[];segmentB=[];};
 for(const c of a.series.candles){const d=common.get(c.time);if(!d){flush();continue;}if(segmentA.length&&Date.parse(c.time)-Date.parse(segmentA.at(-1).time)!==a.series.intervalMinutes*60000)flush();if(c.mid.c<=0||d.mid.c<=0){flush();continue;}segmentA.push(c);segmentB.push(d);}flush();
 const ap=a.features.flatMap(x=>x.pivots),bp=b.features.flatMap(x=>x.pivots),last=a.features.at(-1);
 comparisons.push({a:a.series.id,b:b.series.id,timeframe:a.series.intervalMinutes,rows,latestSMT:last?smtDivergence(ap,bp,last.availableAt,a.series.intervalMinutes*4,'direct'):[],relationship:'Direct relationship is an unapproved research assumption',timingVerified:false,canAuthoriseTrade:false});
}
write('comparisons',comparisons);
write('events',{records:events,statuses,responses:events.filter(e=>e.kind==='scheduled').flatMap(e=>calculated.filter(x=>x.series.intervalMinutes===15).flatMap(x=>[15,60,120].map(minutes=>({eventId:e.id,instrumentId:x.series.instrumentId,minutes,...alignedEventResponse(e.releaseAt,x.series,minutes)}))))});
const manifest={version:BINDING_VERSION,baselineCommit:receipts.baselineCommit,generatedAt:clock.calculatedAt,sourceReceipt:'data/round2/receipts.json',datasets:summaries,artifacts,qDefinition:Q_DEFINITION,edValid:0,edUnavailable:summaries.reduce((n,x)=>n+x.edUnavailable,0),executionRows:summaries.reduce((n,x)=>n+x.executionRows,0),events:{records:events.length,scheduled:events.filter(e=>e.kind==='scheduled').length,unscheduled:events.filter(e=>e.kind==='unscheduled').length,firstReleaseActualVintages:statuses.filter(s=>s.firstReleaseActualVerified).length,fullPointInTimeVintages:statuses.filter(s=>s.fullVintageVerified).length,missingCoverage:source.remainingCoverage},trading212:{credentialsConfigured:false,environmentRevision:0,accountVerified:false,historicalOhlcSupported:false,setup:'Configure TRADING212_API_KEY and TRADING212_API_SECRET as secret runtime values, plus explicit TRADING212_ENVIRONMENT (live or demo), then run the authenticated read-only status and account checks.'},unresolvedProducts:['Sugar Raw - Cash','Crude Oil - Cash'],limitations:['Retained source periods may be truncated by provider retention or requested maximum; no fabricated fill','Historical bar anchoring, closed flags and holiday calendar remain unverified','No direction-attributed Q_d or verified Q_d units','Consensus source timezone and complete revision chains unverified','Yield histories unavailable from inspected Trading 212 public contract','All definitions, correlations, SMT and Judas proxies are research-only; STAND DOWN'],canSubmitOrder:false};
writeFileSync(resolve(root,'manifest.json'),JSON.stringify(manifest,null,2));
const loaders=artifacts.map(a=>`${JSON.stringify(a.name)}:()=>import(${JSON.stringify('../../data/round2/results/'+a.name+'.json?raw')})`).join(',\n');
writeFileSync(resolve('lib/historical/round2-catalog.ts'),`// Generated by scripts/run-round2.mjs. Server only.\nexport const round2Loaders={${loaders}};\nexport async function loadRound2(id:string):Promise<unknown>{const f=round2Loaders[id as keyof typeof round2Loaders];if(!f)throw Error('Unknown Round 2 output');return JSON.parse((await f()).default);}\n`);
console.log(JSON.stringify({datasets:summaries,edValid:manifest.edValid,edUnavailable:manifest.edUnavailable,executionRows:manifest.executionRows,events:manifest.events},null,2));
