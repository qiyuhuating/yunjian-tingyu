import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'D:/xiaofeng/dev-cache/ms-playwright/chromium-1223/chrome-win64/chrome.exe',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));await context.route('**/api/state',route=>route.fulfill({json:{state:null,assets:[],hasLegacyKey:false}}));await page.goto('http://127.0.0.1:5173/signin-with-chatgpt?return_to=/');await page.locator('.home-screen').waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>Array.from(document.querySelectorAll('.illustration-crop img')).every(i=>i.complete&&i.naturalWidth));
await page.screenshot({path:'D:/Codex存储文件夹/2026-10-06/c/outputs/界面预览.png'});
await page.locator('.home-screen').getByRole('button',{name:'设置',exact:true}).click();await page.locator('.provider-preview').waitFor();await page.waitForTimeout(300);await page.screenshot({path:'D:/Codex存储文件夹/2026-10-06/c/outputs/设置预览.png'});
await page.getByText('对话手感与高级参数',{exact:true}).click();await page.locator('.module-root .scroll-panel').evaluate(e=>e.scrollTop=document.querySelector('details.disclosure').offsetTop-80);await page.waitForTimeout(300);await page.screenshot({path:'D:/Codex存储文件夹/2026-10-06/c/outputs/模型参数预览.png'});
assert.deepEqual(errors,[]);console.log(JSON.stringify({screenshots:3,pageErrors:errors}));await browser.close();
