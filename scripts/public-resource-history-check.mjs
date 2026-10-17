import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const root=process.cwd(),cache=new Map();
function load(file){
 const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute);
 const exports={};cache.set(absolute,exports);
 const code=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{exports,setTimeout,require:id=>{assert(id.startsWith('.'));return load(path.resolve(path.dirname(absolute),id+'.ts'));}},{filename:absolute});return exports;
}
const {isPublicResourcePath,watchPublicResourceHistory}=load('src/lib/publicResourceHistory.ts');
function fixture(current='/fr/about',search=''){
 const events=new Map();let reloads=0,stops=0;
 const browser={location:{pathname:current,search,reload:()=>reloads++},addEventListener:(name,fn,capture)=>{assert.equal(capture,true);events.set(name,fn);},removeEventListener:(name,fn,capture)=>{assert.equal(capture,true);assert.equal(events.get(name),fn);events.delete(name);}};
 const subscription=watchPublicResourceHistory(browser);
 const stop=()=>subscription.dispose();
 return {stop,events,update:()=>subscription.update(),setLocation:(pathname,search='')=>{browser.location.pathname=pathname;browser.location.search=search;},get reloads(){return reloads;},get stops(){return stops;},fire(name,pathname,persisted=false,query=''){browser.location.pathname=pathname;browser.location.search=query;events.get(name)?.({persisted,stopImmediatePropagation:()=>stops++});}};
}
let count=0;function test(name,run){run();count++;console.log('PASS '+name);}
test('resource shapes use all existing locale prefixes',()=>{for(const prefix of ['', '/en','/fr','/nl','/de','/zh'])for(const kind of ['post','user','tag','pet'])assert(isPublicResourcePath(prefix+'/'+kind+'/synthetic-id'));});
test('ordinary routes and incomplete or extra paths are excluded',()=>{for(const value of ['/profile','/store','/fr/orders','/fr/admin/reports','/fr/post','/fr/post/x/more','/es/tag/x','/user/'])assert(!isPublicResourcePath(value));});
test('back or forward to a public resource requests one fresh document',()=>{for(const kind of ['post','user','tag','pet']){const f=fixture();f.fire('popstate','/fr/'+kind+'/x');assert.equal(f.reloads,1);assert.equal(f.stops,1);f.fire('popstate','/fr/'+kind+'/x');assert.equal(f.reloads,1);assert.equal(f.stops,2);f.stop();assert.equal(f.events.size,0);}});
test('returning between resource IDs revalidates the destination',()=>{const f=fixture('/fr/post/old');f.fire('popstate','/fr/post/new');assert.equal(f.reloads,1);});
test('ordinary navigation and same-resource fragment navigation are preserved',()=>{const f=fixture('/fr/tag/x');f.fire('popstate','/fr/tag/x');f.fire('popstate','/fr/orders');assert.equal(f.reloads,0);assert.equal(f.stops,0);});
test('changed resource query is revalidated',()=>{const f=fixture('/fr/tag/x','?old=1');f.fire('popstate','/fr/tag/x',false,'?new=2');assert.equal(f.reloads,1);});
test('fresh pageshow does not create a reload loop',()=>{const f=fixture('/fr/tag/x');f.fire('pageshow','/fr/tag/x',false);assert.equal(f.reloads,0);});
test('persisted browser page restoration revalidates only public resources',()=>{const f=fixture('/fr/post/x');f.fire('pageshow','/fr/post/x',true);assert.equal(f.reloads,1);const ordinary=fixture('/profile');ordinary.fire('pageshow','/profile',true);assert.equal(ordinary.reloads,0);});
test('cleanup removes both captured event listeners',()=>{const f=fixture();f.stop();f.fire('popstate','/fr/post/x');f.fire('pageshow','/fr/post/x',true);assert.equal(f.reloads,0);assert.equal(f.events.size,0);});
await (async()=>{const f=fixture('/fr/about');f.setLocation('/fr/post/x');f.update();f.fire('popstate','/fr/post/x');assert.equal(f.reloads,1);await new Promise(resolve=>setTimeout(resolve,0));f.stop();count++;console.log('PASS earlier router commit cannot replace previous URL within the same event');})();
await (async()=>{const f=fixture('/fr/post/x');f.setLocation('/fr/about');f.update();await new Promise(resolve=>setTimeout(resolve,0));f.fire('popstate','/fr/post/x');assert.equal(f.reloads,1);f.stop();count++;console.log('PASS stable listener observes committed link navigation before Back');})();
await (async()=>{const f=fixture('/fr/post/x');f.setLocation('/fr/post/x','?v=1');f.update();await new Promise(resolve=>setTimeout(resolve,0));f.fire('popstate','/fr/post/x');assert.equal(f.reloads,1);f.stop();count++;console.log('PASS query-only commit is remembered before Back');})();
console.log(count+' public resource history checks passed');
