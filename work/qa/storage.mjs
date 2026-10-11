import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createServer} from 'node:http';import {pathToFileURL} from 'node:url';
const repo=path.resolve(import.meta.dirname,'../..'),app=path.join(repo,'outputs/mori-phone'),out=path.join(repo,'work/storage-build'),{build}=await import(pathToFileURL(path.join(app,'node_modules/vite/dist/node/index.js')).href);
await build({configFile:false,logLevel:'error',build:{outDir:out,emptyOutDir:true,lib:{entry:path.join(import.meta.dirname,'storage-entry.ts'),formats:['es'],fileName:()=>'storage-qa.js'},minify:false}});
const server=createServer((req,res)=>{if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><script type="module">import * as api from "/storage-qa.js";window.QA=api;</script>');return;}try{const p=path.resolve(out,'.'+req.url);if(!p.startsWith(out+path.sep))throw Error();res.setHeader('Content-Type','text/javascript');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox'],headless:true}),page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.QA);
try{const result=await page.evaluate(async()=>{
 const a=window.QA,checks=[],owner='storage-fixture',get=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=reject;}),done=tx=>new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=reject;});
 const state=a.freshState();state.threads[state.primary]=Array.from({length:5000},(_,i)=>({id:'row-'+i,text:'消息 '+i,role:i%2?'assistant':'user',kind:'text',timestamp:i}));await a.writeLocal(owner,state,0);const saved=await a.readLocal(owner);if(saved.state.threads[state.primary].length!==5000)throw Error('Initial thread loss');checks.push('5000 条历史原样保存和读取');
 const writes=[],put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){writes.push(this.name);return put.call(this,value,...args);};
 const next={...saved.state,theme:'night'};await a.writeLocal(owner,next,1,undefined,true);if(writes.includes('threads'))throw Error('Unchanged threads were rewritten');checks.push('修改设置只写元数据，不重写未变会话');
 writes.length=0;const newer={...next,threads:{...next.threads,[state.primary]:[...next.threads[state.primary],{id:'new-row',text:'新消息',role:'user',kind:'text',timestamp:6000}]}};await a.writeLocal(owner,newer,2,undefined,true);if(writes.filter(n=>n==='threads').length!==1)throw Error('Wrong changed thread count');checks.push('追加消息只写发生变化的会话');
 let conflict=false;try{await a.writeLocal(owner,next,2);}catch(e){conflict=e instanceof a.LocalConflict;}if(!conflict)throw Error('Missing conflict');if((await a.readLocal(owner)).state.threads[state.primary].length!==5001)throw Error('Conflict overwrote data');checks.push('过期窗口写入冲突被拒绝，历史不被覆盖');
 const file=new File(['原始文件字节，不做重编码。'.repeat(5000)],'large.txt',{type:'text/plain'}),[one,two]=await Promise.all([a.uploadLocal(owner,file),a.uploadLocal(owner,new File([file],'same.txt'))]);if(one.url!==two.url)throw Error('Dedup failed');if(await (await a.getAsset(owner,one.url)).blob.text()!==await file.text())throw Error('Dedup changed original');checks.push('并发相同附件去重，完整原字节保持');
 const template=a.makeSavedCard({...newer.characters[0],avatar:one.url},newer.lore);
 const withAssets={...newer,wallpaper:{asset:one.url,fit:'contain'},threads:{...newer.threads,[state.primary]:[...newer.threads[state.primary],{id:'voice-file',text:'原文件',role:'user',kind:'file',timestamp:7000,asset:one.url,mime:one.mime,fileName:'large.txt'}]},characterCards:[template],drafts:{'editor:characters:':JSON.stringify({...state.characters[0],avatar:one.url}),'editor:cards:new':JSON.stringify(template)}};await a.writeLocal(owner,withAssets,3);const current=await a.readLocal(owner);
 if(current.state.characterCards[0].character.avatar!==one.url||!a.assetReferences(current.state).includes(one.url))throw Error('Library avatar reference lost');checks.push('仓库模板和嵌套编辑草稿保留本机头像引用');
 const zip=await a.makeBackup(owner,current.state),backup=await a.readBackup(new File([zip],'backup.zip'));if(backup.assets.length!==1)throw Error('Backup duplicated asset');if(zip.byteLength>=file.size/2)throw Error('Text compression ineffective');checks.push('完整 ZIP 只写一份共用附件，文本实际压缩并通过摘要校验');
 const stagedPlan=await a.stageBackup(owner,backup,current.state),staged=stagedPlan.state;if(staged.wallpaper.asset===one.url||staged.wallpaper.asset!==staged.threads[state.primary].at(-1).asset||JSON.parse(staged.drafts['editor:characters:']).avatar!==staged.wallpaper.asset)throw Error('Restore reference mapping');if(staged.characterCards[0].character.avatar!==staged.wallpaper.asset||JSON.parse(staged.drafts['editor:cards:new']).character.avatar!==staged.wallpaper.asset)throw Error('Library backup reference mapping');checks.push('完整备份恢复同时重映射卡片模板和卡片草稿头像');await a.writeLocal(owner,staged,4,undefined,false,stagedPlan.assets);const restored=await a.readLocal(owner);if(restored.state.threads[state.primary].length!==5002||await (await a.getAsset(owner,staged.wallpaper.asset)).blob.text()!==await file.text())throw Error('Restore changed content');checks.push('壁纸、消息、角色草稿的共用引用在恢复时全部映射正确');
 const bad=structuredClone(backup);bad.state.mediaSettings.imageURL='https://evil.example/v1';bad.state.mediaSettings.imageEnabled=true;const protectedState=(await a.stageBackup(owner,bad,restored.state)).state;if(protectedState.mediaSettings.imageURL!==restored.state.mediaSettings.imageURL||protectedState.mediaSettings.imageEnabled!==restored.state.mediaSettings.imageEnabled)throw Error('Backup retargeted media key');checks.push('备份不能改媒体连接或自动启用付费工具');
 let fail=false;IDBObjectStore.prototype.put=function(value,...args){const request=put.call(this,value,...args);if(this.name==='states')this.transaction.abort();return request;};try{await a.writeLocal(owner,{...restored.state,theme:'rose'},5);}catch{fail=true;}IDBObjectStore.prototype.put=put;if(!fail||(await a.readLocal(owner)).state.theme==='rose')throw Error('Failed write appears durable');checks.push('状态与会话事务原子性：落盘失败不伪造成功');
 const trial=await a.stageBackup(owner,backup,restored.state);
 let restoreAborted=false;
 IDBObjectStore.prototype.put=function(value,...args){
  const request=put.call(this,value,...args);
  if(this.name==='states')this.transaction.abort();
  return request;
 };
 try{await a.writeLocal(owner,trial.state,5,undefined,false,trial.assets);}catch{restoreAborted=true;}
 IDBObjectStore.prototype.put=put;
 if(!restoreAborted||await a.getAsset(owner,'local:'+trial.assets[0].id))throw Error('Aborted restore leaked staged blob');
 if((await a.readLocal(owner)).version!==5)throw Error('Aborted restore changed state version');
 checks.push('事务强制中止后，恢复附件与状态同时回滚');
 const atomicOwner='atomic-message',atomicFile=new File(['atomic-data'],'atomic.txt',{type:'text/plain'});
 const preparedUpload=await a.prepareLocalUpload(atomicOwner,atomicFile);
 if(!preparedUpload.asset||await a.getAsset(atomicOwner,preparedUpload.result.url))throw Error('Upload was saved before message commit');
 const atomicState=a.freshState();atomicState.threads[atomicState.primary].push({id:'atomic-msg',role:'user',kind:'file',text:'有附件',timestamp:1,asset:preparedUpload.result.url});
 await a.writeLocal(atomicOwner,atomicState,0,undefined,false,[preparedUpload.asset]);
 if(await (await a.getAsset(atomicOwner,preparedUpload.result.url))?.blob.text()!=='atomic-data')throw Error('Atomic attachment content missing');
 checks.push('普通附件在消息与 Blob 同一事务中保存');
 const isolated=a.freshState(),only=a.makeSavedCard({...isolated.characters[0],avatar:staged.wallpaper.asset},isolated.lore);isolated.characterCards=[only];await a.writeLocal(owner,isolated,5);if(!await a.getAsset(owner,only.character.avatar))throw Error('Only library avatar was collected');checks.push('删除聊天角色后，仅仓库引用的头像仍被保留');a.removeSavedCard(isolated,only.id,only.revision);await a.writeLocal(owner,isolated,6);if(!await a.getAsset(owner,only.character.avatar))throw Error('Original library avatar was destructively collected');checks.push('删除库卡保留原头像附件，避免销毁未提交的新引用');
 const raceOwner='pending-dedup',raceState=a.freshState(),original=new File(['pending original'],'original.txt',{type:'text/plain'}),first=await a.uploadLocal(raceOwner,original);raceState.threads[raceState.primary].push({id:'first-use',role:'user',kind:'file',text:'原件',timestamp:1,asset:first.url});await a.writeLocal(raceOwner,raceState,0);const pending=await a.uploadLocal(raceOwner,original);const removed=structuredClone(raceState);removed.threads[removed.primary]=[];await a.writeLocal(raceOwner,removed,1);const attached=structuredClone(removed);attached.threads[attached.primary].push({id:'new-use',role:'user',kind:'file',text:'再次引用',timestamp:2,asset:pending.url});await a.writeLocal(raceOwner,attached,2);if(await (await a.getAsset(raceOwner,pending.url))?.blob.text()!=='pending original')throw Error('Pending deduplicated upload lost its original');checks.push('删除旧用途时不销毁待提交去重附件，新引用仍有完整原件');

 const commandOwner='command-media-atomic',commandState=a.freshState(),commandThread=commandState.primary;
 commandState.threads[commandThread].push({id:'command-source',role:'user',kind:'text',text:'生成一张测试图片',timestamp:1});
 const [effect]=a.queueMedia(commandState,{thread:commandThread,userId:'command-source',speaker:commandThread},[{type:'image',prompt:'test fixture'}]);
 await a.writeLocal(commandOwner,commandState,0);
 const commandPng=new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])],'generated.png',{type:'image/png'});
 const commandStaged=await a.prepareLocalUpload(commandOwner,commandPng);
 if(!commandStaged.asset||await a.getAsset(commandOwner,commandStaged.result.url))throw Error('Generated command media leaked before the state transaction');
 const requesting=structuredClone(commandState),attempt=a.beginMediaDelivery(requesting,effect.id);
 await a.writeLocal(commandOwner,requesting,1);
 const delivered=structuredClone(requesting),outputId='command-output';
 a.completeMediaDelivery(delivered,effect.id,attempt,outputId);
 delivered.threads[commandThread].push({id:outputId,role:'assistant',kind:'image',text:'',timestamp:2,asset:commandStaged.result.url,mime:commandStaged.result.mime,senderId:commandThread,turnId:'command-source'});
 let mediaAbort=false;
 IDBObjectStore.prototype.put=function(value,...args){const request=put.call(this,value,...args);if(this.name==='states')this.transaction.abort();return request;};
 try{await a.writeLocal(commandOwner,delivered,2,undefined,false,[commandStaged.asset]);}catch{mediaAbort=true;}finally{IDBObjectStore.prototype.put=put;}
 const commandFailed=(await a.readLocal(commandOwner)).state;
 if(!mediaAbort||commandFailed.mediaOutbox[0].phase!=='in_flight'||commandFailed.threads[commandThread].some(m=>m.id===outputId)||await a.getAsset(commandOwner,commandStaged.result.url))throw Error('Aborted command media left an orphan, message or completed receipt');
 await a.writeLocal(commandOwner,delivered,2,undefined,false,[commandStaged.asset]);
 const commandSaved=(await a.readLocal(commandOwner)).state;
 if(commandSaved.mediaOutbox[0].phase!=='completed'||commandSaved.mediaOutbox[0].outputId!==outputId||!commandSaved.threads[commandThread].some(m=>m.id===outputId)||!await a.getAsset(commandOwner,commandStaged.result.url))throw Error('Command media and receipt were not saved together');
 checks.push('真实 IndexedDB：AI 命令图片、Outbox 回执与消息一次写入；中断后全部回滚');
 const boundedOwner='budget-persist-29',bounded=a.freshState(),bThread=bounded.primary;
 bounded.threads[bThread].push({id:'bounded-original',role:'user',kind:'text',text:'bounded request',timestamp:1,failed:true});
 a.beginTurn(bounded,{userId:'bounded-original',thread:bThread,mode:'chat',speakers:[bThread]});
 bounded.turnReceipts[0].attempts=a.MAX_TURN_REQUEST_ATTEMPTS;
 const [boundedMedia]=a.queueMedia(bounded,{userId:'bounded-original',thread:bThread,speaker:bThread},[{type:'image',prompt:'fixture'}]);
 bounded.mediaOutbox.find(row=>row.id===boundedMedia.id).attempts=a.MAX_MEDIA_REQUEST_ATTEMPTS;
 const agentThread='bounded-group',agentSpeakers=bounded.characters.slice(0,2).map(c=>c.id);
 bounded.groups.push({id:agentThread,name:'Budget group',members:agentSpeakers});
 a.putWorkspace(bounded,{thread:agentThread,path:'imports/budget.txt',content:'review budget'},null);
 a.planAgentReview(bounded,{jobId:'bounded-agent',thread:agentThread,path:'imports/budget.txt',speakers:agentSpeakers});
 bounded.agentJobs[0].attempts=a.MAX_AGENT_REQUEST_ATTEMPTS;
 await a.writeLocal(boundedOwner,bounded,0);
 const boundedReload=(await a.readLocal(boundedOwner)).state;
 const beforeBudget=JSON.stringify(boundedReload);
 for(const attempt of [
  ()=>a.markRequesting(boundedReload,'bounded-original',bThread),
  ()=>a.beginMediaDelivery(boundedReload,boundedMedia.id),
  ()=>a.authorizeAgentResume(boundedReload,'bounded-agent')
 ]){let prevented=false;try{attempt();}catch(error){prevented=/上限/.test(String(error));}if(!prevented)throw Error('Persisted budget ceiling did not block another request');}
 if(JSON.stringify(boundedReload)!==beforeBudget)throw Error('Rejected request modified persisted state');
 checks.push('真实 IndexedDB 重新读取后，聊天/媒体/Agent 计数上限阻止重复请求且不更改状态');
 const queueOwner='durable-queue-24',queueState=a.freshState(),queueThread=queueState.primary;
 queueState.threads[queueThread].push({id:'queued-intent',role:'user',kind:'text',text:'queued-intent',timestamp:1,failed:true});
 a.enqueueDurableTurn(queueState,{userId:'queued-intent',thread:queueThread,text:'queued-intent',mode:'chat',queuedAt:1});
 let queueAbort=false;IDBObjectStore.prototype.put=function(value,...args){const r=put.call(this,value,...args);if(this.name==='states')this.transaction.abort();return r;};
 try{await a.writeLocal(queueOwner,queueState,0);}catch{queueAbort=true;}IDBObjectStore.prototype.put=put;
 if(!queueAbort||await a.readLocal(queueOwner))throw Error('Aborted queue transaction saved a partial intent');
 await a.writeLocal(queueOwner,queueState,0);
 const queueReload=(await a.readLocal(queueOwner)).state;
 if(a.eligibleQueuedTurn(queueReload)?.userId!=='queued-intent')throw Error('Persisted queue lost intent');
 const untrusted={...backup,state:queueReload};const isolatedRestore=await a.stageBackup(queueOwner,untrusted,queueReload);
 if(isolatedRestore.state.queuedTurns.length)throw Error('Backup import authorized an old POST');
 checks.push('真实 IndexedDB 的消息与待发意图共同回滚、读取恢复、外部备份禁止自动发送');
 for(const abortReply of [false,true]){
  const turnOwner='native-atomic-'+abortReply;let turnState=a.freshState(),turnVersion=0,turnCalls=0,ref='';
  turnState.threads[turnState.primary].push({id:'native-turn',role:'user',kind:'text',text:'native question',timestamp:1,failed:true});
  await a.writeLocal(turnOwner,turnState,turnVersion++);
  const controller=new AbortController();
  const services={snapshot:()=>turnState,signal:controller.signal,deliverMedia:async()=>{},
   requestAI:async(_text,_speaker,_thread,_mode,_delta,_signal,media)=>{
    turnCalls++;media(new File([new Uint8Array([137,80,78,71,13,10,26,10,0])],'native.png',{type:'image/png'}));return 'native text';
   },prepareUpload:async file=>{const prepared=await a.prepareLocalUpload(turnOwner,file);ref=prepared.result.url;if(await a.getAsset(turnOwner,ref))throw Error('Native blob persisted prematurely');return prepared;},
   commit:async(fn,assets=[])=>{
    const draft=structuredClone(turnState);fn(draft);
    if(abortReply&&assets.length)IDBObjectStore.prototype.put=function(value,...args){const r=put.call(this,value,...args);if(this.name==='states')this.transaction.abort();return r;};
    try{turnVersion=await a.writeLocal(turnOwner,draft,turnVersion,undefined,false,assets);turnState=draft;}
    finally{IDBObjectStore.prototype.put=put;}
   }};
  let replyFailed=false;try{await a.executeTurn({thread:turnState.primary,userId:'native-turn',text:'native question',mode:'chat'},services);}catch{replyFailed=true;}
  const persisted=(await a.readLocal(turnOwner)).state,reply=persisted.threads[persisted.primary].filter(m=>m.role==='assistant'&&m.turnId==='native-turn'),receipt=persisted.turnReceipts.find(r=>r.userId==='native-turn'),asset=await a.getAsset(turnOwner,ref);
  if(turnCalls!==1||replyFailed!==abortReply)throw Error('Native turn sent unexpected requests');
  if(abortReply){if(reply.length||asset||receipt.phase!=='in_flight'||a.eligibleQueuedTurn(persisted))throw Error('Failed native transaction left a reply, blob or replayable intent');}
  else if(reply.length!==2||!asset||receipt.phase!=='completed')throw Error('Native transaction failed to persist complete delivery');
 }
 checks.push('原生生成 Blob、正文、媒体消息、回执同事务成功；强制中止后全部回滚且未知 POST 不自动重放');
 return {passed:checks.length,checks,textOriginalBytes:file.size,backupBytes:zip.byteLength,historyMessages:5002};
 });await page.reload();await page.waitForFunction(()=>window.QA);await page.evaluate(async()=>{const a=window.QA,q=(await a.readLocal('durable-queue-24')).state,failed=(await a.readLocal('native-atomic-true')).state;if(a.eligibleQueuedTurn(q)?.userId!=='queued-intent'||a.eligibleQueuedTurn(failed)||failed.turnReceipts[0].phase!=='in_flight')throw Error('Cold reload lost queue or replayed uncertain POST');});result.checks.push('页面冷重载后的真实落盘队列恢复，未知原生请求仍不可自动重放');result.passed=result.checks.length;assert.deepEqual(errors,[]);fs.writeFileSync(path.join(repo,'docs/storage-regression-results.json'),JSON.stringify({...result,pageErrors:errors},null,2));console.log(JSON.stringify(result,null,2));}finally{await browser.close();await new Promise(r=>server.close(r));}
