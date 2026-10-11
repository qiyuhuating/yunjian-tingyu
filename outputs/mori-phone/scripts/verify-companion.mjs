import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import assert from 'node:assert/strict';import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),native=createRequire(path.join(root,'package.json')),loaded=new Map();
function load(file){if(loaded.has(file))return loaded.get(file);const m={exports:{}};loaded.set(file,m.exports);new Function('require','module','exports',ts.transpileModule(fs.readFileSync(path.join(root,'lib',file+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(name=>name.startsWith('./')?load(name.slice(2)):native(name),m,m.exports);return m.exports;}
const {characterConnection,characterKeySlot}=load('character-ai');
const {freshState,stateSchema}=load('phone-model'),{memoryTask,applyMemoryResult}=load('character-memory'),{recallMemories,validMemorySource}=load('continuity'),{buildPrompt}=load('chat-prompt'),{CORE_SYSTEM_PROMPT}=load('system-prompt'),{groupSpeakers,parseGroupReply}=load('group-chat'),{groupDelay,waitForReply}=load('group-cadence');const checks=[];
async function check(name,run){await run();checks.push(name);}
function fixture(){const s=freshState();s.memorySettings.extractEvery=1;s.threads[s.primary]=[{id:'user-fact',role:'user',text:'我喜欢喝不加糖的奶茶，讲数学时请先给例子。',kind:'text',timestamp:1}];return s;}
function proposal(task,changes={}){return JSON.stringify([{key:'饮食.甜度',category:'preference',text:'用户喜欢无糖奶茶',sourceId:task.sources[0].id,quote:'我喜欢喝不加糖的奶茶',...changes}]);}
await check('旧备份补齐设置且不修改已保存的系统提示词',()=>{const s=fixture();delete s.groupSettings;delete s.memoryCursors;delete s.memorySettings.autoExtract;delete s.memorySettings.extractEvery;s.coreSystemPrompt='我保存的核心';const parsed=stateSchema.parse(s);assert.equal(parsed.coreSystemPrompt,'我保存的核心');assert.equal(parsed.groupSettings.cadence,'natural');assert(parsed.memorySettings.autoExtract);});
await check('自动记忆有角色归属、原话证据与持久化游标',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);applyMemoryResult(s,task,proposal(task));const m=s.memories.at(-1);assert.equal(m.scope,s.primary);assert.equal(m.origin,'auto');assert.equal(m.evidence,'我喜欢喝不加糖的奶茶');assert(m.text.includes(m.evidence));assert.equal(memoryTask(s,s.primary,s.primary),null);assert(stateSchema.safeParse(s).success);});
await check('新自动记忆绑定完整来源字节，局部编辑保留引文也会失效',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);applyMemoryResult(s,task,proposal(task));const m=s.memories.at(-1);assert.match(m.sourceDigest,/^[0-9a-f]{64}$/);assert(validMemorySource(s,m));const source=s.threads[s.primary][0];source.text='我现在不喜欢喝不加糖的奶茶，讲数学时请先给例子。';assert(source.text.includes(m.evidence));assert(!validMemorySource(s,m));assert(!recallMemories(s,s.primary,'奶茶').includes('用户明确说过'));});
await check('编造来源、非逐字证据和密钥记忆被拒绝',()=>{for(const changes of [{sourceId:'missing'},{quote:'我爱吃甜糖'},{text:'api key sk-secret123456'}]){const s=fixture(),task=memoryTask(s,s.primary,s.primary),before=JSON.stringify(s);assert.throws(()=>applyMemoryResult(s,task,proposal(task,changes)));assert.equal(JSON.stringify(s),before);}});
await check('模型概括错误不会替换原话为反向偏好',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);applyMemoryResult(s,task,proposal(task,{text:'用户喜欢很多糖'}));assert.equal(s.memories.at(-1).text,'用户明确说过：我喜欢喝不加糖的奶茶');});
await check('不同角色不会读到别人的私有记忆',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);applyMemoryResult(s,task,proposal(task));assert(recallMemories(s,s.primary,'奶茶').includes('不加糖'));assert(!recallMemories(s,s.characters[1].id,'奶茶').includes('不加糖'));assert(!memoryTask(s,s.characters[1].id,s.characters[1].id));});
await check('用户编辑和手动记忆不被自动整理覆盖',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);s.memories.push({id:'locked',text:'我现在喜欢三分糖',scope:s.primary,date:'2026-10-07',key:'饮食.甜度',origin:'manual',locked:true,revisions:[]});assert.throws(()=>applyMemoryResult(s,task,proposal(task,{replaces:'locked'})),/记忆已被更新/);assert.equal(s.memories.at(-1).text,'我现在喜欢三分糖');});
await check('明确更正保存旧版本并使用最新原话',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);applyMemoryResult(s,task,proposal(task));const old=s.memories.at(-1),oldText=old.text;s.threads[s.primary].push({id:'correction',role:'user',text:'更正一下，现在我喜欢三分糖的奶茶。',kind:'text',timestamp:2});const next=memoryTask(s,s.primary,s.primary);applyMemoryResult(s,next,proposal(next,{quote:'现在我喜欢三分糖的奶茶',replaces:old.id}));const updated=s.memories.find(m=>m.id===old.id);assert.equal(updated.revisions[0].text,oldText);assert(updated.text.includes('三分糖'));});
await check('来源删除或内容改变时不提交陈旧记忆',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);s.threads[s.primary][0].text='这句话已经修改';assert.throws(()=>applyMemoryResult(s,task,proposal(task)));assert(!s.memoryCursors[s.primary]);});
await check('满库不静默丢弃旧记忆',()=>{const s=fixture();s.memories=Array.from({length:300},(_,i)=>({id:'m'+i,text:'手动'+i,scope:s.primary,date:'2026-10-07',origin:'manual',locked:true,revisions:[]}));const task=memoryTask(s,s.primary,s.primary);assert.throws(()=>applyMemoryResult(s,task,proposal(task)));assert.equal(s.memories.length,300);});
await check('群聊自然延迟有界、快速模式可关闭且可取消',async()=>{const s=fixture(),delay=groupDelay(s.groupSettings,1,100,false,()=>.5);assert(delay>=900&&delay<=4050);assert.equal(groupDelay({cadence:'fast'},1,100),0);const ctl=new AbortController(),wait=waitForReply(10000,ctl.signal);ctl.abort();await assert.rejects(wait,e=>e.name==='AbortError');await waitForReply(0,new AbortController().signal);const stopped=new AbortController();stopped.abort();await assert.rejects(waitForReply(5,stopped.signal));});
await check('引用优先接话并尊重普通响应人数',()=>{const s=fixture(),g=s.groups[0];s.groupSettings.maxResponders=1;s.threads[g.id]=[{id:'quote-target',role:'assistant',senderId:g.members[2],text:'嗯',kind:'text',timestamp:1},{id:'reply',role:'user',replyTo:'quote-target',text:'具体说说',kind:'text',timestamp:2}];assert.deepEqual(groupSpeakers(s,g.id,'具体说说'),[g.members[2]]);delete s.threads[g.id][1].replyTo;assert.equal(groupSpeakers(s,g.id,'好').length,1);assert.equal(groupSpeakers(s,g.id,'@所有人').length,g.members.length);});
await check('无需凑回复，但首位回应不能静默',()=>{assert.deepEqual(parseGroupReply('<cloudlet-messages>[]</cloudlet-messages>',true),[]);assert.throws(()=>parseGroupReply('<cloudlet-messages>[]</cloudlet-messages>'));});
await check('群聊保留实际多行代码与数学，依旧拒绝旁白',()=>{const code='const sum = (a,b) => {\n /*中文说明*/\n return a+b;\n};'+('\n// 保留完整实现细节').repeat(120);assert.deepEqual(parseGroupReply('<cloudlet-messages>'+JSON.stringify([code])+'</cloudlet-messages>'),[code]);assert.throws(()=>parseGroupReply('旁白：雨落在窗边'));assert.throws(()=>parseGroupReply('<b>环境旁白</b>'));});
await check('语言与能力预设不污染核心，最近原话保留',()=>{const s=fixture();const p=buildPrompt(s,s.characters[0],s.primary,'please explain this','chat');assert.equal(p.system,CORE_SYSTEM_PROMPT);const config=JSON.parse(p.context);assert(config.capabilities.language.includes('当前语言'));assert(config.capabilities.programming.includes('实际可用代码'));assert(config.capabilities.mathematics.includes('推导'));assert(config.capabilities.art.includes('HTML/CSS'));assert(p.history.some(m=>m.id==='user-fact'));});
await check('跨会话的历史补提取不会将新偏好回退成旧偏好',()=>{const s=fixture(),task=memoryTask(s,s.primary,s.primary);s.threads[s.primary][0].timestamp=200;task.sources[0].timestamp=200;applyMemoryResult(s,task,proposal(task));const saved=s.memories.at(-1);s.threads[s.groups[0].id]=[{id:'older',role:'user',text:'以前我喜欢加糖的奶茶',kind:'text',timestamp:100}];const old=memoryTask(s,s.primary,s.groups[0].id);applyMemoryResult(s,old,proposal(old,{quote:'以前我喜欢加糖的奶茶',replaces:saved.id}));assert(saved.text.includes('不加糖'));assert.equal(saved.sourceAt,200);});
await check('角色不能对其他角色的私聊建立独立提取任务',()=>{const s=fixture();assert.equal(memoryTask(s,s.characters[1].id,s.primary),null);});

