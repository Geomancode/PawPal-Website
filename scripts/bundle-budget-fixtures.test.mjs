import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile,symlink} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import * as tool from './bundle-budget.mjs';
async function fixture(t,locale=false){
 const root=await mkdtemp(path.join(os.tmpdir(),'web16-budget-fixture-'));const n=path.join(root,'.next');await mkdir(n);t.after(()=>rm(root,{recursive:true,force:true}));
 const put=async(name,value)=>{await mkdir(path.dirname(path.join(n,name)),{recursive:true});await writeFile(path.join(n,name),typeof value==='string'?value:JSON.stringify(value));};
 const route=locale?'/en':'/';const src=locale?'/[locale]':'/';const key=locale?'/[locale]/page':'/page';
 await put('routes-manifest.json',{rewrites:{beforeFiles:locale?[{source:'/',destination:'/en',regex:'^/(?:/)?$'}]:[],afterFiles:[],fallback:[]},redirects:[],staticRoutes:locale?[]:[{page:'/',regex:'^/(?:/)?$'}],dynamicRoutes:locale?[{page:src,regex:'^/([^/]+?)(?:/)?$'}]:[]});
 await put('prerender-manifest.json',{routes:{[route]:{srcRoute:src,dataRoute:locale?'/en.rsc':'/index.rsc',initialRevalidateSeconds:false,compute:'static',response:'complete'}}});
 await put('app-path-routes-manifest.json',{[key]:src});await put('server/app-paths-manifest.json',{[key]:locale?'app/[locale]/page.js':'app/page.js'});
 await put(locale?'server/app/[locale]/page.js':'server/app/page.js','// page');
 await put(locale?'server/app/en.html':'server/app/index.html','<html><head><script src="/_next/static/chunks/a.js"></script><script src="/_next/static/chunks/a.js?v=1"></script></head></html>');
 await put(locale?'server/app/en.rsc':'server/app/index.rsc','synthetic RSC');
 await put('static/chunks/a.js','const a=1;');await put('static/chunks/b.js','const b=2;');await put('static/chunks/c.js','const c=3;');
 await put('react-loadable-manifest.json',{'src/components/Globe.tsx -> ./GlobeComponent':{files:['static/chunks/b.js','static/chunks/c.js']},'src/components/GlobeComponent.tsx -> react-globe.gl':{files:['static/chunks/c.js']}});
 return {root,n,put,read:async name=>JSON.parse(await readFile(path.join(n,name),'utf8'))};
}
test('legacy public homepage reads unique original initial chunks',async t=>{const f=await fixture(t);assert.equal((await tool.homepageInitialChunks(f.n)).chunks.length,1);});
test('locale public homepage resolves exact / rewrite to static /en instead of guessing index',async t=>{const f=await fixture(t,true);assert.equal((await tool.homepageInitialChunks(f.n)).chunks[0].file,'static/chunks/a.js');});
test('wrong root rewrite must reject even when stale index.html exists',async t=>{const f=await fixture(t);let r=await f.read('routes-manifest.json');r.rewrites.beforeFiles=[{source:'/',destination:'/fr',regex:'^/$'}];await f.put('routes-manifest.json',r);await assert.rejects(tool.homepageInitialChunks(f.n));});
 for(const [name,mutate] of [
  ['duplicate rewrite',async f=>{let r=await f.read('routes-manifest.json');r.rewrites.beforeFiles.push({...r.rewrites.beforeFiles[0]});await f.put('routes-manifest.json',r)}],
  ['conditional rewrite',async f=>{let r=await f.read('routes-manifest.json');r.rewrites.beforeFiles[0].has=[{type:'header',key:'x'}];await f.put('routes-manifest.json',r)}],
  ['missing prerender',async f=>await f.put('prerender-manifest.json',{routes:{}})],
  ['dynamic prerender',async f=>{let r=await f.read('prerender-manifest.json');r.routes['/en'].compute='dynamic';await f.put('prerender-manifest.json',r)}],
  ['duplicate page ownership',async f=>await f.put('app-path-routes-manifest.json',{'/[locale]/page':'/[locale]','/(other)/[locale]/page':'/[locale]'})],
  ['data path traversal',async f=>{let r=await f.read('prerender-manifest.json');r.routes['/en'].dataRoute='/../outside.rsc';await f.put('prerender-manifest.json',r)}],
  ['missing HTML',async f=>await rm(path.join(f.n,'server/app/en.html'))],
 ])test(name+' fails closed',async t=>{const f=await fixture(t,true);await mutate(f);await assert.rejects(tool.homepageInitialChunks(f.n));});
 test('deferred algorithm keeps exact two entry union with shared chunk counted once',async t=>{const f=await fixture(t);const d=await tool.globeDeferredChunks(f.n);assert.deepEqual(d.chunks.map(c=>c.file),['static/chunks/b.js','static/chunks/c.js']);});
 test('duplicate Globe manifest entry rejected',async t=>{const f=await fixture(t);const m=await f.read('react-loadable-manifest.json');m['other/components/Globe.tsx -> ./GlobeComponent']={files:['static/chunks/a.js']};await f.put('react-loadable-manifest.json',m);await assert.rejects(tool.globeDeferredChunks(f.n),/exactly one/);});
 test('level 9 per-file gzip and original delta boundaries retained',async()=>{const{gzipSync,constants}=await import('node:zlib');const b=Buffer.from('abcde'.repeat(5000));assert.equal(tool.gzipBytes(b),gzipSync(b,{level:constants.Z_BEST_COMPRESSION}).length);assert.deepEqual(tool.budgetDelta({initial:{gzipBytes:100},deferred:{gzipBytes:100}},{initial:{gzipBytes:5220},deferred:{gzipBytes:20580}}),{initialDelta:5120,deferredDelta:20480,initialPassed:true,deferredPassed:true});assert.equal(tool.budgetDelta({initial:{gzipBytes:0},deferred:{gzipBytes:0}},{initial:{gzipBytes:5121},deferred:{gzipBytes:20481}}).initialPassed,false);});
 test('legacy CLI preserves exact ref arguments and rejects unknown modes',()=>{assert.deepEqual(tool.parseArguments(['--base','abc','--head','def']),{base:'abc',head:'def'});assert.throws(()=>tool.parseArguments(['--base']),/requires a git ref/);assert.throws(()=>tool.parseArguments(['--offline-builds','pair.json']),/Unknown argument/);});
