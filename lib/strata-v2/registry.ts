import {InstrumentRegistry as previousRegistry} from '../strata/registry';
import type {BrokerInstrument} from './contracts';
export const REGISTRY_VERSION='owner-five-cmc-cash-2026-10-21-v2';
export const TRADE_IDS=['GOLD_CASH','SILVER_CASH','SUGAR_RAW_CASH','CRUDE_OIL_CASH','NQ'] as const;
export type TradeInstrumentId=typeof TRADE_IDS[number];
const make=(id:TradeInstrumentId,ownerLabel:string,economicAssetId:string):BrokerInstrument=>({id,ownerLabel,economicAssetId,tradeEnabled:true,broker:'CMC Markets',brokerProductId:null,wrapper:'Spread Betting',basis:null,currency:null,units:null,listing:null,isin:null,mappingStatus:'unresolved',mappingVersion:null,mappingEvidenceIds:[]});
export const TRADE_INSTRUMENTS:readonly BrokerInstrument[]=Object.freeze([
  make('GOLD_CASH','Gold - Cash','gold'),make('SILVER_CASH','Silver - Cash','silver'),make('SUGAR_RAW_CASH','Sugar Raw - Cash','sugar-raw-cmc-cash'),
  make('CRUDE_OIL_CASH','Crude Oil - Cash','crude-cmc-cash-benchmark-unverified'),make('NQ','US NDAQ 100 - Cash — SELL ONLY','nasdaq100-cmc-cash'),
].map(x=>Object.freeze(x)));
/** Preserve broad observed context without inheriting the obsolete traded flags or provider assumptions. */
export const CONTEXT_INSTRUMENTS=previousRegistry.filter(x=>!TRADE_IDS.some(id=>id===x.id)).map(x=>({id:x.id,name:x.name,assetClass:x.assetClass,region:x.region,tradeEnabled:false,source:'prior-owner-watchlist',mappingStatus:'unresolved' as const,notes:x.id==='RUSSELL2000'?'Context-only Russell comparison; separate from the CMC US NDAQ 100 cash execution product.':x.id==='BRENT_CASH'?'Historical Brent comparison reference; does not resolve Crude Oil execution benchmark.':x.id==='SUGAR_RAW_CASH'?'Raw-sugar comparison reference; does not resolve Sugar Cash execution basis.':x.id==='GOLD_CASH'||x.id==='COPPER_CASH'?'Context only under current owner execution allowlist.':'Comparison reference; no execution eligibility.'}));
export const WATCHLIST=[...TRADE_INSTRUMENTS.map(x=>({id:x.id,name:x.ownerLabel,assetClass:x.id==='NQ'?'Unresolved equity product':'Commodities',tradeEnabled:true})),...CONTEXT_INSTRUMENTS];
export const isTradeEnabled=(id:string):id is TradeInstrumentId=>TRADE_IDS.some(x=>x===id);
export const instrumentLabel=(id:string)=>TRADE_INSTRUMENTS.find(x=>x.id===id)?.ownerLabel||CONTEXT_INSTRUMENTS.find(x=>x.id===id)?.name||id;
