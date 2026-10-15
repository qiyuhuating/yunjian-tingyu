import {chromium} from 'playwright';
import {createServer} from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const repo=path.resolve(import.meta.dirname,'../..'),build=path.resolve(process.env.FEATURE_BUILD_DIR||path.join(repo,'work/feature-build'));
const server=createServer((req,res)=>{try{const url=new URL(req.url,'http://local').pathname,file=path.resolve(build,'.'+(url==='/'?'/index.html':decodeURIComponent(url)));if(!file.startsWith(build+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--disable-webgl']}),page=await browser.newPage({viewport:{width:320,height:640},reducedMotion:'reduce'}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
async function open(name){const back=page.getByRole('button',{name:'返回桌面',exact:true});if(await back.isVisible())await back.click();const b=page.locator('.home-screen').getByRole('button',{name,exact:true});if(await b.count())await b.click();else{await page.locator('.home-screen').getByRole('button',{name:'全部应用',exact:true}).click();await page.locator('.launcher-grid').getByRole('button',{name,exact:true}).click();}}
try{
 await page.goto(origin);await page.locator('.home-screen').waitFor();await open('一起听');
 const wav=Buffer.alloc(48044);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(24000,24);wav.writeUInt32LE(48000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
 let event=page.waitForEvent('filechooser');await page.getByRole('button',{name:'播放本地音乐',exact:true}).click();await(await event).setFiles({name:'本地验收.wav',mimeType:'audio/wav',buffer:wav});
 await page.locator('.playlist').getByRole('button',{name:'01 本地验收.wav',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('.music-screen audio')?.readyState>=1);
 checks.push('320px music button opens real chooser, imports local WAV and media metadata loads');
 event=page.waitForEvent('filechooser');await page.getByRole('button',{name:'导入歌词',exact:true}).click();await(await event).setFiles({name:'本地验收.lrc',mimeType:'text/plain',buffer:Buffer.from('[00:00.00]窗边的雨\n[00:00.50]落在云笺','utf8')});
 await page.locator('.lyric-lines').getByRole('button',{name:'落在云笺',exact:true}).click();assert(Math.abs(await page.locator('audio').evaluate(n=>n.currentTime)-.5)<.05);
 checks.push('Lyrics chooser imports real LRC and clicking a line seeks the audio element');
 await page.evaluate(()=>window.NativeFlush());await page.reload();await page.locator('.home-screen').waitFor();await open('一起听');await page.locator('.playlist').getByRole('button',{name:'01 本地验收.wav',exact:true}).waitFor();await page.locator('.lyric-lines').getByRole('button',{name:'落在云笺',exact:true}).waitFor();
 checks.push('Music and lyrics remain after reload');
 await open('专注');await page.getByRole('button',{name:'15 分钟',exact:true}).click();assert.equal(await page.getByRole('button',{name:'15 分钟',exact:true}).getAttribute('aria-pressed'),'true');await page.getByRole('button',{name:'开始专注',exact:true}).click();assert(await page.getByRole('button',{name:'15 分钟',exact:true}).isDisabled());await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByRole('button',{name:'重置计时器',exact:true}).click();assert.equal((await page.locator('.focus-ring b').innerText()).replace(/\s/g,''),'15:00');
 checks.push('Focus duration selected state, start, pause and reset operate at 320px');
 await open('日记');await page.getByRole('button',{name:'心情：温柔',exact:true}).click();assert.equal(await page.getByRole('button',{name:'心情：温柔',exact:true}).getAttribute('aria-pressed'),'true');
 checks.push('Diary mood selection exposes its actual selected state');
 assert.deepEqual(errors,[]);checks.push('No uncaught page errors or paid API calls');
 const report={passed:checks.length,checks,pageErrors:errors};if(process.env.V6_INTERACTION_REPORT)fs.writeFileSync(process.env.V6_INTERACTION_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
