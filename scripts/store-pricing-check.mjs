import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const context = {exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/storePricing.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
}).outputText,context);
const {storeCartTotals,storeShippingCents,storePriceCents} = context.exports;
let count=0;
function check(name, fn) {fn();console.log(`PASS ${++count} ${name}`);}
const item=(price,quantity=1)=>({product:{price},quantity});
for(const [cents,fee] of [[1499,599],[4999,599],[5000,0],[5001,0]]) {
  check(`subtotal ${cents} cents uses ${fee} cents shipping`,()=>{
    const actual=storeCartTotals([item(cents/100)]);
    assert.equal(actual.valid,true);
    assert.equal(actual.subtotalCents,cents);
    assert.equal(actual.shippingCents,fee);
    assert.equal(actual.totalCents,cents+fee);
    assert.equal(storeShippingCents(cents),fee);
  });
}
check('multi-line decimal amounts are summed in cents before applying threshold',()=>{
  assert.equal(storeCartTotals([item(16.66,3),item(.02)]).totalCents,5000);
  const below=storeCartTotals([item(16.66,3),item(.01)]);
  assert.equal(below.subtotalCents,4999);assert.equal(below.shippingCents,599);
  assert.equal(storeCartTotals([item(.1),item(.2)]).subtotalCents,30);
});
check('empty cart does not quote a delivery charge',()=>{
  const actual=storeCartTotals([]);assert.equal(actual.valid,true);assert.equal(actual.totalCents,0);
});
check('invalid price precision, non-finite and negative prices cannot produce a payable estimate',()=>{
  for(const price of [0,-1,NaN,Infinity,1.005,100000000]) {
    assert.equal(storePriceCents(price),null);assert.equal(storeCartTotals([item(price)]).valid,false);
  }
});
check('invalid quantities and overflow are rejected rather than silently rounded',()=>{
  for(const quantity of [0,-1,1.5,NaN,Number.MAX_SAFE_INTEGER]) assert.equal(storeCartTotals([item(14.99,quantity)]).valid,false);
  assert.equal(storeCartTotals([item(99999999.99,900720)]).valid,false);
  for(const value of [-1,1.5,NaN,Infinity]) assert.throws(()=>storeShippingCents(value));
});
check('calculating prices preserves the shopping cart',()=>{
  const original=[item(24.99,2),item(.02)];const before=JSON.stringify(original);
  assert.equal(storeCartTotals(original).totalCents,5000);assert.equal(JSON.stringify(original),before);
});
console.log(`PASS ${count}/${count}; production integer-cent pricing; no backend or payment calls.`);
