import raw from '../../data/framework-intelligence/registry.json';
import {deepFreeze} from '../strata-v2/contracts';
import {assessmentSchema,contextSchema,registrySchema,FIL_VERSION,type FrameworkContext,type FrameworkEvidence,type FrameworkAssessment} from './contracts';

export const FRAMEWORK_NAMES={graham:'Benjamin Graham — The Intelligent Investor',dalio:'Ray Dalio — How Countries Go Broke',kahneman:'Daniel Kahneman — Thinking, Fast and Slow',taleb:'Nassim Nicholas Taleb — The Black Swan',institutions:'Acemoglu & Robinson — Why Nations Fail'} as const;
// Invalid optional library content never interrupts market ingestion or execution services.
export function loadFrameworkRegistry(value:unknown=raw){return registrySchema.safeParse(value);}
export const FRAMEWORK_REGISTRY=deepFreeze(loadFrameworkRegistry().success?registrySchema.parse(raw):null);

function evidenceProblem(e:FrameworkEvidence,x:FrameworkContext):string|null {
 const clock=Date.parse(x.as_of);
 if(e.instrument_id!==x.instrument_id||e.event_id!==x.event_id)return 'Different instrument / event scope';
 if(e.verification!=='verified'||['narrative','interpretation'].includes(e.kind))return 'Unverified or interpretive material is not an observable input';
 if([e.observed_at,e.published_at,e.received_at,e.revision_available_at].some(t=>t!==null&&Date.parse(t)>clock))return 'Evidence or revision not available as of review';
 if(Date.parse(e.observed_at)>Date.parse(e.received_at)||Date.parse(e.published_at)>Date.parse(e.received_at))return 'Receipt precedes observation / publication';
 if(e.revision_available_at!==null&&Date.parse(e.revision_available_at)>Date.parse(e.received_at))return 'Revision was unavailable at receipt';
 if(e.valid_until!==null&&(Date.parse(e.valid_until)<clock||Date.parse(e.valid_until)<Date.parse(e.observed_at)))return 'Evidence validity expired / invalid';
 if(e.kind==='expectation'&&e.circle!=='expectations')return 'Expectation must remain in its own circle';
 if(e.kind==='decision-record'&&e.topic!=='judgment')return 'Decision record cannot establish a market observation';
 return null;
}

