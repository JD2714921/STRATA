import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {seriesSchema} from '../lib/historical/types.ts';
import {loadRound2} from '../lib/historical/round2-catalog.ts';
const root=new URL('../data/round2/',import.meta.url),read=p=>JSON.parse(readFileSync(new URL(p,root),'utf8'));
const manifest=read('manifest.json'),hash=s=>createHash('sha256').update(s).digest('hex');

test('Round 2 loader preserves typed API boundary shapes and rejects unknown outputs',async()=>{
 for(const d of manifest.datasets){const output=await loadRound2(d.id);assert.equal(output.summary.id,d.id);for(const key of ['features','bindings','gaps','chart'])assert.ok(Array.isArray(output[key]),key);assert.equal(output.chart.length,d.bars);assert.ok(Array.isArray(output.elastication.rows));}
 const pairs=await loadRound2('comparisons');assert.ok(Array.isArray(pairs));for(const pair of pairs){assert.equal(typeof pair.a,'string');assert.equal(typeof pair.b,'string');assert.ok(Array.isArray(pair.rows));assert.ok(Array.isArray(pair.latestSMT));}
 const events=await loadRound2('events');for(const key of ['records','statuses','responses'])assert.ok(Array.isArray(events[key]),key);
 await assert.rejects(()=>loadRound2('round5-unknown-output'),/Unknown Round 2 output/);
});
test('all acquired series preserve exact source OHLC and manifest hashes',()=>{
 assert.equal(manifest.datasets.length,15);
 for(const d of manifest.datasets){const s=seriesSchema.parse(read('series/'+d.id+'.json')),raw=read('raw/'+d.id+'.json');assert.equal(s.candles.length,d.bars);assert.equal(raw.response.data.length,d.bars);assert.equal(hash(JSON.stringify(s)),d.inputHash);
  for(let i=0;i<s.candles.length;i++){const b=s.candles[i],r=raw.response.data[i];assert.equal(b.time,new Date(r.t).toISOString());for(const [side,key]of [['mid','m'],['bid','b'],['ask','a']])for(const field of ['o','h','l','c'])assert.equal(b[side][field],Number(r[key][field]));assert.equal(b.volume,r.v??null);}
 }
});
test('all persisted artifact hashes, E_d missingness and as-of execution links reconcile',()=>{
 let unavailable=0,bindings=0;
 for(const a of manifest.artifacts)assert.equal(hash(readFileSync(new URL('results/'+a.name+'.json',root),'utf8')),a.sha256);
 for(const d of manifest.datasets){const r=read('results/'+d.id+'.json');assert.equal(r.elastication.rows.length,d.bars);assert.equal(r.features.length,d.bars);assert.ok(r.elastication.calculatedAt>=d.receivedAt);
  for(const row of r.elastication.rows){assert.equal(row[6],null);assert.equal(row[7],null);assert.equal(row[9],null);assert.equal(row[10],null);assert.equal(row[11],null);assert.ok(row[12].length>0);}
  for(const row of r.bindings){assert.equal(row.state,'STAND DOWN');for(const l of row.links)assert.ok(!l.availableAt||l.availableAt<=row.availableAt);}
  unavailable+=d.bars*2;bindings+=r.bindings.length;
 }
 assert.equal(manifest.edUnavailable,unavailable);assert.equal(manifest.executionRows,bindings);
 const events=read('results/events.json');assert.equal(events.records.length,36);assert.equal(events.statuses.filter(s=>s.fullVintageVerified).length,manifest.events.fullPointInTimeVintages);assert.ok(events.responses.every(r=>r.response===null));
});
