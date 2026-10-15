// Production route/helper tests with closed auth/catalog/Stripe transports.
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { checkoutFixture, ownerA, ownerB, sourceModule, validShipping } from './lib/store-checkout-fixture.mjs';
const completion=sourceModule('src/lib/checkoutCompletion.ts');
const attempts=sourceModule('src/lib/checkoutAttempt.ts');
const scopes=sourceModule('src/lib/authSessionScope.ts');
let pass=0,failed=0;
async function check(name,fn){try{await fn();console.log('PASS '+name);pass++;}catch(error){console.error('FAIL '+name+'\n'+error.stack);failed++;}}
const sessionOf=f=>[...f.state.sessions.values()][0];
function paid(f){const s=sessionOf(f);s.status='complete';s.payment_status='paid';return s;}
const storage=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};};
await check('anonymous and invalid JWT stop checkout before any stock/provider action',async()=>{
 for(const token of ['', 'bad-token']){const f=checkoutFixture();assert.equal((await f.post(f.body(),token)).status,401);assert.equal(f.state.rpcCalls.length,0);assert.equal(f.state.stripeCreates.length,0);}
});
await check('client owner/price/shipping fields cannot override verified identity or frozen catalog',async()=>{
 const f=checkoutFixture();const out=await f.post(f.body({owner_id:ownerB,userId:ownerB,shippingCents:0,total:1,items:[{id:'synthetic',quantity:1,price:0.01}]}));
 assert.equal(out.status,200);const r=[...f.state.reservations.values()][0];assert.equal(r.owner_id,ownerA);assert.equal(r.subtotal_cents,1025);assert.equal(r.shipping_cents,599);assert.equal(r.total_cents,1624);
 assert.equal(f.state.stripeCreates[0].params.metadata.user_id,ownerA);
});
await check('same attempt cannot move from A to B; original frozen owner remains A',async()=>{
 const f=checkoutFixture(),body=f.body();assert.equal((await f.post(body)).status,200);assert.equal((await f.post(body,'token-b')).status,409);
 assert.equal(f.state.reservations.get(body.attemptId).owner_id,ownerA);assert.equal(f.state.stripeCreates.length,1);
});
await check('owning paid session returns minimal private projection; unrelated account cannot settle it',async()=>{
 const f=checkoutFixture();await f.post();const s=paid(f);const before=f.state.rpcCalls.length;
 const wrong=await f.session(s.id,'token-b');assert.equal(wrong.status,404);assert.equal(f.state.rpcCalls.length,before);assert.equal(f.state.orders.size,0);
 const good=await f.session(s.id);assert.equal(good.status,200);assert.equal(good.data.owner_id,ownerA);assert.equal(good.data.amount_total,1624);assert.equal(good.data.shipping_cents,599);assert.equal(good.data.line_items[0].product_id,'synthetic');
 assert.equal(good.data.metadata.shipping_info,undefined);assert.equal(good.data.metadata.user_id,undefined);assert.equal(good.data.metadata.checkout_request_sha256,undefined);
 assert.equal(good.headers.get('cache-control'),'private, no-store');assert.equal(good.headers.get('vary'),'Authorization');assert.equal(f.state.orders.size,1);
});
await check('session route rejects anonymous before Stripe retrieve',async()=>{const f=checkoutFixture();const out=await f.session('cs_test_unknown','');assert.equal(out.status,401);assert.equal(f.state.stripeReads,0);});
await check('durable orders are available without current cart/nonce and are owner filtered',async()=>{
 const f=checkoutFixture();await f.post();await f.session(paid(f).id);const a=await f.orders(), b=await f.orders('token-b'), anon=await f.orders('');
 assert.equal(a.status,200);assert.equal(a.data.items.length,1);assert.equal(a.data.items[0].total_cents,1624);assert.equal(b.data.items.length,0);assert.equal(anon.status,401);assert.equal(a.headers.get('cache-control'),'private, no-store');
});
await check('legacy ownerless session/order is never claimed by matching email',async()=>{
 const f=checkoutFixture();await f.post();const s=paid(f),r=[...f.state.reservations.values()][0];r.owner_id=null;
 f.state.orders.set(r.attempt_id,{...r,paid_at:new Date().toISOString()});
 assert.equal((await f.session(s.id)).status,404);assert.equal((await f.orders()).data.items.length,0);assert.equal(r.owner_id,null);
});
await check('subscription success also requires the original verified user id',async()=>{
 const f=checkoutFixture();f.state.sessions.set('subscription',{id:'cs_test_subscription',mode:'subscription',livemode:false,status:'complete',payment_status:'paid',metadata:{user_id:ownerA,intent:'ai-upgrade',tier:'basic',shipping_info:'not returned'},currency:'eur',amount_total:999});
 assert.equal((await f.session('cs_test_subscription','token-b')).status,404);
 const a=await f.session('cs_test_subscription');assert.equal(a.status,200);assert.equal(a.data.metadata.tier,'basic');assert.equal(a.data.metadata.shipping_info,undefined);
});
await check('catalog thresholds freeze exact EUR money and never trust client fee',async()=>{
 for(const [price,fee] of [['14.99',599],['49.99',599],['50.00',0],['50.01',0]]){
  const f=checkoutFixture();f.state.rows[0].price=price;assert.equal((await f.post()).status,200);
  const r=[...f.state.reservations.values()][0],p=f.state.stripeCreates[0].params;assert.equal(r.shipping_cents,fee);assert.equal(p.shipping_options[0].shipping_rate_data.fixed_amount.amount,fee);
  assert.equal(sessionOf(f).amount_total,r.total_cents);assert.equal((await f.session(paid(f).id)).status,200);
 }
});
await check('provider subtotal/shipping/tax/discount mismatches never create an order',async()=>{
 for(const mutate of [s=>s.amount_subtotal++,s=>s.total_details.amount_shipping++,s=>s.total_details.amount_tax=1,s=>s.total_details.amount_discount=1,s=>s.shipping_cost.amount_total++,s=>delete s.total_details]){
  const f=checkoutFixture();await f.post();const s=paid(f);mutate(s);assert.equal((await f.session(s.id)).status,503);assert.equal(f.state.orders.size,0);
 }
});
await check('a legacy zero-shipping reservation stays zero while normal new reservations charge fee',async()=>{
 const f=checkoutFixture();await f.post();const s=paid(f),r=[...f.state.reservations.values()][0];r.shipping_cents=0;r.total_cents=r.subtotal_cents;s.amount_total=s.amount_subtotal;s.total_details.amount_shipping=0;s.shipping_cost.amount_total=0;
 assert.equal((await f.session(s.id)).status,200);assert.equal([...f.state.orders.values()][0].shipping_cents,0);
});
await check('v2 attempt storage isolates owners, ignores legacy nonce, and stores no address',async()=>{
 const s=storage();s.setItem('pawpal.checkout-attempts.v1','legacy');const payload={ownerId:ownerA,items:[{id:'synthetic',quantity:1}],shipping:validShipping,locale:'en'};
 const a=await attempts.checkoutAttemptId(payload,s,webcrypto);const b=await attempts.checkoutAttemptId({...payload,ownerId:ownerB},s,webcrypto);
 assert.notEqual(a,b);assert.equal(attempts.ownsCheckoutAttempt(a,ownerB,s),false);attempts.finishCheckoutAttempt(a,ownerB,s);assert.equal(attempts.ownsCheckoutAttempt(a,ownerA,s),true);
 assert.equal(await attempts.checkoutAttemptId(payload,s,webcrypto),a);assert.equal([...s.data.values()].join().includes(validShipping.address),false);assert.equal(s.getItem('pawpal.checkout-attempts.v1'),'legacy');
});
await check('paid-return from another account or device cannot clear this browser cart',async()=>{
 const f=checkoutFixture();await f.post();const data=(await f.session(paid(f).id)).data;let saves=0,finishes=0;
 const ports={ownerId:ownerB,ownsAttempt:()=>true,finishAttempt:()=>finishes++,loadCart:()=>[],saveCart:()=>saves++};
 completion.recordPaidCheckout(data,data.id,ports);assert.equal(saves,0);assert.equal(finishes,0);
 completion.recordPaidCheckout(data,data.id,{...ports,ownerId:ownerA,ownsAttempt:()=>false});assert.equal(saves,0);assert.equal(finishes,0);
});
await check('auth generation remains stable on token refresh but invalidates ABA and signed-out same-owner work',async()=>{
 const s=scopes.createAuthSessionScope();const a=s.accept({user:{id:ownerA},access_token:'a'});const refreshed=s.accept({user:{id:ownerA},access_token:'a2'});
 assert.equal(a.generation,refreshed.generation);assert.equal(s.getSessionForGeneration(a.generation).access_token,'a2');
 s.accept({user:{id:ownerB},access_token:'b'});s.accept({user:{id:ownerA},access_token:'a3'});assert.equal(s.getSessionForGeneration(a.generation),null);
 const current=s.snapshot.generation;s.accept(null,true);s.accept({user:{id:ownerA},access_token:'a3'});assert.equal(s.getSessionForGeneration(current),null);
});
await check('same-name same-price replacement product is never consumed by an old paid return',async()=>{
 const f=checkoutFixture();await f.post();const data=(await f.session(paid(f).id)).data;let saves=0;
 const changed=[{product:{id:'different-product',name:'Trusted Catalog Item',price:10.25,currency:'EUR'},quantity:1}];
 const result=completion.recordPaidCheckout(data,data.id,{ownerId:ownerA,ownsAttempt:()=>true,finishAttempt:()=>{},loadCart:()=>changed,saveCart:()=>saves++});
 assert.equal(result,false);assert.equal(saves,0);
});
await check('missing paid product identity fails closed; exact verified product may consume once',async()=>{
 const f=checkoutFixture();await f.post();const data=(await f.session(paid(f).id)).data;let saves=0;
 const ownCart=[{product:{id:'synthetic',name:'Trusted Catalog Item',price:10.25,currency:'EUR'},quantity:1}];
 const ports={ownerId:ownerA,ownsAttempt:()=>true,finishAttempt:()=>{},loadCart:()=>ownCart,saveCart:()=>saves++};
 const missing=structuredClone(data);delete missing.line_items[0].product_id;
 assert.equal(completion.recordPaidCheckout(missing,missing.id,ports),false);assert.equal(saves,0);
 assert.equal(completion.recordPaidCheckout(data,data.id,ports),true);assert.equal(saves,1);
});
console.log(`${pass}/${pass+failed} ownership/amount/lifecycle cases; actual handlers/helpers with closed transports, no live Stripe/Auth/DB.`);
if(failed)process.exitCode=1;
