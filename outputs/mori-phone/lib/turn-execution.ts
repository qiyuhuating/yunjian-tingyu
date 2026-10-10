import {conversationReply} from './conversation-reply';
import {groupDelay,waitForReply} from './group-cadence';
import {groupSpeakers} from './group-chat';
import {uid,type PhoneState} from './phone-model';
import {beginTurn,markRequesting,markCommitted,receiptFor,remainingSpeakers} from './turn-receipts';
import type {MediaCommand} from './media-contract';
import {queueMedia,beginMediaDelivery,interruptMediaDelivery} from './media-outbox';
import type {MediaEffect} from './media-outbox';

export type TurnMode='chat'|'face'|'group'|'live';
export type TurnPhase='waiting'|'requesting'|'persisting'|'media';
export type TurnRequest={thread:string;userId:string;text:string;mode:TurnMode;speakers?:string[];allowManualRetry?:boolean};
type Asset={url:string;id:string;mime:string;size:number;name:string};
export type TurnServices={
 snapshot:()=>PhoneState;
 commit:(change:(state:PhoneState)=>void)=>Promise<void>;
 requestAI:(text:string,characterId:string,thread:string,mode:TurnMode,onDelta?:(value:string)=>void,signal?:AbortSignal,onMedia?:(file:File)=>void,useDefaultConnection?:boolean,causalUserId?:string)=>Promise<string>;
 upload:(file:File)=>Promise<Asset>;
 deliverMedia:(commands:MediaCommand[],speaker:string,thread:string,signal:AbortSignal,effectId?:string,attempt?:number)=>Promise<void>;
 signal:AbortSignal;
 onPhase?:(phase:TurnPhase)=>void;
 onWait?:(waiting:boolean)=>void;
 onSpeaker?:(speaker:string)=>void;
 onDelta?:(value:string)=>void;
 onRemaining?:(remaining:string[])=>void;
 onVoice?:(message:string)=>void;
 onRequest?:(attempt:number)=>void;
 isVisible?:(thread:string)=>boolean;
};

