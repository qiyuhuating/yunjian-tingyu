import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const repo=path.resolve(import.meta.dirname,'../..'),build=process.env.FEATURE_BUILD_DIR||path.join(repo,'work/feature-build');
const server=createServer((req,res)=>{try{const file=path.join(build,decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));res.setHeader('Content-Type',({html:'text/html',js:'text/javascript',css:'text/css',svg:'image/svg+xml',webp:'image/webp',woff2:'font/woff2'})[path.extname(file).slice(1)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true}),page=await browser.newPage(),errors=[],checks=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('.home-screen').waitFor();
 await page.locator('.home-screen').getByRole('button',{name:'全部应用',exact:true}).click();
 const images=page.locator('.launcher-art-image');await images.first().waitFor();assert.equal(await images.count(),14);
 await page.waitForFunction(()=>[...document.querySelectorAll('.launcher-art-image')].every(img=>img.complete&&img.naturalWidth>0));
 checks.push('All 14 new SVG launcher images load from the production bundle');
 for(const theme of ['sky','night','rose'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.locator('.desktop').evaluate((node,theme)=>{node.classList.remove('theme-sky','theme-night','theme-rose');node.classList.add('theme-'+theme);},theme);
  const metrics=await page.evaluate(()=>{const panel=document.querySelector('.launcher-grid').closest('.scroll-panel');return{viewport:innerWidth,document:document.documentElement.scrollWidth,scroll:panel.scrollWidth,panel:panel.clientWidth,visible:panel.getBoundingClientRect().height>0,polish:getComputedStyle(document.querySelector('.desktop')).getPropertyValue('--polish-radius-md').trim(),font:getComputedStyle(document.querySelector('.desktop')).fontFamily};});
  assert(metrics.visible&&metrics.panel>0,JSON.stringify({theme,width,...metrics}));assert(metrics.document<=metrics.viewport,JSON.stringify({theme,width,...metrics}));assert(metrics.scroll<=metrics.panel,JSON.stringify({theme,width,...metrics}));assert.equal(metrics.polish,'16px');assert(metrics.font.includes('Source Serif'));
  checks.push(`${theme} at ${width}px: no horizontal overflow, polish CSS and original font active`);
 }
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await images.first().evaluate(img=>getComputedStyle(img).transitionDuration),'0s');checks.push('Launcher reduced-motion preference remains active');
 if(process.env.DRAFT_UI_SCREENSHOT_DIR){fs.mkdirSync(process.env.DRAFT_UI_SCREENSHOT_DIR,{recursive:true});await page.setViewportSize({width:390,height:844});for(const theme of ['sky','night','rose']){await page.locator('.desktop').evaluate((node,theme)=>{node.classList.remove('theme-sky','theme-night','theme-rose');node.classList.add('theme-'+theme);},theme);await page.screenshot({path:path.join(process.env.DRAFT_UI_SCREENSHOT_DIR,theme+'.png')});}}
 assert.deepEqual(errors,[]);const report={passed:checks.length,checks,pageErrors:errors};if(process.env.DRAFT_UI_REPORT)fs.writeFileSync(process.env.DRAFT_UI_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();server.close();}
