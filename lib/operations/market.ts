import {quoteSchema,type EvidencePacket} from './contracts';
import {instantMs} from '../strata-v2/contracts';
export const CMC_CAPABILITY={liveEnabled:false,checkedAt:'2026-10-22',source:'CMC Connect current get_price description: live pricing disabled; use get_delayed_price',delayMinutes:15,hostedReadVerified:false} as const;
export function assessQuote(raw:unknown,now:string,liveEnabled:boolean=CMC_CAPABILITY.liveEnabled){
 const p=quoteSchema.safeParse(raw);if(!p.success)return {state:'UNAVAILABLE',eligibleForEntry:false,quote:null,reasons:['Invalid quote contract']};
 const q=p.data,at=instantMs(q.observedAt),receipt=instantMs(q.receivedAt),clock=instantMs(now),reasons:string[]=[];
 if(clock===null||at===null||receipt===null)reasons.push('Quote observation/receipt time unavailable');
 else{if(at>clock||receipt>clock||at>receipt)reasons.push('Future or impossible quote time');if(clock-at>30*60000||clock-receipt>30*60000)reasons.push('Quote stale');if(q.priceMode==='DELAYED'&&receipt-at<q.delayMinutes*60000)reasons.push('Delayed quote incorrectly stamped current');}
 if(q.bid===null||q.ask===null||!Number.isFinite(Number(q.bid))||!Number.isFinite(Number(q.ask))||Number(q.bid)<=0||Number(q.bid)>Number(q.ask))reasons.push('Bid/ask unavailable, invalid or inverted');
 if([q.mid,q.spread].some(v=>v!==null&&!Number.isFinite(Number(v))))reasons.push('Quote contains an unrepresentable numeric observation');
 if(q.priceMode==='LIVE'&&(!liveEnabled||q.delayMinutes!==0))reasons.push('Provider live capability disabled or quote delayed');
 if(q.priceMode==='DELAYED'&&q.delayMinutes!==15)reasons.push('CMC delay differs from current verified capability');
 const marketAt=instantMs(q.marketStatusObservedAt),marketCurrent=clock!==null&&marketAt!==null&&clock>=marketAt&&clock-marketAt<=120000;
 const execution=q.priceMode==='LIVE'&&liveEnabled&&q.delayMinutes===0&&!!at&&clock!==null&&clock-at<=120000&&marketCurrent&&q.marketStatus==='Open'&&q.priceAccess==='Valid'&&!reasons.length;
 return {state:reasons.length?'UNAVAILABLE':q.priceMode,eligibleForEntry:execution,quote:q,marketStatusCurrent:marketCurrent,reasons};
}
export function validatePacketAt(packet:EvidencePacket,now:string){return {quotes:packet.quotes.map(q=>assessQuote(q,now)),news:packet.news.filter(n=>[n.receivedAt,n.publishedAt,n.consensusPublishedAt].every(t=>t===null||Date.parse(t)<=Date.parse(now))),weather:packet.weather.filter(w=>Date.parse(w.observedAt)<=Date.parse(w.receivedAt)&&Date.parse(w.receivedAt)<=Date.parse(now)),issues:packet.issues};}
