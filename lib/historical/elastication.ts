import {z} from 'zod';
export const ELASTICATION_VERSION='v25-directional-elastication-v1';
export const Q_DEFINITION={
 definition:'Q_d is the nonnegative quantity explicitly attributed to direction d during a fixed observation window. BUY and SELL series are separate; neither candle colour nor total volume assigns direction.',
 units:null,kind:'unavailable',signConvention:'Direction label d; signed percentage changes and signed ratio retained separately from absolute E_d.',
 measured:false,proxy:false,reason:'No direction-attributed quantity observations or verified quantity units supplied by the authorised provider.',
} as const;
const observation=z.object({value:z.number().finite().nullable(),start:z.string().datetime({offset:true}),end:z.string().datetime({offset:true}),availableAt:z.string().datetime({offset:true}),sourceId:z.string().min(1)}).strict();
export const elasticationInput=z.object({instrumentId:z.string().min(1),timeframeMinutes:z.number().int().positive(),direction:z.enum(['BUY','SELL']),calculatedAt:z.string().datetime({offset:true}),timingVerified:z.boolean(),priceUnits:z.string().min(1),priceSource:z.string().min(1),qDefinition:z.object({definition:z.string().min(1),units:z.string().nullable(),kind:z.enum(['measured-directional-quantity','research-proxy','unavailable']),directionAttributed:z.boolean(),method:z.string().min(1)}).strict(),q0:observation,q1:observation,p0:observation,p1:observation,minimumAbsPriceChangePct:z.number().positive().finite().default(0.001)}).strict();
export type ElasticationInput=z.input<typeof elasticationInput>;
/** Percentages are in percentage units, not fractions. The 0.001% floor is a documented research safeguard, not an execution threshold. */
export function calculateElastication(raw:ElasticationInput){
 const x=elasticationInput.parse(raw),reasons:string[]=[];
 if(!x.timingVerified)reasons.push('Price / Q_d window timing unverified');
 const all=[x.q0,x.q1,x.p0,x.p1];
 if(all.some(o=>Date.parse(o.start)>=Date.parse(o.end)||Date.parse(o.availableAt)<Date.parse(o.end)||Date.parse(o.availableAt)>Date.parse(x.calculatedAt)))reasons.push('Invalid window or observation unavailable at calculation time');
 const aligned=x.q0.start===x.p0.start&&x.q0.end===x.p0.end&&x.q1.start===x.p1.start&&x.q1.end===x.p1.end&&Date.parse(x.q0.end)===Date.parse(x.q1.start)&&Date.parse(x.q0.end)-Date.parse(x.q0.start)===Date.parse(x.q1.end)-Date.parse(x.q1.start)&&Date.parse(x.q1.end)-Date.parse(x.q1.start)===x.timeframeMinutes*60000;
 if(!aligned)reasons.push('Q_d and P windows are not equal, aligned and contiguous');
 if(x.qDefinition.kind==='unavailable'||!x.qDefinition.directionAttributed||!x.qDefinition.units?.trim())reasons.push('Directional Q_d definition, attribution or units unavailable');
 if(x.q0.value===null||x.q1.value===null)reasons.push('Directional Q_d observations unavailable');
 else if(x.q0.value<=0||x.q1.value<0)reasons.push('Q_d baseline must be positive and quantities nonnegative');
 const pctQ=x.q0.value!==null&&x.q0.value>0&&x.q1.value!==null&&x.q1.value>=0?100*(x.q1.value-x.q0.value)/x.q0.value:null;
 const pctP=x.p0.value!==null&&x.p0.value>0&&x.p1.value!==null&&x.p1.value>0?100*(x.p1.value-x.p0.value)/x.p0.value:null;
 if(pctP===null)reasons.push('Positive original price observations unavailable');
 else if(Math.abs(pctP)<x.minimumAbsPriceChangePct)reasons.push('Zero or near-zero price percentage change');
 const ratio=!reasons.length&&pctQ!==null&&pctP!==null?pctQ/pctP:null;
 if(ratio!==null&&!Number.isFinite(ratio))reasons.push('Nonfinite ratio');
 const signedRatio=reasons.length?null:ratio;
 return {...x,version:ELASTICATION_VERSION,formula:'E_d = |(%ΔQ_d) / (%ΔP)|',pctQ,pctP,signedRatio,magnitude:signedRatio===null?null:Math.abs(signedRatio),state:signedRatio===null?'unavailable':x.qDefinition.kind==='research-proxy'?'research-proxy':'measured',reasons,approvedForExecution:false,canAuthoriseTrade:false};
}
