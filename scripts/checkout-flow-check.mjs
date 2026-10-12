import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function moduleAt(file, require = () => { throw new Error('Unexpected dependency'); }) {
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,esModuleInterop:true}}).outputText;
  const context={exports:{},require,process:{env:{}},console}; vm.runInNewContext(code,context); return context.exports;
}
const shipping=moduleAt('src/lib/checkoutShipping.ts');
const completion=moduleAt('src/lib/checkoutCompletion.ts');
const catalog=moduleAt('src/lib/checkoutCatalog.ts');
const availability=moduleAt('src/lib/cartAvailability.ts');
const locales=moduleAt('src/i18n/locales.ts');
const routing=moduleAt('src/i18n/routing.ts',()=>locales);
let count=0;
async function check(label,fn){await fn();console.log(`PASS ${++count} ${label}`);}
const valid={fullName:' Synthetic Owner ',email:' qa@example.invalid ',address:' Test Street ',city:' Test City ',zipCode:' 9000 ',country:' Belgium ',phone:' 123 '};
await check('all seven shipping fields are trimmed',()=>{assert.equal(shipping.normalizeShipping(valid).fullName,'Synthetic Owner');assert.equal(shipping.normalizeShipping(valid).phone,'123');});
for(const field of shipping.shippingFields) await check(`${field} rejects blank/missing/non-string`,()=>{for(const value of [' ', '', null,undefined,12]) assert.equal(shipping.normalizeShipping({...valid,[field]:value}),null);});
await check('invalid email rejected',()=>assert.equal(shipping.normalizeShipping({...valid,email:'invalid'}),null));
const cart=[{product:{id:'synthetic',name:'Synthetic Item',price:10,currency:'EUR'},quantity:2}];
const paid={id:'cs_synthetic_paid',mode:'payment',status:'paid',amount_total:2000,currency:'eur',metadata:{},customer_email:'qa@example.invalid',line_items:[{name:'Synthetic Item',quantity:2,amount:2000}]};
function ports(){let current=structuredClone(cart);const orders=[];let clears=0;return {loadCart:()=>current,loadOrders:()=>orders,saveOrder:o=>{orders.unshift(o);return true;},saveCart:c=>{current=c;clears++;},replace:c=>current=c,orders,clears:()=>clears};}
for(const status of ['unpaid','pending','no_payment_required','',undefined]) await check(`${status || 'missing'} has no order/cart side effects`,()=>{const p=ports();assert.equal(completion.recordPaidCheckout({...paid,status},paid.id,p),false);assert.equal(p.orders.length,0);assert.equal(p.clears(),0);});
await check('paid succeeds once; replay preserves subsequently added identical cart',()=>{const p=ports();assert.equal(completion.recordPaidCheckout(paid,paid.id,p),true);p.replace(cart);assert.equal(completion.recordPaidCheckout(paid,paid.id,p),false);assert.equal(p.orders.length,1);assert.equal(p.clears(),1);assert.equal(p.loadCart().length,1);});
await check('mismatched session id, cart, currency, and subscription do not consume cart',()=>{for(const s of [{...paid,id:'other'},{...paid,currency:'usd'},{...paid,mode:'subscription'},{...paid,metadata:{intent:'ai-upgrade'}},{...paid,line_items:[{name:'other',quantity:2,amount:2000}]}]){const p=ports();assert.equal(completion.recordPaidCheckout(s,paid.id,p),false);assert.equal(p.clears(),0);}});
await check('receipt replay detected at write time preserves cart',()=>{const p=ports();p.saveOrder=()=>false;assert.equal(completion.recordPaidCheckout(paid,paid.id,p),false);assert.equal(p.clears(),0);});
await check('receipt persistence failure does not clear cart',()=>{const p=ports();p.saveOrder=()=>{throw Error('full');};assert.throws(()=>completion.recordPaidCheckout(paid,paid.id,p));assert.equal(p.clears(),0);});
for(const locale of locales.locales)await check(`${locale} routing keeps query/hash without duplicate locale`,()=>{const expected=locale==='en'?'/store/checkout?x=1#form':`/${locale}/store/checkout?x=1#form`;assert.equal(routing.localizedPath('/store/checkout?x=1#form',locale),expected);if(locale!=='en')assert.equal(routing.localizedPath(expected,locale),expected);});
// Execute actual route code with only the Stripe SDK transport replaced. No network.
let calls=0,lastParams;
const catalogProduct={id:'synthetic',name:'Trusted Catalog Item',price:'10.25',currency:'EUR',published:true,in_stock:true,stock_quantity:2};
let dbRows=[catalogProduct],dbError=null;
const db={from:()=>({select:()=>({eq:()=>({in:async()=>({data:dbRows,error:dbError})})})})};
class Stripe {checkout={sessions:{create:async(params)=>{calls++;lastParams=params;return {url:'https://checkout.example.invalid/session',id:'synthetic'};}}};}
const route=moduleAt('src/app/api/checkout/route.ts',(name)=>{
 if(name==='next/server')return {NextResponse:{json:(data,{status=200}={})=>({data,status})}};
 if(name==='stripe')return Stripe;
 if(name.includes('checkoutShipping'))return shipping;
 if(name.includes('checkoutCatalog'))return catalog;
 if(name.includes('supabaseServer'))return {supabaseServer:db};
 if(name.includes('i18n/locales'))return locales;
 if(name.includes('i18n/routing'))return routing;
 if(name.includes('stripeGuard'))return {assertStripeTestMode:()=>{},getStripeSecretKey:()=>'',createStripeIdempotencyKey:()=> 'synthetic'};
 if(name.includes('errorReporting'))return {reportError:()=>{}};
 throw Error(name);
});
const request=(ship,locale='zh')=>({json:async()=>({items:[{id:'synthetic',name:'Forged',price:0.01,currency:'INVALID',quantity:1}],shipping:ship,locale}),headers:{get:()=> 'http://127.0.0.1:3224'}});
await check('actual server route rejects whitespace and missing phone before Stripe',async()=>{for(const field of shipping.shippingFields){const result=await route.POST(request({...valid,[field]:' '}));assert.equal(result.status,400);}assert.equal(calls,0);});
await check('actual server route trims fields and preserves return/cancel locale',async()=>{const result=await route.POST(request(valid));assert.equal(result.status,200);assert.equal(calls,1);assert.equal(lastParams.metadata.shipping_name,'Synthetic Owner');assert.equal(lastParams.customer_email,'qa@example.invalid');assert.equal(lastParams.success_url,'http://127.0.0.1:3224/zh/store/success?session_id={CHECKOUT_SESSION_ID}');assert.equal(lastParams.cancel_url,'http://127.0.0.1:3224/zh/store/checkout');});