/** Deliberately deterministic: one model call per speaker; no automatic retries. */
export async function executeTurn(request:TurnRequest,p:TurnServices):Promise<string[]>{
 const {thread,userId,text,mode}=request,group=mode==='group',initial=p.snapshot();
 const user=initial.threads[thread]?.find(m=>m.id===userId&&m.role==='user');
 if(!user)throw new Error('发送记录已经不存在，请确认本机数据后重试。');
 if(!user.failed&&!receiptFor(initial,userId))throw new Error('本条消息已回复，不能再次自动执行。');
 if(user.text!==text)throw new Error('原消息已修改，不能使用旧草稿发送。');
 if(!group&&!initial.characters.some(c=>c.id===thread))throw new Error('聊天角色已不存在，禁止误用其他角色回复。');
 const existing=receiptFor(initial,userId);
 const planned=existing?remainingSpeakers(existing):(group?(request.speakers??groupSpeakers(initial,thread,text,userId)):[thread]);
 if(!planned.length)throw new Error('该回合已经结束，请勿重复调用模型。');
 if(new Set(planned).size!==planned.length||planned.some(id=>!initial.characters.some(c=>c.id===id)||
  (group&&!initial.groups.find(g=>g.id===thread)?.members.includes(id))))
  throw new Error('群成员已变化，请重新选择要回复的角色。');
 let speakers:string[]=[];
 // The plan and the user message become durable before the first provider POST.
 await p.commit(state=>{speakers=beginTurn(state,{userId,thread,mode,speakers:planned},request.allowManualRetry);});
 p.onRemaining?.([...speakers]);
 for(let index=0;index<speakers.length;index++){
  p.signal.throwIfAborted();
  const speaker=speakers[index],current=p.snapshot(),character=current.characters.find(c=>c.id===speaker);
  if(!character||(group&&!current.groups.find(g=>g.id===thread)?.members.includes(speaker)))
   throw new Error('群成员已变化，本轮停止，已完成的回复仍保留。');
  p.onSpeaker?.(speaker);
  if(group){
   p.onPhase?.('waiting');p.onWait?.(true);
   try{await waitForReply(groupDelay(current.groupSettings,index,text.length),p.signal);}
   finally{p.onWait?.(false);}
  }
  // Do not charge for a deleted or edited request after a simulated group delay.
  const latest=p.snapshot(),source=latest.threads[thread]?.find(m=>m.id===userId&&m.role==='user');
  if(!source||source.text!==text||!latest.characters.some(c=>c.id===speaker)||
   (group&&!latest.groups.find(g=>g.id===thread)?.members.includes(speaker)))
   throw new Error('等待期间消息或角色已修改，旧请求没有发送。');
  // Persist uncertainty BEFORE posting. If the app dies here, never auto resend.
  let requestAttempt=0;
  await p.commit(state=>{requestAttempt=markRequesting(state,userId,speaker);});
  p.onRequest?.(requestAttempt);
  p.onPhase?.('requesting');p.onDelta?.('');
  const turnText=text; // Run guidance must not change the causal source message.
  const nativeFiles:File[]=[];
  const answer=await p.requestAI(turnText,speaker,thread,mode,p.onDelta,p.signal,file=>nativeFiles.push(file),false,userId);
  const parsed=conversationReply(answer,group,index>0||nativeFiles.length>0);
  // Commit all bubbles from one speaker as a unit. A mid-bubble storage
  // failure must not leave half that speaker's response or gain affection twice.
  p.signal.throwIfAborted();
  p.onPhase?.('persisting');
  let mediaJobs:MediaEffect[]=[];
  await p.commit(state=>{
   const target=state.threads[thread]?.find(m=>m.id===userId&&m.role==='user');
   if(!target||target.text!==text)throw new Error('原用户消息已删除或编辑，不再写入旧回复。');
   const c=state.characters.find(v=>v.id===speaker);
   if(!c||(group&&!state.groups.find(g=>g.id===thread)?.members.includes(speaker)))
    throw new Error('回复期间群成员已修改，取消旧回复写入。');
   // Fence before any mutation: late provider responses must not become messages.
   const complete=markCommitted(state,userId,speaker,requestAttempt);
   for(const bubble of parsed.bubbles){
    (state.threads[thread]??=[]).push({
     id:uid(),role:'assistant',text:bubble,kind:'text',timestamp:Date.now(),sender:c.name,senderId:speaker,turnId:userId,
     suggestions:!group&&state.roleplay.choices?parsed.suggestions:[],
     read:p.isVisible?.(thread)??false
    });
   }
   target.failed=!complete;if(complete)delete target.failureReason;
   if(parsed.bubbles.length){c.affection=Math.min(100,c.affection+1);c.trust=Math.min(100,c.trust+1);}
   mediaJobs=queueMedia(state,{thread,userId,speaker},parsed.commands);
  });
  p.onRemaining?.(speakers.slice(index+1));
  p.onDelta?.('');
  if(current.voiceSettings.autoRead&&parsed.bubbles.length)p.onVoice?.(parsed.bubbles.join('。'));
  // The conversational answer has already committed. Optional media
  // failures should not force the user to repay for the same text generation.
  const mediaFailure=async(error:unknown)=>{
   if(p.signal.aborted)throw error;
   await p.commit(state=>{
    if(!state.threads[thread]?.some(m=>m.id===userId))return;
    (state.threads[thread]??=[]).push({id:uid(),role:'system',kind:'notice',
     text:'媒体未发送：'+(error instanceof Error?error.message:'处理失败。'),
     timestamp:Date.now(),read:true});
   });
  };
  if(nativeFiles.length){
   p.onPhase?.('media');
   for(const file of nativeFiles){
    try{
     p.signal.throwIfAborted();const asset=await p.upload(file);
     if(!/^(image|audio|video)\//.test(asset.mime))throw new Error('模型返回的媒体文件格式无法确认。');
     p.signal.throwIfAborted();
     await p.commit(state=>{
      if(!state.threads[thread]?.some(m=>m.id===userId))throw new Error('原消息已删除，媒体不再写入。');
      (state.threads[thread]??=[]).push({id:uid(),role:'assistant',text:'',
       kind:asset.mime.startsWith('image/')?'image':asset.mime.startsWith('audio/')?'voice':'file',
       timestamp:Date.now(),asset:asset.url,mime:asset.mime,fileSize:asset.size,fileName:asset.name,
       sender:cName(state,speaker),senderId:speaker,turnId:userId,read:p.isVisible?.(thread)??false,
       attachmentStatus:'模型原生生成的媒体'});
     });
    }catch(e){await mediaFailure(e);}
   }
  }
  for(const job of mediaJobs){
   p.onPhase?.('media');
   let attempt=0;
   try{
    p.signal.throwIfAborted();
    await p.commit(state=>{attempt=beginMediaDelivery(state,job.id);});
    await p.deliverMedia([job.command],speaker,thread,p.signal,job.id,attempt);
    if(p.snapshot().mediaOutbox.find(j=>j.id===job.id)?.phase!=='completed')
     throw new Error('媒体输出尚未写入回执，需人工核查。');
   }catch(e){
    if(attempt>0)await p.commit(state=>interruptMediaDelivery(state,job.id,attempt,e instanceof Error?e.message:'媒体中断')).catch(()=>{});
    await mediaFailure(e);
   }
  }
 }
 return speakers;
}
function cName(state:PhoneState,speaker:string){return state.characters.find(c=>c.id===speaker)?.name||'角色';}

/**
 * Only an explicit failed-message retry may enqueue. Scope and deduplicate
 * by persisted message ID, never by text (identical messages may be intentional).
 */
export type PendingTurn={thread:string;text:string;id:string};
export class PendingTurnQueue{
 private entries:PendingTurn[]=[];
 enqueue(item:PendingTurn){
  if(!this.entries.some(v=>v.id===item.id))this.entries.push({...item});
 }
 has(id:string){return this.entries.some(v=>v.id===id);}
 prune(valid:(item:PendingTurn)=>boolean){this.entries=this.entries.filter(valid);}
 take(thread:string,valid:(item:PendingTurn)=>boolean){
  this.prune(valid);
  const index=this.entries.findIndex(v=>v.thread===thread);
  return index<0?null:this.entries.splice(index,1)[0];
 }
 count(){return this.entries.length;}
}
