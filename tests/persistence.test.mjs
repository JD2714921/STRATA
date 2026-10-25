import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({
  resolve(specifier, context, nextResolve) {
    if(specifier.endsWith('.json?raw'))return {url:new URL(specifier,context.parentURL).href,shortCircuit:true};
    if (specifier === 'cloudflare:workers') return { url: 'strata-test:workers', shortCircuit: true };
    if (specifier === 'next/headers') return { url: 'strata-test:headers', shortCircuit: true };
    if (specifier === 'next/navigation') return { url: 'strata-test:navigation', shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file:') && !/\.[a-z]+$/i.test(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'strata-test:workers') return { format: 'module', source: 'export const env = globalThis.__strataTestEnv;', shortCircuit: true };
    if (url === 'strata-test:headers') return { format: 'module', source: 'export async function headers() { return globalThis.__strataTestHeaders; }', shortCircuit: true };
    if (url === 'strata-test:navigation') return { format: 'module', source: 'export function redirect() { throw new Error("Unexpected redirect in API test"); }', shortCircuit: true };
    if (url.startsWith('file:') && url.endsWith('.ts')) return { format: 'module', source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8')), shortCircuit: true };
    if (url.startsWith('file:') && /\.json(\?raw)?$/.test(url)) {const raw=readFileSync(new URL(url.replace('?raw','')),'utf8');return { format:'module',source:'export default '+(url.endsWith('?raw')?JSON.stringify(raw):raw),shortCircuit:true };}
    return nextLoad(url, context);
  },
});
const store = await import(pathToFileURL(join(project, 'lib/round1-store.ts')).href);
const workspaceState = await import(pathToFileURL(join(project, 'lib/strata-v2/workspace-state.ts')).href);
const contracts = await import(pathToFileURL(join(project, 'lib/round1-store-contracts.ts')).href);
const core = await import(pathToFileURL(join(project, 'lib/strata-v2/rules.ts')).href);
globalThis.__strataTestEnv = {};
globalThis.__strataTestHeaders = new Headers();
const route = await import(pathToFileURL(join(project, 'app/api/round1/route.ts')).href);
const historical = await import(pathToFileURL(join(project, 'lib/historical/private-store.ts')).href);
const historicalRoute = await import(pathToFileURL(join(project, 'app/api/historical/route.ts')).href);
const trading212 = await import(pathToFileURL(join(project, 'lib/strata-v2/trading212.ts')).href);
const trading212Route = await import(pathToFileURL(join(project, 'app/api/trading212/route.ts')).href);
const executionHistoryRoute = await import(pathToFileURL(join(project, 'app/api/execution-history/route.ts')).href);
const temporary = mkdtempSync(join(tmpdir(), 'strata-persistence-'));
after(() => rmSync(temporary, { recursive: true, force: true }));

// SQLite executes the generated schema and production SQL. This is not a hosted D1 assertion.
class D1Local {
  constructor(filename) { this.sql = new DatabaseSync(filename); }
  prepare(sql) {
    const connection = this.sql;
    const make = values => ({
      bind(...parameters) { return make(parameters); },
      async first() { return connection.prepare(sql).get(...values) || null; },
      async all() { return { results: connection.prepare(sql).all(...values) }; },
      async run() { const result = connection.prepare(sql).run(...values); return { success: true, meta: { changes: Number(result.changes) } }; },
    });
    return make([]);
  }
  async batch(statements) {
    this.sql.exec('BEGIN');
    try { const result = []; for (const statement of statements) result.push(await statement.run()); this.sql.exec('COMMIT'); return result; }
    catch (error) { this.sql.exec('ROLLBACK'); throw error; }
  }
  close() { this.sql.close(); }
}
function database(name) {
  const db = new D1Local(join(temporary, `${name}.sqlite`));
  for (const migration of readdirSync(join(project, 'drizzle')).filter(p => p.endsWith('.sql')).sort()) db.sql.exec(readFileSync(join(project, 'drizzle', migration), 'utf8'));
  return db;
}
const at = '2026-10-19T08:15:00.000Z';
const request = (body, overrides = {}) => new Request('https://strata.example/api/round1', { method: 'POST', headers: { origin: 'https://strata.example', 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...overrides }, body: JSON.stringify(body) });
const decision = { kind: 'decision', instrumentId: 'SILVER_CASH', review: { token: crypto.randomUUID(), asOf: at, configVersion: null, assessmentHash: '0'.repeat(64) }, decision: 'disagree', thesis: 'I disagree with the current assessment.', executionRationale: 'Standing aside until data and rules qualify.' };
const historicalId='cmc-silver_cash-15m-20261021';

test('historical save retries are atomic, owner scoped and input bound',async()=>{
 const db=database('historical-idempotency'),input={action:'compare',datasetId:historicalId,requestId:crypto.randomUUID()};
 const [first,retried]=await Promise.all([historical.saveHistorical(db,'owner-A',input,at),historical.saveHistorical(db,'owner-A',input,at)]);
 assert.equal(first.id,retried.id);assert.equal((await historical.historicalHistory(db,'owner-A')).length,1);
 const afterLostReply=await historical.saveHistorical(db,'owner-A',input,'2026-10-22T08:00:00.000Z');assert.deepEqual(afterLostReply,first);
 await assert.rejects(historical.saveHistorical(db,'owner-A',{...input,ownerDecision:'wait',ownerThesis:'Changed input must use a new request identity.'},at),{code:'historical_request_conflict'});
 const other=await historical.saveHistorical(db,'owner-B',input,at);assert.notEqual(other.id,first.id);
 await historical.saveHistorical(db,'owner-A',{...input,requestId:crypto.randomUUID()},at);assert.equal((await historical.historicalHistory(db,'owner-A')).length,2);
 assert.equal(historical.historicalRequest.safeParse({...input,requestId:'invalid'}).success,false);db.close();
});
test('Round 2 API authenticates, bounds pages, binds chart rows and keeps research blocked',async()=>{
 globalThis.__strataTestHeaders=new Headers();
 assert.equal((await executionHistoryRoute.GET(new Request('https://strata.example/api/execution-history'))).status,401);
 globalThis.__strataTestHeaders=new Headers({'oai-authenticated-user-id':'owner-A','oai-authenticated-user-email':'owner@example.test'});
 const url='https://strata.example/api/execution-history?datasetId=r2-silver_cash-2m-20261021';
 const response=await executionHistoryRoute.GET(new Request(url+'&kind=bindings&page=1'));
 assert.match(response.headers.get('cache-control'),/private, no-store/);
 const data=await response.json();assert.equal(data.rows.length,50);assert.equal(data.chart.length,50);
 for(let i=0;i<data.rows.length;i++){assert.equal(data.rows[i].index,data.chart[i].index);assert.equal(data.rows[i].time,data.chart[i].time);assert.equal(data.rows[i].state,'STAND DOWN');assert.equal(data.rows[i].canSubmitOrder,false);}
 assert.equal((await executionHistoryRoute.GET(new Request(url+'&kind=bindings&page=-1'))).status,400);
 assert.equal((await executionHistoryRoute.GET(new Request(url+'&kind=forged'))).status,400);
 assert.equal((await executionHistoryRoute.GET(new Request('https://strata.example/api/execution-history?kind=features&datasetId=../../raw/receipts'))).status,400);
 const summary=await (await executionHistoryRoute.GET(new Request('https://strata.example/api/execution-history'))).json();
 assert.equal(summary.manifest.datasets.length,15);assert.equal(summary.manifest.edValid,0);
 assert.equal(/CFD:|A-AUMK|K-GWOT|A-AUNH|unit-fixture-secret/.test(JSON.stringify(summary)),false);
});
test('Trading 212 status authenticates and never exposes secrets or calls a provider',async()=>{globalThis.__strataTestHeaders=new Headers();assert.equal((await trading212Route.GET(new Request('https://strata.example/api/trading212'))).status,401);globalThis.__strataTestHeaders=new Headers({'oai-authenticated-user-id':'owner-A','oai-authenticated-user-email':'owner@example.test'});const r=await (await trading212Route.GET(new Request('https://strata.example/api/trading212?operation=status'))).json();assert.equal(r.credentialsConfigured,false);assert.equal(r.automaticEnvironmentFallback,false);assert.equal(JSON.stringify(r).includes('TRADING212_API_SECRET'),false);await assert.rejects(trading212.readTrading212('live'),{code:'credentials_unconfigured'});});
test('Trading 212 uses explicit environments and documented read-only paths, preserving partial failures',async()=>{const originalFetch=globalThis.fetch;globalThis.__strataTestEnv.TRADING212_API_KEY='unit-fixture-key';globalThis.__strataTestEnv.TRADING212_API_SECRET='unit-fixture-secret';const calls=[];try{await assert.rejects(trading212.readTrading212(),{code:'environment_unresolved'});globalThis.fetch=async(url,options)=>{calls.push({url,method:options.method});if(url.endsWith('/equity/account/summary'))return Response.json({id:1,currency:'GBP',cash:{availableToTrade:100}});if(url.endsWith('/equity/positions'))return Response.json([{instrument:{ticker:'TEST',name:'Unit fixture'},quantity:1,currentPrice:100}]);if(url.endsWith('/equity/orders'))return Response.json({}, {status:403});return Response.json([{ticker:'TEST',name:'Unit fixture'}]);};const r=await trading212.readTrading212('live');assert.equal(r.state,'partial');assert.equal(r.positions.length,1);assert.equal(r.orders,null);assert.equal(r.errors[0].part,'orders');assert.ok(calls.every(c=>c.method==='GET'&&c.url.startsWith('https://live.trading212.com/')));assert.equal(calls.some(c=>c.url.endsWith('/account/cash')),false);assert.equal(JSON.stringify(trading212.trading212Status()).includes('unit-fixture-secret'),false);}finally{globalThis.fetch=originalFetch;delete globalThis.__strataTestEnv.TRADING212_API_KEY;delete globalThis.__strataTestEnv.TRADING212_API_SECRET;}});
const binding = ({ token, asOf, configVersion, assessmentHash }) => ({ token, asOf, configVersion, assessmentHash });
async function reviewedDecision(db, ownerId = 'owner-A', now = at) {
  const review = (await store.issueReviewAssessments(db, ownerId, now)).find(item => item.assessment.instrumentId === decision.instrumentId);
  return { ...decision, review: binding(review) };
}

test('historical runs reproduce full saved feature hash and persist owner-scoped references',async()=>{
 const db=database('historical');const saved=await historical.saveHistorical(db,'owner-A',{action:'run',datasetId:historicalId},'2026-10-21T14:00:00.000Z');
 assert.equal(saved.payload.computation.reproducedExactOutput,true);assert.equal(saved.payload.computation.summary.bars,1950);assert.equal(saved.payload.computation.fullOutputs.retainedInVersionedSource,true);assert.equal((await historical.historicalHistory(db,'owner-A')).length,1);assert.equal((await historical.historicalHistory(db,'owner-B')).length,0);await assert.rejects(historical.historicalHistory(db,'owner-B',saved.id),{code:'record_not_found'});assert.equal(await store.hashPayload(saved.payload),saved.contentHash);db.close();
 const reopened=new D1Local(join(temporary,'historical.sqlite'));assert.equal((await historical.historicalHistory(reopened,'owner-A',saved.id)).contentHash,saved.contentHash);reopened.close();
});
test('historical mutation boundary rejects browser evidence/approval and lab overrides',async()=>{
 for(const patch of [{ownerId:'victim'},{fresh:true},{validated:true},{approvedForExecution:true},{features:[]},{hypothetical:true}])assert.equal(historical.historicalRequest.safeParse({action:'run',datasetId:historicalId,...patch}).success,false);
 assert.equal(historical.historicalRequest.safeParse({action:'compare',datasetId:historicalId,ownerDecision:'disagree'}).success,false);assert.equal(historical.historicalRequest.safeParse({action:'run',datasetId:'unknown'}).success,false);
});
test('current comparison preserves stale/delayed evidence, unknown positions and separate J disagreement',async()=>{
 const db=database('history-compare'),saved=await historical.saveHistorical(db,'owner-A',{action:'compare',datasetId:historicalId,ownerDecision:'disagree',ownerThesis:'Different interpretation; stand down pending fresh bars.'},'2026-10-21T14:00:00.000Z'),r=saved.payload.computation;
 assert.equal(r.assessment.strata.state,'STAND DOWN');assert.equal(r.comparison.eligibleForEntry,false);assert.equal(r.positions,'unknown');assert.equal(saved.payload.ownerDecision.actor,'J');assert.equal(saved.payload.ownerDecision.decision,'disagree');assert.equal(saved.payload.ownerDecision.canOverrideHardGate,false);db.close();
});
test('historical API authenticates, paginates loaded/empty outputs, rejects forged/cross-origin requests and reports failed storage',async()=>{
 globalThis.__strataTestHeaders=new Headers();assert.equal((await historicalRoute.GET(new Request('https://strata.example/api/historical'))).status,401);
 globalThis.__strataTestHeaders=new Headers({'oai-authenticated-user-id':'owner-A','oai-authenticated-user-email':'owner@example.test'});
 const page=await (await historicalRoute.GET(new Request('https://strata.example/api/historical?kind=features&datasetId='+historicalId))).json();assert.equal(page.rows.length,50);assert.equal(page.state,'loaded');
 const empty=await (await historicalRoute.GET(new Request('https://strata.example/api/historical?kind=replay&datasetId='+historicalId))).json();assert.equal(empty.state,'empty');
 const confluence=await (await historicalRoute.GET(new Request('https://strata.example/api/historical?kind=confluence&datasetId=cmc-silver_cash-5m-20261021&page=100'))).json();assert.equal(confluence.rows.length,50);assert.ok(confluence.gateDictionary.length>0);for(const row of confluence.rows){assert.equal(row.strata.state,'STAND DOWN');assert.ok(row.circles.market.comparisons.every(x=>x.availableAt<=row.asOf));assert.ok(row.circles.expectation.responses.every(x=>x.availableAt<=row.asOf));}
 assert.equal((await historicalRoute.GET(new Request('https://strata.example/api/historical?kind=features&datasetId='+historicalId+'&inputHash=wrong'))).status,409);
 assert.equal((await historicalRoute.GET(new Request('https://strata.example/api/historical?kind=features&datasetId='+historicalId+'&page=-1'))).status,400);
 assert.equal((await historicalRoute.POST(new Request('https://strata.example/api/historical',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'}))).status,403);
 globalThis.__strataTestEnv.DB=undefined;assert.equal((await historicalRoute.POST(request({action:'run',datasetId:historicalId}))).status,503);
});

test('reject anonymous ownership and cross-origin or non-JSON writes', async () => {
  assert.throws(() => contracts.requireOwnerId(null), { code: 'authentication_required' });
  await assert.rejects(contracts.readMutation(request(decision, { origin: 'https://elsewhere.example' })), { code: 'origin_rejected' });
  await assert.rejects(contracts.readMutation(request(decision, { 'content-type': 'text/plain' })), { code: 'json_required' });
  assert.equal((await contracts.readMutation(request(decision))).kind, 'decision');
});

test('reject forged ownership, freshness, readiness, lab and arbitrary provider payloads', () => {
  for (const extra of [{ ownerId: 'victim' }, { readiness: 'Conditions met' }, { verified: true }, { fresh: true }, { hypothetical: true }, { positions: { openCount: 0 } }]) assert.equal(contracts.round1MutationSchema.safeParse({ ...decision, ...extra }).success, false);
  assert.equal(contracts.round1MutationSchema.safeParse({ ...decision, instrumentId: 'COPPER_CASH' }).success, false);
  assert.equal(contracts.round1MutationSchema.safeParse({ kind: 'refresh', sourceId: 'https://external.example' }).success, false);
});

test('private records survive closing storage and remain isolated by owner', async () => {
  const db = database('owners');
  const saved = await store.savePrivateMutation(db, 'owner-A', await reviewedDecision(db), at);
  assert.equal(saved.payload.ownerDecision.decision, 'disagree');
  assert.equal(saved.payload.ownerDecision.actor, 'J');
  assert.equal(saved.payload.assessment.actor, 'Strata');
  assert.equal(saved.payload.assessment.canSubmitOrder, false);
  assert.equal(saved.payload.ownerDecision.mayExecute, false);
  assert.ok(saved.payload.assessment.gates.some(g => g.hard && g.state !== 'pass'));
  assert.equal(saved.payload.assessment.hypothetical, false);
  assert.equal(saved.payload.configSnapshot.riskPerTrade.status, 'missing');
  assert.ok(!('ownerId' in saved));
  await assert.rejects(store.readOwnedRecord(db, 'owner-B', saved.id), { code: 'record_not_found' });
  assert.equal((await store.readPrivateState(db, 'owner-B', at)).decisions.length, 0);
  db.close();
  const reopened = new D1Local(join(temporary, 'owners.sqlite'));
  assert.deepEqual(await store.readOwnedRecord(reopened, 'owner-A', saved.id), saved);
  assert.equal(await store.hashPayload(saved.payload), saved.contentHash);
  reopened.close();
});

test('seed saves all 58 lines and rules atomically without overwriting future versions', async () => {
  const db = database('seed');
  const seed = await store.savePrivateMutation(db, 'owner-A', { kind: 'seed' }, at);
  assert.equal(seed.payload.pies.length, 5);
  assert.equal(seed.payload.pies.flatMap(p => p.lines).length, 58);
  for (const pie of seed.payload.pies) assert.equal(pie.lines.reduce((sum, line) => sum + line.intendedTargetWeightPct, 0), 100);
  assert.ok(seed.payload.pies.flatMap(p => p.lines).every(line => line.quantity === null && line.monetaryValue === null && line.brokerReconciledHolding === null));
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).rule.payload.ruleVersion, core.RULE_VERSION);
  const repeat = await store.savePrivateMutation(db, 'owner-A', { kind: 'seed' }, at);
  assert.equal(repeat.id, seed.id);
  db.close();
});

test('configuration and decisions are immutable versions; confirming text never supplies actual market evidence', async () => {
  const db = database('versions');
  const fields = contracts.CONFIG_KEYS.map(key => ({ key, value: 'Owner confirmed text definition', status: 'confirmed' }));
  const configured = await store.savePrivateMutation(db, 'owner-A', { kind: 'config', fields }, at);
  const assessment = await store.savePrivateMutation(db, 'owner-A', await reviewedDecision(db, 'owner-A', '2026-10-19T08:16:00.000Z'), '2026-10-19T08:16:05.000Z');
  assert.equal(assessment.payload.configVersion, configured.version);
  assert.notEqual(assessment.payload.assessment.readiness, 'Conditions met');
  assert.equal(assessment.payload.assessment.gates.find(g => g.id === 'market-data').state, 'unknown');
  assert.equal(assessment.payload.assessment.gates.find(g => g.id === 'position-cap').state, 'unknown');
  assert.equal(assessment.payload.assessment.gates.find(g => g.id === 'broker-mapping').state, 'unknown');
  await store.savePrivateMutation(db, 'owner-A', { kind: 'config', fields: [{ key: 'riskPerTrade', value: null, status: 'missing' }] }, '2026-10-19T08:17:00.000Z');
  assert.deepEqual(await store.readOwnedRecord(db, 'owner-A', assessment.id), assessment);
  assert.equal((await store.readOwnedHistory(db, 'owner-A', 'config')).length, 2);
  db.close();
});

test('imports preserve observed/target/unknown distinctions and reject invalid totals and future times', async () => {
  const db = database('imports');
  const input = { kind: 'import', sourceLabel: 'Owner CSV version 1', observedAt: null, rows: contracts.PIE_NAMES.map(pie => ({ pie, label: 'Unresolved label', targetWeight: 100, observedWeight: null })) };
  const saved = await store.savePrivateMutation(db, 'owner-A', input, at);
  assert.equal(saved.payload.pies[0].lines[0].observedAllocationPct, null);
  assert.equal(saved.payload.pies[0].lines[0].intendedTargetWeightPct, 100);
  assert.equal(saved.payload.pies[0].wholeAccountWeightPct, null);
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', { ...input, observedAt: '2099-01-01T00:00:00Z' }, at), { code: 'future_observation' });
  assert.equal(contracts.round1MutationSchema.safeParse({ ...input, rows: input.rows.map((row, index) => ({ ...row, targetWeight: index === 0 ? 90 : 100 })) }).success, false);
  assert.equal((await store.savePrivateMutation(db, 'owner-A', { kind: 'seed' }, at)).id, saved.id);
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).rule.payload.ruleVersion, core.RULE_VERSION);
  assert.equal((await store.readOwnedHistory(db, 'owner-A', 'portfolio')).length, 1);
  db.close();
});

test('refresh records cannot claim provider success and lab evaluations cannot mutate durable state', async () => {
  const db = database('refresh');
  const before = await store.readPrivateState(db, 'owner-A', at);
  core.evaluateHypothetical({ instrumentId: 'SILVER_CASH', now: at });
  assert.deepEqual(await store.readPrivateState(db, 'owner-A', at), before);
  const receipt = await store.savePrivateMutation(db, 'owner-A', { kind: 'refresh', sourceId: 'cmc' }, at);
  assert.equal(receipt.payload.state, 'unavailable');
  assert.equal(receipt.payload.attemptedProviderRead, false);
  assert.equal(receipt.payload.lastGoodAt, null);
  db.close();
});

test('duplicate request identifiers cannot append duplicate audit decisions', async () => {
  const db = database('duplicates');
  const input = { ...await reviewedDecision(db), requestId: crypto.randomUUID() };
  await store.savePrivateMutation(db, 'owner-A', input, at);
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', input, at), { code: 'request_already_recorded' });
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).decisions.length, 1);
  await store.savePrivateMutation(db, 'owner-B', { ...await reviewedDecision(db, 'owner-B'), requestId: input.requestId }, at);
  assert.equal((await store.readPrivateState(db, 'owner-B', at)).decisions.length, 1);
  db.close();
});