/** Read-only context: deliberately does not accept a trade assessment, risk state or mutable callback. */
export function assessFrameworks(input:unknown,library:unknown=raw){
 const parsed=contextSchema.safeParse(input),loaded=loadFrameworkRegistry(library);
 if(!parsed.success||!loaded.success)return deepFreeze({version:FIL_VERSION,status:'unavailable' as const,summary:'INSUFFICIENT EVIDENCE',assessments:[] as FrameworkAssessment[],comparisons:[],rejected_evidence:[],issues:[!parsed.success?'Invalid framework context':'',!loaded.success?'Framework library unavailable':''].filter(Boolean),quantitative_signal_weight:0 as const,execution_authority:false as const});
 const x=parsed.data,r=loaded.data;
 const rejected=x.evidence.map(e=>({id:e.id,reason:evidenceProblem(e,x)})).filter((e):e is {id:string;reason:string}=>e.reason!==null);
 const accepted=x.evidence.filter(e=>!evidenceProblem(e,x));
 const assessments=r.concepts.map(c=>{
  const released=c.source_provenance.every(s=>Date.parse(s.available_at)<=Date.parse(x.as_of))&&Date.parse(r.ingested_at)<=Date.parse(x.as_of);
  const matches=c.topics.some(t=>x.topics.includes(t))&&c.appropriate_timescales.includes(x.horizon);
  const scoped=accepted.filter(e=>c.topics.includes(e.topic)&&c.relevant_circles.includes(e.circle));
  const supporting=scoped.filter(e=>e.role==='support'),against=scoped.filter(e=>e.role==='contradiction');
  const missing=c.required_evidence_topics.filter(t=>!supporting.some(e=>e.topic===t)).map(t=>'Verified '+t+' evidence');
  if(!released)missing.push('Framework annotation was not available at the review timestamp');
  const applicability=!matches?'not-applicable':missing.length||!supporting.length?'insufficient-evidence':'contextually-relevant';
  return assessmentSchema.parse({framework_id:c.framework_id,framework_name:FRAMEWORK_NAMES[c.framework_id],concept_id:c.concept_id,source_provenance:c.source_provenance,original_claim:c.original_claim,claim_kind:c.claim_kind,applicability,relevant_circle:c.relevant_circles,relevant_time_horizon:c.appropriate_timescales,
   // Do not expose future annotations, their text or future/revised evidence to historical consumers.
   observed_evidence:released?supporting:[],hypothesis:null,contradictory_evidence:released?against:[],missing_evidence:missing,
   limitations:[...c.criticisms,...c.disregard_conditions,'Secondary synthesis; original book not ingested. No measured participant intention or predictive validation.'],
   interpretation:applicability==='contextually-relevant'?'This lens may help question the supplied observations. It neither establishes causation nor predicts continuation; contradictory evidence remains unresolved.':applicability==='not-applicable'?'The selected topic or horizon is outside this concept’s contextual scope.':'No applicability claim: required observable evidence or point-in-time annotation is missing.',
   evidence_status:applicability==='contextually-relevant'?'context-only-not-validated':applicability,interpretation_kind:'strata-inference',influence_level:1,quantitative_signal_weight:0,execution_authority:false,as_of:x.as_of,version:FIL_VERSION});
 }).filter(a=>{
  // No historical consumer receives an annotation created after its as-of, even as metadata.
  return Date.parse(r.ingested_at)<=Date.parse(x.as_of)&&a.source_provenance.every(s=>Date.parse(s.available_at)<=Date.parse(x.as_of));
 });
 const relevant=assessments.filter(a=>a.applicability==='contextually-relevant');
 return deepFreeze({version:FIL_VERSION,status:'loaded' as const,as_of:x.as_of,summary:relevant.length?'CONTEXT ONLY':!assessments.length||x.topics.length&&assessments.some(a=>a.applicability==='insufficient-evidence')?'INSUFFICIENT EVIDENCE':'NO RELEVANT FRAMEWORK APPLIES',assessments,comparisons:assessments.length?reconcileFrameworks(assessments):[],rejected_evidence:rejected,issues:assessments.length?[]:['No framework annotations available at this timestamp'],quantitative_signal_weight:0 as const,execution_authority:false as const});
}

// Competing theoretical interpretations are recorded, never resolved by voting or weights.
export const COMPARISONS=deepFreeze([
 {left:'graham',right:'taleb',relation:'contradiction',question:'A valuation cushion may omit catastrophic liabilities or nonlinear downside.',page:9},
 {left:'dalio',right:'taleb',relation:'contradiction',question:'Recurring debt mechanisms do not establish dependable crisis timing.',page:9},
 {left:'kahneman',right:'graham',relation:'contradiction',question:'A disciplined value estimate can still reflect anchoring or confirmation bias.',page:10},
 {left:'dalio',right:'institutions',relation:'independent-interpretation',question:'Fiscal constraints and political incentives address different parts of a policy response.',page:10},
 {left:'kahneman',right:'taleb',relation:'independent-interpretation',question:'Debiasing familiar judgments does not account for outcomes omitted from the model.',page:9},
 {left:'taleb',right:'institutions',relation:'contradiction',question:'An institutional history may omit alternative causes and contingency.',page:10},
 {left:'dalio',right:'graham',relation:'independent-interpretation',question:'A macro thesis does not establish that an asset is attractively priced.',page:10},
 {left:'graham',right:'taleb',relation:'agreement',question:'Both invite scrutiny of loss exposure, using different methods; agreement adds no independent confirmation.',page:2},
] as const);
export function reconcileFrameworks(assessments:readonly FrameworkAssessment[]){
 return COMPARISONS.map(p=>{
  const left=assessments.filter(a=>a.framework_id===p.left),right=assessments.filter(a=>a.framework_id===p.right);
  const present=(a:typeof left)=>a.some(x=>x.applicability==='contextually-relevant');
  const state=!left.length||!right.length?'missing-evidence':left.every(a=>a.applicability==='not-applicable')||right.every(a=>a.applicability==='not-applicable')?'non-applicability':!present(left)||!present(right)?'missing-evidence':p.relation;
  return {...p,state,relation_kind:'secondary-interpretation' as const,resolution:'Unresolved; no execution influence',source_id:'five-books-comparative-pdf',quantitative_signal_weight:0 as const,execution_authority:false as const};
 });
}
