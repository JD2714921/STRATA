import {session,instant,OperationError} from './contracts';
export const TIMEZONE='Europe/London';
export const SCHEDULES=[
 {time:'01:15',name:'Overnight intelligence'}, {time:'07:45',name:'London / European opening assessment'},
 {time:'10:15',name:'European session review'}, {time:'13:30',name:'US data and pre-market assessment'},
 {time:'14:25',name:'US opening preparation'}, {time:'16:45',name:'Intraday assessment and bookkeeping'},
 {time:'21:15',name:'US review and next-session preparation'},
] as const;
const formatters=new Map<string,Intl.DateTimeFormat>();
export function localParts(at:string,zone=TIMEZONE){instant.parse(at);let f=formatters.get(zone);if(!f){f=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});formatters.set(zone,f);}const p=Object.fromEntries(f.formatToParts(new Date(at)).map(x=>[x.type,x.value]));return {day:`${p.year}-${p.month}-${p.day}`,time:`${p.hour}:${p.minute}`};}
export function localInstants(day:string,time:string,zone=TIMEZONE){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{2}:\d{2}$/.test(time))throw new OperationError('invalid_local_time','Valid local date/time required');
 const base=Date.parse(day+'T'+time+':00Z'),found:string[]=[];if(!Number.isFinite(base))throw new OperationError('invalid_local_time','Invalid local calendar value');
 for(let offset=-840;offset<=840;offset+=15){const at=new Date(base+offset*60000).toISOString(),p=localParts(at,zone);if(p.day===day&&p.time===time)found.push(at);}
 return found;
}
export function occurrence(time:string,scheduledAt:string){session.parse(time);const p=localParts(scheduledAt);if(p.time!==time||new Date(scheduledAt).getUTCSeconds()!==0||new Date(scheduledAt).getUTCMilliseconds()!==0)throw new OperationError('occurrence_mismatch','Occurrence must match its exact London clock minute');return {id:`strata:${p.day}:${time}`,day:p.day,time,scheduledAt:localInstants(p.day,time)[0],timezone:TIMEZONE};}
export function nextOccurrence(time:string,now:string){session.parse(time);instant.parse(now);const day=localParts(now).day;
 for(let n=0;n<4;n++){const d=new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);const at=localInstants(d,time)[0];if(at&&Date.parse(at)>Date.parse(now))return occurrence(time,at);}
 throw new OperationError('schedule_unavailable','No real local occurrence found');
}
export function latestOccurrence(time:string,now:string){const day=localParts(now).day;for(let n=0;n<4;n++){const d=new Date(Date.parse(day+'T12:00:00Z')-n*86400000).toISOString().slice(0,10);const at=localInstants(d,time).filter(t=>Date.parse(t)<=Date.parse(now)).at(-1);if(at)return occurrence(time,at);}throw new OperationError('schedule_unavailable','No occurrence found');}
export function scheduleRegister(now:string){return SCHEDULES.map(s=>({...s,timezone:TIMEZONE,trigger:'Sites cloud task → authenticated Site MCP',taskId:null,status:'BLOCKED / NOT REGISTERED',previousExecution:null,nextOccurrence:nextOccurrence(s.time,now),unattendedReceipt:null}));}