test('actual route requires dispatch identity, enforces ownership and reports unavailable storage', async () => {
  const db = database('route');
  globalThis.__strataTestEnv.DB = db;
  globalThis.__strataTestHeaders = new Headers();
  assert.equal((await route.GET(new Request('https://strata.example/api/round1'))).status, 401);
  assert.equal((await route.POST(request(decision))).status, 401);
  globalThis.__strataTestHeaders = new Headers({ 'oai-authenticated-user-id': 'owner-A', 'oai-authenticated-user-email': 'test-a@invalid.example' });
  const state = await (await route.GET(new Request('https://strata.example/api/round1'))).json();
  assert.equal(state.reviews.length, 5);
  assert.equal(workspaceState.stateSchema.safeParse(state).success, true);
  assert.equal(workspaceState.stateSchema.safeParse({...state,reviews:state.reviews.slice(1)}).success, false);
  assert.equal(workspaceState.stateSchema.safeParse({...state,reviews:state.reviews.map(()=>state.reviews[0])}).success, false);
  const reviewed = state.reviews.find(item => item.assessment.instrumentId === 'SILVER_CASH');
  const written = await route.POST(request({ ...decision, review: binding(reviewed) }));
  assert.equal(written.status, 201);
  const saved = (await written.json()).record;
  assert.deepEqual(saved.payload.assessment, reviewed.assessment);
  assert.equal((await route.POST(request({ ...decision, ownerId: 'owner-B' }))).status, 400);
  assert.equal((await route.POST(request(decision, { origin: 'https://other.example' }))).status, 403);
  globalThis.__strataTestHeaders = new Headers({ 'oai-authenticated-user-id': 'owner-B', 'oai-authenticated-user-email': 'test-b@invalid.example' });
  assert.equal((await route.GET(new Request(`https://strata.example/api/round1?recordId=${saved.id}`))).status, 404);
  assert.equal((await (await route.GET(new Request('https://strata.example/api/round1'))).json()).decisions.length, 0);
  delete globalThis.__strataTestEnv.DB;
  const unavailable = await route.GET(new Request('https://strata.example/api/round1'));
  assert.equal(unavailable.status, 503);
  assert.equal((await unavailable.json()).code, 'storage_unavailable');
  assert.match(unavailable.headers.get('cache-control'), /no-store/);
  db.close();
});

