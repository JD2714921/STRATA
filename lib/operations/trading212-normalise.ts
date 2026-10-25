import {z} from 'zod';
import {eventSchema,instant,type LedgerEvent} from './contracts';
import type {HistoryKind} from './trading212-history';
const id=z.union([z.string().min(1),z.number().int().safe()]).transform(String);
const money=z.number().finite();
const transaction=z.object({reference:id,dateTime:instant,type:z.string(),amount:money,currency:z.string()}).passthrough();
const dividend=z.object({reference:id,paidOn:instant,amount:money,currency:z.string(),ticker:z.string().optional()}).passthrough();
const execution=z.object({order:z.object({id,side:z.enum(['BUY','SELL']),instrument:z.object({name:z.string(),ticker:z.string(),currency:z.string().optional()}).passthrough()}).passthrough(),fill:z.object({id,filledAt:instant,quantity:money,price:money,type:z.string(),walletImpact:z.object({currency:z.string(),netValue:money.optional(),realisedProfitLoss:money.optional()}).passthrough().optional()}).passthrough()}).passthrough();
/** Expand the provider's JSON number without rounding; unsupported precision stays unmapped. */
export function exactNumber(v:number|undefined){
 if(v===undefined||!Number.isFinite(v))return null;
 const s=String(v);if(!/e/i.test(s))return s;
 const [coefficient,exponent]=s.toLowerCase().split('e'),negative=coefficient.startsWith('-'),unsigned=negative?coefficient.slice(1):coefficient,point=(unsigned.indexOf('.')<0?unsigned.length:unsigned.indexOf('.'))+Number(exponent),digits=unsigned.replace('.','');
 return (negative?'-':'')+(point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point));
}
const plain=exactNumber;
export function normaliseTrading212(kind:HistoryKind,items:Record<string,unknown>[],accountRef:string,receivedAt:string){
 const events:LedgerEvent[]=[],unmapped:Record<string,unknown>[]=[];
 for(const raw of items){
  const base={broker:'Trading 212' as const,accountRef,parentId:null,instrument:null,productType:null,direction:null,openClose:'unknown' as const,quantity:null,price:null,priceCurrency:null,amount:null,fees:null,realisedPnl:null,status:'confirmed' as const,replacesEventId:null,receivedAt,sourceId:'trading212-public-api:'+kind,sourceUrl:'https://docs.trading212.com/api'};
  const accept=(candidate:unknown)=>{const p=eventSchema.safeParse(candidate);if(p.success)events.push(p.data);else unmapped.push(raw);};
  if(kind==='transactions'){const p=transaction.safeParse(raw);if(!p.success){unmapped.push(raw);continue;}const x=p.data,category=x.type==='DEPOSIT'?'deposit':x.type==='WITHDRAW'?'withdrawal':x.type==='FEE'?'fee':'adjustment';accept({...base,eventId:x.reference,grain:'cash-event',category,effectiveAt:x.dateTime,currency:x.currency,amount:plain(x.amount)});}
  else if(kind==='dividends'){const p=dividend.safeParse(raw);if(!p.success){unmapped.push(raw);continue;}const x=p.data;accept({...base,eventId:x.reference,grain:'income',category:'dividend',effectiveAt:x.paidOn,currency:x.currency,amount:plain(x.amount),instrument:x.ticker||null});}
  else{const p=execution.safeParse(raw);if(!p.success){unmapped.push(raw);continue;}const {order:o,fill:f}=p.data;
   if(f.type!=='TRADE'){unmapped.push(raw);continue;}
   accept({...base,eventId:f.id,parentId:o.id,grain:'execution',category:o.side==='BUY'?'purchase':'disposal',direction:o.side,effectiveAt:f.filledAt,instrument:o.instrument.name,quantity:plain(f.quantity),price:plain(f.price),priceCurrency:o.instrument.currency??null,currency:f.walletImpact?.currency??null,amount:plain(f.walletImpact?.netValue),realisedPnl:plain(f.walletImpact?.realisedProfitLoss)});
  }
 }
 return {events,unmapped,complete:unmapped.length===0};
}
