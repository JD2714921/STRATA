'use client';
import {useMemo,useState} from 'react';
import {assessFrameworks,FRAMEWORK_NAMES,FRAMEWORK_REGISTRY} from '../lib/framework-intelligence/engine';
import {frameworkId,horizon,topic,type FrameworkContext,type FrameworkEvidence} from '../lib/framework-intelligence/contracts';

type Props={instrumentId:string;eventId?:string|null;asOf:string|null;evidence?:readonly FrameworkEvidence[];sourceNote?:string;initialTopic?:FrameworkContext['topics'][number]|'';initialHorizon?:FrameworkContext['horizon']};
const NO_EVIDENCE:readonly FrameworkEvidence[]=[];

/** An optional view only. No persistence, provider requests, callbacks into decisions or order path. */
export default function FrameworkIntelligence({instrumentId,eventId=null,asOf,evidence=NO_EVIDENCE,sourceNote='No reviewed observable inputs are connected to this panel. Current market readiness is unchanged.',initialTopic='',initialHorizon='intraday'}:Props){
 const [selectedFramework,setFramework]=useState('dalio'),[selectedTopic,setTopic]=useState<string>(initialTopic),[selectedHorizon,setHorizon]=useState<FrameworkContext['horizon']>(initialHorizon);
 const result=useMemo(()=>assessFrameworks({instrument_id:instrumentId,event_id:eventId,as_of:asOf,horizon:selectedHorizon,topics:selectedTopic?[selectedTopic]:[],evidence:[...evidence]}),[instrumentId,eventId,asOf,selectedHorizon,selectedTopic,evidence]);
 const profiles=FRAMEWORK_REGISTRY?.concepts.filter(c=>c.framework_id===selectedFramework)||[];
 const assessments=result.assessments.filter(a=>a.framework_id===selectedFramework&&a.applicability!=='not-applicable');
 function exportReview(){const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='strata-framework-context.json';a.click();URL.revokeObjectURL(url);}
 return <section className="panel" aria-label="Framework intelligence context only">
  <div className="panel-heading"><div><span className="eyebrow">FRAMEWORK INTELLIGENCE — CONTEXT ONLY</span><h2>Five ways to question the explanation.</h2></div><span className="pill">NO EXECUTION AUTHORITY</span></div>
  <p>What the data shows, what a theory suggests and what execution permits remain separate. These are secondary summaries of five books; no full-book ingestion or predictive validation is claimed.</p>
  <p className="muted">Scope: {instrumentId}{eventId?' / '+eventId:''} · Review as of {asOf||'unavailable'}. {sourceNote}</p>
  <div className="toolbar">
   <label>Contextual question<select aria-label="Framework contextual topic" value={selectedTopic} onChange={e=>setTopic(e.target.value)}><option value="">No topic selected</option>{topic.options.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
   <label>Analytical horizon<select aria-label="Framework analytical horizon" value={selectedHorizon} onChange={e=>{const h=horizon.safeParse(e.target.value);if(h.success)setHorizon(h.data);}}>{horizon.options.map(h=><option key={h} value={h}>{h}</option>)}</select></label>
   <button className="quiet" onClick={exportReview} disabled={result.status==='unavailable'}>Export context assessment</button>
  </div>
  <div className="callout" role="status"><strong>{result.summary}</strong><p>Validated quantitative influence: none. Signal weight 0 · Execution authority false · Level 1 contextual reference only.</p>{result.issues.map(s=><p key={s}>{s}</p>)}</div>
  <div className="toolbar"><b>Relevant frameworks:</b>{frameworkId.options.filter(id=>result.assessments.some(a=>a.framework_id===id&&a.applicability==='contextually-relevant')).map(id=><button type="button" className="quiet" key={id} onClick={()=>setFramework(id)}>{FRAMEWORK_NAMES[id]}</button>)}{!result.assessments.some(a=>a.applicability==='contextually-relevant')&&<span>None established from the supplied evidence.</span>}</div>
  <p className="muted">Selecting a topic requests a review; it is not evidence that a lens applies. Relevance is topical context, not verification of the theory or its causal mechanism. Imported narratives, missing observations and future annotations cannot establish applicability. Expectations and realised releases retain separate evidence types. Participant intentions are never measured here.</p>
  <label>Browse a reference profile<select aria-label="Framework reference profile" value={selectedFramework} onChange={e=>setFramework(e.target.value)}>{frameworkId.options.map(id=><option key={id} value={id}>{FRAMEWORK_NAMES[id]}</option>)}</select></label>
  {assessments.map(a=><details key={a.concept_id}><summary>{profiles.find(c=>c.concept_id===a.concept_id)?.name} · {a.applicability}</summary>
   <p><b>Why considered:</b> Topic and horizon match the declared contextual scope. {a.interpretation}</p>
   <h3>Supporting observable evidence</h3>{a.observed_evidence.length?a.observed_evidence.map(e=><p key={e.id}>{e.statement}<small>{e.kind} · {e.circle} · {e.source_id} / {e.source_locator} · observed {e.observed_at} · published {e.published_at} · received {e.received_at} · revision {e.revision_available_at||'none'}</small></p>):<p>Unavailable. No market facts are inferred from the book summary.</p>}
   <h3>Contradictory evidence</h3>{a.contradictory_evidence.length?a.contradictory_evidence.map(e=><p key={e.id}>{e.statement} · {e.kind} · {e.source_id} / {e.source_locator} · {e.published_at}</p>):<p>None supplied; this does not demonstrate absence of contradiction.</p>}
   <h3>Missing requirements</h3><ul>{a.missing_evidence.map(s=><li key={s}>{s}</li>)}</ul>
   <p><b>STRATA inference, not a source fact:</b> {a.interpretation}</p><ul>{a.limitations.map(s=><li key={s}>{s}</li>)}</ul>
  </details>)}
  <details><summary>Reference library · {profiles.length} concepts · secondary synthesis</summary><p>The current reference library is educational context. It is not an annotation available to earlier backtests.</p>{profiles.map(c=><article key={c.concept_id}><h3>{c.name}</h3><p>{c.original_claim}</p><p className="muted">Paraphrased secondary summary · {c.author}, {c.originating_work}. Source {c.source_provenance[0].source_id}, PDF pages {c.source_provenance[0].pages.join(', ')}; ingested {c.source_provenance[0].available_at}.</p><p><b>STRATA applicability proposal:</b> {c.mechanism}</p><p>Horizon: {c.appropriate_timescales.join(', ')}. Required observations: {c.observable_data_needed.join(', ')}.</p><ul>{[...c.criticisms,...c.disregard_conditions].map(s=><li key={s}>{s}</li>)}</ul><p>Alternative lenses: {c.contradictory_frameworks.map(id=>FRAMEWORK_NAMES[id]).join('; ')}. Supporting historical examples: not established by this source.</p><small>Source SHA-256: {c.source_provenance[0].sha256}</small></article>)}</details>
  <details><summary>Alternative explanations and unresolved comparisons</summary>{result.comparisons.length?result.comparisons.map((p,i)=><p key={i}><b>{p.left} / {p.right}: {p.state}</b> — {p.question} {p.resolution}. Secondary synthesis p.{p.page}.</p>):<p>No comparisons available at this review timestamp.</p>}</details>
  {!!result.rejected_evidence.length&&<details><summary>Excluded inputs ({result.rejected_evidence.length})</summary><ul>{result.rejected_evidence.map(e=><li key={e.id}>{e.id}: {e.reason}</li>)}</ul></details>}
  <p className="muted">No automatic hypothesis generation, feature promotion, confidence adjustment, risk changes or order requests. Framework agreement is not independent confirmation.</p>
 </section>;
}
