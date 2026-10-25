import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {getChatGPTUser} from '../../chatgpt-auth';
import {requireOwnerId,validateMutationRequest,StoreError} from '../../../lib/round1-store-contracts';
import {readLimitedJson} from '../../../lib/operations/http';
import {OperationsStore} from '../../../lib/operations/store';
import {runStrataAssessment,operationsStatus} from '../../../lib/operations/runner';
import {refreshTrading212} from '../../../lib/operations/portfolio';
import {reconcileDailyTradingLog} from '../../../lib/operations/ledger';
import {dashboardRead,accountingRead} from '../../../lib/operations/runtime';
import {latestOccurrence} from '../../../lib/operations/schedule';
import {session,OperationError} from '../../../lib/operations/contracts';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store',Vary:'Cookie, oai-authenticated-user-id','X-Content-Type-Options':'nosniff'};
export async function ownedStore(){const owner=requireOwnerId((await getChatGPTUser())?.userId);if(!env.DB)throw new OperationError('storage_unavailable','Private D1 storage unavailable');return new OperationsStore(env.DB,owner);}
function failure(e:unknown){return Response.json({error:e instanceof OperationError||e instanceof StoreError?e.message:'Operation unavailable; last successful records retained',code:e instanceof OperationError||e instanceof StoreError?e.code:'operation_failed'},{status:e instanceof StoreError?e.status:e instanceof z.ZodError?400:e instanceof OperationError&&e.code==='request_too_large'?413:e instanceof OperationError&&e.transient?429:503,headers});}
export async function GET(){try{return Response.json(await operationsStatus(await ownedStore(),new Date().toISOString()),{headers});}catch(e){return failure(e);}}
const requestSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('assessment'),session}).strict(),
 z.object({action:z.literal('ledger')}).strict(),
 z.object({action:z.literal('refresh-trading212'),environment:z.enum(['live','demo']),requestId:z.string().uuid()}).strict(),
]);
export async function POST(request:Request){try{const store=await ownedStore();validateMutationRequest(request);const input=requestSchema.parse(await readLimitedJson(request,4000)),now=new Date().toISOString();
 if(input.action==='refresh-trading212')return Response.json(await refreshTrading212(store,input.requestId,input.environment,()=>dashboardRead(input.environment)),{headers});
 if(input.action==='ledger'){const cutoff=latestOccurrence('16:45',now).scheduledAt;return Response.json(await reconcileDailyTradingLog(store,cutoff,()=>accountingRead(store,cutoff)),{headers});}
 const at=latestOccurrence(input.session,now).scheduledAt;return Response.json(await runStrataAssessment(store,input.session,at),{headers});
 }catch(e){return failure(e);}}
