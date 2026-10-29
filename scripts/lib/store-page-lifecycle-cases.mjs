import assert from 'node:assert/strict';
import { sourceModule, ownerA, ownerB, validShipping } from './store-checkout-fixture.mjs';
import { hookHarness } from './hook-harness.mjs';
const jsx=(type,props)=>({type,props:props??{}});
const text=node=>node==null||typeof node==='boolean'?'':typeof node==='string'||typeof node==='number'?String(node):Array.isArray(node)?node.map(text).join(''):text(node.props?.children);
const nodes=node=>!node||typeof node!=='object'?[]:Array.isArray(node)?node.flatMap(nodes):[node,...nodes(node.props?.children)];
const cart=[{product:{id:'synthetic',name:'Trusted Catalog Item',price:10.25,currency:'EUR'},quantity:1}];
function fixture(kind){
 const runner=hookHarness(), scope=sourceModule('src/lib/authSessionScope.ts').createAuthSessionScope();scope.accept({user:{id:ownerA},access_token:'token-a'});
 const requests=[],location={href:''},writes=[];let finishes=0;const router={push:()=>{}};const i18n={path:x=>x,locale:'en'},translations={loader:null,t:x=>x};
 const useAuth=()=>({user:scope.snapshot.session?.user??null,session:scope.snapshot.session,loading:false,authGeneration:scope.snapshot.generation,getSessionForGeneration:scope.getSessionForGeneration});
 const deps={
  'react':{...runner.api,Suspense:'Suspense'},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},
  'framer-motion':{motion:new Proxy({}, {get:(_t,p)=>'motion.'+String(p)})},'@/components/AuthProvider':{useAuth},
  '@/lib/storePricing':sourceModule('src/lib/storePricing.ts'),'@/lib/checkoutShipping':sourceModule('src/lib/checkoutShipping.ts'),
  '@/lib/checkoutAttempt':{checkoutAttemptId:async()=> 'b1500000-0000-4000-8000-000000000003',finishCheckoutAttempt:()=>finishes++,ownsCheckoutAttempt:()=>true},
  '@/i18n/I18nProvider':{useI18n:()=>i18n},'next/navigation':{useRouter:()=>router,useSearchParams:()=>new URLSearchParams('session_id=cs_test_lifecycle')},
  '@/components/icons/PawIcon':{default:'Icon'},'@/app/store/ProductVisual':{default:'Product'},'@/app/store/useCart':{useCart:()=>[cart,()=>{},true]},
  '@/app/store/storeData':{loadCart:()=>cart,saveCart:rows=>writes.push(rows)},'@/lib/checkoutCompletion':sourceModule('src/lib/checkoutCompletion.ts'),
  '@/components/ui':Object.fromEntries(['Badge','Button','Card','CardContent','Input','StatusMessage'].map(x=>[x,x]).concat([['buttonClassName',()=> 'test']])),
  '@/i18n/useRouteTranslations':{useRouteTranslations:()=>translations},'@/lib/p3b1g1AccountFixtures':{loadP3B1g1AccountFixtures:()=>{throw Error('No product fixture bypass');}},
 };
 const api=sourceModule(`src/app/[locale]/(streamed)/store/${kind}/page.tsx`,deps,{}, {AbortController,queueMicrotask,window:{location,matchMedia:()=>({matches:false})}, fetch:(url,options)=>new Promise(resolve=>requests.push({url,options,resolve}))});
 const component=kind==='success'?api.default().props.children.type:api.default;
 runner.mount(component);
 function change(owner){scope.accept(owner?{user:{id:owner},access_token:'token-'+owner}:null,!owner);runner.render();}
 async function fill(){for(const [name,value] of Object.entries(validShipping)){const field=nodes(runner.value).find(n=>n.props.name===name);assert.ok(field,'actual shipping field '+name);field.props.onChange(value);runner.render();}const review=nodes(runner.value).find(n=>n.type==='motion.button'&&text(n).includes('checkoutReviewOrderButton'));assert.equal(review.props.disabled,false);review.props.onClick();await runner.flush();}
 const pay=()=>nodes(runner.value).find(n=>n.type==='motion.button'&&text(n).includes('checkoutPayPrefix'));
 return {runner,scope,requests,location,writes,change,fill,pay,finishes:()=>finishes};
}
const paid={id:'cs_test_lifecycle',owner_id:ownerA,mode:'payment',status:'paid',customer_email:'qa@example.invalid',amount_total:1624,currency:'eur',metadata:{intent:'store-order',checkout_attempt_id:'b1500000-0000-4000-8000-000000000003'},line_items:[{product_id:'synthetic',name:'Trusted Catalog Item',quantity:1,amount:1025}]};
export async function pageLifecycleCases(check){
 await check('actual checkout page sends identity header and shows shipping-inclusive Pay amount',async()=>{
  const f=fixture('checkout');await f.runner.flush();await f.fill();assert.ok(text(f.pay()).includes('16.24'));const submitted=f.pay().props.onClick();await f.runner.flush();
  assert.equal(f.requests.length,1);assert.equal(f.requests[0].options.headers.Authorization,'Bearer token-a');const body=JSON.parse(f.requests[0].options.body);assert.equal(body.owner_id,undefined);assert.equal(body.total,undefined);
  f.requests[0].resolve({ok:true,json:async()=>({url:'https://checkout.example.invalid/owned'})});await submitted;assert.equal(f.location.href,'https://checkout.example.invalid/owned');f.runner.cleanup();
 });
 await check('actual checkout ABA late response cannot redirect and previous address is not restored',async()=>{
  const f=fixture('checkout');await f.runner.flush();await f.fill();const submitted=f.pay().props.onClick();await f.runner.flush();f.change(ownerB);f.change(ownerA);
  assert.equal(nodes(f.runner.value).find(n=>n.props.name==='address').props.value,'');f.requests[0].resolve({ok:true,json:async()=>({url:'https://checkout.example.invalid/stale'})});await submitted;
  assert.equal(f.location.href,'');f.runner.cleanup();
 });
 await check('actual checkout old failure cannot unlock another login payment in flight',async()=>{
  const f=fixture('checkout');await f.runner.flush();await f.fill();const a=f.pay().props.onClick();await f.runner.flush();f.change(ownerB);await f.fill();const b=f.pay().props.onClick();await f.runner.flush();
  f.requests[0].resolve({ok:false,json:async()=>({code:'invalid_cart'})});await a;await f.runner.flush();
  assert.ok(nodes(f.runner.value).some(n=>n.type==='motion.button'&&n.props.disabled&&text(n).includes('checkoutRedirectingToStripe')));
  f.requests[1].resolve({ok:true,json:async()=>({url:'https://checkout.example.invalid/b'})});await b;assert.equal(f.location.href,'https://checkout.example.invalid/b');f.runner.cleanup();
 });
 await check('actual success page ignores old paid reply across logout/login ABA before effect cleanup',async()=>{
  const f=fixture('success');await f.runner.flush();f.change(ownerB);f.change(ownerA);f.requests[0].resolve({ok:true,json:async()=>paid});await f.runner.flush();
  assert.equal(f.writes.length,0);assert.equal(f.finishes(),0);f.runner.cleanup();
 });
 await check('actual success page accepts own paid result; token refresh never consumes it again',async()=>{
  const f=fixture('success');await f.runner.flush();f.requests[0].resolve({ok:true,json:async()=>paid});await f.runner.flush();assert.equal(f.writes.length,1);assert.equal(f.finishes(),1);
  f.scope.accept({user:{id:ownerA},access_token:'renewed-a'});f.runner.render();await f.runner.flush();assert.equal(f.requests.length,1);assert.equal(f.finishes(),1);f.runner.cleanup();
 });
}
