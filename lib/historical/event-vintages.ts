import {z} from 'zod';
const instant=z.string().datetime({offset:true});
const value=z.number().finite().nullable();
export const eventVintageSchema=z.object({id:z.string().min(1),eventId:z.string().min(1),kind:z.enum(['scheduled','unscheduled']),country:z.enum(['US','GB','CN','Global']),category:z.enum(['CPI','PPI','employment','unemployment','monetary-policy','rates-yields','fiscal','geopolitical','commodity-supply','other']),name:z.string(),referencePeriod:z.string().nullable(),releaseDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),releaseAt:instant.nullable(),releaseTimePrecision:z.enum(['second','minute','day','unknown']),publishedAt:instant.nullable(),receivedAt:instant,actual:value,consensus:value,previous:value,revisedPrevious:value,units:z.string().nullable(),multiplier:z.number().positive().finite(),sourceUrl:z.string().url(),publisher:z.string().min(1),vintage:z.enum(['first-release','revision','unknown']),vintagePublishedAt:instant.nullable(),consensusPublishedAt:instant.nullable(),consensusSourceUrl:z.string().url().nullable(),consensusTimeZoneVerified:z.boolean(),sourceEvidence:z.string().min(1),revisionOf:z.string().nullable(),syndicationGroupId:z.string(),notes:z.string()}).strict();
export type EventVintage=z.infer<typeof eventVintageSchema>;
export function eventVintageStatus(raw:unknown){
 const e=eventVintageSchema.parse(raw),reasons:string[]=[];
 if(e.kind!=='scheduled')reasons.push('Unscheduled reporting is separate from scheduled surprise studies');
 if(!e.releaseAt||!['second','minute'].includes(e.releaseTimePrecision))reasons.push('Exact original release time unavailable');
 if(e.actual===null||!e.units||e.vintage!=='first-release'||!e.vintagePublishedAt)reasons.push('First-release actual, units or vintage unavailable');
 if(e.releaseAt&&e.vintagePublishedAt&&Date.parse(e.vintagePublishedAt)<Date.parse(e.releaseAt))reasons.push('Actual vintage predates release');
 if(e.vintagePublishedAt&&Date.parse(e.vintagePublishedAt)>Date.parse(e.receivedAt))reasons.push('Future vintage');
 if(e.consensus===null||!e.consensusPublishedAt||!e.consensusSourceUrl||!e.consensusTimeZoneVerified||!e.releaseAt||Date.parse(e.consensusPublishedAt)>=Date.parse(e.releaseAt))reasons.push('Timestamped pre-release consensus unverified');
 return {id:e.id,eventId:e.eventId,state:reasons.length?'unavailable':'point-in-time',firstReleaseActualVerified:e.vintage==='first-release'&&e.actual!==null&&!!e.vintagePublishedAt,fullVintageVerified:reasons.length===0,surprise:reasons.length===0?(e.actual!-e.consensus!)*e.multiplier:null,reasons,canAuthoriseTrade:false};
}
/** Never overwrite an earlier vintage or select a future publication during replay. */
export function eventsAsOf(records:EventVintage[],asOf:string){
 const cutoff=Date.parse(asOf);if(!Number.isFinite(cutoff))throw Error('Invalid as-of timestamp');
 const out=new Map<string,EventVintage>();
 for(const raw of records){const e=eventVintageSchema.parse(raw),published=e.vintagePublishedAt||e.publishedAt;if(!published||Date.parse(published)>cutoff||!e.releaseAt||Date.parse(e.releaseAt)>cutoff)continue;const old=out.get(e.eventId);if(!old||Date.parse(old.vintagePublishedAt||old.publishedAt!)<Date.parse(published))out.set(e.eventId,e);}
 return [...out.values()];
}
