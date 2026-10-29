// Actual installed Supabase SDK, closed synthetic transport. No browser/RLS claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';
const root = path.resolve(import.meta.dirname, '..');
const filename = path.join(root, 'src/lib/petMediaAccess.ts');
const context = { exports: {}, URL, queueMicrotask, console,
  require(name) { throw new Error('Unexpected runtime import ' + name); } };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  fileName: filename, compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
}).outputText, context, {filename});
const { observePetMedia, petMediaObjectPath, isPrivatePetMedia } = context.exports;
const A='b2100000-0000-4000-8000-000000000001', B='b2100000-0000-4000-8000-000000000002';
const key=`${A}/pet_media/b2100000-0000-4000-8000-000000000003/b2100000-0000-4000-8000-000000000004.png`;
const source=`https://private-pet.invalid/storage/v1/object/authenticated/pet-media/${key}`;
const delay=()=>new Promise(resolve=>setTimeout(resolve,15));
async function settle(fn) { for(let i=0;i<40;i++) {if(fn())return;await delay();}throw new Error('Bounded synthetic transition timed out'); }
function fixture() {
  let owner=A, serial=0, deny=false, gate=null;
  const reads=[], unknown=[], states=[], created=[], revoked=[];
  const client=createClient('https://private-pet.invalid','synthetic-anon', {
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{fetch:async(input,init={})=>{
      const url=new URL(typeof input==='string'?input:input.url);
      const method=init.method??'GET';
      if(url.origin!=='https://private-pet.invalid')throw new Error('Forbidden origin');
      if(method==='POST' && url.pathname==='/auth/v1/token') {
        const body=Buffer.from(JSON.stringify({sub:owner,exp:4102444800,role:'authenticated',serial:++serial})).toString('base64url');
        return Response.json({access_token:`eyJhbGciOiJIUzI1NiJ9.${body}.synthetic`,refresh_token:'synthetic',token_type:'bearer',expires_in:3600,
          user:{id:owner,aud:'authenticated',created_at:'2026-01-01T00:00:00Z'}});
      }
      if(method==='GET' && url.pathname===`/storage/v1/object/pet-media/${key}`) {
        const record={authorization:new Headers(init.headers).get('Authorization'),cache:init.cache};reads.push(record);
        const held=gate, refused=deny;
        if(held)await held;
        return refused?Response.json({statusCode:'403',message:'denied'}, {status:403}):new Response(new Uint8Array([1,2,3]), {headers:{'content-type':'image/png'}});
      }
      unknown.push(method+' '+url.pathname);throw new Error('Unknown synthetic request');
    }},
  });
  let resource;
  return {client,reads,unknown,states,created,revoked,
    async login(id){owner=id;const r=await client.auth.signInWithPassword({email:'fixture@example.invalid',password:'synthetic'});assert.equal(r.error,null);},
    set deny(value){deny=value;},set gate(value){gate=value;},
    start(value=source){resource=observePetMedia(client,value,s=>states.push(s),{createObjectURL(blob){created.push(blob);return 'blob:synthetic-'+created.length;},revokeObjectURL(url){revoked.push(url);}});return resource;},
    async finish(){resource?.dispose();await client.auth.stopAutoRefresh();assert.deepEqual(unknown,[]);},
  };
}
let passed=0;
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
await check('anonymous public-pet request uses configured anon key and actual SDK Blob bytes',async()=>{
 const f=fixture();try{f.start();await settle(()=>f.created.length===1);assert.equal(f.reads[0].authorization,'Bearer synthetic-anon');assert.equal(f.reads[0].cache,'no-store');assert.deepEqual([...new Uint8Array(await f.created[0].arrayBuffer())],[1,2,3]);}finally{await f.finish();}
});
await check('foreign, signed, public and encoded references fail before credential transport',async()=>{
 const f=fixture();try{for(const value of [source.replace('private-pet.invalid','foreign.invalid'),source+'?token=secret',source.replace('/authenticated/','/public/'),source.replace('/pet-media/','/%70et-media/')])assert.throws(()=>petMediaObjectPath(f.client,value));assert(isPrivatePetMedia(source.replace('/pet-media/','/%70et-media/')));assert.equal(f.reads.length,0);}finally{await f.finish();}
});
await check('account switch revokes old object URL and failed B read cannot retain A pixels',async()=>{
 const f=fixture();try{await f.login(A);f.start();await settle(()=>f.created.length===1);f.deny=true;await f.login(B);await settle(()=>f.states.at(-1)?.failed);assert.deepEqual(f.revoked,['blob:synthetic-1']);assert.equal(f.states.at(-1).url,null);assert.equal(f.reads.length,2);}finally{await f.finish();}
});
await check('A B A held result cannot create a late Blob URL',async()=>{
 const f=fixture();let release;try{await f.login(A);f.gate=new Promise(r=>release=r);f.start();await settle(()=>f.reads.length===1);f.gate=null;f.deny=true;await f.login(B);await settle(()=>f.states.at(-1)?.failed);await f.login(A);await settle(()=>f.reads.length===3&&f.states.at(-1)?.failed);release();await delay();assert.equal(f.created.length,0);assert.equal(f.states.at(-1).url,null);}finally{release?.();await f.finish();}
});
await check('healthy same-owner refresh retries denied read without reviving old scope',async()=>{
 const f=fixture();try{await f.login(A);f.deny=true;f.start();await settle(()=>f.states.at(-1)?.failed);f.deny=false;assert.equal((await f.client.auth.refreshSession()).error,null);await settle(()=>f.created.length===1);assert.equal(f.reads.length,2);assert.equal(f.states.at(-1).failed,false);}finally{await f.finish();}
});
await check('hidden tab revokes and resume performs a new authorization read',async()=>{
 const g=fixture();try{const resource=g.start();await settle(()=>g.created.length===1);resource.setActive(false);assert.equal(g.states.at(-1).url,null);assert.deepEqual(g.revoked,['blob:synthetic-1']);g.deny=true;resource.setActive(true);await settle(()=>g.states.at(-1)?.failed);assert.equal(g.reads.length,2);}finally{await g.finish();}
});
console.log(`${passed}/${passed} SDK/controller checks; controlled transport, not browser or backend authorization validation.`);
