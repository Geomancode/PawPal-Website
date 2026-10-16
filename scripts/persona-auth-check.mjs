import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

// Execute product modules with the real Supabase SDK and a synthetic HTTP transport.
// Gemini is replaced before the route is loaded: this test cannot spend API credit.
const ids = { A: '11111111-1111-4111-8111-111111111111', B: '22222222-2222-4222-8222-222222222222' };
const pets = { A: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' };
const calls = [];
const prompts = [];
const originalFetch = globalThis.fetch;
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json'}});
let denied = null;
globalThis.fetch = async (input, init) => {
  const req = new Request(input, init);
  const url = new URL(req.url);
  assert.equal(url.origin, 'http://persona-fixture.invalid', 'no external service calls');
  const token = req.headers.get('authorization');
  const actor = token === 'Bearer synthetic-A' ? 'A' : token === 'Bearer synthetic-B' ? 'B' : null;
  calls.push({path:url.pathname, actor, params:url.searchParams});
  if (url.pathname === '/auth/v1/user') return actor ? json({id:ids[actor],aud:'authenticated',role:'authenticated',email:`${actor}@example.invalid`}) : json({message:'Invalid session'},401);
  const table = url.pathname.split('/').at(-1);
  if (table === denied) return json({message:'Synthetic RLS denial',code:'42501'},403);
  if (table === 'get_profile_view') {
    assert.equal(req.method, 'POST');
    assert.equal(url.search, '');
    const body = await req.json();
    assert.deepEqual(Object.keys(body), ['p_user_id']);
    return actor && body.p_user_id === ids[actor] ? json({visibility:'self',profile:{
      id:ids[actor],display_name:actor,username:actor,avatar_url:null,location_city:null,
      bio:null,trust_level:1,paw_points:0,is_verified:false,created_at:'2026-01-01T00:00:00Z',
      custom_badge:null,profile_tags:[],language_pref:'en',updated_at:'2026-01-01T00:00:00Z',
      home_address:null,pet_preferences:null,subscription_tier:'basic',
      subscription_expires_at:'2099-01-01T00:00:00Z',quick_actions:[],banned_at:null,
    }}) : json(null);
  }
  if (table === 'pets') return json(actor && url.searchParams.get('owner_id') === `eq.${ids[actor]}` ? [{id:pets[actor],name:`Pet ${actor}`,species_group:'canine',status:'alive'}] : []);
  if (table === 'pet_memories') return json(actor && url.searchParams.get('user_id') === `eq.${ids[actor]}` && url.searchParams.get('pet_id') === `eq.${pets[actor]}` ? [{content:`Only ${actor} memory`,memory_type:'preference',confidence:90}] : []);
  throw new Error(`Unexpected fixture path: ${url.pathname}`);
};
function moduleAt(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const context = {exports:{},require:name=>{
    assert.ok(Object.hasOwn(dependencies,name),`Unexpected module ${name}`);
    return dependencies[name];
  },process:{env:{NEXT_PUBLIC_SUPABASE_URL:'http://persona-fixture.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon-key',GEMINI_API_KEY:'synthetic-unused'}},console,Response,Headers,ReadableStream,TextEncoder,Date};
  vm.runInNewContext(code,context,{filename:file});
  return context.exports;
}
let count=0;
async function check(label,fn){await fn();console.log(`PASS ${++count} ${label}`);}
try {
  const server=moduleAt('src/lib/supabaseServer.ts',{'@supabase/supabase-js':{createClient}});
  const persona=moduleAt('src/app/api/ai-agent/personaEngine.ts');
  const subscriptions=moduleAt('src/lib/subscriptions.ts');
  const profileViews=moduleAt('src/lib/profileViews.ts');
  class GoogleGenAI { chats={create:({config})=>{prompts.push(config.systemInstruction);return {sendMessage:async()=>({text:'Synthetic response'})};}}; }
  const route=moduleAt('src/app/api/ai-agent/route.ts',{
    '@google/genai':{GoogleGenAI,createPartFromFunctionResponse:()=>{}},
    '@/lib/supabaseServer':server,'@/lib/subscriptions':subscriptions,'@/lib/profileViews':profileViews,
    './systemPrompt':{PLATFORM_KNOWLEDGE_PROMPT:'Synthetic platform',FALLBACK_IDENTITY_PROMPT:'Synthetic fallback'},
    './personaEngine':persona,'./tools':{toolDeclarations:[],executeTool:()=>{throw Error('No tools expected');}},
  });
  const request=token=>new Request('http://persona-fixture.invalid/api/ai-agent',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({message:'Synthetic request'})});
  await check('missing and invalid sessions make no private reads or AI requests',async()=>{
    for(const token of [null,'synthetic-invalid']){
      calls.length=0;const res=await route.POST(request(token));assert.equal(res.status,401);
      assert.equal(calls.filter(c=>c.path.startsWith('/rest/')).length,0);assert.equal(prompts.length,0);
    }
  });
  await check('concurrent verified accounts carry their own identity through profiles, pets, memories',async()=>{
    calls.length=0;
    const responses=await Promise.all(['A','B'].map(a=>route.POST(request(`synthetic-${a}`))));
    const bodies=await Promise.all(responses.map(r=>r.text()));
    for(const [i,actor] of ['A','B'].entries()){
      assert.equal(responses[i].status,200);assert.match(bodies[i],/"memoriesRecalled":1/);
      const prompt=prompts.find(p=>p.includes(`You are Pet ${actor}`));assert.ok(prompt);assert.ok(prompt.includes(`Only ${actor} memory`));
      assert.ok(!prompt.includes(`Only ${actor==='A'?'B':'A'} memory`));
      for(const path of ['/rest/v1/rpc/get_profile_view','/rest/v1/pets','/rest/v1/pet_memories']) assert.equal(calls.filter(c=>c.actor===actor&&c.path===path).length,1);
    }
  });
  await check('request clients never mutate shared anonymous client',async()=>{
    calls.length=0;await server.supabaseServer.from('pet_memories').select('content');
    assert.equal(calls.at(-1).actor,null);
    assert.throws(()=>server.createUserScopedSupabaseClient(' '));
  });
  await check('cross-owner pet and memory requests remain denied by transport RLS fixture',async()=>{
    const client=server.createUserScopedSupabaseClient('synthetic-A');
    assert.equal((await persona.loadUserPets(client,ids.B)).length,0);
    assert.equal((await persona.recallMemories(client,ids.A,pets.B)).length,0);
    assert.equal((await persona.recallMemories(client,ids.B,pets.B)).length,0);
  });
  await check('revoked entitlement stops before persona or AI reads',async()=>{
    denied='get_profile_view';calls.length=0;const before=prompts.length;
    const res=await route.POST(request('synthetic-A'));assert.equal(res.status,402);assert.equal(prompts.length,before);
    assert.equal(calls.filter(c=>['/rest/v1/pets','/rest/v1/pet_memories'].includes(c.path)).length,0);denied=null;
  });
  await check('memory read rejection contributes no private prompt content',async()=>{
    denied='pet_memories';const client=server.createUserScopedSupabaseClient('synthetic-A');
    assert.equal((await persona.recallMemories(client,ids.A,pets.A)).length,0);denied=null;
  });
  console.log(`PASS ${count}/${count}; real SDK, synthetic HTTP/RLS and Gemini; no external network, billing or real user data.`);
} finally { globalThis.fetch=originalFetch; }
