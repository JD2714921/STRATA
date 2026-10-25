import {OperationError} from './contracts';
export async function readLimitedJson(request:Request,limit:number):Promise<unknown>{
 const reader=request.body?.getReader();if(!reader)throw new OperationError('invalid_request','JSON body required');const chunks:Uint8Array[]=[],decoder=new TextDecoder();let size=0;
 while(true){const n=await reader.read();if(n.done)break;size+=n.value.byteLength;if(size>limit){await reader.cancel();throw new OperationError('request_too_large','Request exceeds its bounded input contract');}chunks.push(n.value);}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}return JSON.parse(decoder.decode(all));
}
