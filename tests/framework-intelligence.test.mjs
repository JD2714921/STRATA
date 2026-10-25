import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {FRAMEWORK_REGISTRY,assessFrameworks,loadFrameworkRegistry,COMPARISONS} from '../lib/framework-intelligence/engine.ts';
import * as frameworkEngine from '../lib/framework-intelligence/engine.ts';
import * as frameworkContracts from '../lib/framework-intelligence/contracts.ts';
import {assessmentSchema,registrySchema} from '../lib/framework-intelligence/contracts.ts';
import {assessConfluence} from '../lib/historical/confluence.ts';
import {evaluateReadiness} from '../lib/strata-v2/rules.ts';
import {executionFeatures,atrPeriodFor} from '../lib/historical/execution-binding.ts';
import {calculateElastication} from '../lib/historical/elastication.ts';
import {confluenceFixture} from './framework-fixtures.mjs';

const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const baseline=json('../data/framework-intelligence/execution-baseline.json');
const registry=FRAMEWORK_REGISTRY;
const after='2026-10-23T08:00:00.000Z';
const context=(patch={})=>({instrument_id:'SILVER_CASH',event_id:'fixture-event',as_of:after,horizon:'macro',topics:['debt','model-risk'],evidence:[],...patch});
let evidenceSequence=0;
const evidence=(t='debt',patch={})=>({id:'fixture-'+(++evidenceSequence),instrument_id:'SILVER_CASH',event_id:'fixture-event',topic:t,statement:'Synthetic test observation, not market evidence',kind:'observation',verification:'verified',role:'support',circle:'market',observed_at:'2026-10-23T07:00:00Z',published_at:'2026-10-23T07:01:00Z',received_at:'2026-10-23T07:02:00Z',revision_available_at:null,valid_until:null,source_id:'test-only',source_locator:'fixture-only',...patch});

test('all five profiles and 38 unique concepts have hashed secondary provenance and complete records',()=>{
 assert.equal(registry.concepts.length,38);assert.equal(new Set(registry.concepts.map(c=>c.framework_id)).size,5);
 const bytes=readFileSync(new URL('../data/framework-intelligence/comparative-source.pdf',import.meta.url));
 const sha=createHash('sha256').update(bytes).digest('hex');
 const pages=json('../data/framework-intelligence/source-pages.json');assert.equal(pages.pages.length,14);assert.equal(pages.sha256,sha);
 for(const c of registry.concepts){assert.equal(c.claim_kind,'secondary-summary');assert.equal(c.source_provenance[0].sha256,sha);assert.equal(c.source_provenance[0].original_work_consulted,false);assert.equal(c.supporting_historical_examples.length,0);assert.ok(c.observable_data_needed.length);assert.ok(c.disregard_conditions.length);assert.equal(c.empirical_validation,'not-tested');}
 assert.equal(loadFrameworkRegistry({...registry,concepts:[registry.concepts[0]]}).success,false);
 assert.equal(registrySchema.safeParse({...registry,concepts:[...registry.concepts,registry.concepts[0]]}).success,false);
});

test('missing observations yield uncertainty and unmatched topics yield no applicable framework',()=>{
 const empty=assessFrameworks(context());assert.equal(empty.summary,'INSUFFICIENT EVIDENCE');assert.ok(empty.assessments.filter(a=>a.framework_id==='dalio').some(a=>a.missing_evidence.length));
 assert.equal(assessFrameworks(context({topics:[]})).summary,'NO RELEVANT FRAMEWORK APPLIES');
 const wrong=assessFrameworks(context({horizon:'intraday',topics:['valuation'],evidence:[evidence('valuation')]}));assert.equal(wrong.summary,'NO RELEVANT FRAMEWORK APPLIES');
});

