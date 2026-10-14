import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
// Offline browser regression for failed atomic media save and the actual retry button.
const repo=path.resolve(import.meta.dirname,'../..');
const native=createRequire(path.join(repo,'outputs/mori-phone/package.json'));
const {chromium}=createRequire(path.join(repo,'work/qa/package.json'))('playwright');
const ts=native('typescript'),loaded=new Map();
function load(name){if(loaded.has(name))return loaded.get(name);const m={exports:{}};loaded.set(name,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path.join(repo,'outputs/mori-phone/lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(n=>n.startsWith('./')?load(n.slice(2)):native(n),m,m.exports);loaded.set(name,m.exports);return m.exports;}
const state=load('phone-model').freshState(),thread=state.primary;
state.memorySettings.autoExtract=false;state.memorySettings.autoSummary=false;state.mediaSettings.imageEnabled=true;
state.threads[thread]=[{id:'spec-source',role:'user',kind:'text',text:'请生成测试图片',timestamp:1,read:true}];
state.mediaOutbox=[{id:'spec-effect',thread,userId:'spec-source',speaker:thread,command:{type:'image',prompt:'offline fixture cloud'},phase:'queued',attempts:0,updatedAt:1}];
const build=path.resolve(process.env.FEATURE_BUILD_DIR||path.join(repo,'work/feature-build'));
const server=createServer((req,res)=>{if(req.url==='/__seed__'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Offline synthetic fixture seed</title>');return;}try{const requested=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(build,'.'+(requested==='/'?'/index.html':requested));if(!file.startsWith(build+path.sep))throw Error();const bytes=fs.readFileSync(file);res.setHeader('Content-Type',({js:'text/javascript',mjs:'text/javascript',css:'text/css',html:'text/html',webp:'image/webp',png:'image/png',svg:'image/svg+xml',woff2:'font/woff2'})[path.extname(file).slice(1)]||'application/octet-stream');res.end(bytes);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
let providerCalls=0;
try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/__seed__');
 await page.evaluate(async state=>{
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('personal-device:openai')},key,new TextEncoder().encode('fixture-media-key'));
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('cloudlet-device',1);r.onupgradeneeded=()=>{for(const [name,keyPath] of [['states','owner'],['assets',['owner','id']],['keys',['owner','provider']],['crypto','owner']])r.result.createObjectStore(name,{keyPath});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const tx=db.transaction(['states','keys','crypto'],'readwrite');tx.objectStore('states').put({owner:'personal-device',state,version:1,updatedAt:1});tx.objectStore('crypto').put({owner:'personal-device',key});tx.objectStore('keys').put({owner:'personal-device',provider:'openai',iv,ciphertext});await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=reject;});db.close();
 },state);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOoWXvnPwAGswMFHbh7QQAAAABJRU5ErkJggg==','base64');
 await page.route('https://api.openai.com/**',r=>{providerCalls++;return r.fulfill({json:{data:[{b64_json:png.toString('base64')}]}});});
 await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('.home-screen').waitFor();
 await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();
 await page.locator('.contact-row').filter({hasText:'云汐'}).first().click();
 await page.getByRole('button',{name:'聊天菜单',exact:true}).click();
 await page.evaluate(()=>{const put=IDBObjectStore.prototype.put;window.__assetAbort=false;IDBObjectStore.prototype.put=function(value,...args){const r=put.call(this,value,...args);if(this.name==='states'&&this.transaction.objectStoreNames.contains('assets')&&!window.__assetAbort){window.__assetAbort=true;this.transaction.abort();}return r;};});
 await page.getByRole('button',{name:/续接未发送媒体/}).click();
 await page.getByRole('alert').filter({hasText:'本机保存未成功'}).waitFor();
 const read=()=>page.evaluate(async()=>{
  const db=await new Promise(resolve=>{const r=indexedDB.open('cloudlet-device');r.onsuccess=()=>resolve(r.result);}),tx=db.transaction(['states','threads','assets'],'readonly'),get=r=>new Promise(resolve=>{r.onsuccess=()=>resolve(r.result);});
  const [row,threads,assets]=await Promise.all([get(tx.objectStore('states').get('personal-device')),get(tx.objectStore('threads').index('owner').getAll('personal-device')),get(tx.objectStore('assets').getAll())]);db.close();return {version:row.version,effect:row.state.mediaOutbox[0],messages:threads.flatMap(t=>t.messages).filter(m=>m.id==='spec-source'||m.asset),assetCount:assets.length,assets:await Promise.all(assets.map(async a=>({id:a.id,mime:a.mime,bytes:Array.from(new Uint8Array(await a.blob.arrayBuffer()))})))};
 });
 const afterAbort=await read();
 assert.equal(afterAbort.effect.phase,'in_flight');assert.equal(afterAbort.assetCount,0);
 await page.getByRole('button',{name:'重试保存',exact:true}).first().click();
 await page.waitForFunction(()=>!document.querySelector('.mobile-save-recovery[role=alert]'));
 await page.evaluate(()=>window.NativeFlush());
 const afterRetry=await read();
 if(process.env.EXPECT_FIXED!=='0'){
  const reread=page.getByRole('button',{name:'重新读取图片',exact:true});
  if(await reread.count())await reread.first().click();
  await page.locator('.image-preview-button img').last().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.image-preview-button img')).some(img=>img.naturalWidth===1));
 }
 await page.reload();await page.locator('.home-screen').waitFor();
 const afterReload=await read();
 if(process.env.EXPECT_FIXED!=='0'){
  await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();
  await page.locator('.contact-row').filter({hasText:'云汐'}).first().click();
  await page.locator('.image-preview-button img').last().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('.image-preview-button img')).some(img=>img.naturalWidth===1));
 }
 const report={providerCalls,afterAbort,afterRetry,afterReload,pageErrors:errors,bug:afterRetry.effect.phase==='completed'&&afterRetry.messages.some(m=>m.asset)&&afterRetry.assetCount===0};
 console.log(JSON.stringify(report,null,2));if(process.env.MEDIA_SAVE_RETRY_REPORT)fs.writeFileSync(process.env.MEDIA_SAVE_RETRY_REPORT,JSON.stringify(report,null,2)+'\n');
 assert.equal(providerCalls,1);
 assert.deepEqual(errors,[]);
 if(process.env.EXPECT_FIXED!=='0'){
  assert.equal(afterRetry.effect.phase,'completed');assert.equal(afterRetry.effect.attempts,1);assert.equal(afterRetry.assetCount,1);assert.equal(report.bug,false);
  assert.equal(afterRetry.version,afterAbort.version+1);
  const image=afterRetry.messages.find(m=>m.id===afterRetry.effect.outputId);
  assert.equal(image.kind,'image');assert.equal(image.asset,'local:'+afterRetry.assets[0].id);assert.deepEqual(afterRetry.assets[0].bytes,[...png]);
  assert.deepEqual(afterReload.effect,afterRetry.effect);assert.deepEqual(afterReload.assets,afterRetry.assets);assert.deepEqual(afterReload.messages,afterRetry.messages);
 }else assert.equal(report.bug,true);
}finally{await browser.close();server.close();}
