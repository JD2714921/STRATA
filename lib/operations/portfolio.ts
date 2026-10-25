import {OperationsStore} from './store';
import {OperationError} from './contracts';
import {z} from 'zod';
const refreshResult=z.object({accountSummary:z.record(z.unknown()),positions:z.array(z.unknown()).nullable(),state:z.enum(['loaded','partial'])}).passthrough();
export async function refreshTrading212(store:OperationsStore,requestId:string,environment:string,read:()=>Promise<unknown>,clock=()=>new Date().toISOString()){
 const prior=await store.latest('portfolio-refresh-attempt','manual'),now=clock();
 if(prior&&Date.parse(now)-Date.parse(prior.created_at)<60000&&prior.value.requestId!==requestId)throw new OperationError('rate_limited','Wait at least 60 seconds before another account/catalog refresh',true);
 return store.phase('manual-portfolio:'+requestId,'portfolio-refresh',{environment},async()=>{
  await store.append('portfolio-refresh-attempt','manual',{requestId,requestedAt:clock(),state:'running'},clock());
  try{const data=refreshResult.parse(await read()),receipt={requestId,environment,receivedAt:clock(),priceObservedAt:null,data,readOnly:true,source:'Trading 212 hosted GET',dashboardRefresh:'on-command-only'};
   if(data.state==='partial'||data.positions===null){await store.append('portfolio-partial','dashboard',receipt,clock());throw new OperationError('portfolio_partial','Incomplete broker refresh; previous successful dashboard snapshot retained and stale',true);}
   await store.append('portfolio-snapshot','dashboard',receipt,clock());await store.append('portfolio-refresh-attempt','manual',{requestId,state:'succeeded',completedAt:clock()},clock());return receipt;
  }catch(e){await store.append('portfolio-refresh-attempt','manual',{requestId,state:'failed',completedAt:clock(),error:'Account read failed; last successful snapshot retained and stale'},clock());throw e;}
 },clock);
}
export async function portfolioView(store:OperationsStore){const [last,attempt]=await Promise.all([store.latest('portfolio-snapshot','dashboard'),store.latest('portfolio-refresh-attempt','manual')]);return {snapshot:last?.value??null,state:!last?'UNAVAILABLE':attempt?.value.state==='failed'&&Date.parse(attempt.created_at)>=Date.parse(last.created_at)?'STALE':'CACHED',refresh:last?.value.receivedAt??null,latestAttempt:attempt?.value??null,priceObservationTime:null};}
