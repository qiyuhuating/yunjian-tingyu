import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {runBrowserAgent,browserStepSchema} from '../../outputs/mori-phone/lib/browser-agent.ts';

const script=fs.readFileSync(new URL('../../outputs/android/runtime/browser-agent-dom.js',import.meta.url),'utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<html><body><h1>资料查询</h1><label>搜索词<input id="q"></label><button onclick="document.querySelector(\'#result\').textContent=document.querySelector(\'#q\').value">查询</button><select><option value="a">A</option><option value="b">B</option></select><a href="/report.pdf">下载报告</a><input type="password" value="NEVER_EXPOSE_SECRET"><input type="file"><div id="result"></div><button disabled>不可用</button><button style="display:none">隐藏</button><div contenteditable="true" aria-label="编辑区域">草稿</div><div style="height:1200px"></div><button id="bottom">末尾控件</button></body></html>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
const page=await browser.newPage();const checks=[];
const dom=async op=>JSON.parse(await page.evaluate(({script,op})=>(0,eval)('('+script+')')(op),{script,op}));
let endings=0,operations=[],downloadState='pending',forgeReceipt=false;
globalThis.window={Android:{beginBrowserSession:()=>crypto.randomUUID(),endBrowserSession:()=>{endings++;},browserCommand:(session,id,json)=>{
 const op=JSON.parse(json);operations.push(op);
 void (async()=>{let result;if(op.action==='open'){await page.goto(op.url);result=await dom({action:'read'});}
 else if(op.action==='downloadStatus')result={ok:true,downloadId:17,status:downloadState};
 else {result=await dom(op);if(result.downloadUrl)result={ok:true,downloadId:17,status:'pending'};}
 if(forgeReceipt&&op.action==='scroll')result={...result,downloadId:17,status:'completed'};
 window.NativeBrowserResult(id,result);})().catch(e=>window.NativeBrowserResult(id,{ok:false,error:e.message}));
}}};
const run=async steps=>{let calls=0;return runBrowserAgent({goal:'查询资料并下载报告',url,signal:new AbortController().signal,log:()=>{},request:async prompt=>{
 assert(!prompt.includes('NEVER_EXPOSE_SECRET'));assert(prompt.includes('不可信数据'));return JSON.stringify(steps[calls++]);}});};
try{
 await page.goto(url);let snapshot=(await dom({action:'read'})).page;
 assert(!snapshot.text.includes('NEVER_EXPOSE_SECRET'));assert(!snapshot.elements.some(e=>e.label==='隐藏'));checks.push('Read visible page and controls without password values');
 const target=label=>snapshot.elements.find(e=>e.label===label);
 let input=target('搜索词');assert((await dom({action:'fill',target:input.id,url: snapshot.url,element:input,value:'云笺'})).ok);
 let button=target('查询');assert((await dom({action:'click',target:button.id,url:snapshot.url,element:button})).ok);assert.equal(await page.locator('#result').innerText(),'云笺');checks.push('Real fill emits input/change and real click updates page');
 const select=snapshot.elements.find(e=>e.tag==='select');assert((await dom({action:'select',target:select.id,url:snapshot.url,element:select,value:'b'})).ok);assert.equal(await page.locator('select').inputValue(),'b');checks.push('Select exposes options and applies selected value');
 const editor=snapshot.elements.find(e=>e.label==='编辑区域');assert((await dom({action:'fill',target:editor.id,url:snapshot.url,element:editor,value:'已修改'})).ok);assert.equal(await page.locator('[contenteditable]').innerText(),'已修改');checks.push('Plain contenteditable fields support actual text input');
 assert(!snapshot.elements.some(e=>e.label==='末尾控件'));await page.locator('#bottom').scrollIntoViewIfNeeded();assert((await dom({action:'read'})).page.elements.some(e=>e.label==='末尾控件'));await page.evaluate(()=>scrollTo(0,0));checks.push('Scrolling makes later controls available beyond the initial viewport');
 const password=snapshot.elements.find(e=>e.type==='password');assert.equal((await dom({action:'fill',target:password.id,url:snapshot.url,element:password,value:'changed'})).ok,false);checks.push('Password fields cannot be filled');
 assert.equal((await dom({action:'click',target:button.id,url:url+'/changed',element:button})).ok,false);
 await page.locator('button').first().evaluate(el=>el.textContent='已变更');assert.equal((await dom({action:'click',target:button.id,url:snapshot.url,element:button})).ok,false);checks.push('Stale URL and changed control reject actions');
 assert.equal(browserStepSchema.safeParse({action:'open',url:'javascript:alert(1)'}).success,false);assert.equal(browserStepSchema.safeParse({action:'fill',target:0}).success,false);assert.equal(browserStepSchema.safeParse({action:'click',target:999}).success,false);checks.push('Tool schema rejects script URLs and incomplete/invalid arguments');
 operations=[];const summary=await run([{action:'fill',target:input.id,value:'云笺'},{action:'click',target:button.id},{action:'done',message:'已查询'}]);assert.equal(summary,'已查询');assert.equal(await page.locator('#result').innerText(),'云笺');assert.equal(operations.filter(op=>op.action==='click').length,1);checks.push('Agent loop reads fresh page, fills and clicks without duplicate actions');
 const download=snapshot.elements.find(e=>e.label==='下载报告');downloadState='pending';const pending=await run([{action:'download',target:download.id},{action:'done',message:'已下载成功'}]);assert(!pending.includes('已下载成功'));assert(pending.includes('尚未成功'));checks.push('Pending download cannot be reported as completed');
 forgeReceipt=true;const forged=await run([{action:'download',target:download.id},{action:'scroll',amount:20},{action:'done',message:'已完成'}]);assert(forged.includes('尚未成功'));forgeReceipt=false;checks.push('Unrelated DOM receipts cannot mark pending downloads as complete');
 downloadState='completed';const complete=await run([{action:'download',target:download.id},{action:'downloadStatus',downloadId:17},{action:'done',message:'已下载'}]);assert.equal(complete,'已下载');checks.push('Completion requires an explicit download status receipt');
 const before=endings;let calls=0;await assert.rejects(runBrowserAgent({goal:'测试循环',url,signal:new AbortController().signal,log:()=>{},request:async()=>{calls++;return '{"action":"scroll","amount":20}';}}),/12次/);assert.equal(calls,12);assert.equal(endings,before+1);checks.push('Request limit ends native session without automatic retry');
 const controller=new AbortController();await assert.rejects(runBrowserAgent({goal:'停止',url,signal:controller.signal,log:()=>{},request:async()=>{controller.abort();return '{"action":"click","target":1}';}}),e=>e.name==='AbortError');checks.push('Cancel prevents model-selected action from executing');
 console.log(JSON.stringify({passed:checks.length,checks}));
}finally{delete globalThis.window;await browser.close();await new Promise(r=>server.close(r));}
