import {z} from 'zod';
export const SOURCE_POLICY_VERSION='owner-routing-2026-10-21-v1';
/** Market-data authority is distinct from execution permission and news provenance. */
export const CMC_EXECUTION_PRODUCTS=Object.freeze([
 {id:'GOLD_CASH',name:'Gold - Cash',sides:['BUY','SELL']},
 {id:'SILVER_CASH',name:'Silver - Cash',sides:['BUY','SELL']},
 {id:'SUGAR_RAW_CASH',name:'Sugar Raw - Cash',sides:['BUY','SELL']},
 {id:'CRUDE_OIL_CASH',name:'Crude Oil - Cash',sides:['BUY','SELL']},
 {id:'NQ',name:'US NDAQ 100 - Cash',sides:['SELL']},
]);
const normalize=(x:string)=>x.trim().replace(/\s+/g,' ').toLocaleLowerCase('en-GB');
export function cmcProduct(idOrExactName:string){return CMC_EXECUTION_PRODUCTS.find(p=>p.id===idOrExactName||normalize(p.name)===normalize(idOrExactName));}
export function marketSource(idOrExactName:string){const product=cmcProduct(idOrExactName);return {version:SOURCE_POLICY_VERSION,provider:product?'cmc':'trading212',lane:product?'execution-market':'context-portfolio',instrument:idOrExactName,productName:product?.name??null,priceCoverage:'requires-verified-product-and-timestamp',automaticFallback:false,newsIsPriceConfirmation:false} as const;}
export function assertMarketSource(provider:string,idOrExactName:string){const selected=marketSource(idOrExactName);if(provider!==selected.provider)throw Error(`${provider} is not authorised for direct market data for ${idOrExactName}; assigned source is ${selected.provider}.`);return selected;}
export const TRADING212_COVERAGE=Object.freeze([
 {need:'Account, holdings and held-security currentPrice',state:'documented-read-path',note:'Invest / Stocks ISA; secure credentials and explicit environment required. currentPrice has no separate quote timestamp; receipt time is not observation time.'},
 {need:'Stocks, ETFs and parent-company security identities',state:'documented-metadata-path',note:'Resolve actual accessible catalog, listing, ISIN and currency; corporate-parent relationships still require sourced research.'},
 {need:'Treasuries, UK gilts and other bonds',state:'unverified-coverage',note:'Exact accessible bond or ETF must be verified. A bond ETF price is not a Treasury/gilt yield or underlying bond quote.'},
 {need:'Spot Forex and currencies',state:'unverified-coverage',note:'FOREX appears in the metadata type enum; this does not prove an accessible spot-FX quote feed for this Invest/ISA account.'},
 {need:'Unheld-security quotes, historical OHLC, intraday bars and yield curves',state:'not-in-inspected-public-api',note:'No general quote/bar/yield endpoint found in the inspected public API. Leave unavailable; do not route silently to CMC or substitute a different series.'},
]);
export const NEWS_SOURCES=Object.freeze([
 {id:'bigdata',name:'Bigdata.com',url:'https://bigdata.com',kind:'research-connector'},
 {id:'investment-banking',name:'Investment Banking',url:null,kind:'research-workflow'},
 {id:'market-research',name:'Market Research Analyst',url:null,kind:'research-workflow'},
 {id:'data',name:'Data',url:null,kind:'analysis-workflow'},
 {id:'forexfactory',name:'Forex Factory',url:'https://www.forexfactory.com/calendar',kind:'calendar-publisher'},
 {id:'bloomberg',name:'Bloomberg',url:'https://www.bloomberg.com',kind:'publisher'},
 {id:'yahoo',name:'Yahoo Finance',url:'https://finance.yahoo.com',kind:'publisher-aggregator'},
 {id:'reuters',name:'Reuters',url:'https://www.reuters.com',kind:'publisher'},
 {id:'wsj',name:'The Wall Street Journal',url:'https://www.wsj.com',kind:'publisher'},
 {id:'bbc',name:'BBC',url:'https://www.bbc.com/news',kind:'publisher'},
 {id:'gb-news',name:'GB News',url:'https://www.gbnews.com',kind:'publisher'},
 {id:'official',name:'Central banks, statistical agencies, issuers and exchanges',url:null,kind:'primary-source'},
]);
export const NEWS_REGIONS=['Global','China','Middle East','Russia','Africa','United Kingdom','Europe','Americas','Asia Pacific'] as const;
/** A workflow/plugin is not an independent publisher or a market-price confirmation. */
export const newsEvidenceSchema=z.object({id:z.string().min(1),discoveryProviderId:z.string().min(1),publisher:z.string().min(1),originalUrl:z.string().url(),publishedAt:z.string().datetime({offset:true}).nullable(),firstSeenAt:z.string().datetime({offset:true}).nullable(),receivedAt:z.string().datetime({offset:true}),region:z.enum(NEWS_REGIONS),syndicationGroupId:z.string().min(1),evidenceType:z.enum(['reporting','official-release','consensus','opinion','interpretation']),verified:z.boolean()}).strict();
export function uniqueNewsEventCount(raw:unknown[]){return new Set(raw.map(x=>newsEvidenceSchema.parse(x).syndicationGroupId)).size;}
export const NEWS_POLICY={sources:NEWS_SOURCES,regions:NEWS_REGIONS,independentPriceConfirmation:false,paywallBypass:false,unverifiedConsensusClearsGate:false,sourceCountIsConfirmationCount:false,principle:'Keep publisher, original link, publication/first-seen/receipt times, regional context and syndication group. Attribute analysis separately; verify material claims against original sources.'};
