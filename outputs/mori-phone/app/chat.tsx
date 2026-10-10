'use client';
import React,{useEffect,useRef,useState} from 'react';
import {Search,Plus,Send,Paperclip,Smile,PhoneCall,Mic,Square,ChevronLeft,MoreHorizontal,Brain,Trash2,RotateCw,Download,Settings,X} from 'lucide-react';
import {uid,localDate,type Message} from '../lib/phone-model';
import {readAttachment} from '../lib/attachment-text';
import {splitRoleplayReply} from '../lib/roleplay';
import {useVoice} from './use-voice';
import {useRecorder} from './use-recorder';
import RecordingPreview from './recording-preview';
import {getAsset} from '../lib/local-phone';
import {getProvider} from '../lib/providers';
import {generatedImage,speechFile,transcribeFile} from '../lib/media-client';
import {visibleReply,type MediaCommand} from '../lib/media-contract';
import {maintainConversation} from '../lib/chat-maintenance';
import {executeTurn,type TurnPhase} from '../lib/turn-execution';
import {enqueueDurableTurn,dequeueDurableTurn,eligibleQueuedTurn} from '../lib/durable-turn-queue';
import {markInterrupted,receiptFor,manualRetryRequiresConfirmation} from '../lib/turn-receipts';
import {putWorkspace} from '../lib/agent-workspace';
import {planAgentReview,executeAgentReview,flagUncertainAgentJob,authorizeAgentResume,reportEvidence} from '../lib/agent-orchestrator';
import {beginMediaDelivery,completeMediaDelivery,assertMediaDelivery,interruptMediaDelivery} from '../lib/media-outbox';
import RealtimeCall from './realtime-call';
import {Avatar,GroupAvatar,DockArt,MessageCard,usePhone,downloadJson} from './ui';
export default function Chat(){
 const p=usePhone(),{state,open,commit,detail,app,toast}=p,reader=useVoice();
 const [filter,setFilter]=useState(''),[input,setInput]=useState(''),[extras,setExtras]=useState(false),[groupForm,setGroupForm]=useState(false),[groupName,setGroupName]=useState(''),[members,setMembers]=useState<string[]>([]),[rawStream,setStream]=useState(''),[rawError,setError]=useState(''),[activeMessage,setActiveMessage]=useState(''),[realtime,setRealtime]=useState(false),[phase,setPhase]=useState<'reply'|'media'>('reply'),[maintenance,setMaintenance]=useState(false),[searchTarget,setSearchTarget]=useState(''),[packet,setPacket]=useState(''),[amount,setAmount]=useState(20),[uploading,setUploading]=useState(false);
 const [visibleCount,setVisibleCount]=useState(200),[menu,setMenu]=useState(false),[groupDetails,setGroupDetails]=useState(false),[groupTitle,setGroupTitle]=useState(''),[activeSpeaker,setActiveSpeaker]=useState(''),[replyTo,setReplyTo]=useState(''),[waiting,setWaiting]=useState(false);
 const recorder=useRecorder(toast),maintenanceQueue=useRef(Promise.resolve()),maintenanceAbort=useRef(new AbortController()),draftInput=useRef(input);draftInput.current=input;
 const retrySpeakers=useRef<{thread:string;userId:string;speakers:string[]}|null>(null),runningThread=useRef(''),running=useRef(false),runningUserId=useRef(''),errorThread=useRef(''),view=useRef({thread:'',visible:false});
 const partial=useRef(''),follow=useRef(true),viewport=useRef<HTMLDivElement>(null),[showLatest,setShowLatest]=useState(false);
 const end=useRef<HTMLDivElement>(null),fileInput=useRef<HTMLInputElement>(null),abort=useRef<AbortController|null>(null);
 const thread=detail||(app==='face'||app==='live'?state.primary:'');const group=state.groups.find(g=>g.id===thread),character=state.characters.find(c=>c.id===thread)||state.characters.find(c=>c.id===group?.members[0])||state.characters.find(c=>c.id===state.primary)!;
 view.current={thread,visible:!!p.chatVisible};const lastUser=(state.threads[thread]||[]).filter(m=>m.role==='user').at(-1),error=p.busy&&runningThread.current===thread?'':(errorThread.current===thread?rawError:'')||(lastUser?.failed?lastUser.failureReason||'上次回复未完成，可以重试或检查连接。':'');
 const busyHere=p.busy&&runningThread.current===thread,stream=runningThread.current===thread?rawStream:'';
 useEffect(()=>{if(!p.chatVisible||p.busy||running.current)return;
  const next=eligibleQueuedTurn(p.snapshot(),thread);
  if(next)void reply(next.text,true,next.userId,next.thread);
 },[p.chatVisible,p.busy,thread,state.threads,state.queuedTurns]);
 useEffect(()=>{const back=(event:Event)=>{if(!p.chatVisible)return; if(activeMessage){setActiveMessage('');event.preventDefault();}else if(groupDetails){setGroupDetails(false);event.preventDefault();}else if(menu){setMenu(false);event.preventDefault();}else if(extras){setExtras(false);event.preventDefault();}else if(groupForm){setGroupForm(false);event.preventDefault();}};window.addEventListener('cloudlet-chat-back',back);return()=>window.removeEventListener('cloudlet-chat-back',back);},[p.chatVisible,activeMessage,groupDetails,menu,extras,groupForm]);
 useEffect(()=>{setRealtime(false);},[p.chatVisible,thread]);
 const pendingReply=(id:string)=>(p.busy&&runningUserId.current===id)||state.queuedTurns.some(t=>t.userId===id);
 const messages=state.threads[thread]||[],targetIndex=searchTarget?messages.findIndex(m=>m.id===searchTarget):-1;const shown=targetIndex>=0?messages.slice(Math.max(0,targetIndex-30),targetIndex+31):state.longChat?messages.slice(-visibleCount):messages.slice(-6);
 useEffect(()=>{if(searchTarget){follow.current=false;requestAnimationFrame(()=>document.getElementById('message-'+searchTarget)?.scrollIntoView({block:'center'}));}},[searchTarget,thread]);
 useEffect(()=>{if(p.chatVisible&&thread&&follow.current){const frame=requestAnimationFrame(()=>end.current?.scrollIntoView({block:'end'}));return()=>cancelAnimationFrame(frame);}},[p.chatVisible,thread]);
 useEffect(()=>{if(follow.current)end.current?.scrollIntoView({block:'end',behavior:stream?'instant':'smooth'});else setShowLatest(true);},[messages.length,stream]);
 useEffect(()=>{setInput(state.drafts[thread]||'');setReplyTo('');setError('');setMenu(false);setExtras(false);setActiveMessage('');setVisibleCount(200);follow.current=true;setShowLatest(false);},[thread]);
 useEffect(()=>{const controller=new AbortController();maintenanceAbort.current=controller;return()=>{abort.current?.abort();controller.abort();};},[]);
 useEffect(()=>{const guard=(event:Event)=>{if(!p.chatVisible||recorder.status==='idle')return;const next=(event as CustomEvent<{app:string;detail:string}>).detail;if(next.app===app&&next.detail===detail)return;if(!window.confirm('这段录音还没有发送。放弃录音并离开？'))event.preventDefault();};window.addEventListener('cloudlet-before-navigation',guard);return()=>window.removeEventListener('cloudlet-before-navigation',guard);},[p.chatVisible,recorder.status,app,detail]);
 useEffect(()=>{recorder.cancel();},[thread,p.chatVisible]);
 useEffect(()=>{if(!p.chatVisible||!thread||!messages.some(m=>m.role==='assistant'&&!m.read))return;void commit(s=>{s.threads[thread]?.forEach(m=>{if(m.role==='assistant')m.read=true;});}).catch(()=>{});},[thread,p.chatVisible]);
 const deliverMedia=async(commands:MediaCommand[],speaker:string,thread:string,signal?:AbortSignal,effectId?:string,attempt?:number)=>{
  for(const command of commands){signal?.throwIfAborted();const current=p.snapshot(),c=current.characters.find(c=>c.id===speaker);if(!c)throw new Error('角色不存在。');
   try{let result:{url:string;id:string;mime:string;size:number;name:string};
    if(command.type==='sticker'){const sticker=current.gallery.find(g=>g.id===command.id&&current.mediaSettings.stickers.includes(g.id));if(!sticker)throw new Error('这个表情包未被授权。');const asset=await getAsset(p.ownerId,sticker.url);if(!asset||!asset.mime.startsWith('image/'))throw new Error('表情包原文件不可用。');result={url:sticker.url,id:sticker.id,mime:asset.mime,size:asset.size,name:sticker.name};}
    else{if(command.type==='voice'&&!current.mediaSettings.aiVoice)throw new Error('尚未开启 AI 语音文件。');const file=command.type==='image'?await generatedImage(p.ownerId,current,command.prompt,signal):await speechFile(p.ownerId,current,command.text,signal);signal?.throwIfAborted();result=await p.upload(file);if(command.type==='image'?!result.mime.startsWith('image/'):!result.mime.startsWith('audio/'))throw new Error('生成媒体的实际文件类型不正确，未发送。');}
    signal?.throwIfAborted();await commit(s=>{const messageId=uid();let causalUserId:string|undefined;if(effectId){if(attempt===undefined)throw new Error('媒体代次不存在。');const effect=assertMediaDelivery(s,effectId,attempt,thread,speaker);if(!s.threads[thread]?.some(m=>m.id===effect.userId&&m.role==='user'))throw new Error('来源消息已删除，取消发送媒体。');completeMediaDelivery(s,effectId,attempt,messageId);causalUserId=effect.userId;} (s.threads[thread]??=[]).push({id:messageId,role:'assistant',text:command.type==='voice'?command.text:command.type==='image'?command.prompt:'',timestamp:Date.now(),kind:command.type==='voice'?'voice':'image',asset:result.url,fileName:result.name,mime:result.mime,fileSize:result.size||undefined,sender:c.name,senderId:speaker,turnId:causalUserId,read:view.current.thread===thread&&view.current.visible,attachmentStatus:command.type==='image'?'AI 生成的图片':command.type==='voice'?'AI 合成语音':'已授权的表情包'});});
   }catch(e){if(signal?.aborted||effectId)throw e;await commit(s=>{(s.threads[thread]??=[]).push({id:uid(),role:'system',kind:'notice',text:'媒体未发送：'+(e instanceof Error?e.message:'生成失败。'),timestamp:Date.now(),read:true});});}
  }
 };
 const reply=async(text:string,newTurn=false,userId?:string,targetThread=thread)=>{
  if(p.busy||running.current)return;
  const current=p.snapshot(),targetGroup=current.groups.find(g=>g.id===targetThread);
  const turnUserId=userId||(current.threads[targetThread]||[]).filter(m=>m.role==='user').at(-1)?.id;
  if(!turnUserId)return;
  const persistedMode=current.queuedTurns.find(t=>t.userId===turnUserId)?.mode||receiptFor(current,turnUserId)?.mode;
  const mode=persistedMode??(targetGroup?'group':app==='face'?'face':app==='live'?'live':'chat');
  const retry=retrySpeakers.current;
  const speakers=!newTurn&&retry?.thread===targetThread&&retry.userId===turnUserId?retry.speakers:undefined;
  const receipt=receiptFor(current,turnUserId);
  if(!newTurn&&manualRetryRequiresConfirmation(current,turnUserId)){
   if(!window.confirm('上一次请求可能已经计费，但回复尚未完整保存。再次发送可能重复计费。确认重新请求剩余角色吗？'))return;
  }
  if(newTurn&&receipt&&manualRetryRequiresConfirmation(current,turnUserId)){
   toast('上次请求结果不明确，请在聊天记录中手动确认重试。');return;
  }
  running.current=true;runningThread.current=targetThread;errorThread.current=targetThread;
  runningUserId.current=turnUserId;p.setBusy(true);partial.current='';setPhase('reply');setStream('');setError('');
  abort.current=new AbortController();let replyingAs:string|undefined,activeAttempt=0;
  try{
   const completed=await executeTurn({thread:targetThread,userId:turnUserId,text,mode,speakers,allowManualRetry:!newTurn},{
    snapshot:p.snapshot,commit,requestAI:p.requestAI,upload:p.upload,
    deliverMedia,signal:abort.current.signal,
    onPhase:(step:TurnPhase)=>setPhase(step==='media'?'media':'reply'),
    onWait:setWaiting,
    onSpeaker:speaker=>{replyingAs=speaker;setActiveSpeaker(speaker);},
     onRequest:attempt=>{activeAttempt=attempt;},
    onDelta:value=>{partial.current=value;if(!targetGroup)setStream(value);},
    onRemaining:remaining=>{retrySpeakers.current={thread:targetThread,userId:turnUserId,speakers:remaining};},
    onVoice:value=>{void reader.read(value).catch(()=>{});},
    isVisible:id=>view.current.visible&&view.current.thread===id
   });
   retrySpeakers.current=null;
   const maintenanceSignal=maintenanceAbort.current.signal,participants=[...completed];
   const services={snapshot:p.snapshot,commit,requestAI:p.requestAI,toast};
   maintenanceQueue.current=maintenanceQueue.current.catch(()=>{}).then(async()=>{setMaintenance(true);try{await maintainConversation(services,participants,targetThread,maintenanceSignal);}finally{setMaintenance(false);}}).catch(()=>{});
  }catch(e){
   const message=e instanceof Error?e.message:'回复失败。';errorThread.current=targetThread;
   setError(e instanceof Error&&e.name==='AbortError'?'已中止回复。':message);setStream('');
   const pending=retrySpeakers.current;
   const needsRetry=!pending||pending.thread!==targetThread||pending.userId!==turnUserId||pending.speakers.length>0;
   await commit(s=>{
    if(activeAttempt>0&&receiptFor(s,turnUserId)?.attempts!==activeAttempt)return;
     if(partial.current&&!targetGroup)(s.threads[targetThread]??=[]).push({id:uid(),role:'assistant',text:visibleReply(splitRoleplayReply(partial.current).text)+'\n\n[这条回复未完成]',timestamp:Date.now(),kind:'text',senderId:replyingAs,read:true,failed:true});
    const original=s.threads[targetThread]?.find(m=>m.id===turnUserId);
    markInterrupted(s,turnUserId,message,activeAttempt);
    dequeueDurableTurn(s,turnUserId);
    if(original&&needsRetry){original.failed=true;original.failureReason=message.slice(0,600);}
   }).catch(()=>{});
  }finally{
   running.current=false;p.setBusy(false);runningUserId.current='';setWaiting(false);setActiveSpeaker('');abort.current=null;
  }
 };
 const send=async(event?:React.FormEvent)=>{
  event?.preventDefault();
  const submitted=input,text=submitted.trim(),target=thread,id=uid();
  if(!text||uploading||!target)return;
  try{
   // Persist before clearing the composer or charging for a model request.
   await commit(s=>{(s.threads[target]??=[]).push({id,role:'user',text,failed:true,timestamp:Date.now(),kind:'text',replyTo:replyTo||undefined,read:true});enqueueDurableTurn(s,{thread:target,userId:id,text,mode:s.groups.some(g=>g.id===target)?'group':app==='face'?'face':app==='live'?'live':'chat',queuedAt:Date.now()});delete s.drafts[target];});
   if(view.current.thread===target&&draftInput.current===submitted){
    setInput('');setReplyTo('');p.setDraft(target,'');
   }
   follow.current=true;
   if(p.busy||running.current)return;
   await reply(text,true,id,target);
  }catch(e){toast(e instanceof Error?e.message:'消息未保存，请重试。');}
 };
 const sendFiles=async(files:File[],duration?:number)=>{
  if(!files.length||uploading||!thread)return false;setUploading(true);const submitted=draftInput.current,quoted=replyTo,target=thread;let success=false;
  try{for(const file of files.slice(0,6)){const result=await p.upload(file),audio=result.mime.startsWith('audio/'),parsed=audio?{text:'',status:'原录音已保存；尚未转写。'}:await readAttachment(file,result.mime),id=uid();const text=submitted.trim()||(audio?'发送了一条语音':`发送了 ${file.name}`);
   await commit(s=>{(s.threads[target]??=[]).push({id,role:'user',text,timestamp:Date.now(),kind:audio?'voice':result.mime.startsWith('image/')?'image':'file',asset:result.url,fileName:file.name.slice(0,160),fileSize:result.size,mime:result.mime,duration,extracted:parsed.text||undefined,attachmentStatus:parsed.status,replyTo:quoted||undefined,read:true});if(result.mime.startsWith('image/')&&!s.gallery.some(g=>g.url===result.url))s.gallery.push({id:result.id,url:result.url,name:result.name});if(s.gallery.length>100)s.gallery=s.gallery.slice(-100);
    if(parsed.text){
     const safeName=file.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fff. -]/g,'_').slice(0,90)||'attachment.txt';
     try{
      putWorkspace(s,{thread:target,path:'imports/'+id+'/'+safeName,content:parsed.text,sourceId:id},null);
      const original=s.threads[target]?.find(m=>m.id===id);
      if(original)original.attachmentStatus=parsed.status+'；文字已加入本会话工作区';
     }catch{
      const original=s.threads[target]?.find(m=>m.id===id);
      if(original)original.attachmentStatus=parsed.status+'；工作区未索引，仍可查看聊天附件';
     }
    }
   });
   let canRead=!audio||p.snapshot().provider==='gemini'&&p.snapshot().mediaSettings.nativeAudio;
   if(audio&&p.snapshot().mediaSettings.transcriptionEnabled){try{const transcript=await transcribeFile(p.ownerId,p.snapshot(),file);await commit(s=>{const message=s.threads[target]?.find(m=>m.id===id);if(message){message.extracted=transcript;message.attachmentStatus='已转写；原音频保留。';}});canRead=true;}catch(e){await commit(s=>{const message=s.threads[target]?.find(m=>m.id===id);if(message)message.attachmentStatus=e instanceof Error?e.message:'转写失败，原录音保留。';});toast('语音已保存，转写未成功。');}}
   if(canRead&&(p.apiKey||p.serverAI||p.snapshot().characters.some(c=>!!c.aiConnection&&(c.id===target||p.snapshot().groups.some(g=>g.id===target&&g.members.includes(c.id)))))){await commit(s=>{const m=s.threads[target]?.find(m=>m.id===id);if(m){m.failed=true;enqueueDurableTurn(s,{userId:id,thread:target,text,mode:s.groups.some(g=>g.id===target)?'group':app==='face'?'face':app==='live'?'live':'chat',queuedAt:Date.now()});}});if(!p.busy&&!running.current)await reply(text,true,id,target);}
  }success=true;if(view.current.thread===target&&draftInput.current===submitted){setInput('');p.setDraft(target,'');setReplyTo('');}follow.current=true;toast('附件和记录已保存。');
  }catch(e){toast(e instanceof Error?e.message:'附件发送失败。');}finally{setUploading(false);if(fileInput.current)fileInput.current.value='';}return success;
 };
 const attach=async(files:FileList|null)=>{if(files)await sendFiles(Array.from(files));};
 const sendRecording=async()=>{const file=recorder.file;if(file&&await sendFiles([file],recorder.seconds))recorder.cancel();};
 const searchOpen=(id:string)=>{const match=filter.trim()?(p.snapshot().threads[id]||[]).find(m=>m.text.includes(filter)||m.extracted?.includes(filter)):undefined;setSearchTarget(match?.id||'');open('chat',id);};
 const reviewWorkspaceFile=async(message:Message)=>{
  const current=p.snapshot(),target=thread,g=current.groups.find(v=>v.id===target);
  const entry=current.workspaceFiles.find(x=>x.thread===target&&x.sourceId===message.id);
  if(!g||g.members.length<2||!entry){toast('只有有文字索引的群聊文件可以进行多角色协作审阅。');return;}
  if(p.busy||running.current)return;
  const speakers=g.members.slice(0,Math.min(4,g.members.length));
  if(!window.confirm('将此文件已提取的文字交给 '+speakers.length+' 位群角色依次审阅。每位角色将使用自己的 AI 连接，可能分别计费。此操作不会执行代码或自动修改原文件。继续吗？'))return;
  const jobId=uid(),controller=new AbortController();let activeAttempt=0;
  running.current=true;runningThread.current=target;p.setBusy(true);abort.current=controller;
  setMenu(false);setActiveMessage('');setPhase('reply');setError('');
  try{
   await commit(s=>planAgentReview(s,{jobId,thread:target,path:entry.path,speakers}));
   await executeAgentReview(jobId,{snapshot:p.snapshot,commit,requestAI:p.requestAI,signal:controller.signal,onRequest:attempt=>{activeAttempt=attempt;}});
   toast('协作审阅完成：各角色报告已保存至聊天与独立工作区文件。');
  }catch(e){
   const reason=e instanceof Error?e.message:'协作任务中断';
   await commit(s=>flagUncertainAgentJob(s,jobId,reason,activeAttempt)).catch(()=>{});
   setError(reason);toast('协作未完整完成，执行记录已保留，不会自动重复请求。');
  }finally{running.current=false;p.setBusy(false);abort.current=null;setPhase('reply');}
 };
 const resumeReviewJob=async(jobId:string)=>{
  const current=p.snapshot(),job=current.agentJobs.find(j=>j.id===jobId&&j.thread===thread);
  if(!job||job.status==='completed'||job.status==='cancelled'||p.busy||running.current)return;
  if(job.status==='requesting'||job.status==='needs_review'){
   if(!window.confirm('上次模型请求可能已经发送并计费。仅未保存结果的角色可能会被重新请求，可能重复计费。明确确认继续吗？'))return;
  }
  const target=job.thread,controller=new AbortController();let activeAttempt=0;
  running.current=true;runningThread.current=target;p.setBusy(true);abort.current=controller;
  setMenu(false);setPhase('reply');setError('');
  try{
   await commit(s=>authorizeAgentResume(s,jobId));
   await executeAgentReview(jobId,{snapshot:p.snapshot,commit,requestAI:p.requestAI,signal:controller.signal,onRequest:attempt=>{activeAttempt=attempt;}});
   toast('已续接并保存剩余角色的审阅报告。');
  }catch(e){
   const reason=e instanceof Error?e.message:'协作任务中断';
   await commit(s=>flagUncertainAgentJob(s,jobId,reason,activeAttempt)).catch(()=>{});
   setError(reason);toast('协作仍未完成；不会自动再次请求模型。');
  }finally{running.current=false;p.setBusy(false);abort.current=null;setPhase('reply');}
 };
 const resumeMediaEffect=async(effectId:string)=>{
 const initial=p.snapshot().mediaOutbox.find(e=>e.id===effectId&&e.thread===thread);
 if(!initial||p.busy||running.current||initial.phase==='completed'||initial.phase==='cancelled')return;
 if(!p.snapshot().threads[initial.thread]?.some(m=>m.id===initial.userId&&m.role==='user')){toast('原消息不存在，不能继续媒体任务。');return;}
 if((initial.phase==='in_flight'||initial.phase==='needs_review')&&!window.confirm('这项媒体任务之前可能已调用外部 API。重新执行可能重复计费；确认继续吗？'))return;
 const controller=new AbortController();let attempt=0;
 running.current=true;runningThread.current=initial.thread;p.setBusy(true);abort.current=controller;setMenu(false);setPhase('media');
 try{
  await commit(s=>{attempt=beginMediaDelivery(s,effectId,true);});
  await deliverMedia([initial.command],initial.speaker,initial.thread,controller.signal,effectId,attempt);
  if(p.snapshot().mediaOutbox.find(e=>e.id===effectId)?.phase!=='completed')throw new Error('媒体结果未被持久化确认。');
  toast('媒体已保存，执行回执已完成。');
 }catch(e){
  const reason=e instanceof Error?e.message:'媒体交付中断';
  if(attempt)await commit(s=>interruptMediaDelivery(s,effectId,attempt,reason)).catch(()=>{});
  toast('媒体未完成：'+reason);
 }finally{running.current=false;p.setBusy(false);abort.current=null;setPhase('reply');}
};
const createGroup=async()=>{if(!groupName.trim()||members.length<2){toast('请填写群名，并选择至少两位角色。');return;}const id=uid();await commit(s=>s.groups.push({id,name:groupName.trim().slice(0,160),members}));open('chat',id);};
 const memory=(m:Message)=>{void commit(s=>s.memories.push({id:uid(),text:group&&m.sender?m.sender+'：'+m.text:m.text,scope:group?.id||character.id,date:localDate(),origin:'manual',locked:true,revisions:[]})).then(()=>toast(group?'已收进这个群的记忆。':'已放进这位角色的记忆。')).catch(()=>{});setActiveMessage('');};
 const sendMoney=async()=>{if(!Number.isInteger(amount)||amount<=0||amount>100000){toast('请输入 1—100000 的整数云币。');return;}if(amount>state.wallet){toast('云币不够，去完成小任务赚一些吧。');return;}await commit(s=>{s.wallet-=amount;s.ledger.unshift({id:uid(),title:`给 ${character.name} 的${packet==='packet'?'红包':packet==='kinship'?'亲属卡':'转账'}`,amount:-amount,date:localDate()});(s.threads[thread]??=[]).push({id:uid(),role:'user',text:'送你一点小心意。',timestamp:Date.now(),kind:packet as 'packet',amount,read:true});});setPacket('');toast('心意已记录。云币仅用于小手机中的互动。');};
 if(!thread)return <div className="scroll-panel contact-screen"><label className="search-field"><Search size={17}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="找一位朋友，或一条消息"/></label><div className="section-label"><span>我的朋友</span><button className="icon-button" aria-label="新建群聊" onClick={()=>setGroupForm(v=>!v)}><Plus size={19}/></button></div>
  {groupForm&&<div className="form-card"><h3>建一个小群</h3><input aria-label="群聊名称" value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="例如：今晚一起听歌"/><div className="member-picker">{state.characters.map(c=><label key={c.id}><input type="checkbox" checked={members.includes(c.id)} onChange={e=>setMembers(v=>e.target.checked?[...v,c.id].slice(0,12):v.filter(id=>id!==c.id))}/>{c.name}</label>)}</div><button className="primary" onClick={()=>void createGroup().catch(e=>toast(e instanceof Error?e.message:'创建群聊失败。'))}>创建群聊</button></div>}
  {state.groups.filter(g=>g.name.includes(filter)||(state.threads[g.id]||[]).some(m=>m.text.includes(filter))).map(g=><button className="contact-row" key={g.id} onClick={()=>searchOpen(g.id)}><GroupAvatar characters={state.characters.filter(c=>g.members.includes(c.id))}/><span><strong>{g.name}</strong><small>{state.threads[g.id]?.at(-1)?.text||`${g.members.length}位朋友的小群`}</small></span><span className="contact-time">群聊</span></button>)}
  {[...state.characters].sort((a,b)=>(state.threads[b.id]?.at(-1)?.timestamp||0)-(state.threads[a.id]?.at(-1)?.timestamp||0)).filter(c=>c.name.includes(filter)||(state.threads[c.id]||[]).some(m=>m.text.includes(filter))).map(c=>{const unread=(state.threads[c.id]||[]).filter(m=>m.role==='assistant'&&!m.read).length;return <button className="contact-row" key={c.id} onClick={()=>searchOpen(c.id)}><span className="contact-avatar"><Avatar character={c}/>{unread>0&&<i className="badge">{unread}</i>}</span><span><strong>{c.name}</strong><small>{state.threads[c.id]?.at(-1)?.text||c.greeting}</small></span><span className="contact-time">{c.id===state.primary?'陪伴中':''}</span></button>;})}
  <button className="wide soft-button" onClick={()=>open('characters')}><Plus size={17}/>新建或导入角色</button><p className="helper center">聊天记录与附件保存在这台设备</p>
 </div>;
 return <div className={`chat-screen ${app==='face'?'face-chat':''}`}>
  <header className="chat-person"><button className="icon-button" aria-label="返回聊天列表" onClick={()=>open('chat')}><ChevronLeft size={19}/></button><>{group?<GroupAvatar characters={state.characters.filter(c=>group.members.includes(c.id))}/>:<Avatar character={character} size="small"/>}</><span><strong>{group?.name||character.name}</strong><small>{busyHere?`${state.characters.find(c=>c.id===activeSpeaker)?.name||character.name} ${phase==='media'?'正在生成媒体…':waiting?'稍后接话…':'正在输入…'}`:group?`${group.members.length} 位朋友 · 轮流接话`:app==='face'?'面对面 · 角色共演':app==='live'?'弹幕互动 · 私人剧情':character.aiConnection?getProvider(character.aiConnection.provider).name+' · '+character.aiConnection.model:p.apiKey||p.serverAI?'等待你的消息':'尚未连接 AI'}</small></span><button className="icon-button" aria-label="返回桌面" onClick={()=>open('home')}><DockArt name="home"/></button>{!group&&<button className="icon-button" aria-label="实时语音通话" title={group?'群聊使用文字消息':'实时语音通话'} disabled={!!group} onClick={()=>setRealtime(true)}><PhoneCall size={18}/></button>}<button className="icon-button" aria-label="聊天菜单" aria-expanded={menu} onClick={()=>setMenu(v=>!v)}><MoreHorizontal size={20}/></button></header>
  {menu&&<div className="chat-options"><button onClick={()=>downloadJson(messages,(group?.name||character.name)+'-聊天.json')}><Download size={15}/>导出记录</button>{!group&&<><button onClick={()=>open('characters',character.id)}><Settings size={15}/>编辑人设</button><button onClick={()=>open('face',character.id)}>面对面</button></>}<button onClick={()=>void commit(s=>{s.longChat=!s.longChat;}).catch(()=>{})}>{state.longChat?'只看最近 6 条':'查看完整记录'}</button>{group&&<button onClick={()=>{setGroupTitle(group.name);setGroupDetails(v=>!v);setMenu(false);}}>群成员与群名</button>}{group&&state.agentJobs.filter(j=>j.thread===thread&&j.status!=='completed'&&j.status!=='cancelled').slice(-5).map(j=><button key={j.id} disabled={p.busy} onClick={()=>void resumeReviewJob(j.id)}>续接协作 {j.completed.length}/{j.speakers.length} · {j.status==='planned'?'未完成':'需确认'}</button>)}{group&&state.agentJobs.filter(j=>j.thread===thread&&j.status==='completed').slice(-3).map(j=><div key={j.id} className="helper">审阅证据 {j.completed.filter(id=>reportEvidence(state,j.id,id).valid).length}/{j.completed.length} 项核对一致（不是运行测试）</div>)}{state.mediaOutbox.filter(j=>j.thread===thread&&j.phase!=='completed'&&j.phase!=='cancelled').slice(-6).map(j=><button key={j.id} disabled={p.busy} onClick={()=>void resumeMediaEffect(j.id)}>续接未发送媒体 · {j.command.type} · {j.phase==='queued'?'待交付':'需人工确认'}</button>)}</div>}
  {group&&groupDetails&&<section className="group-details" aria-label="群成员与群名"><form className="inline-form" onSubmit={e=>{e.preventDefault();if(!groupTitle.trim()){toast('给这个群起个名字吧。');return;}void commit(s=>{const g=s.groups.find(v=>v.id===group.id);if(g)g.name=groupTitle.trim().slice(0,160);}).then(()=>toast('群名改好了。')).catch(()=>{});}}><input aria-label="群名称" maxLength={160} value={groupTitle} onChange={e=>setGroupTitle(e.target.value)}/><button className="soft-button" disabled={p.busy}>保存群名</button></form><p className="helper">点名字就能 @；勾选朋友加入这个群。</p><div className="group-member-list">{state.characters.map(c=><div key={c.id}><label><input type="checkbox" aria-label={'群成员 '+c.name} checked={group.members.includes(c.id)} disabled={p.busy||(!group.members.includes(c.id)&&group.members.length>=12)||(group.members.includes(c.id)&&group.members.length===1)} onChange={e=>{const checked=e.target.checked;void commit(s=>{const g=s.groups.find(v=>v.id===group.id);if(g)g.members=checked?[...g.members,c.id]:g.members.filter(id=>id!==c.id);}).catch(()=>{});}}/><Avatar character={c} size="tiny"/></label><button disabled={!group.members.includes(c.id)} onClick={()=>{const next=input+(input&&!/\s$/.test(input)?' ':'')+'@'+c.name+' ';setInput(next);p.setDraft(thread,next);document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus();}}>{c.name}<small>@ 接话</small></button></div>)}</div><button className="text-button" onClick={()=>setGroupDetails(false)}>收起群设置</button></section>}
  {app==='face'&&<div className="scene-caption">窗边的小屋，光线柔和。<br/>你和 {character.name} 坐在一起，慢慢聊。</div>}
  {app==='live'&&<div className="scene-caption">{character.name} 的小小直播间<br/>发送弹幕，聊聊此刻。不连接真实直播平台。</div>}
  <div className="message-flow" ref={viewport} onScroll={()=>{const node=viewport.current;if(node){follow.current=node.scrollHeight-node.scrollTop-node.clientHeight<100;if(follow.current)setShowLatest(false);}}}>{!messages.length&&<div className="chat-day">{localDate()} · 今天</div>}{state.longChat&&messages.length>visibleCount&&<button className="soft-button" onClick={()=>{follow.current=false;setVisibleCount(v=>v+200);}}>查看更早的消息</button>}{shown.map((m,index)=><React.Fragment key={m.id}>{(index===0||m.timestamp-shown[index-1].timestamp>300000)&&<div className="chat-timestamp">{new Date(m.timestamp).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>}<div id={'message-'+m.id} className={`message-row role-${m.role} ${m.id===searchTarget?'search-hit':''} ${index>0&&m.role===shown[index-1].role&&(m.senderId||m.sender)===(shown[index-1].senderId||shown[index-1].sender)&&m.timestamp-shown[index-1].timestamp<120000?'consecutive':''}`}>
   {m.role==='assistant'&&<Avatar character={state.characters.find(c=>m.senderId?c.id===m.senderId:c.name===m.sender)||character} size="tiny"/>}
   <div className="message-wrap">{m.sender&&group&&<small className="speaker-name">{m.sender}</small>}{m.replyTo&&<blockquote className="quoted-message">{messages.find(v=>v.id===m.replyTo)?.text.slice(0,160)||'原消息已删除'}</blockquote>}<MessageCard message={m}/><div className="message-meta"><span>{new Date(m.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}{m.failed?(pendingReply(m.id)?' · 等待回复':' · 回复未完成'):''}</span><button aria-label="消息操作" onClick={()=>setActiveMessage(activeMessage===m.id?'':m.id)}><MoreHorizontal size={13}/></button></div>{m.failed&&!pendingReply(m.id)&&<small className="message-failure"><span>回复未完成</span>{m.role==='user'&&<button disabled={p.busy} onClick={()=>void reply(m.text,false,m.id)}>重新回复这条</button>}</small>}{activeMessage===m.id&&<div className="message-menu"><button onClick={()=>{void commit(s=>{const item=s.threads[thread].find(v=>v.id===m.id);if(item)item.favorite=!item.favorite;}).catch(()=>{});setActiveMessage('');}}>{m.favorite?'取消收藏':'收藏消息'}</button><button onClick={()=>{setReplyTo(m.id);setActiveMessage('');document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus();}}>回复这条</button><button onClick={()=>memory(m)}><Brain size={14}/>记住这件事</button>{group&&m.role==='user'&&m.extracted&&state.workspaceFiles.some(w=>w.thread===thread&&w.sourceId===m.id)&&<button disabled={p.busy} onClick={()=>void reviewWorkspaceFile(m)}>协作审阅文件（按角色计费）</button>}<button onClick={()=>{navigator.clipboard?.writeText(m.text).then(()=>toast('已复制')).catch(()=>toast('浏览器未允许复制。'));}}>复制</button><button onClick={()=>{void commit(s=>{s.threads[thread]=s.threads[thread].filter(v=>v.id!==m.id);}).catch(()=>{});setActiveMessage('');}}><Trash2 size={14}/>删除</button></div>}</div>
  </div></React.Fragment>)}{busyHere&&phase==='reply'&&<div className="message-row role-assistant"><Avatar character={state.characters.find(c=>c.id===activeSpeaker)||character} size="tiny"/><div className="message-card streaming" role="status" aria-label="正在输入">{(!group&&visibleReply(splitRoleplayReply(stream).text))||<span className="typing-dots"><i/><i/><i/></span>}</div></div>}{error&&<div className="chat-error" role="alert"><strong>这次回复没有完成</strong><p>{error}</p><button onClick={()=>open('settings','connection')}>检查 API 连接</button><button disabled={p.busy} onClick={()=>{const last=messages.filter(m=>m.role==='user').at(-1);if(last)void reply(last.text,false,last.id);}}><RotateCw size={13}/>重试回复</button></div>}<div ref={end}/></div>
  {showLatest&&<button className="latest-message" onClick={()=>{follow.current=true;setShowLatest(false);end.current?.scrollIntoView({block:'end',behavior:'smooth'});}}>回到最新消息 ↓</button>}
  {searchTarget&&<div className="chat-search-status" role="status">已定位搜索结果<button onClick={()=>{setSearchTarget('');follow.current=true;}}>回到最新</button></div>}{maintenance&&<small className="maintenance-status" role="status">正在后台整理记忆</small>}
  <div className="composer-area">{recorder.status!=='idle'&&<section className="recorder-panel" aria-label="语音录制"><span>{recorder.status==='requesting'?'正在请求麦克风…':recorder.status==='recording'?'录音中':'录音已就绪'} · {recorder.seconds}s / 120s</span>{recorder.file&&<RecordingPreview file={recorder.file}/>}<div className="button-row">{recorder.status==='recording'&&<button className="primary" onClick={recorder.stop}>停止录音</button>}{recorder.status==='ready'&&<button className="primary" disabled={uploading} onClick={()=>void sendRecording()}>发送原录音</button>}<button className="text-button" disabled={uploading} onClick={recorder.cancel}>取消录音</button></div></section>}{replyTo&&<div className="quoted-message reply-draft"><span>回复：{messages.find(m=>m.id===replyTo)?.text.slice(0,80)||'原消息已删除'}</span><button aria-label="取消引用" onClick={()=>setReplyTo('')}>×</button></div>}{state.roleplay.choices&&!p.busy&&!error&&messages.at(-1)?.role==='assistant'&&!!messages.at(-1)?.suggestions?.length&&<div className="reply-suggestions" aria-label="接话选项"><span>你可以这样接话</span><div>{messages.at(-1)!.suggestions!.map(v=><button type="button" key={v} onClick={()=>{setInput(v);p.setDraft(thread,v);document.querySelector<HTMLTextAreaElement>('.composer textarea')?.focus();}}>{v}<span aria-hidden="true">↗</span></button>)}</div></div>}<div className="composer-tools"><button className="icon-button" aria-label="发送文件、图片或表情包" disabled={uploading||p.busy} onClick={()=>fileInput.current?.click()}><Paperclip size={19}/></button><button className="icon-button" aria-label="表情与心意" aria-expanded={extras} onClick={()=>setExtras(v=>!v)}><Smile size={20}/></button><button className={`icon-button ${recorder.status==='recording'?'active':''}`} aria-label="录制语音消息" disabled={uploading||recorder.status==='requesting'} onClick={()=>void recorder.start()}><Mic size={18}/></button>{busyHere&&<button className="icon-button" aria-label="停止回复" onClick={()=>{void commit(s=>{s.queuedTurns=s.queuedTurns.filter(t=>t.thread!==thread);}).catch(()=>{});abort.current?.abort();}}><Square size={16}/></button>}</div>
   {extras&&<div className="emoji-tray">{['☁️','🤍','🥰','🥺','🌷','🍓','🫶','✨','🐾','🎧','🌙','(｡･ω･｡)'].map(e=><button key={e} onClick={()=>{setInput(v=>v+e);p.setDraft(thread,input+e);}}>{e}</button>)}<div className="heart-actions"><button onClick={()=>setPacket('packet')}>红包</button><button onClick={()=>setPacket('transfer')}>转账</button><button onClick={()=>setPacket('kinship')}>亲属卡</button></div></div>}
   <form className="composer" onSubmit={send}><textarea aria-label="消息内容" maxLength={18000} rows={1} placeholder={app==='live'?'发送一条弹幕…':'把今天的小事说给我听…'} value={input} onChange={e=>{setInput(e.target.value);p.setDraft(thread,e.target.value);}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}}/><button type="submit" className="send-button" disabled={!input.trim()||uploading} aria-label="发送消息"><Send size={18}/></button></form>
   <input ref={fileInput} type="file" multiple hidden onChange={e=>void attach(e.target.files)}/>
  </div>
  {packet&&<div className="sheet-backdrop"><div className="bottom-sheet"><button className="sheet-close icon-button" aria-label="关闭心意卡片" onClick={()=>setPacket('')}><X size={20}/></button><h3>送给 {character.name} 的小心意</h3><p>云币是小手机内的虚拟积分。</p><label className="field"><span>金额 · 可用 {state.wallet} 云币</span><input type="number" min="1" max="100000" value={amount} onChange={e=>setAmount(Number(e.target.value))}/></label><button className="primary" onClick={()=>void sendMoney().catch(()=>{})}>送出心意</button></div></div>}

  {realtime&&<RealtimeCall character={character} thread={thread} onClose={()=>setRealtime(false)}/>}

 </div>;
}
