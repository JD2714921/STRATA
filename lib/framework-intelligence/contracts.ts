import {z} from 'zod';

export const FIL_VERSION='framework-context-v1';
export const frameworkId=z.enum(['graham','dalio','kahneman','taleb','institutions']);
export const horizon=z.enum(['intraday','multiday','macro','investment','decision-review']);
export const circle=z.enum(['market','expectations','behaviour']);
export const topic=z.enum(['valuation','capital-preservation','debt','policy','currency','judgment','tail-risk','model-risk','institutions','innovation']);
const text=z.string().trim().min(1).max(8000);
const instant=z.string().datetime({offset:true});
export const sourceProvenance=z.object({source_id:text,source_type:z.literal('secondary-synthesis'),title:text,sha256:z.string().regex(/^[a-f0-9]{64}$/),pages:z.array(z.number().int().min(1).max(14)).min(1),available_at:instant,original_work_consulted:z.literal(false)}).strict();
export const conceptSchema=z.object({
 concept_id:text,framework_id:frameworkId,name:text,author:text,originating_work:text,
 original_claim:text,claim_kind:z.literal('secondary-summary'),mechanism:text,
 relevant_market_conditions:z.array(text).min(1),appropriate_timescales:z.array(horizon).min(1),relevant_circles:z.array(circle).min(1),topics:z.array(topic).min(1),
 supporting_historical_examples:z.array(z.object({description:text,source_id:text}).strict()),historical_example_status:z.literal('not-established-by-supplied-source'),
 criticisms:z.array(text).min(1),contradictory_frameworks:z.array(frameworkId).min(1),observable_data_needed:z.array(text).min(1),required_evidence_topics:z.array(topic).min(1),disregard_conditions:z.array(text).min(1),
 source_provenance:z.array(sourceProvenance).min(1),applicability_rules_kind:z.literal('strata-inference'),
 influence_level:z.literal(1),quantitative_signal_weight:z.literal(0),execution_authority:z.literal(false),empirical_validation:z.literal('not-tested'),
}).strict();
export type FrameworkConcept=z.infer<typeof conceptSchema>;
export const registrySchema=z.object({version:z.literal(FIL_VERSION),ingested_at:instant,scope:z.literal('secondary-synthesis-only'),concepts:z.array(conceptSchema).min(5)}).strict().superRefine((r,c)=>{
 const ids=new Set<string>();for(const x of r.concepts){if(ids.has(x.concept_id))c.addIssue({code:'custom',message:'Duplicate concept ID'});ids.add(x.concept_id);}
 for(const id of frameworkId.options)if(!r.concepts.some(x=>x.framework_id===id))c.addIssue({code:'custom',message:'Missing framework '+id});
});

// Evidence comes from a reviewed upstream boundary, never from matching words in imported prose.
export const evidenceSchema=z.object({
 id:text,instrument_id:text,event_id:text.nullable(),topic,statement:text,
 kind:z.enum(['observation','expectation','realised-release','decision-record','narrative','interpretation']),
 verification:z.enum(['verified','unverified']),role:z.enum(['support','contradiction']),circle,
 observed_at:instant,published_at:instant,received_at:instant,revision_available_at:instant.nullable(),valid_until:instant.nullable(),
 source_id:text,source_locator:text,
}).strict();
export type FrameworkEvidence=z.infer<typeof evidenceSchema>;
export const contextSchema=z.object({instrument_id:text,event_id:text.nullable(),as_of:instant,horizon,topics:z.array(topic).max(10),evidence:z.array(evidenceSchema).max(200)}).strict();
export type FrameworkContext=z.infer<typeof contextSchema>;
export const assessmentSchema=z.object({
 framework_id:frameworkId,framework_name:text,concept_id:text,source_provenance:z.array(sourceProvenance).min(1),original_claim:text,claim_kind:z.literal('secondary-summary'),
 applicability:z.enum(['contextually-relevant','insufficient-evidence','not-applicable']),relevant_circle:z.array(circle),relevant_time_horizon:z.array(horizon),
 observed_evidence:z.array(evidenceSchema),hypothesis:text.nullable(),contradictory_evidence:z.array(evidenceSchema),missing_evidence:z.array(text),limitations:z.array(text).min(1),
 interpretation:text,evidence_status:z.enum(['context-only-not-validated','insufficient-evidence','not-applicable']),interpretation_kind:z.literal('strata-inference'),
 influence_level:z.literal(1),quantitative_signal_weight:z.literal(0),execution_authority:z.literal(false),as_of:instant,version:z.literal(FIL_VERSION),
}).strict();
export type FrameworkAssessment=z.infer<typeof assessmentSchema>;