test('partial seed failure rolls back both records', async () => {
  const db = database('atomic');
  db.sql.exec("CREATE TRIGGER reject_rule BEFORE INSERT ON round1_records WHEN NEW.kind = 'rule' BEGIN SELECT RAISE(ABORT, 'test failure'); END");
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', { kind: 'seed' }, at));
  const state = await store.readPrivateState(db, 'owner-A', at);
  assert.equal(state.portfolio, null);
  assert.equal(state.rule, null);
  db.close();
});

test('decision preserves exactly the issued assessment and records the later owner time', async () => {
  const db = database('review-exact');
  const reviews = await store.issueReviewAssessments(db, 'owner-A', at);
  assert.equal(reviews.length, 5);
  const reviewed = reviews.find(item => item.assessment.instrumentId === 'SILVER_CASH');
  const saved = await store.savePrivateMutation(db, 'owner-A', { ...decision, review: binding(reviewed) }, '2026-10-19T08:15:20.000Z');
  assert.deepEqual(saved.payload.assessment, reviewed.assessment);
  assert.equal(saved.payload.assessment.evaluatedAt, at);
  assert.equal(saved.payload.ownerDecision.recordedAt, '2026-10-19T08:15:20.000Z');
  assert.equal(saved.payload.review.assessmentHash, await store.hashPayload(saved.payload.assessment));
  assert.equal(saved.payload.review.token, reviewed.token);
  db.close();
});

