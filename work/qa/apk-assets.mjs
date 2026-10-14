import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const repo=path.resolve(import.meta.dirname,'../..'),root=path.resolve(process.env.FEATURE_BUILD_DIR||path.join(repo,'work/apk-trim-web'));
const server=createServer((req,res)=>{try{
 const url=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(url==='/'?'/index.html':url));if(!file.startsWith(root+path.sep))throw Error();
 res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--disable-webgl']});
const errors=[],bad=[],checks=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)bad.push({url:response.url(),status:response.status()});});
 const images=async()=>page.evaluate(()=>Promise.all([...document.images].filter(img=>img.getBoundingClientRect().width>0).map(async img=>{await img.decode();if(!img.naturalWidth)throw Error('Empty image: '+img.src);})));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('.home-screen').waitFor();await images();checks.push('Home static illustrations decode from production files');
 await page.getByRole('button',{name:'打开一起听音乐',exact:true}).click();await page.locator('.music-cover img').waitFor();await images();
 assert.match(await page.locator('.music-cover img').getAttribute('src'),/music-listen\.webp$/);checks.push('Music cover uses existing WebP and decodes; no missing PNG fallback');
 await page.getByRole('button',{name:'返回桌面',exact:true}).click();await page.getByRole('button',{name:'全部应用',exact:true}).first().click();await page.locator('.launcher-grid').waitFor();await images();checks.push('Launcher static illustrations decode');
 await page.getByRole('button',{name:'返回桌面',exact:true}).click();await page.getByRole('button',{name:'设置',exact:true}).first().click();await page.getByText('数据与备份',{exact:true}).waitFor();checks.push('Settings lazy module loads');
 assert.deepEqual(bad,[]);assert.deepEqual(errors,[]);checks.push('No failed production asset responses or uncaught page errors');
 console.log(JSON.stringify({passed:checks.length,checks,failedResponses:bad,pageErrors:errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
