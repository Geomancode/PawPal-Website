import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Default: actual handler, Stripe signature SDK and Supabase SDK, synthetic HTTP.
// Optional evidence mode: those same RPC calls execute the real migration in the
// explicitly owned, network-none fixture database. Never reads .env credentials.
const realDb = process.env.PAWPAL_SUBSCRIPTION_SQL === '1';
const user = 'c3030000-0000-4000-8000-000000000001';
const other = 'c3030000-0000-4000-8000-000000000002';
const container = 'geopet-qa-post-edit-batch3';
const database = process.env.PAWPAL_SUBSCRIPTION_DATABASE || 'qa_batch4_subscription';
assert.match(database,/^qa_batch4_subscription(?:_[a-z0-9]+)?$/);
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
function sql(text) {
  return execFileSync('docker', ['exec','-i',container,'psql','-X','-qAt','-h','/tmp','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1'], {input:text,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
}
if (realDb) {
  const env = JSON.parse(execFileSync('docker',['inspect','--format','{"network":{{json .HostConfig.NetworkMode}},"ports":{{json .HostConfig.PortBindings}},"mounts":{{json .Mounts}}}',container],{encoding:'utf8'}));
  assert.equal(env.network,'none');assert.equal(Object.keys(env.ports??{}).length,0);assert.deepEqual(env.mounts,[]);
  assert.equal(sql("SELECT count(*) FROM public.billing_subscriptions WHERE stripe_subscription_id LIKE 'sub_batch4_%';"),'0','fixture must start unused; use a new clone for replay');
}
const environment = {STRIPE_SECRET_KEY:'sk_test_synthetic_not_a_secret',STRIPE_WEBHOOK_SECRET:'synthetic-signature-fixture',STRIPE_BASIC_PRICE_ID:'price_basic',STRIPE_PRO_PRICE_ID:'price_pro'};
function moduleAt(file, dependencies = {}) {
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const context={exports:{},require:name=>{assert.ok(Object.hasOwn(dependencies,name),`Unexpected module ${name}`);return dependencies[name];},process:{env:environment},console,Date};
  vm.runInNewContext(code,context,{filename:file});return context.exports;
}
const subscriptions=moduleAt('src/lib/subscriptions.ts');
const locks=new Map(), events=new Map(), billing=new Map(), profiles=new Map();
let sequence=0, failProfile=false, loseAck=false, stripeFail=false, hold=null;
let stripeReads=0, rpcCalls=0;
let current;
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
function mockRpc(name,args) {
  const id=args.p_subscription_id;
  if(name==='claim_subscription_webhook'){
    if(events.get(args.p_event_id)?.applied_at)return {status:'duplicate'};
    if(locks.get(id)?.token)return {status:'busy'};
    const token=`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`;
    locks.set(id,{token,event_id:args.p_event_id});return {status:'claimed',token};
  }
  if(name==='release_subscription_webhook'){
    if(locks.get(id)?.token===args.p_token)locks.delete(id);return null;
  }
  const lock=locks.get(id);
  assert.equal(lock?.token,args.p_token);assert.equal(lock?.event_id,args.p_event.id);
  if(failProfile)throw new Error('synthetic profile failure');
  const row=args.p_snapshot;
  if(billing.get(id)&&billing.get(id).user_id!==row.user_id)throw new Error('owner conflict');
  billing.set(id,{...row,updated_at:new Date().toISOString()});
  const eligible=[...billing.values()].filter(r=>r.user_id===row.user_id&&['active','trialing'].includes(r.status)&&Date.parse(r.current_period_end)>Date.now()).sort((a,b)=>(b.tier==='pro')-(a.tier==='pro')||Date.parse(b.current_period_end)-Date.parse(a.current_period_end));
  profiles.set(row.user_id,{subscription_tier:eligible[0]?.tier??'free',subscription_expires_at:eligible[0]?.current_period_end??null});
  events.set(args.p_event.id,{applied_at:'now'});locks.delete(id);return {status:'applied'};
}
function dbRpc(name,args){
  const params=name==='claim_subscription_webhook'?[args.p_subscription_id,args.p_event_id]:name==='release_subscription_webhook'?[args.p_subscription_id,args.p_token]:[args.p_subscription_id,args.p_token,JSON.stringify(args.p_event),JSON.stringify(args.p_snapshot)];
  return JSON.parse(sql(`SELECT coalesce(to_jsonb(public.${name}(${params.map(quote).join(',')})),'null'::jsonb);`)||'null');
}
const admin=createClient('http://subscription-fixture.invalid','synthetic-service-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
  const req=new Request(input,init),url=new URL(req.url);assert.equal(url.origin,'http://subscription-fixture.invalid');
  const name=url.pathname.split('/').at(-1);assert.ok(['claim_subscription_webhook','apply_subscription_webhook','release_subscription_webhook'].includes(name));rpcCalls++;
  const args=JSON.parse(await req.text());
  try {
    const result=realDb?dbRpc(name,args):mockRpc(name,args);
    if(loseAck&&name==='apply_subscription_webhook'){loseAck=false;return json({message:'Synthetic lost committed response'},500);}
    return json(result);
  }catch(error){return json({message:error.message,code:'P0001'},500);}
}}});
class LocalStripe extends Stripe {
  constructor(key,opts){super(key,{...opts,maxNetworkRetries:0,httpClient:Stripe.createFetchHttpClient(async(url,init)=>{
    assert.match(String(url),/^https:\/\/api\.stripe\.com\/v1\/subscriptions\/sub_batch4_/);
    assert.equal(new Headers(init.headers).get('stripe-version'),'2026-03-25.dahlia');
    stripeReads++;
    if(hold)await hold;
    if(stripeFail)return json({error:{message:'Synthetic Stripe failure',type:'api_error'}},503);
    return json(current);
  })});}
}
const route=moduleAt('src/app/api/stripe/webhook/route.ts',{
  'next/server':{NextResponse:{json:(value,init)=>json(value,init?.status??200)}},stripe:LocalStripe,'@/lib/errorReporting':{reportError:()=>{}},
  '@/lib/stripeGuard':{assertStripeTestMode:()=>{},getStripeSecretKey:()=>environment.STRIPE_SECRET_KEY},
  '@/lib/supabaseAdmin':{getSupabaseAdmin:()=>admin},'@/lib/subscriptions':subscriptions,
  '@/lib/storeCheckout':{reconcileStoreCheckout:()=>{throw new Error('Store checkout must not run in subscription cases');}},
});
const signer=new Stripe(environment.STRIPE_SECRET_KEY);
const event=(id,type='customer.subscription.updated',object={id:'sub_batch4_main',object:'subscription',status:'active'})=>({id,object:'event',type,created:100,api_version:'2024-06-20',data:{object}});
const snapshot=(id='sub_batch4_main',extra={})=>({id,object:'subscription',customer:'cus_synthetic',status:'active',metadata:{user_id:user,tier:'basic'},cancel_at_period_end:false,canceled_at:null,items:{object:'list',has_more:false,data:[{id:'si_synthetic',price:{id:'price_basic'},current_period_start:1700000000,current_period_end:4102444800}]},...extra});
async function send(evt,signature=true){const payload=JSON.stringify(evt);return route.POST(new Request('http://fixture.invalid/api/stripe/webhook',{method:'POST',headers:signature?{'stripe-signature':signer.webhooks.generateTestHeaderString({payload,secret:environment.STRIPE_WEBHOOK_SECRET})}:{},body:payload}));}
function state(id='sub_batch4_main',uid=user){
  if(!realDb)return {billing:billing.get(id)??null,profile:profiles.get(uid)??null};
  return JSON.parse(sql(`SELECT jsonb_build_object('billing',(SELECT to_jsonb(b) FROM public.billing_subscriptions b WHERE stripe_subscription_id=${quote(id)}),'profile',(SELECT jsonb_build_object('subscription_tier',subscription_tier,'subscription_expires_at',subscription_expires_at) FROM public.profiles WHERE id=${quote(uid)}));`));
}
function receipt(id){return realDb?sql(`SELECT count(*) FROM public.subscription_events WHERE id=${quote(id)} AND applied_at IS NOT NULL;`)==='1':Boolean(events.get(id)?.applied_at);}
function profileFault(enabled){failProfile=enabled;if(realDb)sql(enabled?`CREATE FUNCTION public.qa_batch4_fail_profile() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic profile failure'; END $$; CREATE TRIGGER qa_batch4_fail_profile BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.qa_batch4_fail_profile();`:'DROP TRIGGER qa_batch4_fail_profile ON public.profiles; DROP FUNCTION public.qa_batch4_fail_profile();');}
let count=0;async function check(label,fn){await fn();console.log(`PASS ${++count} ${label}`);}
try {
 await check('missing/wrong signatures and unrelated payments cannot touch billing',async()=>{
  assert.equal((await send(event('evt_bad'),false)).status,400);
  assert.equal((await route.POST(new Request('http://fixture.invalid',{method:'POST',headers:{'stripe-signature':'invalid'},body:'{}'}))).status,400);
  assert.equal((await send(event('evt_store','checkout.session.completed',{id:'cs_synthetic',object:'checkout.session',mode:'payment'}))).status,200);assert.equal(rpcCalls,0);
 });
 await check('actual profile write failure rolls back billing and receipt; same event retries',async()=>{
  current=snapshot();const beforeProfile=JSON.stringify(state().profile);profileFault(true);
  assert.equal((await send(event('evt_batch4_failure'))).status,500);
  assert.equal(state().billing,null);assert.equal(receipt('evt_batch4_failure'),false);assert.equal(JSON.stringify(state().profile),beforeProfile);
  profileFault(false);assert.equal((await send(event('evt_batch4_failure'))).status,200);
  assert.equal(state().profile.subscription_tier,'basic');assert.equal(Date.parse(state().billing.current_period_end),4102444800000);assert.equal(receipt('evt_batch4_failure'),true);
 });
 await check('successful duplicate performs no Stripe retrieval or business rewrite',async()=>{
  const reads=stripeReads,before=JSON.stringify(state());const response=await send(event('evt_batch4_failure'));assert.equal(response.status,200);assert.equal((await response.json()).duplicate,true);assert.equal(stripeReads,reads);assert.equal(JSON.stringify(state()),before);
 });
 await check('committed response lost: retry acknowledges one durable receipt',async()=>{
  loseAck=true;assert.equal((await send(event('evt_batch4_ack'))).status,500);assert.equal(receipt('evt_batch4_ack'),true);const before=JSON.stringify(state());assert.equal((await send(event('evt_batch4_ack'))).status,200);assert.equal(JSON.stringify(state()),before);
 });
 await check('Stripe retrieval failure leaves no completed receipt and permits retry',async()=>{
  stripeFail=true;assert.equal((await send(event('evt_batch4_stripe'))).status,500);assert.equal(receipt('evt_batch4_stripe'),false);stripeFail=false;assert.equal((await send(event('evt_batch4_stripe'))).status,200);
 });
 await check('concurrent same-subscription event waits via retryable busy response',async()=>{
  let release;hold=new Promise(resolve=>{release=resolve;});const first=send(event('evt_batch4_first'));while(!((realDb?sql("SELECT token IS NOT NULL FROM public.subscription_webhook_locks WHERE stripe_subscription_id='sub_batch4_main';")==='t':locks.has('sub_batch4_main'))))await new Promise(r=>setTimeout(r,5));
  const second=await send(event('evt_batch4_second'));assert.equal(second.status,503);release();hold=null;assert.equal((await first).status,200);assert.equal((await send(event('evt_batch4_second'))).status,200);
 });
 await check('older and same-second event payloads cannot resurrect a canceled canonical subscription',async()=>{
  current=snapshot('sub_batch4_main',{status:'canceled'});assert.equal((await send(event('evt_batch4_delete','customer.subscription.deleted'))).status,200);
  assert.equal((await send(event('evt_batch4_older'))).status,200);assert.equal(state().billing.status,'canceled');assert.equal(state().profile.subscription_tier,'free');
 });
 await check('null/invalid/expired entitlement denies access; missing active item period retries',async()=>{
  for(const expiry of [null,undefined,'','not-date','2000-01-01T00:00:00Z'])assert.equal(subscriptions.hasAiAccess({subscription_tier:'pro',subscription_expires_at:expiry}),false);
  assert.equal(subscriptions.hasProAccess({subscription_tier:'pro',subscription_expires_at:'2099-01-01T00:00:00Z'}),true);
  current=snapshot('sub_batch4_missing');delete current.items.data[0].current_period_end;
  assert.equal((await send(event('evt_batch4_missing','customer.subscription.created',{id:current.id}))).status,500);assert.equal(receipt('evt_batch4_missing'),false);assert.equal(state(current.id).billing,null);
 });
 await check('ambiguous paid items do not silently choose a plan or period',async()=>{
  current=snapshot('sub_batch4_multi');current.items.data.push({...current.items.data[0],id:'si_second',price:{id:'price_pro'}});
  assert.equal((await send(event('evt_batch4_multi','customer.subscription.updated',{id:current.id}))).status,500);assert.equal(receipt('evt_batch4_multi'),false);
 });
 await check('legacy receipt without applied_at is reconciled, not skipped',async()=>{
  current=snapshot('sub_batch4_legacy');const evt=event('evt_batch4_legacy','customer.subscription.updated',{id:current.id});
  if(realDb)sql(`INSERT INTO public.subscription_events(id,event_type,payload) VALUES (${quote(evt.id)},${quote(evt.type)},${quote(JSON.stringify(evt))});`);else events.set(evt.id,{applied_at:null});
  assert.equal((await send(evt)).status,200);assert.equal(receipt(evt.id),true);
 });
 await check('canceling one subscription preserves another known valid subscription',async()=>{
  current=snapshot('sub_batch4_main',{status:'canceled'});assert.equal((await send(event('evt_batch4_cancel_again'))).status,200);assert.equal(state().profile.subscription_tier,'basic');
 });
 await check('checkout canonical snapshot supports expanded subscription IDs; canceled-at-period-end stays valid until expiry',async()=>{
  current=snapshot('sub_batch4_checkout',{cancel_at_period_end:true});const evt=event('evt_batch4_checkout','checkout.session.completed',{id:'cs_synthetic',object:'checkout.session',mode:'subscription',subscription:{id:current.id},metadata:{user_id:user,tier:'basic'}});
  assert.equal((await send(evt)).status,200);assert.equal(state(current.id).billing.cancel_at_period_end,true);assert.equal(state(current.id).profile.subscription_tier,'basic');
 });
 await check('checkout user disagreement fails without a successful receipt',async()=>{
  current=snapshot('sub_batch4_checkout_conflict');const evt=event('evt_batch4_checkout_conflict','checkout.session.completed',{id:'cs_synthetic2',object:'checkout.session',mode:'subscription',subscription:current.id,metadata:{user_id:other,tier:'basic'}});
  assert.equal((await send(evt)).status,500);assert.equal(receipt(evt.id),false);assert.equal(state(current.id).billing,null);
 });
 await check('expired active period is recorded but cannot grant paid entitlement',async()=>{
  current=snapshot('sub_batch4_expired',{metadata:{user_id:other,tier:'pro'}});current.items.data[0]={...current.items.data[0],price:{id:'price_pro'},current_period_start:1500000000,current_period_end:1600000000};
  const evt=event('evt_batch4_expired','customer.subscription.updated',{id:current.id});assert.equal((await send(evt)).status,200);assert.equal(state(current.id,other).profile.subscription_tier,'free');
 });
 await check('existing subscription cannot be reassigned to a different profile',async()=>{
  current=snapshot('sub_batch4_legacy',{metadata:{user_id:other,tier:'basic'}});assert.equal((await send(event('evt_batch4_remap','customer.subscription.updated',{id:current.id}))).status,500);assert.equal(state(current.id).billing.user_id,user);assert.equal(receipt('evt_batch4_remap'),false);
 });
 if(realDb){
  await check('expired lease fencing rejects old commit and old release cannot clear new lease',async()=>{
   const args={p_subscription_id:'sub_batch4_fence',p_event_id:'evt_batch4_fence_old'};const old=dbRpc('claim_subscription_webhook',args);
   sql("UPDATE public.subscription_webhook_locks SET expires_at=clock_timestamp()-interval '1 second' WHERE stripe_subscription_id='sub_batch4_fence';");
   assert.throws(()=>dbRpc('apply_subscription_webhook',{p_subscription_id:args.p_subscription_id,p_token:old.token,p_event:{id:args.p_event_id},p_snapshot:{}}));
   const newer=dbRpc('claim_subscription_webhook',{...args,p_event_id:'evt_batch4_fence_new'});assert.notEqual(old.token,newer.token);
   assert.throws(()=>dbRpc('apply_subscription_webhook',{p_subscription_id:args.p_subscription_id,p_token:old.token,p_event:{id:args.p_event_id},p_snapshot:{}}));
   dbRpc('release_subscription_webhook',{p_subscription_id:args.p_subscription_id,p_token:old.token});assert.equal(sql("SELECT token FROM public.subscription_webhook_locks WHERE stripe_subscription_id='sub_batch4_fence';"),newer.token);
   dbRpc('release_subscription_webhook',{p_subscription_id:args.p_subscription_id,p_token:newer.token});
  });
  await check('anon/authenticated denied all three RPCs; service_role can claim',async()=>{
   for(const role of ['anon','authenticated'])for(const call of ["claim_subscription_webhook('sub_denied','evt_denied')","release_subscription_webhook('sub_denied',null)","apply_subscription_webhook('sub_denied',null,'{}','{}')"]){assert.throws(()=>sql(`SET ROLE ${role}; SELECT public.${call};`),e=>String(e.stderr).includes('permission denied'));}
   assert.equal(JSON.parse(sql("SET ROLE service_role; SELECT public.claim_subscription_webhook('sub_batch4_service','evt_batch4_service');")).status,'claimed');
  });
 }
 console.log(`PASS ${count}/${count}; ${realDb?'real isolated PostgreSQL RPCs':'synthetic RPC transport'}; actual product POST + Stripe signing/retrieval SDK + Supabase SDK; no Stripe network/payment.`);
} finally {
 if(failProfile)profileFault(false);
 await admin.auth.stopAutoRefresh();
}
