import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root='D:/Codex存储文件夹/2026-10-06/c';
const browser=await chromium.launch({executablePath:'D:/xiaofeng/dev-cache/ms-playwright/chromium-1223/chrome-win64/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/signin-with-chatgpt?return_to=/');
await page.locator('.home-screen').waitFor();
await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>Array.from(document.querySelectorAll('.illustration-crop img')).every(img=>img.complete&&img.naturalWidth));
const measurements=[];
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:width<740?844:1080});
 const m=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,icons:Array.from(document.querySelectorAll('.home-screen .app-icon')).map(e=>{const art=e.querySelector('.illustration-crop'),a=e.getBoundingClientRect(),b=art.getBoundingClientRect();return {name:e.parentElement.getAttribute('aria-label'),dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2),fits:b.width<a.width&&b.height<a.height};})}));
 assert(m.scrollWidth<=m.width,JSON.stringify(m));assert.equal(m.icons.length,8);
 for(const icon of m.icons){assert(icon.dx<.6&&icon.dy<.6,JSON.stringify(icon));assert(icon.fits,JSON.stringify(icon));}
 measurements.push(m);
 if(width===390){const gap=await page.evaluate(()=>document.querySelector('.note-widget').getBoundingClientRect().top-document.querySelector('.widget-row').getBoundingClientRect().bottom);assert(gap>=48,'A clear landscape gap is required between widgets');const bottom=await page.locator('.phone-dock').evaluate(e=>e.getBoundingClientRect().bottom);assert(bottom<=844,'Dock must remain fully visible at 390 × 844');await page.screenshot({path:root+'/outputs/界面预览.png',fullPage:true});}
 if(width===1440)await page.screenshot({path:root+'/work/home-contrast-desktop.png',fullPage:true});
}
await page.setViewportSize({width:390,height:844});
await page.locator('.home-screen').getByRole('button',{name:'全部应用',exact:true}).click();
await page.waitForTimeout(300);
const launcher=await page.locator('.launcher-grid .illustration-crop').evaluateAll(es=>es.map(e=>{const a=e.parentElement.parentElement.getBoundingClientRect(),b=e.getBoundingClientRect();return {dx:Math.abs(a.x+a.width/2-b.x-b.width/2),dy:Math.abs(a.y+a.height/2-b.y-b.height/2)};}));
for(const m of launcher)assert(m.dx<.6&&m.dy<.6);
await page.getByRole('button',{name:'返回桌面',exact:true}).click();
await page.locator('.desktop').evaluate(e=>{e.classList.remove('theme-sky','theme-rose');e.classList.add('theme-night');});
await page.screenshot({path:root+'/work/home-contrast-night.png',fullPage:true});
assert.deepEqual(errors,[]);
const report={measurements,launcherCentered:launcher.length,pageErrors:errors};
await fs.writeFile(root+'/work/contrast-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({widths:measurements.map(m=>m.width),iconsCentered:8,launcherCentered:launcher.length,pageErrors:errors}));
await browser.close();
