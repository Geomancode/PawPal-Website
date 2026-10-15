import assert from 'node:assert/strict';
import { sourceModule, ownerA, ownerB } from './lib/store-checkout-fixture.mjs';
import { hookHarness } from './lib/hook-harness.mjs';
import { pageLifecycleCases } from './lib/store-page-lifecycle-cases.mjs';
function fixture() {
  const runner=hookHarness(), requests=[];
  const scope = sourceModule('src/lib/authSessionScope.ts').createAuthSessionScope();
  const initial = scope.accept({user:{id:ownerA},access_token:'token-a'});
  let auth={user:{id:ownerA},session:initial.session,loading:false,authGeneration:initial.generation};
  const getSessionForGeneration = scope.getSessionForGeneration;
  const useAuth=()=>({...auth,getSessionForGeneration});
  const hook=sourceModule('src/lib/hooks/useStoreOrders.ts',{'react':runner.api,'@/components/AuthProvider':{useAuth}}, {}, {
    AbortController, queueMicrotask, fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve,reject})),
  }).useStoreOrders;
  runner.mount(hook);
  return {runner, requests, async change(user, generation, token) {const next=scope.accept(user?{user:{id:user},access_token:token}:null); assert.equal(next.generation,generation);auth={user:next.session?.user??null,session:next.session,loading:false,authGeneration:next.generation}; return runner.render();},
    respond(index,ids,more=false) {requests[index].resolve({ok:true,json:async()=>({items:ids.map(id=>({id})),next_cursor:more?{paid_at:'2026-10-15T00:00:00.000001Z',id:ids.at(-1)}:null,has_more:more})});} };
}
let passed=0, failed=0;
async function check(name, fn) {try {await fn();passed++;console.log('PASS '+name);}catch(error){failed++;console.error('FAIL '+name+'\n'+error.stack);}}
await check('token refresh after second page never re-appends committed rows',async()=>{
 const f=fixture(); await f.runner.flush(); f.respond(0,['one'],true); await f.runner.flush();
 f.runner.value.loadMore();await f.runner.flush();f.respond(1,['two'],true);await f.runner.flush();
 await f.change(ownerA,1,'refreshed-a');await f.runner.flush();
 assert.equal(f.requests.length,2,'refresh must not refetch a committed page');
 assert.equal(f.runner.value.orders.map(x=>x.id).join(','),'one,two');f.runner.cleanup();
});
await check('A to B to A renders no prior-session orders before effects',async()=>{
 const f=fixture();await f.runner.flush();f.respond(0,['private-A'],true);await f.runner.flush();
 assert.equal((await f.change(ownerB,2,'token-b')).orders.length,0);
 assert.equal((await f.change(ownerA,3,'token-a-new')).orders.length,0,'owner-only cache is not a session boundary');
 await f.runner.flush();f.runner.cleanup();
});
await check('failed next page retries same cursor with newest token and no duplicate prefix',async()=>{
 const f=fixture();await f.runner.flush();f.respond(0,['one'],true);await f.runner.flush();
 f.runner.value.loadMore();await f.runner.flush();f.requests[1].reject(Error('offline'));await f.runner.flush();
 assert.equal(f.runner.value.orders.map(x=>x.id).join(','),'one');assert.equal(f.runner.value.error,true);
 await f.change(ownerA,1,'refreshed-a');await f.runner.flush();f.runner.value.retry();await f.runner.flush();
 const i=f.requests.length-1;assert.equal(f.requests[i].url,f.requests[1].url);assert.equal(f.requests[i].options.headers.Authorization,'Bearer refreshed-a');
 f.respond(i,['two'],false);await f.runner.flush();assert.equal(f.runner.value.orders.map(x=>x.id).join(','),'one,two');f.runner.cleanup();
});
await check('late A response after B switch does not expose A rows',async()=>{
 const f=fixture();await f.runner.flush();await f.change(ownerB,2,'token-b');await f.runner.flush();
 f.respond(0,['private-A']);f.respond(1,['private-B']);await f.runner.flush();assert.equal(f.runner.value.orders.map(x=>x.id).join(','),'private-B');f.runner.cleanup();
});
await pageLifecycleCases(check);
console.log(`${passed}/${passed+failed} production hook lifecycle checks; deterministic hook runner, no browser, network or payments.`);
if(failed)process.exitCode=1;
