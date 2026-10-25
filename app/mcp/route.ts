import {z} from 'zod';
import {ownedStore} from '../api/operations/route';
import {runStrataAssessment,operationsStatus} from '../../lib/operations/runner';
import {reconcileDailyTradingLog} from '../../lib/operations/ledger';
import {accountingRead} from '../../lib/operations/runtime';
import {prepareNativeNotionWrite,finishNativeNotionWrite} from '../../lib/operations/notion-bridge';
import {session,instant,packetSchema,ledgerInputSchema} from '../../lib/operations/contracts';
import destination from '../../data/operations/notion-destination.json';
import {readLimitedJson} from '../../lib/operations/http';
import {validateMutationRequest,StoreError} from '../../lib/round1-store-contracts';
export const dynamic='force-dynamic';
const responseHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const definitions=[
 {name:'get_strata_operations',description:'Read private receipts, exact London definitions, source limitations and Notion outbox. No broker writes.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'run_strata_assessment',description:'Run the shared research pipeline for a real London occurrence. Supply actual authorised CMC five-product, news and material-weather outputs only. Delayed data never authorises entry.',inputSchema:{type:'object',properties:{session:{type:'string',enum:session.options},scheduledAt:{type:'string'},evidence:{type:'object'}},required:['session','scheduledAt'],additionalProperties:false}},
 {name:'reconcile_daily_trading_log',description:'Reconcile an actual 16:45 London cutoff. CMC open positions cannot establish closed history. T212 history uses server secrets separately from dashboard refresh. Produces durable Notion outbox.',inputSchema:{type:'object',properties:{cutoffAt:{type:'string'},brokerEvidence:{type:'object'}},required:['cutoffAt'],additionalProperties:false}},
 {name:'prepare_notion_write',description:'Reserve a deduplicated ledger write after fetching exact destination schema and querying Record key through authorised Notion tools. Daily parents first. Never blind-retry uncertain creates.',inputSchema:{type:'object',properties:{key:{type:'string'},dataSource:{type:'string'},schema:{type:'object'},schemaReadAt:{type:'string'},foundPageUrls:{type:'array',items:{type:'string'}}},required:['key','dataSource','schema','schemaReadAt','foundPageUrls'],additionalProperties:false}},
 {name:'finish_notion_write',description:'Acknowledge an actual Notion write with reservation and tool receipt, or record not-sent/uncertain. Never acknowledge a proposed write as completed.',inputSchema:{type:'object',properties:{key:{type:'string'},claimToken:{type:'string'},desiredHash:{type:'string'},remoteUrl:{type:['string','null']},outcome:{type:'string',enum:['written','not-sent','uncertain']},toolReceiptId:{type:'string'}},required:['key','claimToken','desiredHash','remoteUrl','outcome','toolReceiptId'],additionalProperties:false}},
];
export async function POST(request:Request){let id:unknown=null;try{
 const rpc=z.object({jsonrpc:z.literal('2.0'),id:z.union([z.string(),z.number(),z.null()]).optional(),method:z.string(),params:z.object({name:z.string(),arguments:z.unknown().optional()}).optional()}).strict().parse(await readLimitedJson(request,512000));id=rpc.id??null;const reply=(result:unknown)=>Response.json({jsonrpc:'2.0',id,result},{headers:responseHeaders});
 if(rpc.method==='server/discover')return reply({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
 if(rpc.method==='tools/list')return reply({tools:definitions});
 if(rpc.method!=='tools/call')return Response.json({jsonrpc:'2.0',id,error:{code:-32601,message:'Unknown MCP method'}},{headers:responseHeaders});
 const store=await ownedStore();validateMutationRequest(request);const name=rpc.params?.name,args=rpc.params?.arguments??{},now=new Date().toISOString();let result:unknown;
 if(name==='get_strata_operations')result={...await operationsStatus(store,now),notionDestination:destination};
 else if(name==='run_strata_assessment'){const p=z.object({session,scheduledAt:instant,evidence:packetSchema.optional()}).strict().parse(args);result=await runStrataAssessment(store,p.session,p.scheduledAt,p.evidence||{});}
 else if(name==='reconcile_daily_trading_log'){const p=z.object({cutoffAt:instant,brokerEvidence:ledgerInputSchema.optional()}).strict().parse(args);result=await reconcileDailyTradingLog(store,p.cutoffAt,async()=>{const accounting=await accountingRead(store,p.cutoffAt);if(!p.brokerEvidence)return accounting;return {events:[...accounting.events,...p.brokerEvidence.events.filter(e=>e.broker==='CMC')],snapshots:[...accounting.snapshots,...p.brokerEvidence.snapshots.filter(e=>e.broker==='CMC')],coverage:{cmcClosedHistory:false,trading212History:accounting.coverage.trading212History,paginationComplete:accounting.coverage.paginationComplete},cursor:accounting.cursor,issues:[...accounting.issues,...p.brokerEvidence.issues,'CMC forwarded account evidence is not a full closed-trade statement']};});}
 else if(name==='prepare_notion_write')result=await prepareNativeNotionWrite(store,args,now);
 else if(name==='finish_notion_write')result=await finishNativeNotionWrite(store,args,now);
 else return Response.json({jsonrpc:'2.0',id,error:{code:-32601,message:'Unknown Strata tool'}},{headers:responseHeaders});
 return reply({content:[{type:'text',text:JSON.stringify(result)}]});
 }catch(e){return Response.json({jsonrpc:'2.0',id,result:{isError:true,content:[{type:'text',text:'Strata tool failed validation, authentication or storage. No execution permission granted. Inspect private receipts; never blindly repeat financial writes.'}]}},{status:e instanceof StoreError?e.status:200,headers:responseHeaders});}}
