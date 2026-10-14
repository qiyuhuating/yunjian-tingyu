import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const repo=path.resolve(import.meta.dirname,'../..'),app=path.join(repo,'outputs/mori-phone');
const output=path.resolve(process.env.VISUAL_CLEANUP_OUTPUT||path.join(repo,'work/visual-cleanup-evidence'));
const qaDir=path.join(repo,'work/visual-cleanup-build');
const {build}=await import(pathToFileURL(path.join(app,'node_modules/vite/dist/node/index.js')));
await build({configFile:false,logLevel:'error',build:{outDir:qaDir,emptyOutDir:true,lib:{entry:path.join(import.meta.dirname,'reference-sky-entry.ts'),formats:['es'],fileName:()=>'qa.js'},minify:false}});
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--disable-webgl']});
const builds=[['after',path.resolve(process.env.FEATURE_BUILD_DIR||path.join(repo,'work/feature-build'))]];
if(process.env.VISUAL_BASELINE_DIR)builds.unshift(['before',path.resolve(process.env.VISUAL_BASELINE_DIR)]);
const results={},errors=[];
try{
 for(const [version,root] of builds){
  const server=createServer((req,res)=>{try{
   const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname),base=url==='/qa.js'?qaDir:root;
   const file=path.resolve(base,'.'+(url==='/'?'/index.html':url));if(!file.startsWith(base+path.sep))throw Error('path');
   res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
  }catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  results[version]=[];
  try{for(const theme of ['sky','night','rose'])for(const viewport of [{width:320,height:640},{width:390,height:844},{width:844,height:390},{width:1440,height:1000}]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce',locale:'zh-CN',timezoneId:'Asia/Singapore'});
   try{
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.clock.setFixedTime(new Date('2026-10-13T10:00:00+08:00'));
    await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('.home-screen').waitFor();
    await page.evaluate(async theme=>{await window.NativeFlush();const api=await import('/qa.js'),saved=await api.readLocal('personal-device');saved.state.theme=theme;await api.writeLocal('personal-device',saved.state,saved.version);},theme);
    await page.reload();await page.locator('.home-screen').waitFor();
    const capture=async screen=>{
     await page.evaluate(()=>document.fonts.ready);
     await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
     await page.evaluate(()=>Promise.all([...document.querySelectorAll('.button-art img,.dock-art img,.pet-model img')].filter(el=>el.getBoundingClientRect().width>0).map(el=>el.decode())));
     await page.waitForTimeout(350);
     const record=await page.evaluate(()=>{
      const icons=[...document.querySelectorAll('.home-screen .app-icon,.launcher-grid .app-icon')].map(el=>({art:el.querySelectorAll('.button-art,.dock-art').length,svg:el.querySelectorAll(':scope>svg').length}));
      const images=[...document.querySelectorAll('.button-art img,.dock-art img,.pet-model img')].filter(el=>el.getBoundingClientRect().width>0).map(el=>({loaded:el.complete&&el.naturalWidth>0,visible:el.getBoundingClientRect().height>0}));
      const selectors=['.home-screen .glass','.home-apps .app-button>span:last-child','.pet-peek>span:nth-child(2)','.message-card','.chat-person','.composer textarea','.settings-title-row h2','.settings-destination','.launcher-grid .app-icon'];
      const props=['background','border','border-radius','box-shadow','color','font-size','font-weight','line-height','padding','margin','display','opacity','width','height'];
      return {icons,images,overflow:document.documentElement.scrollWidth>innerWidth,styles:selectors.flatMap(selector=>[...document.querySelectorAll(selector)].map(el=>({selector,css:Object.fromEntries(props.map(key=>[key,getComputedStyle(el).getPropertyValue(key)])),rect:JSON.stringify(el.getBoundingClientRect())})))};
     });
     assert.equal(record.overflow,false);for(const icon of record.icons)assert.equal(icon.art+icon.svg,1,'Each app slot must have exactly one graphic');for(const image of record.images)assert(image.loaded&&image.visible,'Illustration must load and have visible dimensions');
     if(version==='after')assert.equal(await page.locator('.home-indicator').count(),0);
     const key=`${theme}-${viewport.width}x${viewport.height}-${screen}`;
     await page.screenshot({path:path.join(output,version+'-'+key+'.png'),animations:'disabled'});
     results[version].push({key,...record});
    };
    await capture('home');
    await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();await page.locator('.contact-row').filter({hasText:'云汐'}).click();await page.locator('.chat-screen').waitFor();await capture('chat');
    await page.reload();await page.locator('.home-screen').waitFor();await page.locator('.home-screen').getByRole('button',{name:'设置',exact:true}).click();await page.getByText('数据与备份',{exact:true}).waitFor();await capture('settings');
    await page.reload();await page.locator('.home-screen').waitFor();await page.getByRole('button',{name:'全部应用',exact:true}).first().click();await page.locator('.launcher-grid').waitFor();await capture('launcher');
   }finally{await context.close();}
  }}finally{await new Promise(r=>server.close(r));}
 }
 assert.deepEqual(errors,[]);
 if(results.before)assert.deepEqual(results.after,results.before,'Cleanup must preserve computed styles, geometry and rendered icon counts');
 const report={states:results.after.length,baselineCompared:!!results.before,pageErrors:errors,results};
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({states:report.states,baselineCompared:report.baselineCompared,pageErrors:errors}));
}finally{await browser.close();}
