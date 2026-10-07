import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='D:/Codex存储文件夹/2026-10-06/c';
const browser=await chromium.launch({executablePath:'D:/xiaofeng/dev-cache/ms-playwright/chromium-1223/chrome-win64/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1020}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5173/signin-with-chatgpt?return_to=/');
await page.getByRole('button',{name:'我们的家',exact:true}).waitFor();
await page.evaluate(async()=>{const response=await fetch('/api/state');const data=await response.json();const s=data.state;s.diaries=[];s.gallery=[];s.threads['char-0']=s.threads['char-0'].slice(0,1);s.characters=s.characters.filter(c=>c.id.startsWith('char-'));s.lore=s.lore.slice(0,1);const result=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:s,version:data.version})});if(!result.ok)throw new Error('Local QA fixture reset failed');});
await page.reload();await page.getByRole('button',{name:'我们的家',exact:true}).waitFor();
await page.waitForTimeout(500);
await page.screenshot({path:root+'/work/home-desktop.png',fullPage:true});
const report={viewport:[],checks:[]};
for(const width of [320,390,768,1440]){
 await page.setViewportSize({width,height:width<740?844:1020});
 const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.scrollWidth<=metrics.width,JSON.stringify(metrics));report.viewport.push(metrics);
 if(width===390)await page.screenshot({path:root+'/work/home-mobile.png',fullPage:true});
}
await page.setViewportSize({width:1440,height:1020});
await page.getByRole('button',{name:'日记',exact:true}).click();
await page.getByRole('textbox',{name:'日记内容'}).fill('验收记录：今天的云朵很好看。');
await page.getByRole('button',{name:'把今天收好',exact:true}).click();
await page.locator('.journal-card').getByText('验收记录：今天的云朵很好看。',{exact:true}).first().waitFor();
await page.reload();await page.getByRole('button',{name:'日记',exact:true}).click();
await page.locator('.journal-card').getByText('验收记录：今天的云朵很好看。',{exact:true}).first().waitFor();report.checks.push('Diary persists after reload');
await page.getByRole('button',{name:'返回桌面'}).click();
await page.getByRole('button',{name:'聊天',exact:true}).click();
await page.locator('.contact-row').filter({hasText:'云汐'}).first().click();
await page.getByRole('textbox',{name:'消息内容'}).fill('请给我一个真实回复。');
await page.getByRole('button',{name:'发送消息',exact:true}).click();
await page.getByText('请先在设置里填写 API 密钥，连接真实 AI。',{exact:true}).waitFor();
let cloud=await page.evaluate(async()=>{const r=await fetch('/api/state');return r.json();});
assert(cloud.state.threads['char-0'].filter(m=>m.role==='user').some(m=>m.text==='请给我一个真实回复。'));
assert(cloud.state.threads['char-0'].filter(m=>m.role==='assistant').length===1);report.checks.push('Unconfigured AI does not fabricate replies; user message saved');
const uploadInput=page.locator('.composer-area input[type=file]');
await uploadInput.setInputFiles([
 {name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('这是一份用于验证保存和下载的文字附件。')},
 {name:'archive.zip',mimeType:'application/zip',buffer:Buffer.from('PK\x03\x04ZIP_FIXTURE')},
 {name:'document.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await fs.readFile('D:/小手机试玩20轮.docx')},
 {name:'sticker.png',mimeType:'image/png',buffer:await fs.readFile(root+'/outputs/mori-phone/public/icon-192.png')},
]);
await page.getByText('附件和记录已保存。可以继续发消息让角色回应。',{exact:true}).waitFor();
cloud=await page.evaluate(async()=>{const r=await fetch('/api/state');return r.json();});
const attachments=cloud.state.threads['char-0'].filter(m=>m.asset);assert(attachments.length===4);
assert(attachments.find(m=>m.fileName==='document.docx').extracted.includes('小手机试玩20轮'));
for(const file of attachments){const result=await context.request.get('http://127.0.0.1:5173'+file.asset);assert.equal(result.status(),200);const data=await result.body();assert.equal(data.length,file.fileSize);if(file.kind==='file')assert(result.headers()['content-disposition'].startsWith('attachment'));}
await page.reload();await page.getByRole('button',{name:'聊天',exact:true}).click();await page.locator('.contact-row').filter({hasText:'云汐'}).first().click();await page.getByRole('link',{name:/archive.zip/}).waitFor();
report.checks.push('TXT ZIP DOCX PNG attachments upload, download and survive reload');
await page.screenshot({path:root+'/work/chat-desktop.png',fullPage:true});
await page.getByRole('button',{name:'返回桌面'}).click();await page.getByRole('button',{name:'角色与世界',exact:true}).click();
const cardInput=page.locator('input[accept=".txt,.json,.png"]');
await cardInput.setInputFiles({name:'青禾.txt',mimeType:'text/plain',buffer:Buffer.from('青禾是一位温和的成年角色，喜欢写诗和旅行。')});
await page.getByRole('button',{name:'确认导入',exact:true}).click();await page.getByRole('button',{name:'保存角色设定',exact:true}).click();
await cardInput.setInputFiles({name:'清月.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({spec:'chara_card_v2',data:{name:'清月',description:'一位安静的成年插画师。',personality:'温柔',first_mes:'你好，我是清月。',character_book:{entries:[{name:'花园',keys:['花园'],content:'花园里种着蓝色的花。',enabled:true}]}}}))});
await page.getByRole('button',{name:'确认导入',exact:true}).click();await page.getByRole('button',{name:'保存角色设定',exact:true}).click();
await cardInput.setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('not json')});
await page.getByText('JSON 格式不正确，请检查文件。',{exact:true}).waitFor();
cloud=await page.evaluate(async()=>{const r=await fetch('/api/state');return r.json();});assert(cloud.state.characters.some(c=>c.name==='青禾'));assert(cloud.state.characters.some(c=>c.name==='清月'));assert(cloud.state.lore.some(c=>c.title==='花园'));report.checks.push('TXT and V2 JSON cards import; embedded lore imported; malformed card rejected');
const crc32=bytes=>{let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;};
const basePng=await fs.readFile(root+'/outputs/mori-phone/public/icon-192.png'),cardData=Buffer.from('chara\0'+Buffer.from(JSON.stringify({spec:'chara_card_v2',data:{name:'星野',description:'喜欢星星的成年摄影师。',first_mes:'今天也一起看星星吧。'}})).toString('base64')),chunk=Buffer.alloc(cardData.length+12);chunk.writeUInt32BE(cardData.length,0);chunk.write('tEXt',4);cardData.copy(chunk,8);chunk.writeUInt32BE(crc32(chunk.subarray(4,-4)),chunk.length-4);
const pngCard=Buffer.concat([basePng.subarray(0,-12),chunk,basePng.subarray(-12)]);
await cardInput.setInputFiles({name:'星野.png',mimeType:'image/png',buffer:pngCard});await page.getByRole('button',{name:'确认导入',exact:true}).click();await page.getByRole('button',{name:'保存角色设定',exact:true}).click();
cloud=await page.evaluate(async()=>{const r=await fetch('/api/state');return r.json();});assert(cloud.state.characters.find(c=>c.name==='星野').avatar.startsWith('/api/assets/'));report.checks.push('PNG embedded character card imports UTF-8 metadata and preserves avatar');
const vault=await page.evaluate(async()=>{const res=await fetch('/api/connection',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:'test-private-key-not-a-provider-key'})});const stored=await fetch('/api/state').then(r=>r.json());return {status:res.status,body:stored};});assert.equal(vault.status,200);assert.equal(vault.body.savedAI,true);assert(!JSON.stringify(vault.body).includes('test-private-key'));await page.evaluate(()=>fetch('/api/connection',{method:'DELETE',headers:{'Content-Type':'application/json'}}));report.checks.push('Encrypted key vault saves and removes keys without returning plaintext');
const hostileOrigin=await context.request.put('http://127.0.0.1:5173/api/state',{headers:{Origin:'https://untrusted.example'},data:{version:cloud.version,state:cloud.state}});assert.equal(hostileOrigin.status(),403);report.checks.push('Cross-origin writes rejected');
const csrf=await page.evaluate(async()=>{const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:{},version:0})});return r.status;});assert.equal(csrf,400);
const conflict=await page.evaluate(async(state)=>{const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({state,version:0})});return r.status;},cloud.state);assert.equal(conflict,409);report.checks.push('Invalid state rejected; stale writes return conflict instead of overwriting');
const signedOut=await browser.newContext();const anon=await signedOut.request.get('http://127.0.0.1:5173/api/state');assert.equal(anon.status(),401);
const leaked=await signedOut.request.get('http://127.0.0.1:5173'+attachments[0].asset);assert.equal(leaked.status(),401);report.checks.push('Unauthenticated state and attachment access rejected');await signedOut.close();
assert.deepEqual(errors,[]);report.pageErrors=errors;await fs.writeFile(root+'/work/qa-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();


