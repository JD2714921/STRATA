import {closeAt,UK_CLOCK,UK_DAY,RESEARCH_CONFIG,type HistoricalSeries,type Feature,type ResearchConfig,type Side} from './types';
import {chronologicalSplit} from './statistics';
import {instantMs} from '../strata-v2/contracts';
/** Research scenario, explicitly NOT an owner TP1 or cost definition. */
export const SCENARIO={...RESEARCH_CONFIG,version:'scenario-1R-half-5R-remainder-v1',tp1R:1,tp1Fraction:0.5,slippagePoints:0,commissionPoints:0} satisfies ResearchConfig;
const nyClock=new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
export function fundingCutoffs(start:string,end:string){let count=0;for(let t=Math.floor(Date.parse(start)/3600000)*3600000;t<=Date.parse(end);t+=3600000)if(t>Date.parse(start)&&nyClock.format(new Date(t))==='17:00')count++;return count;}
export function asOf<T extends {availableAt:string}>(features:T[],time:string){const clock=instantMs(time);if(clock===null)return null;let lo=0,hi=features.length;while(lo<hi){const m=(lo+hi)>>>1,t=instantMs(features[m].availableAt);if(t===null)return null;if(t<=clock)lo=m+1;else hi=m;}const found=lo?features[lo-1]:null,t=instantMs(found?.availableAt);return found&&t!==null&&t<=clock?found:null;}
export function simulatePath(s:HistoricalSeries,start:number,side:Side,stop:number,c:ResearchConfig){
 const first=s.candles[start],sign=side==='BUY'?1:-1,entry=first?(side==='BUY'?first.ask?.o:first.bid?.o):null;
 if(entry===null||entry===undefined||c.tp1R===null||c.tp1Fraction===null||c.tp1Fraction<=0||c.tp1Fraction>=1||c.tp1R<=0||c.tp1R>=5||c.slippagePoints===null||c.commissionPoints===null||c.slippagePoints<0||c.commissionPoints<0)return {status:'unscored',reason:'Quote sides, explicit TP1 scenario, slippage and commission are required.',entry:null,exitIndex:null,grossR:null,costAdjustedR:null,netR:null};
 const fill=entry+sign*c.slippagePoints,risk=sign*(fill-stop);if(!(risk>0))return {status:'unscored',reason:'Invalid structure stop / entry risk.',entry:fill,exitIndex:null,grossR:null,costAdjustedR:null,netR:null};
 const target=fill+sign*5*risk,tp1=fill+sign*c.tp1R*risk;let activeStop=stop,remaining=1,realized=0,tp1At:string|null=null,ambiguous=false,exitIndex:number|null=null,exitPrice:number|null=null,status='unresolved';
 for(let i=start;i<Math.min(s.candles.length,start+c.maxHoldingBars);i++){
  const b=s.candles[i],p=side==='BUY'?b.bid:b.ask;if(!p){status='missing-quote-side';break;}
  if(i>start&&Date.parse(b.time)-Date.parse(s.candles[i-1].time)!==s.intervalMinutes*60000){status='unobserved-gap';break;}
  const stopped=side==='BUY'?p.l<=activeStop:p.h>=activeStop,touched=side==='BUY'?p.h>=target:p.l<=target,firstTarget=remaining===1&&(side==='BUY'?p.h>=tp1:p.l<=tp1);
  // Unknown tick order: adverse stop is always processed before either target.
  if(stopped){ambiguous=touched||firstTarget;exitPrice=side==='BUY'?Math.min(activeStop,p.o):Math.max(activeStop,p.o);exitIndex=i;status=tp1At?'breakeven-stop':'stop';break;}
  if(touched){if(firstTarget){realized+=c.tp1Fraction*c.tp1R;remaining=1-c.tp1Fraction;tp1At=closeAt(s,b);}exitPrice=target;exitIndex=i;status='target';break;}
  if(firstTarget){realized+=c.tp1Fraction*c.tp1R;remaining=1-c.tp1Fraction;tp1At=closeAt(s,b);activeStop=fill;}
  // Breakeven becomes active on the next bar; no inferred intra-bar ordering.
  if(i===Math.min(s.candles.length,start+c.maxHoldingBars)-1){exitPrice=p.c;exitIndex=i;status=i+1===s.candles.length?'censored-end':'time-exit';}
 }
 const grossR=exitPrice===null?null:realized+remaining*sign*(exitPrice-fill)/risk,costAdjustedR=grossR===null?null:grossR-(c.slippagePoints+c.commissionPoints)/risk;
 const multiday=exitIndex!==null&&UK_DAY(s.candles[exitIndex].time)!==UK_DAY(first.time),cutoffs=exitIndex===null?0:fundingCutoffs(first.time,closeAt(s,s.candles[exitIndex])),carryKnown=cutoffs===0||c.carryPerDayPoints!==null;
 return {status,reason:carryKnown?null:'Historical carry unavailable; net result unknown.',entry:fill,stop,target,proposedR:5,tp1At,weightedTargetR:c.tp1Fraction*c.tp1R+(1-c.tp1Fraction)*5,exitIndex,exitAt:exitIndex===null?null:closeAt(s,s.candles[exitIndex]),exitPrice,ambiguous,grossR,costAdjustedR,netR:costAdjustedR===null||!carryKnown?null:costAdjustedR-cutoffs*(c.carryPerDayPoints??0)/risk,riskPoints:risk,multiday,fundingCutoffs:cutoffs,scenarioVersion:c.version};
}
export function simulateSetups(s:HistoricalSeries,features:Feature[],directional:Feature[],higher:Feature[],c:ResearchConfig=RESEARCH_CONFIG){
 const split=chronologicalSplit(features.length,c.holdoutFraction,c.purgeBars),usedDays=new Set<string>();let lastExit=-1;
 type Setup={time:string;index:number;side:Side;partition:string;rejected:boolean;reasons:string[];structuralCandidate:boolean;htfAt:string|null;result:(ReturnType<typeof simulatePath>&{excludedFromValidation:boolean;multidayConfluence:boolean;costModel:string;operationallyEligible:boolean})|null};
 return features.flatMap<Setup>((f,i)=>{
  if(!f.retest)return [];const next=s.candles[i+1],side=f.retest,time=f.availableAt,htf=asOf(directional,time),multi=asOf(higher,time),reasons:string[]=[],clock=UK_CLOCK(time),day=UK_DAY(time);
  const partition=i<split.developmentEndExclusive?'development':i>=split.holdoutStart?'holdout':'purged';
  if(!next||next.time!==time)reasons.push('No contiguous next-bar entry');
  if(s.intervalMinutes!==5&&s.intervalMinutes!==2)reasons.push('Execution requires native 2m or 5m');
  if(s.intervalMinutes===2)reasons.push('2m replay requires a separate 5m+ structural binding; this study replays 5m only');
  if(!(clock>='08:00'&&clock<'10:00'||clock>='14:00'&&clock<'16:30'))reasons.push('Outside UK entry window');
  if(usedDays.has(day))reasons.push('One new position per instrument per UK day');
  if(i<=lastExit)reasons.push('Research model holds one position at a time');
  if(s.instrumentId==='NDAQ_CASH_RESEARCH'&&side==='BUY')reasons.push('NQ sell-only constraint applies even to candidate proxy');
  if(!htf||Date.parse(time)-Date.parse(htf.availableAt)>15*60000||htf.direction!==(side==='BUY'?'Bullish':'Bearish'))reasons.push('15m direction missing, old or contradictory');
  if(partition==='purged')reasons.push('Purged boundary');
  const recent=s.candles.slice(Math.max(0,i-c.retestBars),i+1),stop=side==='BUY'?Math.min(...recent.map(x=>x.bid?.l??x.mid.l)):Math.max(...recent.map(x=>x.ask?.h??x.mid.h));
  if(reasons.length)return [{time,index:i,side,partition,rejected:true,reasons,structuralCandidate:true,htfAt:htf?.availableAt??null,result:null}];
  const result=simulatePath(s,i+1,side,stop,c);if(result.entry!==null){usedDays.add(day);lastExit=result.exitIndex??s.candles.length;}
  const crossesBoundary=partition==='development'&&result.exitIndex!==null&&result.exitIndex>=split.developmentEndExclusive;
  const multidayConfluence=multi?.direction===(side==='BUY'?'Bullish':'Bearish')&&Date.parse(time)-Date.parse(multi.availableAt)<=120*60000;
  return [{time,index:i,side,partition,rejected:false,reasons:[],structuralCandidate:true,htfAt:htf?.availableAt??null,result:{...result,excludedFromValidation:crossesBoundary||!!result.multiday&&!multidayConfluence,multidayConfluence:!!multidayConfluence,costModel:'Observed bid/ask; scenario slippage and commission; carry unknown',operationallyEligible:false}}];
 });
}
