import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),native=createRequire(path.join(root,'package.json')),loaded=new Map();
function load(name){
 if(loaded.has(name))return loaded.get(name);
 const module={exports:{}};loaded.set(name,module.exports);
 const code=ts.transpileModule(fs.readFileSync(path.join(root,'lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(id=>id.startsWith('./')?load(id.slice(2)):native(id),module,module.exports);
 loaded.set(name,module.exports);return module.exports;
}
const {freshState,stateSchema}=load('phone-model'),{executeTurn,PendingTurnQueue}=load('turn-execution');
const {receiptFor,remainingSpeakers,markInterrupted,manualRetryRequiresConfirmation}=load('turn-receipts');
const checks=[];async function check(name,fn){await fn();checks.push(name);}
function harness({group=false,answer='收到',onRequest=undefined,onUpload=undefined,onCommit=undefined}={}){
 let state=freshState();const speaker=state.characters[0],other=state.characters[1],thread=group?'test-group':speaker.id;
 if(group){state.groups.push({id:thread,name:'群聊',members:[speaker.id,other.id]});state.groupSettings.cadence='fast';state.groupSettings.maxResponders=2;}
 state.threads[thread]=[{id:'turn-1',role:'user',kind:'text',timestamp:1,text:'今天好吗',failed:true}];
 let calls=0,commits=0;const remaining=[];
 const signal=new AbortController();
 const commit=async change=>{
  if(onCommit)await onCommit(commits);
  const draft=structuredClone(state);change(draft);state=draft;commits++;
 };
 const services={
  snapshot:()=>state,commit,signal:signal.signal,
  requestAI:async(text,id,t,mode,delta,abort,media)=>{
   calls++;
   if(onRequest)return onRequest({calls,text,id,t,mode,delta,abort,media});
   if(group)return '<cloudlet-messages>["'+answer+'"]</cloudlet-messages>';
   return answer;
  },
  upload:async f=>onUpload?onUpload(f):({url:'local:00000000-0000-0000-0000-000000000000',id:'x',mime:f.type,size:f.size,name:f.name}),
  deliverMedia:async()=>{},
  onRemaining:r=>remaining.push([...r]),
  isVisible:()=>true
 };
 return {services,signal,thread,speaker,other,remaining,get state(){return state;},get calls(){return calls;},get commits(){return commits;}};
}
await check('Turn queue deduplicates IDs but not intentionally repeated text',()=>{
 const q=new PendingTurnQueue();
 q.enqueue({id:'one',thread:'a',text:'同一段文字'});
 q.enqueue({id:'one',thread:'a',text:'不能双重发送'});
 q.enqueue({id:'two',thread:'b',text:'同一段文字'});
 q.enqueue({id:'three',thread:'a',text:'同一段文字'});
 assert.equal(q.count(),3);assert(q.has('two'));
 assert.equal(q.take('a',()=>true).id,'one');assert.equal(q.take('a',()=>true).id,'three');
 assert.equal(q.take('b',()=>true).id,'two');assert.equal(q.take('a',()=>true),null);
});
await check('Queue prunes removed, saved and no-longer-failed messages',()=>{
 const q=new PendingTurnQueue();q.enqueue({id:'done',thread:'a',text:'x'});q.enqueue({id:'pending',thread:'b',text:'y'});
 const taken=q.take('b',x=>x.id==='pending');
 assert.equal(taken.id,'pending');assert(!q.has('done'));assert.equal(q.count(),0);
});
await check('One-to-one turn persists exactly one reply and one affection increment',async()=>{
 const h=harness(),old=h.state.characters[0].affection;
 const result=await executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services);
 assert.deepEqual(result,[h.speaker.id]);assert.equal(h.calls,1);
 assert.equal(h.state.threads[h.thread].filter(m=>m.role==='assistant').length,1);
 assert.equal(h.state.threads[h.thread][0].failed,false);
 assert.equal(h.state.threads[h.thread].find(m=>m.role==='assistant').turnId,'turn-1');
 assert.equal(h.state.characters[0].affection,Math.min(100,old+1));
});
await check('A saved reply may not be charged for again',async()=>{
 const h=harness();await executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services);
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services),/已回复|已经结束/);
 assert.equal(h.calls,1);
});
await check('Missing user record never generates orphaned assistant messages',async()=>{
 const h=harness();await assert.rejects(executeTurn({thread:h.thread,userId:'wrong',text:'你好',mode:'chat'},h.services),/不存在/);assert.equal(h.calls,0);
});
await check('Edited user message must not invoke a stale paid request',async()=>{
 const h=harness();h.state.threads[h.thread][0].text='被编辑的内容';
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services),/已修改/);
 assert.equal(h.calls,0);
});
await check('Deleted single-chat character must not silently fall back to another actor',async()=>{
 const h=harness();h.state.characters.splice(0,1);
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services),/角色已不存在/);
 assert.equal(h.calls,0);
});
await check('Speaker bubbles commit atomically rather than one write per bubble',async()=>{
 const h=harness({group:true,answer:'一条'});const result=await executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'group'},h.services);
 assert.equal(h.calls,2);assert.equal(result.length,2);assert.equal(h.commits,5);
 assert.equal(h.state.threads[h.thread].filter(m=>m.role==='assistant').length,2);
});
await check('A failed second group speaker retains first speaker and safe resume cursor',async()=>{
 const h=harness({group:true,onRequest:({calls})=>calls===1?'<cloudlet-messages>["首位成功"]</cloudlet-messages>':Promise.reject(new Error('服务器中断'))});
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'group'},h.services),/服务器中断/);
 assert.equal(h.calls,2);assert.equal(h.state.threads[h.thread].filter(m=>m.role==='assistant').length,1);
 assert.deepEqual(h.remaining.at(-1),[h.other.id]);
});
await check('On persist failure one speaker cannot leave partial bubbles',async()=>{
 const h=harness({group:true,answer:'你好',onCommit:()=>Promise.reject(new Error('disk full'))});
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'group'},h.services),/disk full/);
 assert.equal(h.state.threads[h.thread].filter(m=>m.role==='assistant').length,0);
 assert.equal(h.state.threads[h.thread][0].failed,true);
});
await check('Media upload failure is shown but never resends already committed text',async()=>{
 const h=harness({onRequest:({media})=>{media(new File(['x'],'a.png',{type:'image/png'}));return '文字已生成';},onUpload:()=>Promise.reject(new Error('磁盘空间不足'))});
 await executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services);
 const messages=h.state.threads[h.thread];
 assert.equal(h.calls,1);assert.equal(messages.filter(m=>m.role==='assistant').length,1);
 assert.equal(messages.filter(m=>m.kind==='notice').length,1);
 assert.equal(messages[0].failed,false);
});
await check('Invalid stale group member plan stops before API call',async()=>{
 const h=harness({group:true});
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'group',speakers:['deleted-role']},h.services),/群成员已变化/);
 assert.equal(h.calls,0);
});
await check('Cancelled group turn never charges an API request',async()=>{
 const h=harness({group:true});h.signal.abort();
 await assert.rejects(executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'group'},h.services),e=>e.name==='AbortError');
 assert.equal(h.calls,0);
});
await check('Visible chat routes turn execution exclusively through testable module',()=>{
 const source=fs.readFileSync(path.join(root,'app/chat.tsx'),'utf8');
 assert(source.includes('await executeTurn('));
 assert(!source.includes('await p.requestAI('));
 assert(source.includes('queued.current.enqueue('));
 assert(source.includes('queued.current.take('));
});
await check('Composer is cleared only after user message persistence resolves',()=>{
 const source=fs.readFileSync(path.join(root,'app/chat.tsx'),'utf8');
 const start=source.indexOf(' const send=async(event?:React.FormEvent)=>{'),end=source.indexOf(' const sendFiles=',start);
 const section=source.slice(start,end);
 assert(start>=0&&end>start);
 assert(section.indexOf('await commit(')<section.indexOf("setInput('');"));
});