await check('actual route takes price/currency/name only from catalog',async()=>{assert.equal(lastParams.line_items[0].price_data.unit_amount,1025);assert.equal(lastParams.line_items[0].price_data.currency,'eur');assert.equal(lastParams.line_items[0].price_data.product_data.name,'Trusted Catalog Item');});
for(const quantity of [0,-1,1.5,'1',Number.MAX_SAFE_INTEGER+1])await check(`invalid quantity ${quantity} rejected before Stripe`,async()=>{const before=calls;const req=request(valid);req.json=async()=>({items:[{id:'synthetic',quantity}],shipping:valid});const result=await route.POST(req);assert.equal(result.status,400);assert.equal(calls,before);});
await check('duplicate IDs aggregate before stock check',async()=>{const req=request(valid);req.json=async()=>({items:[{id:'synthetic',quantity:1},{id:'synthetic',quantity:2}],shipping:valid});const before=calls;assert.equal((await route.POST(req)).status,409);assert.equal(calls,before);assert.equal(catalog.checkoutQuantities([{id:'synthetic',quantity:1},{id:'synthetic',quantity:1}])[0].quantity,2);});
for(const field of [{id:'forged'}, {published:false},{in_stock:false},{stock_quantity:0},{stock_quantity:-1},{currency:'USD'},{currency:'INVALID'},{price:-1},{price:'1.234'},{price:'NaN'},{name:''}])await check('unavailable/invalid catalog '+JSON.stringify(field),async()=>{dbRows=[{...catalogProduct,...field}];const before=calls;assert.equal((await route.POST(request(valid))).status,409);assert.equal(calls,before);});
await check('backend failure stops checkout',async()=>{dbError={message:'controlled unavailable'};const before=calls;assert.equal((await route.POST(request(valid))).status,503);assert.equal(calls,before);dbError=null;});
await check('valid duplicate items become one Stripe line',async()=>{dbRows=[catalogProduct];const req=request(valid);req.json=async()=>({items:[{id:'synthetic',quantity:1},{id:'synthetic',quantity:1}],shipping:valid});assert.equal((await route.POST(req)).status,200);assert.equal(lastParams.line_items.length,1);assert.equal(lastParams.line_items[0].quantity,2);});
await check('availability handles false/zero/malformed and finite stock',()=>{for(const p of [{inStock:false},{inStock:true,stockQuantity:0},{inStock:true,stockQuantity:-1},{inStock:true,published:false},{inStock:true,stockQuantity:1.5}])assert.equal(availability.cartQuantityLimit(p),0);assert.equal(availability.cartQuantityLimit({inStock:true,stockQuantity:2}),2);});
console.log(`PASS ${count}/${count} checks; catalog and Stripe transports mocked; no payment or email.`);