test('stale, future, forged and another owner review cannot create a decision', async () => {
  const db = database('review-reject');
  const input = await reviewedDecision(db);
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', input, '2026-10-19T08:16:00.000Z'), { code: 'review_expired' });
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', input, '2026-10-19T08:14:59.000Z'), { code: 'review_expired' });
  for (const field of [{ assessmentHash: '0'.repeat(64) }, { asOf: '2026-10-19T08:15:01.000Z' }, { configVersion: 'forged-version' }]) await assert.rejects(store.savePrivateMutation(db, 'owner-A', { ...input, review: { ...input.review, ...field } }, at), { code: 'review_mismatch' });
  await assert.rejects(store.savePrivateMutation(db, 'owner-B', input, at), { code: 'record_not_found' });
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', { ...input, instrumentId: 'SUGAR_RAW_CASH' }, at), { code: 'review_mismatch' });
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).decisions.length, 0);
  db.close();
});

test('configuration changes invalidate a review without silently changing the assessed evidence', async () => {
  const db = database('review-config');
  const input = await reviewedDecision(db);
  await store.savePrivateMutation(db, 'owner-A', { kind: 'config', fields: [{ key: 'riskPerTrade', value: 'Definition changed', status: 'proposed' }] }, '2026-10-19T08:15:10.000Z');
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', input, '2026-10-19T08:15:20.000Z'), { code: 'review_configuration_changed' });
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).decisions.length, 0);
  db.close();
});

