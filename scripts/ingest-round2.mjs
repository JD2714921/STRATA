// Provider data ingestion over stdin. No credentials, network, or broker writes.
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {resolve} from 'node:path';
const root=resolve('data/round2');
const inputFile=process.argv[2];
if(process.stdin.isTTY&&!inputFile)process.stdin.setRawMode(true);
console.log('Ready for provider receipt JSON on stdin');
const identities={GOLD_CASH:'Gold - Cash',SILVER_CASH:'Silver - Cash',NQ:'US NDAQ 100 - Cash'};
for await(const line of inputFile?[readFileSync(inputFile,'utf8')]:createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false})){
 if(!line.trim())continue;
 const x=JSON.parse(line);
 if(x.kind==='finish'){console.log('Ingestion complete');break;}
 if(x.kind==='receipt'){mkdirSync(root,{recursive:true});writeFileSync(resolve(root,'receipts.json'),JSON.stringify(x.data,null,2));continue;}
 if(!identities[x.instrumentId]||![2,5,15,60,120].includes(x.minutes)||!Array.isArray(x.response?.data)||x.response.data.length>20000)throw Error('Invalid scoped provider receipt');
 const id=`r2-${x.instrumentId.toLowerCase()}-${x.minutes}m-20261021`;
 const series={id,instrumentId:x.instrumentId,displayName:identities[x.instrumentId],provider:'CMC Markets',intervalMinutes:x.minutes,receivedAt:x.receivedAt,timestampMeaning:'unknown',closedStateVerified:false,calendarVerified:false,mappingVerified:true,mappingNote:'Round 2 exact Live GBP SB cash-product match. Timestamp anchoring, closed state and historical holiday calendar unverified.',sourceId:id+'-provider',candles:x.response.data.map(c=>({time:new Date(c.t).toISOString(),mid:Object.fromEntries(Object.entries(c.m).map(([k,v])=>[k,Number(v)])),bid:Object.fromEntries(Object.entries(c.b).map(([k,v])=>[k,Number(v)])),ask:Object.fromEntries(Object.entries(c.a).map(([k,v])=>[k,Number(v)])),volume:c.v??null}))};
 for(const [folder,data]of [['raw',x],['series',series]]){mkdirSync(resolve(root,folder),{recursive:true});writeFileSync(resolve(root,folder,id+'.json'),JSON.stringify(data));}
 if(inputFile){const receipts=JSON.parse(readFileSync(resolve(root,'receipts.json'),'utf8')),previous=receipts.reads.find(r=>r.id===id);receipts.priorBoundedRequests=[...(receipts.priorBoundedRequests||[]),previous];receipts.reads=receipts.reads.map(r=>r.id===id?{...r,returnedBars:series.candles.length,from:series.candles[0].time,to:series.candles.at(-1).time,receivedAt:x.receivedAt,maxIntervals:x.requested.maxIntervals}:r);writeFileSync(resolve(root,'receipts.json'),JSON.stringify(receipts,null,2));}
 console.log(JSON.stringify({id,bars:series.candles.length}));
}
if(process.stdin.isTTY&&!inputFile)process.stdin.setRawMode(false);
process.stdin.pause();
