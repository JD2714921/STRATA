import {requireOwnerId} from '../round1-store-contracts';
import {hashPayload} from '../round1-store';
import {OperationError} from './contracts';
type Row={id:string;kind:string;record_key:string;created_at:string;payload:string;content_hash:string};
export class OperationsStore {
 readonly db:D1Database;readonly owner:string;
 constructor(db:D1Database,owner:string){requireOwnerId(owner);this.db=db;this.owner=owner;}
 async records(kind:string,key?:string,limit=100){const q=key?'SELECT * FROM operation_records WHERE owner_id = ? AND kind = ? AND record_key = ? ORDER BY rowid DESC LIMIT ?':'SELECT * FROM operation_records WHERE owner_id = ? AND kind = ? ORDER BY rowid DESC LIMIT ?';return (await this.db.prepare(q).bind(...(key?[this.owner,kind,key,limit]:[this.owner,kind,limit])).all<Row>()).results.map(r=>({...r,value:JSON.parse(r.payload)}));}
 async latest(kind:string,key:string){return (await this.records(kind,key,1))[0]||null;}
 async append(kind:string,key:string,payload:unknown,now:string,lease?:{resource:string;token:string}){const hash=await hashPayload(payload),values=[crypto.randomUUID(),this.owner,kind,key,now,JSON.stringify(payload),hash];if(lease){await this.checkLease(lease,now);await this.db.prepare('INSERT OR IGNORE INTO operation_records (id,owner_id,kind,record_key,created_at,payload,content_hash) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM operation_locks WHERE owner_id=? AND resource=? AND token=? AND expires_at>?)').bind(...values,this.owner,lease.resource,lease.token,now).run();}else await this.db.prepare('INSERT OR IGNORE INTO operation_records (id,owner_id,kind,record_key,created_at,payload,content_hash) VALUES (?,?,?,?,?,?,?)').bind(...values).run();return hash;}
 async lease(resource:string,now:string,seconds=240){const token=crypto.randomUUID(),until=new Date(Date.parse(now)+seconds*1000).toISOString();const r=await this.db.prepare('INSERT INTO operation_locks (owner_id,resource,token,expires_at) VALUES (?,?,?,?) ON CONFLICT(owner_id,resource) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE operation_locks.expires_at <= ?').bind(this.owner,resource,token,until,now).run();if(r.meta.changes!==1)throw new OperationError('overlap','This operation is already running',true);return {resource,token};}
 async checkLease(l:{resource:string;token:string},now:string){const r=await this.db.prepare('SELECT token FROM operation_locks WHERE owner_id = ? AND resource = ? AND token = ? AND expires_at > ?').bind(this.owner,l.resource,l.token,now).first();if(!r)throw new OperationError('lease_lost','Operation lease expired; stale worker cannot commit',true);}
 async release(l:{resource:string;token:string}){await this.db.prepare('DELETE FROM operation_locks WHERE owner_id = ? AND resource = ? AND token = ?').bind(this.owner,l.resource,l.token).run();}
 async phase<T>(runId:string,phase:string,input:unknown,work:(lease:{resource:string;token:string})=>Promise<T>,clock:()=>string=()=>new Date().toISOString()):Promise<T>{
  const inputHash=await hashPayload(input),existing=await this.db.prepare('SELECT * FROM operation_runs WHERE owner_id = ? AND run_id = ? AND phase = ?').bind(this.owner,runId,phase).first<{input_hash:string;state:string;payload:string|null}>();
  if(existing?.input_hash!==undefined&&existing.input_hash!==inputHash)throw new OperationError('run_conflict','Occurrence already belongs to different inputs');
  if(existing?.state==='succeeded')return JSON.parse(existing.payload!) as T;
  const lock=await this.lease(phase,clock());
  try{
   // Recheck after the resource lock: a concurrent retry may have just completed.
   const done=await this.db.prepare('SELECT state,payload FROM operation_runs WHERE owner_id = ? AND run_id = ? AND phase = ?').bind(this.owner,runId,phase).first<{state:string;payload:string}>();if(done?.state==='succeeded')return JSON.parse(done.payload) as T;
   await this.db.prepare('INSERT INTO operation_runs (owner_id,run_id,phase,input_hash,state,attempts,updated_at,payload,error,retry_at) VALUES (?,?,?,?,?,1,?,NULL,NULL,NULL) ON CONFLICT(owner_id,run_id,phase) DO UPDATE SET state=excluded.state,attempts=operation_runs.attempts+1,updated_at=excluded.updated_at,error=NULL,retry_at=NULL').bind(this.owner,runId,phase,inputHash,'running',clock()).run();
   const result=await work(lock);await this.checkLease(lock,clock());
   const pending=typeof result==='object'&&result!==null&&'retryPending' in result&&result.retryPending===true;
   const blocked=typeof result==='object'&&result!==null&&'blocked' in result&&result.blocked===true;
   const canonical=JSON.stringify(result);
   await this.db.prepare('UPDATE operation_runs SET state=?,payload=?,updated_at=?,error=NULL,retry_at=? WHERE owner_id=? AND run_id=? AND phase=? AND EXISTS (SELECT 1 FROM operation_locks WHERE owner_id=? AND resource=? AND token=? AND expires_at>?)').bind(blocked?'blocked':pending?'retryable':'succeeded',canonical,clock(),pending?new Date(Date.parse(clock())+60000).toISOString():null,this.owner,runId,phase,this.owner,lock.resource,lock.token,clock()).run();return JSON.parse(canonical) as T;
  }catch(e){const retry=e instanceof OperationError&&e.transient;await this.db.prepare('UPDATE operation_runs SET state=?,error=?,updated_at=?,retry_at=? WHERE owner_id=? AND run_id=? AND phase=? AND EXISTS (SELECT 1 FROM operation_locks WHERE owner_id=? AND resource=? AND token=? AND expires_at>?)').bind(retry?'retryable':'failed',e instanceof OperationError?e.message:'Operation failed; prior good records retained',clock(),retry?new Date(Date.parse(clock())+60000).toISOString():null,this.owner,runId,phase,this.owner,lock.resource,lock.token,clock()).run();throw e;}
  finally{await this.release(lock);}
 }
 async runs(){return (await this.db.prepare('SELECT run_id,phase,state,attempts,updated_at,error,retry_at FROM operation_runs WHERE owner_id=? ORDER BY updated_at DESC LIMIT 70').bind(this.owner).all()).results;}
}