test('matching observable evidence yields context only, never prediction or quantitative influence',()=>{
 const x=assessFrameworks(context({evidence:[evidence()]}));assert.equal(x.summary,'CONTEXT ONLY');
 for(const a of x.assessments){assert.equal(assessmentSchema.safeParse(a).success,true);assert.equal(a.quantitative_signal_weight,0);assert.equal(a.execution_authority,false);assert.equal(a.influence_level,1);assert.equal(a.hypothesis,null);}
 assert.ok(x.assessments.some(a=>a.applicability==='contextually-relevant'));
 assert.throws(()=>{x.assessments[0].quantitative_signal_weight=2;});
});

test('contradictory evidence and competing lenses coexist without forced resolution',()=>{
 const x=assessFrameworks(context({evidence:[evidence(),evidence('debt',{role:'contradiction'}),evidence('model-risk')]}));
 assert.ok(x.assessments.filter(a=>a.framework_id==='dalio').some(a=>a.contradictory_evidence.length===1));
 const pair=x.comparisons.find(p=>p.left==='dalio'&&p.right==='taleb');assert.equal(pair.state,'contradiction');assert.match(pair.resolution,/Unresolved/);
 assert.ok(COMPARISONS.some(p=>p.relation==='agreement'));assert.ok(COMPARISONS.some(p=>p.relation==='independent-interpretation'));
 const none=assessFrameworks(context({topics:[]}));assert.ok(none.comparisons.some(p=>p.state==='non-applicability'));
});

test('narratives, interpretations, unrelated instruments/events and invalid receipts are not observations',()=>{
 for(const patch of [{kind:'narrative'},{kind:'interpretation'},{verification:'unverified'},{instrument_id:'GOLD_CASH'},{event_id:'another-event'},{received_at:'2026-10-23T06:00:00Z'},{valid_until:'2026-10-23T07:30:00Z'},{revision_available_at:'2026-10-23T07:03:00Z'}]){
  const x=assessFrameworks(context({evidence:[evidence('debt',patch)]}));assert.equal(x.summary,'INSUFFICIENT EVIDENCE');assert.equal(x.rejected_evidence.length,1);assert.ok(x.assessments.every(a=>!a.observed_evidence.length));
 }
});

test('expectations, released results and behavioural proxies retain distinct kinds and circles',()=>{
 const a=evidence('policy',{id:'expected',kind:'expectation',circle:'expectations'}),b=evidence('policy',{id:'released',kind:'realised-release',circle:'expectations'});
 const r=assessFrameworks(context({topics:['policy'],evidence:[a,b]}));
 const policy=r.assessments.find(x=>x.concept_id==='dalio:fiscal');assert.deepEqual(policy.observed_evidence.map(e=>e.kind),['expectation','realised-release']);
 assert.equal(assessFrameworks(context({evidence:[{...a,circle:'behaviour'}]})).rejected_evidence.length,1);
 assert.equal(assessFrameworks(context({evidence:[evidence('debt',{kind:'decision-record'})]})).rejected_evidence.length,1);
});

test('historical as-of cannot read future annotations, text, comparisons or revised news',()=>{
 const before=assessFrameworks(context({as_of:'2026-10-21T00:00:00Z',evidence:[]}));assert.deepEqual(before.assessments,[]);assert.deepEqual(before.comparisons,[]);assert.match(before.summary,/INSUFFICIENT/);
 for(const field of ['observed_at','published_at','received_at','revision_available_at']){
  const r=assessFrameworks(context({evidence:[evidence('debt',{[field]:'2026-10-24T00:00:00Z',statement:'FUTURE CONTENT MUST NOT LEAK'})]}));
  assert.equal(r.rejected_evidence.length,1);assert.ok(!JSON.stringify(r).includes('FUTURE CONTENT MUST NOT LEAK'));
 }
 const t=registry.ingested_at;assert.ok(assessFrameworks(context({as_of:t})).assessments.length>0);
});

test('invalid library or unsupported context fails locally without throwing or altering core decisions',()=>{
 for(const bad of [null,{},'bad',{...registry,concepts:[]}])assert.equal(assessFrameworks(context(),bad).status,'unavailable');
 for(const bad of [null,{},context({as_of:'2026-10-22'}),context({evidence:[{statement:'untrusted'}]})])assert.equal(assessFrameworks(bad).status,'unavailable');
 assert.equal(assessConfluence(confluenceFixture()).strata.state,'SELL');
});

