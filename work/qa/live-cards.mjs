// Opt-in real UI run. Private cards and credentials are external inputs, never repo fixtures.
import {chromium} from 'playwright';import {createServer} from 'node:http';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const repo=path.resolve(import.meta.dirname,'../..'),app=path.join(repo,'outputs/mori-phone'),cardsDir=process.env.LIVE_CARDS_DIR,resultsDir=process.env.LIVE_CARDS_RESULTS;
assert(cardsDir&&resultsDir,'Set LIVE_CARDS_DIR and LIVE_CARDS_RESULTS outside the repository');fs.mkdirSync(resultsDir,{recursive:true});
const source=JSON.parse(fs.readFileSync(path.join(cardsDir,'source-index.json'),'utf8')),cards=source.files.filter(f=>/^(private|推荐版本|历史存档)\//.test(f.path)&&!f.path.endsWith('README.md')).map((f,i)=>({...f,index:i,bytes64:fs.readFileSync(path.join(cardsDir,f.path)).toString('base64')}));
for(const card of cards)assert.equal(createHash('sha256').update(Buffer.from(card.bytes64,'base64')).digest('hex'),card.sha256);
fs.writeFileSync(path.join(resultsDir,'card-source-index.json'),JSON.stringify({...source,files:cards.map(({bytes64,...card})=>card)},null,2));
const library=path.join(repo,'work/live-card-build'),{build}=await import(pathToFileURL(path.join(app,'node_modules/vite/dist/node/index.js')).href);
await build({configFile:false,logLevel:'error',build:{outDir:library,emptyOutDir:true,lib:{entry:path.join(import.meta.dirname,'live-card-entry.ts'),formats:['es'],fileName:()=>'cards-qa.js'},minify:false}});
const product=path.join(repo,'work/feature-build'),traces=[],runs=[],pageErrors=[],tokenLimit=100000000;let reservedUpperBound=Number(process.env.LIVE_PRIOR_RESERVED_UPPER_BOUND||500000),active=0,maxConcurrent=0,nextFreeRequest=0;
const models={deepseek:'deepseek-flash',openrouter:process.env.LIVE_CARDS_OPENROUTER_MODEL||'liquid/lfm-2.5-2.6b:free'},keys={deepseek:process.env.DEEPSEEK_API_KEY,openrouter:process.env.OPENROUTER_API_KEY};
const selectedProviders=(process.env.LIVE_CARDS_PROVIDERS||'deepseek,openrouter').split(',');assert(selectedProviders.every(p=>p in models));
assert(selectedProviders.length>0&&selectedProviders.every(p=>keys[p]),'Selected provider temporary credentials required');
assert(Number.isSafeInteger(reservedUpperBound)&&reservedUpperBound>=0&&reservedUpperBound<=tokenLimit,'Prior reservation bound');
// Current official catalog must independently confirm the chosen route has zero pricing.
if(selectedProviders.includes('openrouter')){const catalog=await (await fetch('https://openrouter.ai/api/v1/models',{signal:AbortSignal.timeout(20000)})).json(),free=catalog.data?.find(m=>m.id===models.openrouter);
assert(free?.id.endsWith(':free')&&free.pricing.prompt==='0'&&free.pricing.completion==='0','No paid fallback');}
const writeTrace=row=>fs.appendFileSync(path.join(resultsDir,'request-usage.jsonl'),JSON.stringify(row)+'\n');
const clean=value=>{let s=String(value||'').replace(/sk-[A-Za-z0-9_-]+/g,'[redacted]');for(const key of Object.values(keys).filter(Boolean))s=s.replaceAll(key,'[redacted]');return s.slice(0,500);};
const server=createServer(async(req,res)=>{
 if(req.url.startsWith('/relay/')){const match=req.url.match(/^\/relay\/(deepseek|openrouter)(\/.*)$/);if(!match)return res.writeHead(404).end();const [,provider,route]=match;
  try{const parts=[];for await(const chunk of req)parts.push(chunk);const data=Buffer.concat(parts),body=data.length?JSON.parse(data):null;if(body)assert.equal(body.model,models[provider]);
   if(body){const reserve=Buffer.byteLength(JSON.stringify(body.messages))+Number(body.max_tokens||0);assert(reservedUpperBound+reserve<=tokenLimit,'Token cap');reservedUpperBound+=reserve;}
   if(body&&provider==='openrouter'){const scheduled=Math.max(Date.now(),nextFreeRequest);nextFreeRequest=scheduled+3600;await new Promise(r=>setTimeout(r,scheduled-Date.now()));}
   const url=(provider==='deepseek'?'https://api.deepseek.com':'https://openrouter.ai/api/v1')+route,started=performance.now(),row={id:traces.length,provider,model:body?.model,method:req.method,startedAt:new Date().toISOString(),kind:body?'generation':'models'};traces.push(row);active++;maxConcurrent=Math.max(maxConcurrent,active);
   try{const upstream=await fetch(url,{method:req.method,headers:{Authorization:'Bearer '+keys[provider],'Content-Type':'application/json'},...(data.length?{body:data}:{}),signal:AbortSignal.timeout(55000),redirect:'error'});row.http=upstream.status;res.writeHead(upstream.status,{'Content-Type':upstream.headers.get('Content-Type')||'application/json'});
    const reader=upstream.body?.getReader();let pending='',usage=null,firstTokenMs=null,finish='';if(reader)try{for(;;){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));if(body&&upstream.ok){pending+=new TextDecoder().decode(value);const lines=pending.split('\n');pending=lines.pop()||'';for(const line of lines)if(line.startsWith('data: {'))try{const event=JSON.parse(line.slice(6));if(event.usage)usage=event.usage;if(event.choices?.[0]?.delta?.content&&firstTokenMs===null)firstTokenMs=performance.now()-started;finish=event.choices?.[0]?.finish_reason||finish;}catch{}}}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    Object.assign(row,{durationMs:performance.now()-started,firstTokenMs,finishReason:finish,usage});res.end();
   }catch(e){row.failure=clean(e.message);if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'Live test upstream failed'}}));}finally{active--;writeTrace(row);}
  }catch(e){if(!res.headersSent)res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:clean(e.message)}}));}return;
 }
 try{const qa=req.url==='/cards-qa.js',file=qa?path.join(library,'cards-qa.js'):path.resolve(product,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!qa&&!file.startsWith(product+path.sep))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-webgl']});
const prompts=(i,name)=>[
 `我已经30岁，今天想和你慢慢聊聊。你通常怎样判断一个刚认识的人？保持你自己的性格，按手机聊天自然回答。`,
 `告诉你一件私事：我的专属记号是砂雨-${700+i}。我喜欢无糖乌龙茶，不喜欢别人反复叫昵称。请记住。`,
 '今天工作出了点小差错，我有点烦。我暂时不想听建议，只想说两句。',
 '谢谢你听我说。你现在最想做的一件小事是什么？不需要每轮反问我。',
 '朋友说为了效率可以随便答应别人，然后不兑现。你同意吗？请坚持你自己的判断。',
 '今天换个话题：写一个判断整数是否为素数的 Python 函数，然后解释一个边界条件。不要声称已执行。',
 '代码聊完了，回到日常。你愿意怎样度过一个下雨的下午？',
 '我说错了一件事：从现在起我更喜欢热水，不再喜欢乌龙茶。这是明确更正。',
 '我的工作安排变了，原本明晚见朋友的计划取消，改成周末白天见面。',
 '你别总是迁就我。如果我的想法有问题，可以直接说不同意见。',
 '我现在好多了，给我讲个符合你口吻的小玩笑。别解释笑点。',
 '刚才我们有一件计划变更，你还记得吗？只说确定知道的事。',
 '我给你一张临时文书：访客叫阿澄，喜欢咖啡。这只是访客资料，不是我的个人偏好。',
 '你觉得一段长期关系最需要守住什么？按照你的价值观说。',
 '如果另一位角色告诉你我的私事，你会直接当成我们共同经历过的事吗？',
 '现在回想一下：我明确更正过的饮品偏好是什么？别把访客的咖啡算到我身上。',
 '我们隔了一段时间再见。你还记得我不喜欢哪种聊天习惯吗？',
 '以前的计划取消后，你会怎样确认新的安排？不要擅自声称见面已经发生。',
 `我的专属记号是什么？如果没有证据就说不知道，不要编。`,
 `现在请说出你自己的身份和一个不会轻易改变的原则。不要把我或访客当成你。`,
 '不再讨论这些检查，今天晚饭想吃点清淡的。自然接话，不机械复述问题。',
 '我不同意你刚才的看法，但仍愿意听你的理由。你怎样回应？',
 '你有没有觉得我今天的情绪与最开始不同？只根据我们这段对话判断。',
 '最后确认一下：我的饮品偏好、周末安排和专属记号各是什么？说得简短些。'
];
async function attachQA(page){await page.addScriptTag({type:'module',content:'import * as api from "/cards-qa.js";window.CardsQA=api;'});await page.waitForFunction(()=>window.CardsQA);}
async function home(page){const back=page.getByRole('button',{name:'返回桌面',exact:true});if(await back.count())await back.first().click();}
async function snapshot(page){await page.evaluate(()=>window.NativeFlush());return page.evaluate(async()=> (await window.CardsQA.readLocal('personal-device')).state);}
async function worker(provider,workerIndex){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();page.on('pageerror',e=>pageErrors.push({provider,workerIndex,message:clean(e.message)}));
 await context.addInitScript(()=>{const native=window.fetch.bind(window);window.fetch=(input,init)=>{const url=typeof input==='string'?input:input instanceof Request?input.url:input.href;let target=url.replace(/^https:\/\/api\.deepseek\.com/,'/relay/deepseek').replace(/^https:\/\/openrouter\.ai\/api\/v1/,'/relay/openrouter');return native(target,init);};});
 try{await page.goto(origin);await page.locator('.home-screen').waitFor();await attachQA(page);
  const imported=await page.evaluate(async({cards,provider,model})=>{const q=window.CardsQA,saved=await q.readLocal('personal-device'),state=q.freshState();state.characters=[];state.threads={};state.groups=[];state.memories=[];state.lore=[];state.provider=provider;state.model=model;state.connections[provider]={model,baseURL:'',vision:false};state.vision=false;state.profile.name='成年测试用户';state.profile.address='朋友';state.roleplay.choices=false;state.roleplay.length='short';state.groupSettings.cadence='fast';state.memorySettings.extractEvery=8;state.memorySettings.interval=16;state.sampling.maxTokens=provider==='openrouter'?2048:768;state.sampling.thinking=false;state.mediaSettings.aiVoice=false;state.mediaSettings.imageEnabled=false;state.mediaSettings.stickers=[];
   const checks=[];for(const row of cards){const bytes=Uint8Array.from(atob(row.bytes64),c=>c.charCodeAt(0)),filename=row.path.split('/').at(-1),file=new File([bytes],filename.endsWith('.txt')?filename:filename+'.txt',{type:'text/plain'}),card=await q.parseCharacter(file),c={...card.character,id:'card-'+row.index};const asset=await q.uploadLocal('personal-device',file);state.characters.push(c);state.threads[c.id]=[{id:'source-'+row.index,role:'user',kind:'file',text:'角色卡来源原件，仅作为保留的资料。',timestamp:1,asset:asset.url,fileName:filename,mime:asset.mime,fileSize:asset.size,attachmentStatus:'原件已保存；人物设定通过角色卡导入。'}];const original=await q.getAsset('personal-device',asset.url),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await original.blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==row.sha256||c.description!==new TextDecoder().decode(bytes))throw Error('Card source altered');checks.push({index:row.index,name:c.name,sourceSHA256:hash,warnings:card.warnings});}
   state.primary=state.characters[0].id;await q.writeLocal('personal-device',state,saved.version);await q.saveDeviceKey('personal-device',provider,'fixture-proxy-key-not-real');return checks;
  },{cards,provider,model:models[provider]});
  await page.reload();await page.locator('.home-screen').waitFor();await attachQA(page);
  for(const card of cards.filter(c=>c.index%3===workerIndex)){
   await home(page);await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();const name=imported[card.index].name,search=page.getByPlaceholder('找一位朋友，或一条消息');if(await search.count())await search.fill(name);
   const candidates=page.locator('.contact-row').filter({has:page.getByText(name,{exact:true})}),duplicateIndex=cards.slice(0,card.index).filter(c=>imported[c.index].name===name).length;await candidates.nth(duplicateIndex).click();
   const run={provider,model:models[provider],card:card.path,index:card.index,sourceSHA256:card.sha256,turns:[],import:imported[card.index]};runs.push(run);const script=prompts(card.index,name);
   for(let turn=0;turn<script.length;turn++){
    if(turn===17){await page.reload();await page.locator('.home-screen').waitFor();await attachQA(page);await page.locator('.home-screen').getByRole('button',{name:'聊天',exact:true}).click();const rows=page.locator('.contact-row').filter({has:page.getByText(name,{exact:true})});await rows.first().click();}
    const before=await snapshot(page),thread='card-'+card.index,previous=before.threads[thread].length,started=performance.now(),traceStart=traces.length;await page.getByLabel('消息内容').fill(script[turn]);await page.getByRole('button',{name:'发送消息',exact:true}).click();
    await page.waitForFunction(({thread,count})=>document.querySelectorAll('.message-row.role-user').length>0&&document.querySelector('button[aria-label="停止回复"]')||document.querySelector('[role="alert"]'),{thread,count:previous},{timeout:15000}).catch(()=>{});
    await page.waitForFunction(()=>!document.querySelector('button[aria-label="停止回复"]'),null,{timeout:75000});
    // Background memory has a separate queue; allow its commit before the next fixture turn.
    await page.waitForFunction(()=>!document.body.innerText.includes('正在后台整理记忆'),null,{timeout:65000}).catch(()=>{});const after=await snapshot(page),added=after.threads[thread].slice(previous),user=added.find(m=>m.role==='user'),assistant=added.filter(m=>m.role==='assistant'&&!m.failed),entry={turn:turn+1,user:script[turn],userMessageId:user?.id,status:user&&!user.failed&&assistant.length?'passed':'failed',assistant:assistant.map(m=>({id:m.id,text:m.text,senderId:m.senderId})),durationMs:performance.now()-started,traceRange:[traceStart,traces.length],memoryCount:after.memories.filter(m=>m.scope===thread).length,error:clean((await page.getByRole('alert').allTextContents()).join(' '))};
    assert(user?.text===script[turn],'Original user text missing');assert(assistant.every(m=>m.senderId===thread),'Wrong character attribution');run.turns.push(entry);fs.appendFileSync(path.join(resultsDir,'dialogues.jsonl'),JSON.stringify({provider,card:card.path,index:card.index,...entry})+'\n');
    fs.writeFileSync(path.join(resultsDir,`checkpoint-${provider}-${workerIndex}.json`),JSON.stringify(after));if((turn+1)%8===0)console.log(JSON.stringify({provider,card:card.index,turn:turn+1,status:entry.status}));
    if(entry.status==='failed'){run.interruptedAt=turn+1;break;}
   }
   if(run.turns.length===24&&run.turns.every(t=>t.status==='passed')){const cold=await page.evaluate(async({index})=>{const q=window.CardsQA,state=(await q.readLocal('personal-device')).state,thread='card-'+index,character=state.characters.find(c=>c.id===thread),reduced={...state,threads:{...state.threads,[thread]:[]}},query='只依据你持久化的角色记忆与阶段摘要，简短回答：我的饮品偏好、周末安排和专属记号分别是什么？缺少证据就说不知道。',prompt=q.buildPrompt(reduced,character,thread,query,'chat'),input=q.chatInput.parse({provider:state.provider,model:state.model,baseURL:'',apiKey:'fixture-proxy-key-not-real',sampling:state.sampling,messages:[{role:'system',content:prompt.system},{role:'user',content:'[应用运行配置]\n'+prompt.context},{role:'user',content:query},{role:'user',content:prompt.tail}]}),wire=q.wireRequest(input),response=await fetch(wire.url,{method:'POST',headers:wire.headers,body:JSON.stringify(wire.body)});if(!response.ok)return {status:'failed',http:response.status};const stream=await new Response(q.normalizeStream(response.body,wire.protocol)).text(),events=stream.split('\n').filter(l=>l.startsWith('data: {')).map(l=>JSON.parse(l.slice(6))),answer=events.map(e=>e.choices?.[0]?.delta?.content||'').join(''),complete=stream.includes('data: [DONE]')&&!events.some(e=>e.error)&&events.some(e=>e.choices?.[0]?.finish_reason==='stop'),hits={drink:answer.includes('热水'),plan:answer.includes('周末'),marker:answer.includes('砂雨-'+(700+index))};return {status:complete&&Object.values(hits).every(Boolean)?'passed':'failed',answer,hits,complete,originalHistoryCount:state.threads[thread].length,sentHistoryCount:0,scope:'Cold prompt uses persisted per-role memory and summary, no original chat sent; original DB history preserved.'};},{index:card.index});run.coldRecall=cold;fs.appendFileSync(path.join(resultsDir,'cold-recall.jsonl'),JSON.stringify({provider,index:card.index,...cold})+'\n');}
   const state=await snapshot(page);run.memory=state.memories.filter(m=>m.scope==='card-'+card.index);run.originalHistoryCount=state.threads['card-'+card.index].length;
   const backup=await page.evaluate(async()=>Array.from(await window.CardsQA.makeBackup('personal-device',(await window.CardsQA.readLocal('personal-device')).state)));fs.writeFileSync(path.join(resultsDir,`backup-${provider}-${workerIndex}.zip`),Buffer.from(backup));
   fs.writeFileSync(path.join(resultsDir,'progress.json'),JSON.stringify({runs,requests:traces.length,reservedUpperBound,tokenLimit,maxConcurrent,pageErrors},null,2));console.log(JSON.stringify({provider,card:card.index,completedTurns:run.turns.length,failed:run.turns.filter(t=>t.status!=='passed').length}));
  }
 }finally{await context.close();}
}
try{const jobs=await Promise.allSettled(selectedProviders.flatMap(provider=>[0,1,2].map(i=>worker(provider,i))));const failures=jobs.flatMap((r,i)=>r.status==='rejected'?[{worker:i,error:clean(r.reason?.message)}]:[]),generations=traces.filter(t=>t.kind==='generation'),cache={};
 for(const provider of ['deepseek','openrouter']){const measured=generations.filter(t=>t.provider===provider&&typeof (t.usage?.prompt_cache_hit_tokens??t.usage?.prompt_tokens_details?.cached_tokens)==='number'),prompt=measured.reduce((n,t)=>n+t.usage.prompt_tokens,0),hit=measured.reduce((n,t)=>n+(t.usage.prompt_cache_hit_tokens??t.usage.prompt_tokens_details.cached_tokens),0);cache[provider]={measuredRequests:measured.length,totalRequests:generations.filter(t=>t.provider===provider).length,promptTokens:prompt,hitTokens:hit,tokenWeightedHitRate:prompt?hit/prompt:null};}
 const report={sourceRepository:source.repository,sourceTreeSHA:source.treeSHA,cardFiles:cards.length,uniqueCardContents:new Set(cards.map(c=>c.sha256)).size,models,turnsPerCard:24,runs,failures,pageErrors,cache,reportedTokens:generations.reduce((n,t)=>n+(t.usage?.total_tokens||0),0),reservedUpperBound,tokenLimit,maxConcurrent,scope:`Actual production React UI and IndexedDB, ${selectedProviders.length*3} isolated desktop device contexts, three concurrent device workers per selected provider. Proxy forwards real SSE without replacing model content; real secrets remain only in Node process. Card original bytes imported through actual parseCharacter and retained as attachments. Desktop UI timing includes network; not Android FPS. Raw transcripts retained; subjective persona quality needs evidence review, not an automatic overall pass.`};fs.writeFileSync(path.join(resultsDir,'results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({completedCards:runs.length,failures,cache,reportedTokens:report.reportedTokens,reservedUpperBound}));if(failures.length||pageErrors.length||runs.length!==cards.length*selectedProviders.length||runs.some(r=>r.turns.length!==24||r.turns.some(t=>t.status!=='passed')||r.coldRecall?.status!=='passed'))process.exitCode=1;
}finally{await browser.close();await new Promise(r=>server.close(r));}
