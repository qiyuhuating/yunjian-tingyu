import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const repo=path.resolve(import.meta.dirname,'../..'),app=path.join(repo,'outputs/mori-phone');
const buildDir=path.resolve(process.env.FEATURE_BUILD_DIR||path.join(repo,'work/feature-build'));
const output=path.resolve(process.env.V6_UI_OUTPUT||path.join(repo,'work/v6-ui-evidence'));
const mode=process.env.V6_UI_MODE||'candidate',qaDir=path.join(repo,'work/reference-sky-build');
const {build}=await import(pathToFileURL(path.join(app,'node_modules/vite/dist/node/index.js')));
await build({configFile:false,logLevel:'error',build:{outDir:qaDir,emptyOutDir:true,lib:{entry:path.join(import.meta.dirname,'reference-sky-entry.ts'),formats:['es'],fileName:()=>'qa.js'},minify:false}});
fs.mkdirSync(output,{recursive:true});
const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://local').pathname;if(url==='/__seed__'){res.setHeader('Content-Type','text/html');res.end('<title>Offline fixture</title>');return;}const base=url==='/qa.js'?qaDir:buildDir,file=path.resolve(base,'.'+(url==='/'?'/index.html':decodeURIComponent(url)));if(!file.startsWith(base+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--disable-webgl']});
const records=[],checks=[],failures=[],errors=[],bad=[],contrastRecords=[];
function rgb(value){const n=value.match(/[\d.]+/g).map(Number);return n.slice(0,3).map(v=>v/255);}
function luminance(c){return c.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(rgb(a)),y=luminance(rgb(b));return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
async function check(name,fn){try{await fn();checks.push(name);}catch(e){failures.push({name,error:e.message});}}
const screens=[['home','首页'],['contacts','聊天'],['chat','聊天详情'],['settings','设置'],['characters','角色设定'],['calendar','日历'],['diary','日记'],['notes','小纸条'],['music','一起听'],['focus','专注'],['tasks','任务'],['launcher','全部应用']];
const widths=process.env.V6_UI_QUICK==='1'?[390]:[320,390,844,1440];
try{
for(const theme of ['sky','night','rose'])for(const width of widths){
 const context=await browser.newContext({viewport:{width,height:width===844?390:844},hasTouch:true,isMobile:width<1000,reducedMotion:'reduce',locale:'zh-CN',timezoneId:'Asia/Singapore'});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.clock.setFixedTime(new Date('2026-10-15T10:00:00+08:00'));
 await page.goto(origin+'/__seed__');
 await page.evaluate(async theme=>{const a=await import('/qa.js'),s=a.freshState();s.theme=theme;s.appearanceRevision=1;s.memorySettings.autoExtract=false;s.memorySettings.autoSummary=false;s.characters.push({...s.characters[0],id:'visual-friend',name:'林晚晴'});s.groups=[{id:'visual-group',name:'窗边的小会客室',members:[s.primary,'visual-friend']}];s.threads[s.primary].push({id:'visual-user',role:'user',kind:'text',text:'今天的小事，慢慢讲就好。',timestamp:Date.now()-60000,read:true},{id:'visual-reply',role:'assistant',kind:'text',text:'窗外的云停了一会儿。\n\n**普通的一天**，也可以记下来。',timestamp:Date.now()-30000,read:true});s.threads['visual-friend']=[{id:'visual-history',role:'assistant',kind:'text',text:'那把紫色雨伞，我替你收好了。',timestamp:Date.now()-90000,read:true}];await a.writeLocal('personal-device',s,0);},theme);
 await page.goto(origin);await page.locator('.home-screen').waitFor();
 async function home(){const b=page.getByRole('button',{name:'返回桌面',exact:true});if(await b.isVisible())await b.click();}
 async function open(name){await home();if(name==='首页')return;const b=page.locator('.home-screen').getByRole('button',{name,exact:true});if(await b.count())await b.click();else{await page.locator('.home-screen').getByRole('button',{name:'全部应用',exact:true}).click();await page.locator('.launcher-grid').waitFor();await page.locator('.launcher-grid').getByRole('button',{name,exact:true}).click();}await page.locator('.module-root > :last-child').waitFor();}
 for(const [screen,name] of screens){
  if(screen==='chat'){await open('聊天');await page.locator('.contact-row').filter({hasText:'云汐'}).click();await page.locator('.composer').waitFor();}
  else if(screen==='launcher'){await home();await page.locator('.home-screen').getByRole('button',{name:'全部应用',exact:true}).click();await page.locator('.launcher-grid').waitFor();}
  else await open(name);
  if(screen!=='home')await page.locator('.module-root .scroll-panel:visible,.chat-screen:visible').first().waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>Promise.all([...document.images].filter(n=>n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0).map(n=>n.decode())));
  await page.waitForTimeout(30);
  const metrics=await page.evaluate(()=>{const visible=n=>n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0&&getComputedStyle(n).visibility!=='hidden';return {viewport:innerWidth,document:document.documentElement.scrollWidth,panels:[...document.querySelectorAll('.scroll-panel,.message-flow,.settings-workspace')].filter(visible).map(n=>({class:n.className,width:n.clientWidth,scroll:n.scrollWidth})),font:getComputedStyle(document.body).fontFamily,meta:[...document.querySelectorAll('.message-meta')].filter(visible).map(n=>getComputedStyle(n).opacity),motion:[...document.querySelectorAll('.message-row,.send-button,.contact-row')].filter(visible).map(n=>({class:n.className,transition:getComputedStyle(n).transitionDuration,animation:getComputedStyle(n).animationName}))};});
  records.push({theme,width,screen,...metrics});
  await check(`${theme}/${width}/${screen}: visible content has no horizontal overflow`,()=>{assert(metrics.document<=metrics.viewport);for(const p of metrics.panels){assert(p.width>0);assert(p.scroll<=p.width,JSON.stringify(p));}});
  if(width===390||width===1440&&theme==='sky')await page.screenshot({path:path.join(output,`${mode}-${theme}-${width}-${screen}.png`),animations:'disabled'});
  if(mode!=='before'){
   const colors=await page.evaluate(()=>[...document.querySelectorAll('.primary:not(:disabled),.send-button:not(:disabled),.calendar-grid>button.active')].filter(n=>n.getBoundingClientRect().width>0&&n.getBoundingClientRect().height>0).map(n=>{const c=getComputedStyle(n);return{text:n.textContent,fg:c.color,bg:c.backgroundColor,gradient:c.backgroundImage};}));
   await check(`${theme}/${width}/${screen}: enabled action contrast`,()=>{for(const c of colors){const stops=c.gradient.match(/rgba?\([^)]+\)/g)||[c.bg];const ratios=stops.map(bg=>contrast(c.fg,bg));contrastRecords.push({theme,width,screen,...c,minimum:Math.min(...ratios)});assert(Math.min(...ratios)>=4.5,JSON.stringify({...c,minimum:Math.min(...ratios)}));}});
   if(screen==='chat'){
    await check(`${theme}/${width}: message actions remain discoverable`,()=>assert(metrics.meta.every(v=>Number(v)===1),JSON.stringify(metrics.meta)));
    await check(`${theme}/${width}: composer keyboard focus remains visible`,async()=>{const input=page.locator('.composer textarea'),before=await input.evaluate(n=>{const c=getComputedStyle(n);return{border:c.borderColor,shadow:c.boxShadow};});await input.focus();const after=await input.evaluate(n=>{const c=getComputedStyle(n);return{visible:n.matches(':focus-visible'),outline:c.outlineStyle,outlineWidth:parseFloat(c.outlineWidth),border:c.borderColor,shadow:c.boxShadow};});assert(after.visible);assert(after.outline!=='none'&&after.outlineWidth>=2||after.border!==before.border||after.shadow!==before.shadow,JSON.stringify({before,after}));});
    await check(`${theme}/${width}: enabled send action has readable gradient`,async()=>{await page.locator('.composer textarea').fill('待发送的测试草稿');const button=page.locator('.send-button');assert(await button.isEnabled());const c=await button.evaluate(n=>{const s=getComputedStyle(n);return{fg:s.color,bg:s.backgroundColor,gradient:s.backgroundImage};});const ratios=(c.gradient.match(/rgba?\([^)]+\)/g)||[c.bg]).map(bg=>contrast(c.fg,bg));contrastRecords.push({theme,width,screen:'send',...c,minimum:Math.min(...ratios)});assert(Math.min(...ratios)>=4.5);});
   }
   await check(`${theme}/${width}/${screen}: reduced-motion preference`,()=>{for(const m of metrics.motion){assert(m.transition.split(',').every(v=>parseFloat(v)===0),JSON.stringify(m));assert.equal(m.animation,'none');}});
  }
  if(mode!=='before'&&screen==='contacts'){
   const input=page.getByRole('searchbox',{name:'搜索朋友或消息'});
   await check(`${theme}/${width}: contact history search and clear preserve focus`,async()=>{await input.fill('紫色雨伞');assert.equal(await page.locator('.contact-row:visible').count(),1);await page.getByRole('status').filter({hasText:'找到 1 个相关会话'}).waitFor();await page.getByRole('button',{name:'清空聊天搜索',exact:true}).click();assert.equal(await input.inputValue(),'');assert(await input.evaluate(n=>n===document.activeElement));await input.fill('没有这条记录-test');await page.getByText('暂时没有找到',{exact:true}).waitFor();await page.getByRole('button',{name:'查看全部朋友',exact:true}).click();assert.equal(await input.inputValue(),'');assert(await input.evaluate(n=>n===document.activeElement));assert.equal(await page.locator('.contact-row:visible').count(),3);});
  }
  if(mode!=='before'&&screen==='settings')await check(`${theme}/${width}: settings clear returns focus`,async()=>{const input=page.getByRole('searchbox',{name:'搜索设置'});await input.fill('不存在的设置-test');await page.getByText('没有找到相关设置',{exact:true}).waitFor();await page.getByRole('button',{name:'查看全部设置',exact:true}).click();assert.equal(await input.inputValue(),'');assert(await input.evaluate(n=>n===document.activeElement));});
 }
 if(theme==='sky'&&width===320)await check('Long companion name does not widen the 320px home music widget',async()=>{await page.evaluate(async()=>{await window.NativeFlush();const a=await import('/qa.js'),row=await a.readLocal('personal-device');row.state.characters[0].name='很长的陪伴名字'.repeat(5);await a.writeLocal('personal-device',row.state,row.version);});await page.reload();await page.locator('.home-screen').waitFor();const metric=await page.locator('.listen-widget').evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth}));assert(metric.width>0&&metric.scroll<=metric.width,JSON.stringify(metric));});
 await context.close();
}
await check('No uncaught page errors',()=>assert.deepEqual(errors,[]));await check('No missing production assets',()=>assert.deepEqual(bad,[]));
}finally{await browser.close();await new Promise(r=>server.close(r));}
const report={mode,states:records.length,passed:checks.length,failures,pageErrors:errors,failedResponses:bad,records,contrastRecords};fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,states:records.length,passed:checks.length,failures,pageErrors:errors,failedResponses:bad}));if(failures.length)process.exitCode=1;