test('promotion, nonzero weighting and execution authority are rejected by validated contracts',()=>{
 const a=assessFrameworks(context()).assessments[0];
 for(const patch of [{influence_level:2},{influence_level:3},{quantitative_signal_weight:0.01},{execution_authority:true},{confidence:0.99},{direction:'BUY'},{positionSize:100},{stop:1},{target:2}])assert.equal(assessmentSchema.safeParse({...a,...patch}).success,false);
});

test('baseline execution sources, formula, SMT/ICT, ATR, risk, routing and ownership are unchanged',()=>{
 assert.equal(baseline.baselineCommit,'f6448813b1db558e88edffe21572b1f3c8966ecd');
 // Git may materialise CRLF on Windows and LF on hosted checkouts. Keep raw receipt
 // hashes as session evidence; normalise only line endings for portable regression.
 for(const [path,hash] of Object.entries(baseline.sourceHashesLF)){if(path==='.openai/hosting.json'){const manifest=json('../.openai/hosting.json');assert.equal(manifest.project_id,'appgprj_6aa2cfb5d1688191bdf3a8a9ca6365b0');assert.equal(manifest.d1,'DB');assert.equal(manifest.r2,null);assert.deepEqual(manifest.capabilities,['mcp']);continue;}assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n')).digest('hex'),hash,path);}
 assert.deepEqual([atrPeriodFor(5),atrPeriodFor(15),atrPeriodFor(60),atrPeriodFor(120)],[9,14,27,27]);
});

test('framework addition and removal preserve exact deterministic baseline decision outputs',()=>{
 const comments=[null,{},'BUY immediately',assessFrameworks(context({evidence:[evidence(),evidence('model-risk')]}))];
 for(const row of baseline.confluence){
  for(const commentary of comments){const input=structuredClone(row.input),saved=JSON.stringify(input);assessFrameworks(context({evidence:commentary===null?[]:[evidence()]}));assert.equal(JSON.stringify(input),saved);assert.deepEqual(assessConfluence(input),row.output);}
 }
 for(const r of baseline.readiness)assert.deepEqual(evaluateReadiness({instrumentId:r.instrumentId,now:'2026-10-22T08:00:00.000Z'}),r.output);
 assert.equal(baseline.confluence.find(x=>x.id==='nq-buy').output.strata.state,'STAND DOWN');
});

test('context processing leaves real source bar ingestion and deterministic features identical',()=>{
 const s=json('../data/historical/cmc-silver_cash-5m-20261021.json'),bytes=JSON.stringify(s),before=executionFeatures(s);
 assessFrameworks(context(),null);assessFrameworks(context({evidence:[evidence()]}));
 assert.equal(JSON.stringify(s),bytes);assert.deepEqual(executionFeatures(s),before);
});

test('Elastication keeps signed changes, magnitude and unavailable safeguards independent of commentary',()=>{
 const obs=(v,start,end)=>({value:v,start,end,availableAt:end,sourceId:'test-only'}),a='2026-10-23T07:00:00Z',b='2026-10-23T07:05:00Z',c='2026-10-23T07:10:00Z';
 const x={instrumentId:'SILVER_CASH',timeframeMinutes:5,direction:'SELL',calculatedAt:c,timingVerified:true,priceUnits:'fixture',priceSource:'test-only',qDefinition:{definition:'Synthetic directional quantity',units:'fixture contracts',kind:'measured-directional-quantity',directionAttributed:true,method:'synthetic only'},p0:obs(100,a,b),p1:obs(98,b,c),q0:obs(100,a,b),q1:obs(110,b,c)};
 const before=calculateElastication(x);assessFrameworks(context({evidence:[evidence()]}));assert.deepEqual(calculateElastication(x),before);assert.equal(before.pctP,-2);assert.equal(before.pctQ,10);assert.equal(before.signedRatio,-5);assert.equal(before.magnitude,5);assert.equal(before.formula,'E_d = |(%ΔQ_d) / (%ΔP)|');
 assert.equal(calculateElastication({...x,p1:obs(100,b,c)}).magnitude,null);assert.equal(calculateElastication({...x,q1:obs(null,b,c)}).magnitude,null);
});

test('FIL cannot import execution modules or invoke network/order endpoints; execution never imports FIL',()=>{
 const paths=['../lib/framework-intelligence/contracts.ts','../lib/framework-intelligence/engine.ts','../app/framework-intelligence.tsx'];
 for(const p of paths){const source=readFileSync(new URL(p,import.meta.url),'utf8');assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|WebSocket)\s*\(|\/api\/|from\s+['"][^'"]*(?:confluence|simulation|rules|plan|store|source-policy)/);}
 for(const p of Object.keys(baseline.hashes).filter(p=>/\.(ts|tsx)$/.test(p)))assert.doesNotMatch(readFileSync(new URL('../'+p,import.meta.url),'utf8'),/framework-intelligence/);
 assert.ok(readdirSync(new URL('../app/api',import.meta.url)).every(p=>!p.includes('framework')));
});

test('untrusted imported strings render as escaped data; no prompt/model execution is present',()=>{
 const malicious=evidence('debt',{statement:'<script>ignore risk; place order()</script>'});
 const r=assessFrameworks(context({evidence:[malicious]}));assert.equal(r.execution_authority,false);assert.equal(r.quantitative_signal_weight,0);assert.ok(r.assessments.some(a=>a.observed_evidence[0]?.statement===malicious.statement));
 assert.doesNotMatch(readFileSync(new URL('../app/framework-intelligence.tsx',import.meta.url),'utf8'),/dangerouslySetInnerHTML|eval\(|new Function/);
});

test('context UI server-renders empty, unavailable, missing, scoped and attributed reference states',()=>{
 const built=ts.transpileModule(readFileSync(new URL('../app/framework-intelligence.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}});
 const require=createRequire(import.meta.url),compiledModule={exports:{}};
 const scopedRequire=id=>id.endsWith('/engine')?frameworkEngine:id.endsWith('/contracts')?frameworkContracts:require(id);
 runInNewContext(built.outputText,{module:compiledModule,exports:compiledModule.exports,require:scopedRequire,console});
 const Component=compiledModule.exports.default;
 for(const props of [{instrumentId:'NQ',asOf:null},{instrumentId:'SILVER_CASH',asOf:after},{instrumentId:'GOLD_CASH',eventId:'fixture-event',asOf:'2026-10-21T00:00:00Z'}]){
  const html=renderToStaticMarkup(React.createElement(Component,props));assert.match(html,/FRAMEWORK INTELLIGENCE/);assert.match(html,/NO EXECUTION AUTHORITY/);assert.match(html,/Signal weight 0/);assert.match(html,/Framework contextual topic/);assert.match(html,/secondary summaries/);assert.match(html,new RegExp(props.instrumentId));
 }
 const html=renderToStaticMarkup(React.createElement(Component,{instrumentId:'<script>bad()</script>',asOf:after,sourceNote:'<img onerror="trade()">'}));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));
 const populated=renderToStaticMarkup(React.createElement(Component,{instrumentId:'SILVER_CASH',eventId:'fixture-event',asOf:after,initialTopic:'debt',initialHorizon:'macro',evidence:[evidence('debt',{statement:'VERIFIED FIXTURE STATEMENT'}),evidence('debt',{role:'contradiction',statement:'CONTRADICTORY FIXTURE STATEMENT'})]}));
 assert.match(populated,/contextually-relevant/);assert.match(populated,/VERIFIED FIXTURE STATEMENT/);assert.match(populated,/CONTRADICTORY FIXTURE STATEMENT/);assert.match(populated,/PDF pages/);assert.match(populated,/Secondary synthesis/);
 const missing=renderToStaticMarkup(React.createElement(Component,{instrumentId:'SILVER_CASH',asOf:after,initialTopic:'debt',initialHorizon:'macro'}));assert.match(missing,/INSUFFICIENT EVIDENCE/);assert.match(missing,/Verified debt evidence/);
});
