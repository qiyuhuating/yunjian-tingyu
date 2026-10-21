import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const repo=path.resolve(import.meta.dirname,'../..');
const app=path.resolve(repo,'outputs/mori-phone');
const require=createRequire(path.join(app,'package.json'));
const {build}=await import(pathToFileURL(require.resolve('vite')));
const buildDir=path.join(repo,'work/save-recovery-build');
await build({configFile:path.join(app,'android-web/vite.config.ts'),build:{outDir:buildDir,emptyOutDir:true}});
await build({configFile:false,resolve:{alias:{fflate:require.resolve('fflate'),'@noble/hashes/sha2.js':require.resolve('@noble/hashes/sha2.js'),zod:require.resolve('zod')}},build:{outDir:buildDir,emptyOutDir:false,lib:{entry:path.join(import.meta.dirname,'save-recovery-entry.ts'),formats:['iife'],name:'RecoveryQA',fileName:()=> 'recovery-qa.js'}}});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.join(buildDir,name==='/'?'index.html':decodeURIComponent(name));res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true});
const checks=[],errors=[],failures=[];
const fileBytes=Buffer.from('Recovery bytes: 雨落云笺\nNo API calls.\u0000tail','utf8');
const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',d=>d.type()==='beforeunload'?d.accept():d.dismiss());
await context.route('**/*',route=>{const url=new URL(route.request().url());return url.hostname==='127.0.0.1'?route.continue():route.abort();});
await page.addInitScript(()=>{window.failAssetWrite=false;window.failedTransactions=0;const add=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(...args){const request=add.apply(this,args);if(this.name==='assets'&&window.failAssetWrite){window.failAssetWrite=false;window.failedTransactions++;const tx=this.transaction;request.addEventListener('success',()=>tx.abort(),{once:true});}return request;};});
const origin=`http://127.0.0.1:${server.address().port}`;
const qa=()=>page.addScriptTag({url:origin+'/recovery-qa.js'});
async function check(name,fn){try{await fn();checks.push(name);}catch(e){failures.push({name,error:e.message});}}
try{
 await page.goto(origin);await page.locator('.home-screen').waitFor();await qa();
 await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();
 await page.locator('.contact-row').first().click();
 await page.locator('input[type=file]').waitFor({state:'attached'});
 await page.evaluate(()=>{window.failAssetWrite=true;});
 await page.locator('input[type=file]').setInputFiles({name:'recovery.txt',mimeType:'text/plain',buffer:fileBytes});
 await page.getByText('本机保存未成功',{exact:true}).waitFor();
 const initial=await page.evaluate(async()=>{const row=await window.recoveryQA.readLocal('personal-device');return {failed:window.failedTransactions,messages:Object.values(row.state.threads).flat().filter(m=>m.fileName==='recovery.txt').length};});
 assert.equal(initial.failed,1);assert.equal(initial.messages,0);checks.push('Real UI upload transaction abort leaves durable state unchanged');
 await check('Emergency UI backup contains unsaved attachment bytes',async()=>{
  const download=page.waitForEvent('download',{timeout:6000});
  await page.locator('.mobile-save-recovery').getByRole('button',{name:'导出备份',exact:true}).click();
  const item=await download;const zipPath=path.join(repo,'work/save-recovery-emergency.zip');await item.saveAs(zipPath);
  const bytes=Array.from(await fs.readFile(zipPath));
  const restored=await page.evaluate(async bytes=>{const backup=await window.recoveryQA.readBackup(new File([new Uint8Array(bytes)],'recovery.zip'));return {messages:Object.values(backup.state.threads).flat().filter(m=>m.fileName==='recovery.txt').length};},bytes);
  assert.equal(restored.messages,1);
  const {unzipSync}=require('fflate');const entries=unzipSync(new Uint8Array(bytes));assert(Object.entries(entries).some(([name,data])=>name.startsWith('assets/')&&Buffer.from(data).equals(fileBytes)));
 });
 await page.evaluate(()=>{window.failAssetWrite=true;});
 await page.locator('.mobile-save-recovery').getByRole('button',{name:'重试保存',exact:true}).click();
 await check('A second failed retry retains recovery controls and aborts the full transaction',async()=>{
  await page.waitForFunction(()=>window.failedTransactions===2,{},{timeout:2500});
  await page.getByText('本机保存未成功',{exact:true}).waitFor();
  const persisted=await page.evaluate(async()=>{const row=await window.recoveryQA.readLocal('personal-device');return Object.values(row.state.threads).flat().filter(m=>m.fileName==='recovery.txt').length;});
  assert.equal(persisted,0);
 });
 if(await page.locator('.mobile-save-recovery').isVisible())await page.locator('.mobile-save-recovery').getByRole('button',{name:'重试保存',exact:true}).click();
 await page.locator('.mobile-save-recovery').waitFor({state:'hidden'});
 await page.reload();await page.locator('.home-screen').waitFor();await qa();
 await check('UI retry and reload preserve attachment reference and exact bytes',async()=>{
  const saved=await page.evaluate(async()=>{const row=await window.recoveryQA.readLocal('personal-device');const messages=Object.values(row.state.threads).flat().filter(m=>m.fileName==='recovery.txt');const asset=messages[0]?.asset?await window.recoveryQA.getAsset('personal-device',messages[0].asset):null;return {count:messages.length,bytes:asset?Array.from(new Uint8Array(await asset.blob.arrayBuffer())):null};});
  assert.equal(saved.count,1);assert.deepEqual(saved.bytes,Array.from(fileBytes));
 });
 await check('No uncaught page errors',async()=>assert.deepEqual(errors,[]));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
const report={checks,failures,pageErrors:errors};await fs.writeFile(path.join(repo,'work/save-recovery-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(failures.length)process.exitCode=1;
