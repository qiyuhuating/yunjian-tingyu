import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:'D:/xiaofeng/dev-cache/ms-playwright/chromium-1223/chrome-win64/chrome.exe',headless:true}),page=await browser.newPage();
page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));page.on('response',r=>{if(r.url().includes('/api/'))console.log('HTTP',new URL(r.url()).pathname,r.status());});
await page.goto('http://127.0.0.1:5173/signin-with-chatgpt?return_to=/');await page.waitForTimeout(3000);
console.log(await page.evaluate(()=>({opening:document.querySelector('.opening p')?.textContent,home:!!document.querySelector('.home-screen')})));
console.log(await page.evaluate(async()=>{const r=await fetch('/api/state'),b=await r.json();return {status:r.status,error:b.error,hasState:!!b.state,assetCount:b.assets?.length,hasLegacyKey:b.hasLegacyKey};}));
console.log(await page.evaluate(async()=>{const b=await fetch('/api/state').then(r=>r.json());const refs=JSON.stringify(b.state);return await Promise.all(b.assets.slice(0,3).map(async a=>{const r=await fetch('/api/assets/'+a.id,{cache:'no-store'});return {id:a.id,expected:a.size,headers:Object.fromEntries(Array.from(r.headers).filter(([k])=>!k.includes('cookie'))),header:r.headers.get('content-length'),type:r.headers.get('content-type'),disposition:r.headers.get('content-disposition'),status:r.status,actual:(await r.arrayBuffer()).byteLength,referenced:refs.includes(a.id)};}));}));
await page.screenshot({path:'D:/Codex存储文件夹/2026-10-06/c/work/local-probe.png'});await browser.close();
