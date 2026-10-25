import {EXECUTION_PLAN,allowedSide} from './plan';
import type {AssessmentState,Side,Feature} from './types';
import {instantMs} from '../strata-v2/contracts';
export interface EventContext {coverage:boolean;vintageVerified:boolean;contradiction:boolean;expectedDirection:Side|null;eventIds?:string[];responses?:{availableAt:string;value:number;minutes:number}[]}
export interface ComparisonContext {pair:string;availableAt:string;correlation60:number|null;smtDirection:Side|null;descriptiveOnly:true}
export interface ConfluenceInput {instrumentId:string;asOf:string;feature:Feature|null;directional:Feature|null;multiday?:boolean;higher:Feature|null;circle2:EventContext;comparisons?:ComparisonContext[];mappingVerified:boolean;timingVerified:boolean;methodsApproved:boolean;validated:boolean;fresh:boolean;riskConfigured:boolean;positionsKnown:boolean;newPositionsToday:number|null;ownerDirection:Side|null;ownerEvidenceComplete:boolean;invalidation:boolean;proposedR:number|null}
/** Deterministic gates own the final state; narrative/model text is never an input. */
export function assessConfluence(x:ConfluenceInput){
 const f=x.feature,candidate:Side|null=f?.retest||f?.openingReversal||null,hard:string[]=[],cautions:string[]=[];
 if(!candidate)hard.push('No qualifying observable structural candidate');
 if(!x.mappingVerified)hard.push('Exact execution product unresolved');
 if(!x.timingVerified)hard.push('Bar boundaries, closed state or session calendar unverified');
 if(!x.methodsApproved||!x.validated)hard.push('Research definitions lack execution approval / historical validation');
 if(!x.fresh)hard.push('No fresh current operational observations');
 if(!x.riskConfigured)hard.push('Risk sizing, stop/target or TP1 configuration incomplete');
 if(!x.positionsKnown||x.newPositionsToday===null||!Number.isInteger(x.newPositionsToday)||x.newPositionsToday<0)hard.push('Current positions and daily opening history unknown');
 if(x.newPositionsToday!==null&&x.newPositionsToday>=EXECUTION_PLAN.maxNewPositionsPerInstrumentUKDay)hard.push('Daily new-position limit reached');
 if(!x.circle2.coverage||!x.circle2.vintageVerified)hard.push('Point-in-time event / expectation evidence incomplete');
 if(!x.circle2.expectedDirection)hard.push('Frozen expected price direction unavailable');
 if(candidate&&x.circle2.expectedDirection&&candidate!==x.circle2.expectedDirection)hard.push('Expected price direction contradicts observed structural candidate');
 if(x.circle2.contradiction||x.invalidation)hard.push('Contradiction or invalidation unresolved');
 if(candidate&&!allowedSide(x.instrumentId,candidate))hard.push('Instrument / direction outside execution allowlist');
 if(x.proposedR===null||!Number.isFinite(x.proposedR)||x.proposedR<5)hard.push('Proposed reward/risk below 1:5 or unavailable');
 const clock=instantMs(x.asOf),known=(time:string)=>{const t=instantMs(time);return clock!==null&&t!==null&&t<=clock;};
 const recent=(feature:Feature|null,minutes:number)=>{const t=instantMs(feature?.availableAt);return clock!==null&&t!==null&&t<=clock&&clock-t<=minutes*60000;};
 if([f,x.directional,x.higher].some(feature=>feature&&instantMs(feature.availableAt)===null)||clock===null)hard.push('Invalid feature timestamp rejected');
 if([f,x.directional,x.higher].some(feature=>{const t=instantMs(feature?.availableAt);return t!==null&&clock!==null&&t>clock;}))hard.push('Future feature rejected');
 if(!recent(f,5))hard.push('Entry feature missing valid freshness');
 if(x.directional&&!recent(x.directional,15))hard.push('Directional feature stale');
 if(x.multiday&&x.higher&&!recent(x.higher,120))hard.push('Multiday feature stale');
 if(x.circle2.responses?.some(r=>!known(r.availableAt)||!Number.isFinite(r.value)||!Number.isFinite(r.minutes)||r.minutes<=0))hard.push('Future or invalid event outcome rejected');
 if(x.comparisons?.some(r=>!known(r.availableAt)||(r.correlation60!==null&&(!Number.isFinite(r.correlation60)||Math.abs(r.correlation60)>1))))hard.push('Future or invalid cross-market evidence rejected');
 const direction=candidate==='BUY'?'Bullish':candidate==='SELL'?'Bearish':null;
 if(!x.directional||x.directional.direction!==direction)hard.push('15m+ directional confluence absent or contradictory');
 if(x.multiday&&(!x.higher||x.higher.direction!==direction))hard.push('2H+ multiday confluence absent or contradictory');
 if(f?.sweep==='CONFLICT')hard.push('Two-sided sweep conflict');
 if(f?.volatility==='high')cautions.push('High realised volatility; risk review required');
 const strata:AssessmentState=hard.length?'STAND DOWN':cautions.length?'CAUTION':candidate!;
 const ownerHard=[...hard];if(!x.ownerEvidenceComplete||!x.ownerDirection)ownerHard.push('Owner cross-market ladder / separate NQ branch incomplete');if(x.ownerDirection&&candidate&&x.ownerDirection!==candidate)ownerHard.push('Owner direction disagrees with computed structural candidate');
 const owner:AssessmentState=ownerHard.length?'STAND DOWN':cautions.length?'CAUTION':x.ownerDirection!;
 return {version:EXECUTION_PLAN.version,asOf:x.asOf,instrumentId:x.instrumentId,strata:{actor:'Strata',state:strata,candidate,hardGates:hard,cautions},ownerPlan:{actor:'Owner plan evaluator',state:owner,declaredDirection:x.ownerDirection,hardGates:ownerHard},disagreement:owner!==strata,sharedEvidenceIsIndependentConfirmation:false,circles:{market:{featureAt:f?.availableAt??null,direction:x.directional?.direction??'Unknown',atr:f?.atr??null,comparisons:x.comparisons||[]},expectation:x.circle2,behaviour:{sweep:f?.sweep??null,retest:f?.retest??null,openingReversal:f?.openingReversal??null,intentMeasured:false}},invalidation:'A failed hard gate, stale evidence, opposite structure, breached stop or contradictory expectation requires Stand Down.',nextConditions:[...hard,...ownerHard.filter(h=>!hard.includes(h))],statisticalConfidence:null,canSubmitOrder:false};
}
