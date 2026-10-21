import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';

const repo=path.resolve(import.meta.dirname,'../..'),app=path.join(repo,'outputs/mori-phone');
const buildDir=path.resolve(process.env.FEATURE_BUILD_DIR||path.join(repo,'work/feature-build'));
const qaDir=path.join(repo,'work/reference-sky-build');
const {build}=await import(pathToFileURL(path.join(app,'node_modules/vite/dist/node/index.js')).href);
await build({configFile:false,logLevel:'error',build:{outDir:qaDir,emptyOutDir:true,lib:{entry:path.join(import.meta.dirname,'reference-sky-entry.ts'),formats:['es'],fileName:()=>'qa.js'},minify:false}});
const server=createServer((req,res)=>{
 try {
  const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const fontDir=process.env.REFERENCE_SKY_FONT_DIR;
  const base=url==='/qa.js'?qaDir:url.startsWith('/qa-fonts/')&&fontDir?path.join(fontDir,'files'):buildDir;
  const resource=url.startsWith('/qa-fonts/')&&fontDir?url.slice('/qa-fonts'.length):url;
  const p=path.resolve(base,'.'+(resource==='/'?'/index.html':resource));
  if(!p.startsWith(base+path.sep))throw Error();
  res.setHeader('Content-Type',({js:'text/javascript',mjs:'text/javascript',css:'text/css',html:'text/html',webp:'image/webp',png:'image/png',woff2:'font/woff2'})[path.extname(p).slice(1)]||'application/octet-stream');
  res.end(fs.readFileSync(p));
 }catch{res.statusCode=404;res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox','--disable-webgl']});
const checks=[],errors=[];
const output=path.resolve(process.env.REFERENCE_SKY_OUTPUT||path.join(repo,'work/reference-sky-evidence'));
fs.mkdirSync(output,{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('pageerror',e=>errors.push(e.message));
 const loadFont=async()=>{
  if(!process.env.REFERENCE_SKY_FONT_DIR)return;
  const css=fs.readFileSync(path.join(process.env.REFERENCE_SKY_FONT_DIR,'400.css'),'utf8').replaceAll('./files/','/qa-fonts/');
  await page.addStyleTag({content:css+"body,button,input,textarea,select{font-family:'Source Serif 4','Noto Serif SC',serif}"});
  await page.evaluate(()=>document.fonts.ready);
 };
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('.home-greeting').waitFor();
 await loadFont();
 const preserved=await page.evaluate(async()=>{
  const api=await import('/qa.js');
  const old=api.freshState();old.theme='night';delete old.appearanceRevision;
  old.profile.name='配色恢复验收';old.notes[0].text='验收：纸条仍在';old.drafts['chat:char-0']='验收：草稿仍在';
  old.threads['char-0'].push({id:'reference-user',role:'user',text:'验收：原消息仍在',timestamp:Date.now(),kind:'text',read:true});
  await api.writeLocal('reference-upgrade',old,0);
  const image=await api.uploadLocal('reference-upgrade',new File(['wallpaper fixture bytes'],'wallpaper.png',{type:'image/png'}));
  old.wallpaper={asset:image.url,fit:'contain'};
  await api.writeLocal('reference-upgrade',old,1);
  const upgraded=await api.initializeLocal('reference-upgrade');
  const expected={...old,theme:'sky',appearanceRevision:1};
  const savedAgain=await api.initializeLocal('reference-upgrade');
  const choice={...savedAgain.state,theme:'rose'};
  await api.writeLocal('reference-upgrade',choice,savedAgain.version);
  const later=await api.initializeLocal('reference-upgrade');
  const blob=await api.getAsset('reference-upgrade',image.url);
  return {expected,actual:upgraded.state,version:upgraded.version,againVersion:savedAgain.version,laterTheme:later.state.theme,blob:await blob.blob.text()};
 });
 assert.deepEqual(preserved.actual,preserved.expected);
 assert.equal(preserved.version,3);assert.equal(preserved.againVersion,3);
 assert.equal(preserved.laterTheme,'rose');assert.equal(preserved.blob,'wallpaper fixture bytes');
 checks.push('Legacy upgrade changes only theme and revision; state and wallpaper bytes survive; deliberate later theme choice persists');
 const color=async(selector,property='color')=>page.locator(selector).first().evaluate((el,key)=>getComputedStyle(el).getPropertyValue(key),property);
 assert.equal(await color('main','--soft'),'#f2f6f8');
 assert.equal(await color('.home-greeting h2 > span'),'rgb(35, 72, 101)');
 assert.equal(await page.locator('.home-apps').evaluate(el=>getComputedStyle(el,'::before').content),'none');
 assert.match(await color('.home-apps .app-button > span:last-child','background-color'),/rgba\(247, 251, 255/);
 assert.match(await color('.phone-screen','background-image'),/wallpaper\.webp/);
 assert.equal(await page.locator('.phone-screen').evaluate(el=>el.scrollHeight<=el.clientHeight+1),true);
 await page.screenshot({path:path.join(output,'home.png')});
 checks.push('390×844 home restores blue title, white label pills and original wallpaper without a fog overlay');
 await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();
 await page.locator('.contact-row').filter({hasText:'云汐'}).click();
 assert.equal(await color('.chat-screen','background-color'),'rgb(242, 246, 248)');
 assert.equal(await color('.role-assistant .message-card','background-color'),'rgb(255, 255, 253)');
 await page.evaluate(async()=>{
  await window.NativeFlush();const api=await import('/qa.js');const saved=await api.readLocal('personal-device');
  saved.state.threads['char-0'].push({id:'reference-user-bubble',role:'user',text:'验收：浅蓝气泡',timestamp:Date.now(),kind:'text',read:true});
  await api.writeLocal('personal-device',saved.state,saved.version);
 });
 await page.reload();await page.locator('.home-greeting').waitFor();
 await loadFont();
 await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();
 await page.locator('.contact-row').filter({hasText:'云汐'}).click();
 assert.equal(await color('.role-user .message-card','background-color'),'rgb(225, 236, 244)');
 await page.screenshot({path:path.join(output,'chat.png')});
 checks.push('Chat restores cool paper background, milk-white assistant bubble and pale-blue user bubble');
 await page.getByRole('button',{name:'返回聊天列表',exact:true}).first().click();
 // Home geometry at narrow and landscape sizes; all dock entries must remain on screen.
 await page.getByRole('button',{name:'返回桌面',exact:true}).first().click();
 for(const viewport of [{width:320,height:640},{width:844,height:390},{width:1440,height:1000}]){
  await page.setViewportSize(viewport);
  const dock=await page.locator('.phone-dock').boundingBox();assert(dock&&dock.y>=0&&dock.y+dock.height<=viewport.height+1,JSON.stringify({viewport,dock}));
 }
 checks.push('320×640, 844×390 and desktop dock remains visible');
 for(const theme of ['night','rose']){
  await page.evaluate(async theme=>{await window.NativeFlush();const api=await import('/qa.js'),saved=await api.readLocal('personal-device');saved.state.theme=theme;await api.writeLocal('personal-device',saved.state,saved.version);},theme);
  await page.reload();await page.locator('.home-greeting').waitFor();
  assert.equal(await page.locator('main').getAttribute('class'),'desktop theme-'+theme);
  assert.notEqual(await color('main','--soft'),'#f2f6f8');
 }
 checks.push('Night and rose themes still apply after a deliberate choice and a cold reload');
 await page.setViewportSize({width:390,height:844});
 for(const theme of ['sky','night','rose']){
  await page.evaluate(async theme=>{await window.NativeFlush();const api=await import('/qa.js'),saved=await api.readLocal('personal-device');saved.state.theme=theme;await api.writeLocal('personal-device',saved.state,saved.version);},theme);
  await page.reload();await page.locator('.home-greeting').waitFor();
  await page.locator('.home-screen').getByRole('button',{name:'设置',exact:true}).click();
  await page.locator('.settings-title-row h2').waitFor();
  const values=await page.evaluate(()=>{const main=document.querySelector('main'),probe=document.createElement('span');probe.hidden=true;main.append(probe);const variable=name=>{probe.style.color='var('+name+')';return getComputedStyle(probe).color;};const read=selector=>getComputedStyle(document.querySelector(selector));const result={title:read('.settings-title-row h2').color,ink:variable('--ink'),secondary:read('.settings-destination small').color,muted:variable('--muted'),border:read('.settings-directory').borderColor,line:variable('--line'),inputBorder:read('.settings-search input').borderWidth};probe.remove();return result;});
  if(theme!=='sky')assert.equal(values.title,values.ink);
  assert.equal(values.secondary,values.muted);assert.equal(values.border,values.line);assert.equal(values.inputBorder,'0px');
  await page.locator('.settings-search input').focus();assert.equal(await page.locator('.settings-search').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  if(theme==='night')await page.screenshot({path:path.join(output,'night-settings.png')});
  await page.reload();await page.locator('.home-greeting').waitFor();
  await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();await page.locator('.contact-row').filter({hasText:'云汐'}).click();await page.mouse.move(0,0);
  assert(Number(await page.locator('.message-meta button').first().evaluate(el=>getComputedStyle(el).opacity))>=.8);
 }
 checks.push('Sky, night and rose settings retain theme text and border colors with a single search border and visible focus');
 checks.push('Mobile message actions remain discoverable in all three themes');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({passed:checks.length,checks,errors},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,checks}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
