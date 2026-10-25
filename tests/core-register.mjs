import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
// Source tests only: resolve extensionless local TS imports under Node's type stripper.
registerHooks({resolve(specifier,context,next){try{return next(specifier,context)}catch(error){if((specifier.startsWith('./')||specifier.startsWith('../'))&&!/\.[a-z]+$/i.test(specifier))return next(`${specifier}.ts`,context);throw error}},load(url,context,next){if(url.startsWith('file:')&&/\.json(\?raw)?$/.test(url)){const raw=readFileSync(new URL(url.replace('?raw','')),'utf8');return {format:'module',source:'export default '+(url.endsWith('?raw')?JSON.stringify(raw):raw),shortCircuit:true};}return next(url,context);}});
