import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const repo=path.resolve(import.meta.dirname,'../..'),build=path.join(repo,'work/feature-build');
const server=createServer((req,res)=>{try{const url=decodeURIComponent(req.url.split('?')[0]),file=path.resolve(build,'.'+(url==='/'?'/index.html':url));if(!file.startsWith(build+path.sep))throw Error('outside build');res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-webgl']}),results=[];
try{
 for(const [width,height] of [[390,844],[390,660],[320,568],[414,896]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.locator('.home-screen').waitFor({timeout:25000});
  await page.evaluate(()=>document.fonts.ready);
  const row=await page.evaluate(()=>{
   const home=document.querySelector('.home-screen'),screen=document.querySelector('.phone-screen'),rect=home.getBoundingClientRect(),bounds=[...home.children].filter(x=>getComputedStyle(x).position!=='absolute'&&getComputedStyle(x).display!=='none').map(x=>({name:x.className,top:x.getBoundingClientRect().top,bottom:x.getBoundingClientRect().bottom}));
   return {viewportHeight:innerHeight,bodyScroll:document.documentElement.scrollHeight-document.documentElement.clientHeight,homeScroll:home.scrollHeight-home.clientHeight,homeOverflow:getComputedStyle(home).overflowY,top:rect.top,screenTop:screen.getBoundingClientRect().top,bounds};
  });
  assert(row.screenTop>=-1&&row.screenTop<1,'The phone wallpaper must start at the top of the viewport: '+JSON.stringify(row));
  assert(row.bodyScroll<=1&&row.homeScroll<=2&&row.homeOverflow==='hidden','Home may not scroll: '+JSON.stringify(row));
  for(const part of row.bounds)assert(part.top>=row.top-2&&part.bottom<=height+1,'Home widget out of viewport: '+JSON.stringify({width,height,part,row}));
  assert.deepEqual(errors,[],'Unexpected page errors');
  results.push({width,height,homeScroll:row.homeScroll,bodyScroll:row.bodyScroll,visible:row.bounds.map(x=>x.name)});
  await page.close();
 }
 console.log(JSON.stringify({passed:results.length,results}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