await check('旧角色不设独立连接，仍继承原全局服务商且保持旧备份兼容',()=>{
 const state=freshState(),character=state.characters[0],routing=characterConnection(state,character);
 assert.equal(routing.provider,state.provider);assert.equal(routing.model,state.model);assert.equal(routing.keySlot,state.provider);assert.equal(routing.inherited,true);assert(stateSchema.safeParse(state).success);
});
await check('不同角色在同一个群各自选择 OpenAI 和 OpenRouter 模型',()=>{
 const state=freshState(),one=state.characters[0],two=state.characters[1];
 one.aiConnection={provider:'openai',model:'gpt-4.1-mini',baseURL:'',vision:true,keyScope:'provider'};
 two.aiConnection={provider:'openrouter',model:'google/gemini-2.5-flash',baseURL:'',vision:false,keyScope:'character'};
 const a=characterConnection(state,one),b=characterConnection(state,two);
 assert.equal(a.provider,'openai');assert.equal(a.keySlot,'openai');assert.equal(a.model,'gpt-4.1-mini');assert.equal(a.vision,true);
 assert.equal(b.provider,'openrouter');assert.equal(b.keySlot,characterKeySlot(two.id,'openrouter'));assert.equal(b.keyScope,'character');
 assert.equal(state.provider,'deepseek');assert(stateSchema.safeParse(state).success);
 const planA=buildPrompt({...state,provider:a.provider,model:a.model,baseURL:a.baseURL,vision:a.vision},one,state.groups[0].id,'你好','group');
 assert.equal(planA.system,state.coreSystemPrompt);assert(!planA.context.includes('sk-'));
});
await check('自定义角色连接绝不复用其他自定义地址的全局密钥',()=>{
 const state=freshState(),one=state.characters[0];state.provider='compatible';state.model='global-model';state.baseURL='https://global.example/v1';
 one.aiConnection={provider:'compatible',model:'local-model',baseURL:'https://role.example/v1',vision:false,keyScope:'provider'};
 const route=characterConnection(state,one);
 assert.equal(route.provider,'compatible');assert.equal(route.baseURL,'https://role.example/v1');
 assert.equal(route.keySlot,characterKeySlot(one.id,'compatible','https://role.example/v1'));assert.equal(route.keyScope,'character');
 assert.notEqual(route.keySlot,state.provider);
});
await check('测试全局连接能够显式绕过角色专用模型',()=>{
 const state=freshState(),one=state.characters[0];one.aiConnection={provider:'gemini',model:'gemini-2.5-flash',baseURL:'',vision:true,keyScope:'character'};
 assert.equal(characterConnection(state,one).provider,'gemini');
 const normal=characterConnection(state,one,true);assert.equal(normal.provider,state.provider);assert.equal(normal.keySlot,state.provider);
});
await check('修改角色 AI 配置不改变聊天、角色记忆、世界书和系统提示词',()=>{
 const state=freshState(),baseline=JSON.stringify({threads:state.threads,memories:state.memories,lore:state.lore,coreSystemPrompt:state.coreSystemPrompt});
 state.characters[0].aiConnection={provider:'gemini',model:'gemini-2.5-flash',baseURL:'',vision:true,keyScope:'provider'};
 const restored=stateSchema.parse(state);
 assert.equal(JSON.stringify({threads:restored.threads,memories:restored.memories,lore:restored.lore,coreSystemPrompt:restored.coreSystemPrompt}),baseline);
});

console.log(JSON.stringify({passed:checks.length,checks},null,2));

