import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import ts from 'typescript';
const root=path.resolve(import.meta.dirname,'..'),native=createRequire(path.join(root,'package.json')),loaded=new Map();
function load(name){if(loaded.has(name))return loaded.get(name);const m={exports:{}};loaded.set(name,m.exports);const code=ts.transpileModule(fs.readFileSync(path.join(root,'lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('require','module','exports',code)(id=>id.startsWith('./')?load(id.slice(2)):native(id),m,m.exports);loaded.set(name,m.exports);return m.exports;}
const {freshState,stateSchema}=load('phone-model'),w=load('agent-workspace'),a=load('agent-orchestrator');
const checks=[],check=async(name,fn)=>{await fn();checks.push(name);};
const fixture=()=>{const state=freshState(),thread='review-room',speakers=state.characters.slice(0,2).map(c=>c.id);state.groups.push({id:thread,name:'文档审阅组',members:speakers});w.putWorkspace(state,{thread,path:'imports/sample.ts',content:'export const sum=(a,b)=>a+b;'},null);return {state,thread,speakers};};
await check('Reject traversal, absolute and .git workspace paths',()=>{const f=()=>({workspaceFiles:[]});for(const p of ['../x','/private/a','a/../../b','repo/.git/config','x//y'])assert.throws(()=>w.putWorkspace(f(),{thread:'t',path:p,content:'x'},null),/路径/);});
await check('Writes require explicit approval and exact revision',()=>{const f=fixture();assert.throws(()=>w.executeWorkspaceTool(f.state,{tool:'workspace.write',thread:f.thread,path:'imports/sample.ts',content:'changed',expectedRevision:1},{thread:f.thread,write:false}),/授权/);assert.throws(()=>w.putWorkspace(f.state,{thread:f.thread,path:'imports/sample.ts',content:'bad'},0),/已更新/);const x=w.putWorkspace(f.state,{thread:f.thread,path:'imports/sample.ts',content:'updated'},1);assert.equal(x.revision,2);});
await check('Multi-file edits commit together or leave all previous revisions unchanged',()=>{
 const f=fixture();
 const first=w.putWorkspace(f.state,{thread:f.thread,path:'lib/a.ts',content:'export const a=1'},null);
 const before=structuredClone(f.state.workspaceFiles);
 assert.throws(()=>w.executeWorkspaceTool(f.state,{
  tool:'workspace.batch',thread:f.thread,edits:[
   {path:'lib/a.ts',content:'export const a=2',expectedRevision:first.revision},
   {path:'imports/sample.ts',content:'stale',expectedRevision:99}
  ]},{thread:f.thread,write:true}),/已更新/);
 assert.deepEqual(f.state.workspaceFiles,before);
 assert.throws(()=>w.executeWorkspaceTool(f.state,{tool:'workspace.batch',thread:f.thread,edits:[
  {path:'lib/a.ts',content:'a',expectedRevision:1}
 ]},{thread:f.thread,write:false}),/授权/);
 assert.throws(()=>w.applyWorkspaceBatch(f.state,f.thread,[
  {path:'lib/a.ts',content:'a',expectedRevision:1},
  {path:'lib/a.ts',content:'b',expectedRevision:2}
 ]),/重复/);
 assert.deepEqual(f.state.workspaceFiles,before);
 const receipts=w.executeWorkspaceTool(f.state,{tool:'workspace.batch',thread:f.thread,edits:[
  {path:'lib/a.ts',content:'export const a=2',expectedRevision:first.revision},
  {path:'lib/b.ts',content:'export const b=3',expectedRevision:null}
 ]},{thread:f.thread,write:true});
 assert.equal(receipts.length,2);
 assert.equal(w.readWorkspace(f.state,f.thread,'lib/a.ts').revision,2);
 assert.equal(w.readWorkspace(f.state,f.thread,'lib/b.ts').revision,1);
 assert.deepEqual(w.searchWorkspace(f.state,'other','export const'),[]);
 assert.equal(w.executeWorkspaceTool(f.state,{tool:'workspace.search',thread:f.thread,query:'export const'},{thread:f.thread,write:false}).length,2+1);
});
await check('No access from another thread even with a valid file path',()=>{const f=fixture();assert.throws(()=>w.executeWorkspaceTool(f.state,{tool:'workspace.read',thread:f.thread,path:'imports/sample.ts'},{thread:'other',write:false}),/跨会话/);assert.equal(w.readWorkspace(f.state,'other','imports/sample.ts'),null);});
await check('Legacy state defaults to an empty workspace and agent log',()=>{const state=freshState(),old={...state};Reflect.deleteProperty(old,'workspaceFiles');Reflect.deleteProperty(old,'agentJobs');const restored=stateSchema.parse(old);assert.deepEqual(restored.workspaceFiles,[]);assert.deepEqual(restored.agentJobs,[]);});
await check('Real collaboration reads actual file and hands prior review to a second role',async()=>{
 const f=fixture(),calls=[];let state=f.state;
 const commit=async change=>{const copy=structuredClone(state);change(copy);state=copy;};
 a.planAgentReview(state,{jobId:'job-1',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 await a.executeAgentReview('job-1',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI:async(prompt,id,thread,mode)=>{
  calls.push({prompt,id,thread,mode});return id===f.speakers[0]?'建议验证类型':'需加上边界测试';
 }});
 assert.equal(calls.length,2);
 assert.deepEqual(calls.map(c=>c.id),f.speakers);
 assert(calls[0].prompt.includes('export const sum'));
 assert(calls[1].prompt.includes('建议验证类型'));
 assert.equal(state.agentJobs[0].status,'completed');
 assert(a.reportEvidence(state,'job-1',f.speakers[0]).valid);
 assert(a.reportEvidence(state,'job-1',f.speakers[1]).valid);
 assert.equal(state.threads[f.thread].filter(x=>x.role==='assistant').length,2);
 assert.equal(w.listWorkspace(state,f.thread).filter(x=>x.path.startsWith('reviews/')).length,2);
 await assert.rejects(a.executeAgentReview('job-1',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI:async()=>''}),/不能自动重复/);
});
await check('Unapproved file edits and shell execution are never tool capabilities',()=>{
 const f=fixture();assert.throws(()=>w.executeWorkspaceTool(f.state,{tool:'shell.execute',thread:f.thread},{thread:f.thread,write:true}),/不支持/);
});
await check('An uncertain model call is recorded rather than silently retried',async()=>{
 const f=fixture(),state=f.state;a.planAgentReview(state,{jobId:'job-error',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 const commit=async fn=>fn(state);
 await assert.rejects(a.executeAgentReview('job-error',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI:async()=>{throw new Error('provider timeout');}}),/provider timeout/);
 a.flagUncertainAgentJob(state,'job-error','provider timeout');
 assert.equal(state.agentJobs[0].status,'needs_review');
 await assert.rejects(a.executeAgentReview('job-error',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI:async()=>''}),/不能自动重复/);
});
await check('Deleted and edited automatic memory evidence is excluded, manual notes survive',()=>{
 const continuity=load('continuity'),f=fixture(),sourceId='evidence-1';
 f.state.threads[f.thread]=[{id:sourceId,role:'user',kind:'text',timestamp:500,text:'我确实喜欢测试'}];
 f.state.memories.push({id:'auto-evidence',text:'用户明确说过：我确实喜欢测试',scope:f.speakers[0],date:'2026-10-10',origin:'auto',locked:false,revisions:[],sourceThread:f.thread,sourceIds:[sourceId],sourceAt:500,evidence:'我确实喜欢测试'});
 f.state.memories.push({id:'manual-note',text:'手动保留的待确认资料',scope:f.speakers[0],date:'2026-10-10',origin:'manual',locked:true,revisions:[]});
 assert(continuity.recallMemories(f.state,f.speakers[0],'测试').includes('我确实喜欢测试'));
 f.state.threads[f.thread][0].text='原文已经编辑';
 assert(!continuity.recallMemories(f.state,f.speakers[0],'测试').includes('用户明确说过'));
 assert(continuity.recallMemories(f.state,f.speakers[0],'测试').includes('手动保留'));
});
await check('Resumed collaboration skips completed reviewers and includes saved evidence',async()=>{
 const f=fixture();let state=f.state;const calls=[];
 const commit=async fn=>{const copy=structuredClone(state);fn(copy);state=copy;};
 a.planAgentReview(state,{jobId:'resume-demo',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 const requestAI=async(prompt,id)=>{
  calls.push({prompt,id});
  if(calls.length===2)throw new Error('stream disconnected');
  return id===f.speakers[0]?'先审查函数输入':'建议加入断言';
 };
 await assert.rejects(a.executeAgentReview('resume-demo',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI}),/stream disconnected/);
 assert.equal(state.agentJobs[0].completed.length,1);
 assert.equal(state.agentJobs[0].status,'requesting');
 assert.equal(state.agentJobs[0].attempts,2);
 await commit(s=>a.flagUncertainAgentJob(s,'resume-demo','network disconnected'));
 await assert.rejects(a.executeAgentReview('resume-demo',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI}),/不能自动重复/);
 await commit(s=>a.authorizeAgentResume(s,'resume-demo'));
 await a.executeAgentReview('resume-demo',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI});
 assert.equal(calls.length,3);
 assert.deepEqual(calls.map(c=>c.id),[f.speakers[0],f.speakers[1],f.speakers[1]]);
 assert(calls[2].prompt.includes('先审查函数输入'));
 assert.equal(state.agentJobs[0].status,'completed');
 assert.equal(state.agentJobs[0].attempts,3);
});
await check('Changed source cannot be resumed into stale agent review',async()=>{
 const f=fixture();a.planAgentReview(f.state,{jobId:'source-changed',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 a.flagUncertainAgentJob(f.state,'source-changed','unknown');
 w.putWorkspace(f.state,{thread:f.thread,path:'imports/sample.ts',content:'edited'},1);
 assert.throws(()=>a.authorizeAgentResume(f.state,'source-changed'),/源文件已改变/);
});
await check('Missing saved reviewer output blocks restart rather than rebilling it',async()=>{
 const f=fixture();a.planAgentReview(f.state,{jobId:'missing-report',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 const j=f.state.agentJobs[0];j.completed=[f.speakers[0]];j.status='needs_review';
 assert.throws(()=>a.authorizeAgentResume(f.state,'missing-report'),/报告来源或存储内容不匹配|报告不存在/);
});
await check('Read-only workspace tools return a copy rather than mutable storage',()=>{
 const f=fixture(),old=w.readWorkspace(f.state,f.thread,'imports/sample.ts').content;
 const copy=w.executeWorkspaceTool(f.state,{tool:'workspace.read',thread:f.thread,path:'imports/sample.ts'},{thread:f.thread,write:false});
 copy.content='unauthorized mutation';
 assert.equal(w.readWorkspace(f.state,f.thread,'imports/sample.ts').content,old);
});
await check('Workspace capacity errors are side-effect free before transaction',()=>{
 const f=fixture(),entry=w.readWorkspace(f.state,f.thread,'imports/sample.ts'),old=entry.content;
 f.state.workspaceFiles.push({id:'near-limit',thread:f.thread,path:'other.txt',content:'x'.repeat(1024*1024-250),revision:1,updatedAt:1});
 assert.throws(()=>w.putWorkspace(f.state,{thread:f.thread,path:'imports/sample.ts',content:'edited'},1),/上限/);
 assert.equal(entry.content,old);assert.equal(entry.revision,1);
});
await check('Late agent completion is fenced after a manually retried request',async()=>{
 const f=fixture();let state=f.state;const held=[];
 const commit=async fn=>{const copy=structuredClone(state);fn(copy);state=copy;};
 a.planAgentReview(state,{jobId:'fenced-review',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 const requestAI=async(text,speaker)=>speaker===f.speakers[1]?'verified second':new Promise(resolve=>held.push(resolve));
 const services={snapshot:()=>state,commit,signal:new AbortController().signal,requestAI};
 const wait=async n=>{for(let i=0;i<40&&held.length<n;i++)await new Promise(resolve=>setImmediate(resolve));assert.equal(held.length,n);};
 const stale=a.executeAgentReview('fenced-review',services);await wait(1);
 await commit(s=>{a.flagUncertainAgentJob(s,'fenced-review','retry');a.authorizeAgentResume(s,'fenced-review');});
 const fresh=a.executeAgentReview('fenced-review',services);await wait(2);
 held[0]('stale result');await assert.rejects(stale,/代次/);
 assert.equal(state.agentJobs[0].completed.length,0);
 held[1]('fresh result');await fresh;
 assert.equal(state.agentJobs[0].status,'completed');
 assert.equal(state.threads[f.thread].filter(m=>m.role==='assistant'&&m.senderId===f.speakers[0]).length,1);
 assert.equal(w.readWorkspace(state,f.thread,'reviews/fenced-review/'+f.speakers[0]+'.md').content,'fresh result');
});
await check('Stale Agent failure cannot poison a newer request',()=>{
 const f=fixture();a.planAgentReview(f.state,{jobId:'late-error',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 const job=f.state.agentJobs[0];job.status='requesting';job.attempts=2;
 a.flagUncertainAgentJob(f.state,'late-error','stale failure',1);
 assert.equal(job.status,'requesting');
 a.flagUncertainAgentJob(f.state,'late-error','current failure',2);
 assert.equal(job.status,'needs_review');
});
await check('Agent report provenance rejects modified source, rewritten artifact and chat spoof',async()=>{
 const f=fixture();let state=f.state;const commit=async change=>{const next=structuredClone(state);change(next);state=next;};
 a.planAgentReview(state,{jobId:'evidence-audit',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 await a.executeAgentReview('evidence-audit',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI:async()=> '可复核的分析结果'});
 const checkReport=()=>a.reportEvidence(state,'evidence-audit',f.speakers[0]);
 assert(checkReport().valid);assert(checkReport().reason.includes('并不代表代码已执行'));
 const report=state.agentJobs[0].reports[0];
 state.threads[f.thread].find(m=>m.id===report.messageId).text='伪造测试通过';
 assert(!checkReport().valid);
 state.threads[f.thread].find(m=>m.id===report.messageId).text='可复核的分析结果';
 assert(checkReport().valid);
 w.putWorkspace(state,{thread:f.thread,path:report.path,content:'修改后的报告'},1);
 assert(!checkReport().valid);
});
await check('Changed source revision invalidates previously linked Agent results',async()=>{
 const f=fixture();let state=f.state;const commit=async change=>{const next=structuredClone(state);change(next);state=next;};
 a.planAgentReview(state,{jobId:'source-audit',thread:f.thread,path:'imports/sample.ts',speakers:f.speakers});
 await a.executeAgentReview('source-audit',{snapshot:()=>state,commit,signal:new AbortController().signal,requestAI:async()=> '这只是审阅建议'});
 assert(a.reportEvidence(state,'source-audit',f.speakers[0]).valid);
 w.putWorkspace(state,{thread:f.thread,path:'imports/sample.ts',content:'export const sum=()=>0;'},1);
 assert(!a.reportEvidence(state,'source-audit',f.speakers[0]).valid);
});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
