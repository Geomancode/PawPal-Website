import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const stage=process.argv[2];if(!stage)throw new Error('explicit stage required');
const require=createRequire(path.join(stage,'package.json')),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
let pathname='/',locale='en';const cache=new Map();
function load(file){
 file=path.resolve(stage,file);if(cache.has(file))return cache.get(file).exports;
 const loaded={exports:{}};cache.set(file,loaded);
 const source=fs.readFileSync(file,'utf8'),js=ts.transpileModule(source,{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const localRequire=id=>{
  if(['react','react/jsx-runtime'].includes(id))return require(id);
  if(id==='next/navigation')return {usePathname:()=>pathname,useRouter:()=>({push(){throw new Error('SSR handler invoked');}})};
  if(id==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
  if(id==='framer-motion')return {AnimatePresence:({children})=>children,motion:new Proxy({},{get:(_,tag)=>({children,...props})=>React.createElement(tag,Object.fromEntries(Object.entries(props).filter(([key])=>!['initial','animate','exit','transition','layoutId'].includes(key))),children)})};
  if(id.endsWith('.module.css'))return {__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
  if(id==='./AuthProvider')return {useAuth:()=>({user:null,loading:false,signOut(){throw new Error('business action invoked');}})};
  if(id==='./icons/PawIcon')return {__esModule:true,default:()=>React.createElement('svg')};
  if(id==='./PawPalLogo')return {__esModule:true,default:()=>React.createElement('span',null,'PawPal')};
  if(id==='./Footer')return {__esModule:true,default:()=>React.createElement('footer',null,'footer-fixture')};
  if(id==='@/i18n/I18nProvider')return {useI18n:()=>({path:href=>routing.localizedPath(href,locale)})};
  if(id==='@/i18n/useRouteTranslations')return {useRouteTranslations:()=>({loader:null,t:key=>key})};
  if(id.startsWith('@/'))return load(path.join('src',id.slice(2))+'.ts');
  if(id==='./locales')return load('src/i18n/locales.ts');
  throw new Error('Unexpected import '+id+' from '+file);
 };
 vm.runInNewContext(`(function(require,module,exports){${js}\n})`,{console,process},{filename:file})(localRequire,loaded,loaded.exports);return loaded.exports;
}
const routing=load('src/i18n/routing.ts'),Navbar=load('src/components/Navbar.tsx').default,Footer=load('src/components/ConditionalFooter.tsx').default;
const checks=[];function check(name,f){try{f();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.message.slice(0,350)});}}
for(const [input,expected]of[['/en','/'],['/en/','/'],['/en/auth','/auth'],['/en/store','/store'],['/en/globe','/globe'],['/fr/globe','/globe'],['/de/auth','/auth'],['/xx/auth','/xx/auth'],['/store','/store']])check('normalize '+input,()=>assert.equal(routing.stripLocalePrefix(input),expected));
for(const publicPath of ['/','/store','/auth','/globe','/companion'])check('actual Navbar SSR/public shape '+publicPath,()=>{
 locale='en';pathname=publicPath==='/'?'/en':'/en'+publicPath;const server=renderToStaticMarkup(React.createElement(Navbar));pathname=publicPath;const client=renderToStaticMarkup(React.createElement(Navbar));assert.equal(server,client);
});
for(const language of ['en','de','fr','nl','zh'])check('localized companion navigation '+language,()=>{
 locale=language;pathname=language==='en'?'/companion':'/'+language+'/companion';const html=renderToStaticMarkup(React.createElement(Navbar));assert(html.includes('href="'+routing.localizedPath('/companion',language)+'"'));assert(html.includes('companionTitle'));
});
for(const input of ['/en/globe','/fr/globe','/globe'])check('actual Footer hidden '+input,()=>{pathname=input;assert.equal(renderToStaticMarkup(React.createElement(Footer)),'');});
check('actual Footer retained on localized auth',()=>{pathname='/fr/auth';assert.match(renderToStaticMarkup(React.createElement(Footer)),/footer-fixture/);});
for(const [href,lang,expected]of[['/auth?next=store#form','fr','/fr/auth?next=store#form'],['/en/auth?x=1#top','de','/de/auth?x=1#top'],['/','en','/'],['/store','en','/store'],['https://example.test/path','fr','https://example.test/path'],['mailto:test@example.test','zh','mailto:test@example.test'],['#main','nl','#main']])check('localizedPath '+href+' '+lang,()=>assert.equal(routing.localizedPath(href,lang),expected));
const report={passed:checks.every(c=>c.passed),checks,scope:'actual Navbar and ConditionalFooter rendered by React server with only dependency/UI stubs; actual routing module; not a browser hydration test'};console.log(JSON.stringify(report,null,2));process.exitCode=report.passed?0:1;