test('encoded Next locale chunk URL maps to its exact bracket directory',async t=>{const f=await fixture(t,true);await f.put('static/chunks/app/[locale]/page.js','const locale=1;');await f.put('server/app/en.html','<html><script src="/_next/static/chunks/app/%5Blocale%5D/page.js"></script></html>');const result=await tool.homepageInitialChunks(f.n);assert.deepEqual(result.chunks.map(c=>c.file),['static/chunks/app/[locale]/page.js']);});
for(const value of ['app/%2e%2e/escape.js','app/%2Fescape.js','app/%255Blocale%255D/page.js','app/%ZZ/page.js'])test('unsafe or ambiguous URL encoding rejected: '+value,async t=>{const f=await fixture(t,true);await f.put('server/app/en.html',`<html><script src="/_next/static/chunks/${value}"></script></html>`);await assert.rejects(tool.homepageInitialChunks(f.n));});

test('static artifact symlink cannot escape build',async t=>{const f=await fixture(t,true);await rm(path.join(f.n,'server/app/en.html'));await writeFile(path.join(f.root,'outside.html'),'outside');await symlink(path.join(f.root,'outside.html'),path.join(f.n,'server/app/en.html'));await assert.rejects(tool.homepageInitialChunks(f.n),/leaves build/);});


test('structured result retains complete measurements, per-ref locks and exact byte outcomes', async t => {
 const legacy=await fixture(t), locale=await fixture(t,true);
 const base={label:'base',ref:'base-ref',commit:'a'.repeat(40),packageLockSha256:'1'.repeat(64),initial:await tool.homepageInitialChunks(legacy.n),deferred:await tool.globeDeferredChunks(legacy.n)};
 const head={label:'head',ref:'head-ref',commit:'b'.repeat(40),packageLockSha256:'2'.repeat(64),initial:await tool.homepageInitialChunks(locale.n),deferred:await tool.globeDeferredChunks(locale.n)};
 const r=JSON.parse(JSON.stringify(tool.structuredBudgetResult(base,head,'v24.synthetic','11.synthetic')));
 assert.deepEqual(r.base,base);assert.deepEqual(r.head,head);
 assert.deepEqual(r.budgets,{initialBytes:5120,deferredBytes:20480,gzipLevel:9});assert.equal(r.passed,true);
 assert.equal(r.node,'v24.synthetic');assert.equal(r.npm,'11.synthetic');
 for(const side of [r.base,r.head]){assert.match(side.initial.homepage.htmlSha256,/^[a-f0-9]{64}$/);assert.equal(side.initial.homepage.mappingInputs.length,5);assert.match(side.deferred.manifestInput.sha256,/^[a-f0-9]{64}$/);for(const c of [...side.initial.chunks,...side.deferred.chunks])assert.match(c.sha256,/^[a-f0-9]{64}$/);}
 const over={...head,initial:{...head.initial,gzipBytes:base.initial.gzipBytes+5121}};
 const failed=tool.structuredBudgetResult(base,over,'v24.synthetic','11.synthetic');assert.equal(failed.initialPassed,false);assert.equal(failed.deferredPassed,true);assert.equal(failed.passed,false);
});