await check('A successful text turn persists media work and a result receipt without a second AI call',async()=>{
 const h=harness();const media=load('media-outbox');
 h.services.requestAI=async()=> '回复已保存\n<cloudlet-media>[{"type":"sticker","id":"sticker-id"}]</cloudlet-media>';
 h.services.deliverMedia=async(commands,speaker,thread,signal,id,attempt)=>{
  assert.equal(commands.length,1);assert.equal(commands[0].type,'sticker');
  await h.services.commit(state=>{
   media.assertMediaDelivery(state,id,attempt,thread,speaker);
   const outputId='output-sticker-1';
   media.completeMediaDelivery(state,id,attempt,outputId);
   (state.threads[thread]??=[]).push({id:outputId,role:'assistant',kind:'image',text:'',timestamp:3,senderId:speaker,turnId:'turn-1'});
  });
 };
 await executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services);
 const job=h.state.mediaOutbox[0];
 assert.equal(job.phase,'completed');assert.equal(job.outputId,'output-sticker-1');
 assert.equal(job.userId,'turn-1');
 assert.equal(h.state.threads[h.thread][0].failed,false);
 assert.equal(h.state.threads[h.thread].filter(m=>m.role==='assistant').length,2);
});
await check('A failed media side effect retains finished text and a recoverable receipt',async()=>{
 const h=harness(),media=load('media-outbox');
 h.services.requestAI=async()=> '文字完成\n<cloudlet-media>[{"type":"image","prompt":"一片云"}]</cloudlet-media>';
 h.services.deliverMedia=async()=>{throw new Error('media provider offline');};
 await executeTurn({thread:h.thread,userId:'turn-1',text:'今天好吗',mode:'chat'},h.services);
 const job=h.state.mediaOutbox[0];
 assert.equal(job.phase,'needs_review');
 assert.equal(h.state.threads[h.thread][0].failed,false);
 assert.equal(h.state.threads[h.thread].filter(m=>m.role==='assistant'&&m.kind==='text').length,1);
 assert.equal(h.state.threads[h.thread].filter(m=>m.role==='system'&&m.text.includes('媒体未发送')).length,1);
 assert.throws(()=>media.beginMediaDelivery(h.state,job.id),/用户确认/);
 assert.equal(media.beginMediaDelivery(h.state,job.id,true),2);
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
