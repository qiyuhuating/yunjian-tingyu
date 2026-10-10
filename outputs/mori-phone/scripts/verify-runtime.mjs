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
const {readChatStream}=load('ai-stream'),{assembleChatMessages}=load('ai-messages');
const {freshState,samplingSchema}=load('phone-model'),{chatInput,normalizeStream}=load('provider-adapter');
const encoder=new TextEncoder(),checks=[];
async function check(name,fn){await fn();checks.push(name);}
function stream(parts){
 const body=new ReadableStream({start(c){for(const part of parts)c.enqueue(encoder.encode(part));c.close();}});
 return new Response(body,{headers:{'content-type':'text/event-stream'}});
}
const piece=(v)=>'data: '+JSON.stringify(v)+'\n\n';
const done='data: [DONE]\n\n';
const delta=s=>({choices:[{delta:{content:s},finish_reason:null}]});
const read=(parts,opts={})=>readChatStream(stream(parts),{started:performance.now(),...opts});
await check('Fragmented SSE UTF-8 and CRLF boundaries survive',async()=>{
 const raw=(piece(delta('你好🌧️'))+piece({choices:[{delta:{},finish_reason:'stop'}]})+done).replace(/\n/g,'\r\n');
 const chunks=[];const bytes=encoder.encode(raw);for(const b of bytes)chunks.push(new Uint8Array([b]));
 const response=new Response(new ReadableStream({start(c){chunks.forEach(x=>c.enqueue(x));c.close();}}));
 let calls=0;const r=await readChatStream(response,{started:performance.now(),onDelta:()=>calls++});
 assert.equal(r.answer,'你好🌧️');assert.equal(r.finishReason,'stop');assert.equal(calls,1);
});
await check('Multi-line data: events decode as one payload',async()=>{
 const a='data: {"choices":\ndata: [{"delta":{"content":"OK"},"finish_reason":"stop"}]}\n\n'+done;
 const r=await read([a.slice(0,22),a.slice(22)]);
 assert.equal(r.answer,'OK');assert.equal(r.finishReason,'stop');
});
await check('SSE usage survives completion and never becomes displayed text',async()=>{
 const r=await read([piece(delta('answer')),piece({usage:{prompt_tokens:70,completion_tokens:2}}),done]);
 assert.equal(r.answer,'answer');assert.equal(r.usage.prompt,70);assert.equal(r.usage.completion,2);
});
await check('A disconnected stream cannot report success',async()=>{
 await assert.rejects(read([piece(delta('partial'))]),/中断/);
});
await check('A stream declaring finish_reason without DONE is not complete',async()=>{
 await assert.rejects(read([piece({choices:[{delta:{content:'draft'},finish_reason:'stop'}]})]),/中断/);
});
await check('Malformed and upstream error frames cannot be completed',async()=>{
 await assert.rejects(read(['data: {broken}\n\n',done]),/无法读取/);
 await assert.rejects(read([piece({error:{message:'模拟限流'}}),done]),/模拟限流/);
});
await check('Media cannot enter non-media operations',async()=>{
 await assert.rejects(read([piece({media:[{mime:'image/png',data:'YWJjZA=='}]}),done]),/不接收媒体/);
});
await check('Oversized text is bounded before commit',async()=>{
 await assert.rejects(read([piece(delta('A'.repeat(18001))),done]),/太长/);
});
await check('Abort before response consumption is honored',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(read([piece(delta('no')),done],{signal:controller.signal}),e=>e.name==='AbortError');
});
await check('Plain chat uses one real last user message and a single system envelope',async()=>{
 const state=freshState(),character=state.characters[0],thread=character.id;
 state.threads[thread]=[{id:'old-user',role:'user',kind:'text',timestamp:1,text:'旧的内容'},{id:'current-user',role:'user',kind:'text',timestamp:2,text:'只回答这次'}];
 const messages=await assembleChatMessages({ownerId:'fixture',state,character,thread,text:'只回答这次',mode:'chat',provider:'deepseek',model:'deepseek-flash',baseURL:'',vision:false});
 assert.equal(messages[0].role,'system');
 assert.equal(messages.at(-1).role,'user');
 assert.equal(messages.at(-1).content,'只回答这次');
 assert(!messages.some((m,i)=>i>0&&typeof m.content==='string'&&/^\[应用运行配置\]|^\[本轮补充背景/.test(m.content)));
 assert.equal(messages[0].content,state.coreSystemPrompt);
 assert(messages.some((m,i)=>i>0&&typeof m.content==='string'&&m.content.startsWith('[应用参考资料')&&m.content.includes(character.name)));
 chatInput.parse({provider:'deepseek',model:'deepseek-flash',apiKey:'fixture-only-key',baseURL:'',sampling:samplingSchema.parse({}),messages});
});
await check('Group chat preserves other-speaker identity but not fabricated user turn',async()=>{
 const state=freshState(),a=state.characters[0],b=state.characters[1],thread='group-fixture';
 state.groups.push({id:thread,name:'测试群',members:[a.id,b.id]});
 state.threads[thread]=[{id:'assistant-b',role:'assistant',kind:'text',timestamp:1,text:'B说的话',sender:b.name,senderId:b.id},{id:'user-new',role:'user',kind:'text',timestamp:2,text:'@'+a.name+' 你好'}];
 const messages=await assembleChatMessages({ownerId:'fixture',state,character:a,thread,text:'@'+a.name+' 你好',mode:'group',provider:'deepseek',model:'deepseek-flash',baseURL:'',vision:false});
 assert(messages.some(m=>m.role==='user'&&typeof m.content==='string'&&m.content.includes('B说的话')));
 assert.equal(messages.at(-1).content,'@'+a.name+' 你好');
});
await check('A repeated group question is not skipped when another member spoke last',async()=>{
 const state=freshState(),a=state.characters[0],b=state.characters[1],thread='group-repeat';
 state.groups.push({id:thread,name:'测试群',members:[a.id,b.id]});
 state.threads[thread]=[{id:'user-1',role:'user',kind:'text',timestamp:1,text:'再解释一下'},{id:'assistant-b',role:'assistant',kind:'text',timestamp:2,text:'我刚说过',sender:b.name,senderId:b.id}];
 const messages=await assembleChatMessages({ownerId:'fixture',state,character:a,thread,text:'再解释一下',mode:'group',provider:'deepseek',model:'deepseek-flash',baseURL:'',vision:false});
 assert.equal(messages.at(-1).role,'user');
 assert.equal(messages.at(-1).content,'再解释一下');
});
await check('OpenAI truncated upstream after finish_reason must never synthesize DONE',async()=>{
 const raw=stream([piece(delta('partial')),piece({choices:[{delta:{},finish_reason:'stop'}]})]);
 const normalized=new Response(normalizeStream(raw.body,'openai'));
 await assert.rejects(readChatStream(normalized,{started:performance.now()}),/中断/);
});
await check('Anthropic message_stop is an explicit terminal event',async()=>{
 const raw=stream(['data: '+JSON.stringify({type:'content_block_delta',delta:{type:'text_delta',text:'ok'}})+'\n\n','data: {"type":"message_stop"}\n\n']);
 const normalized=new Response(normalizeStream(raw.body,'anthropic'));
 assert.equal((await readChatStream(normalized,{started:performance.now()})).answer,'ok');
});
await check('Causal user anchor blocks future queued messages and preserves peer evidence',async()=>{
 const state=freshState(),a=state.characters[0],b=state.characters[1],thread='causal-test';
 state.groups.push({id:thread,name:'测试',members:[a.id,b.id]});
 state.threads[thread]=[
  {id:'A',role:'user',kind:'text',timestamp:1,text:'第一条问题'},
  {id:'B',role:'user',kind:'text',timestamp:2,text:'未来的秘密'},
  {id:'peer',role:'assistant',kind:'text',timestamp:3,text:'已经核验过',sender:b.name,senderId:b.id,turnId:'A'}];
 const args={ownerId:'fixture',state,character:a,thread,text:'第一条问题',mode:'group',provider:'deepseek',model:'deepseek-flash',baseURL:'',vision:false,causalUserId:'A'};
 const items=await assembleChatMessages(args);
 const joined=items.map(m=>typeof m.content==='string'?m.content:'').join('\n');
 assert(!joined.includes('未来的秘密'));
 assert(joined.includes('已经核验过'));
 assert.equal(items.filter(m=>m.role==='user'&&m.content==='第一条问题').length,1);
 assert.equal(items.at(-1).content,'第一条问题');
 await assert.rejects(assembleChatMessages({...args,text:'修改后的第一条'}),/修改|不存在/);
});
await check('No hidden automatic retry remains in the chat turn',()=>{
 const source=fs.readFileSync(path.join(root,'app/chat.tsx'),'utf8');
 assert.equal((source.match(/await p\.requestAI\(/g)||[]).length,0);
 const executor=fs.readFileSync(path.join(root,'lib/turn-execution.ts'),'utf8');
 assert.equal((executor.match(/await p\.requestAI\(/g)||[]).length,1);
 assert(!source.includes('[格式修正：'));
 assert(!source.includes('[请重写：'));
});
await check('Failed backup commits never delete assets referenced by older records',()=>{
 const source=fs.readFileSync(path.join(root,'app/phone.tsx'),'utf8');
 assert(!/catch\(e\)\{[^{}]*removeAssets/.test(source));
 assert(!source.includes('removeAssets(ownerId,assetReferences(restored)'));
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