test('session transition invalidates a review even inside the 60-second TTL', async () => {
  const db = database('review-session');
  const input = await reviewedDecision(db, 'owner-A', '2026-10-19T08:59:50.000Z');
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', input, '2026-10-19T09:00:05.000Z'), { code: 'review_conditions_changed' });
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).decisions.length, 0);
  db.close();
});

test('a concurrent configuration version cannot slip between review validation and final append', async () => {
  const db = database('review-config-race');
  const input = await reviewedDecision(db);
  const originalPrepare = db.prepare.bind(db);
  db.prepare = sql => {
    if (sql.includes('WHERE COALESCE')) {
      db.sql.prepare("INSERT INTO round1_records (id, owner_id, kind, version, created_at, payload, content_hash) VALUES (?, ?, 'config', ?, ?, ?, ?)").run(crypto.randomUUID(), 'owner-A', 'concurrent-config-version', '2026-10-19T08:15:01.000Z', JSON.stringify({ fields: [{ key: 'riskPerTrade', value: 'Changed in another tab', status: 'proposed' }] }), 'test-fixture-hash');
    }
    return originalPrepare(sql);
  };
  await assert.rejects(store.savePrivateMutation(db, 'owner-A', input, '2026-10-19T08:15:05.000Z'), { code: 'review_configuration_changed' });
  assert.equal((await store.readPrivateState(db, 'owner-A', at)).decisions.length, 0);
  db.close();
});
