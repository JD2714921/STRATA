import {closeAt,UK_CLOCK,UK_DAY,RESEARCH_CONFIG,type HistoricalSeries,type Feature,type Pivot,type ResearchConfig,type Side} from './types';
/** Wilder ATR: mean of first n true ranges, then ((n-1)*ATR+TR)/n.
 * Intraday missing intervals reset warmup; no invented calendar or resampling. */
export function computeFeatures(s:HistoricalSeries,c:ResearchConfig=RESEARCH_CONFIG,atrPeriod=s.intervalMinutes===5?9:14):Feature[]{
 const n=atrPeriod,rows:Feature[]=[],pivots:Pivot[]=[],ranges:number[]=[],priorAtr:number[]=[],gaps:{id:string;side:Side;low:number;high:number;created:number;filled:boolean}[]=[];
 let atr:number|null=null,segment=0,lastSweep:{side:Side;level:number;index:number}|null=null;
 const openings=new Map<string,{high:number;low:number;breakSide:Side|null;start:number;last:number;resolved:boolean}>();
 for(let i=0;i<s.candles.length;i++){
  const b=s.candles[i],previous=s.candles[i-1],gapBefore=!!previous&&Date.parse(b.time)-Date.parse(previous.time)!==s.intervalMinutes*60000;
  if(gapBefore){segment=i;atr=null;ranges.length=0;priorAtr.length=0;lastSweep=null;gaps.length=0;}
  const tr=!previous||gapBefore?b.mid.h-b.mid.l:Math.max(b.mid.h-b.mid.l,Math.abs(b.mid.h-previous.mid.c),Math.abs(b.mid.l-previous.mid.c));
  ranges.push(tr);if(atr===null&&ranges.length>=n)atr=ranges.slice(-n).reduce((a,x)=>a+x,0)/n;else if(atr!==null)atr=((n-1)*atr+tr)/n;
  const atrPercentile=atr!==null&&priorAtr.length>=20?priorAtr.filter(x=>x<=atr!).length/priorAtr.length:null;
  if(atr!==null){priorAtr.push(atr);if(priorAtr.length>100)priorAtr.shift();}
  const newPivots:Pivot[]=[],candidate=i-c.pivotRight;
  if(candidate-c.pivotLeft>=segment){const base=s.candles[candidate],window=s.candles.slice(candidate-c.pivotLeft,i+1);for(const kind of ['high','low'] as const){const price=kind==='high'?base.mid.h:base.mid.l;const qualifies=window.every((x,k)=>candidate-c.pivotLeft+k===candidate||(kind==='high'?x.mid.h<price:x.mid.l>price));if(qualifies)newPivots.push({kind,price,pivotIndex:candidate,confirmedIndex:i,availableAt:closeAt(s,b)});}}
  // Only previously confirmed levels may be swept, not today's newly confirmed pivot.
  const known=pivots.filter(p=>p.confirmedIndex<i&&p.pivotIndex>=segment),highs=known.filter(p=>p.kind==='high').slice(-2),lows=known.filter(p=>p.kind==='low').slice(-2);
  const direction=highs.length<2||lows.length<2?'Unknown':highs[1].price>highs[0].price&&lows[1].price>lows[0].price?'Bullish':highs[1].price<highs[0].price&&lows[1].price<lows[0].price?'Bearish':'Neutral';
  const buy=!!lows.length&&b.mid.l<lows.at(-1)!.price&&b.mid.c>lows.at(-1)!.price,sell=!!highs.length&&b.mid.h>highs.at(-1)!.price&&b.mid.c<highs.at(-1)!.price;
  const sweep=buy&&sell?'CONFLICT':buy?'BUY':sell?'SELL':null;let retest:Side|null=null;
  if(lastSweep&&i>lastSweep.index&&i-lastSweep.index<=c.retestBars&&atr!==null){const tol=c.retestAtr*atr;if(b.mid.l<=lastSweep.level+tol&&b.mid.h>=lastSweep.level-tol&&(lastSweep.side==='BUY'?b.mid.c>lastSweep.level:b.mid.c<lastSweep.level))retest=lastSweep.side;}
  const outcomes:Feature['gapOutcome']=[];let ifvg:Side|null=null;
  for(let k=gaps.length-1;k>=0;k--){const g=gaps[k];if(i<=g.created)continue;if(i-g.created>200){gaps.splice(k,1);continue;}const inverted=g.side==='BUY'?b.mid.c<g.low:b.mid.c>g.high,filled=g.side==='BUY'?b.mid.l<=g.low:b.mid.h>=g.high;if(inverted){ifvg=g.side==='BUY'?'SELL':'BUY';outcomes.push({id:g.id,state:'inverted',at:closeAt(s,b)});gaps.splice(k,1);}else if(filled&&!g.filled){g.filled=true;outcomes.push({id:g.id,state:'filled',at:closeAt(s,b)});}}
  let fvg:Feature['fvg']=null;
  if(s.intervalMinutes>=5&&i-2>=segment){const a=s.candles[i-2];if(b.mid.l>a.mid.h)fvg={side:'BUY',low:a.mid.h,high:b.mid.l};else if(b.mid.h<a.mid.l)fvg={side:'SELL',low:b.mid.h,high:a.mid.l};if(fvg)gaps.push({id:s.id+':gap:'+i,...fvg,created:i,filled:false});}
  if(sweep==='BUY'||sweep==='SELL')lastSweep={side:sweep,level:sweep==='BUY'?lows.at(-1)!.price:highs.at(-1)!.price,index:i};else if(sweep==='CONFLICT')lastSweep=null;
  // Observable opening-range break-and-reentry; no claim of participant intent.
  const clock=UK_CLOCK(b.time),day=UK_DAY(b.time),minute=Number(clock.slice(0,2))*60+Number(clock.slice(3));let openingReversal:Side|null=null;
  for(const start of [480,840]){if(minute<start||minute>=start+c.openingReversalMinutes)continue;const key=day+':'+start;let o=openings.get(key);if(!o&&minute===start){o={high:b.mid.h,low:b.mid.l,breakSide:null,start,last:i,resolved:false};openings.set(key,o);}if(!o)continue;if(i>o.last+1||gapBefore){openings.delete(key);continue;}o.last=i;if(o.resolved)continue;if(minute<start+c.openingRangeMinutes){o.high=Math.max(o.high,b.mid.h);o.low=Math.min(o.low,b.mid.l);}else{if(o.breakSide==='SELL'&&b.mid.c>o.low)openingReversal='BUY';if(o.breakSide==='BUY'&&b.mid.c<o.high)openingReversal='SELL';if(openingReversal)o.resolved=true;if(!o.breakSide){if(b.mid.c>o.high)o.breakSide='BUY';else if(b.mid.c<o.low)o.breakSide='SELL';}}}
  pivots.push(...newPivots);
  rows.push({index:i,sourceTime:b.time,availableAt:closeAt(s,b),atr,atrPeriod:n,atrPercentile,volatility:atrPercentile===null?'warmup':atrPercentile<=0.2?'low':atrPercentile>=0.8?'high':'normal',direction,pivots:newPivots,sweep,level:sweep==='BUY'?lows.at(-1)?.price??null:sweep==='SELL'?highs.at(-1)?.price??null:lastSweep?.level??null,retest,fvg,ifvg,gapOutcome:outcomes,openingReversal,gapBefore});
 }
 return rows;
}
