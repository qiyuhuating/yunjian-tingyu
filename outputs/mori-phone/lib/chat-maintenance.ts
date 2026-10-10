import type {PhoneState} from './phone-model';
import {memoryTask,applyMemoryResult} from './character-memory';
import {summaryNeeded,summaryPrompt} from './continuity';

type Services={snapshot:()=>PhoneState;commit:(change:(s:PhoneState)=>void)=>Promise<void>;requestAI:(text:string,character:string,thread:string,mode:'summary',delta:undefined,signal:AbortSignal)=>Promise<string>;toast:(text:string)=>void};
// Background work is serialized separately from visible turns. It can never overwrite a newer conversation snapshot.
export async function maintainConversation(p:Services,speakers:string[],thread:string,signal:AbortSignal){
 for(const speaker of speakers){signal.throwIfAborted();const task=memoryTask(p.snapshot(),speaker,thread);if(!task)continue;try{const answer=await p.requestAI(task.prompt,speaker,thread,'summary',undefined,signal);signal.throwIfAborted();await p.commit(s=>applyMemoryResult(s,task,answer));}catch(e){if(signal.aborted)throw e;p.toast('聊天已保存；这次记忆未能整理，稍后重试。');}}
 const state=p.snapshot();if(!summaryNeeded(state,thread)||!speakers[0])return;const task=summaryPrompt(state,thread);
 try{const answer=await p.requestAI(task.prompt,speakers[0],thread,'summary',undefined,signal);signal.throwIfAborted();await p.commit(s=>{if(!answer.trim()||!task.sources.every(source=>s.threads[thread]?.some(m=>m.id===source.id&&m.text===source.text&&m.role===source.role&&m.senderId===source.senderId&&m.timestamp===source.timestamp&&!m.failed))||s.continuity[thread]?.through!==state.continuity[thread]?.through||s.continuity[thread]?.text!==state.continuity[thread]?.text)return;s.continuity[thread]={text:answer.trim().slice(0,6000),through:task.through,updatedAt:Date.now(),sources:task.sources.map(source=>({id:source.id,role:source.role==='system'?'user':source.role,timestamp:source.timestamp,...(source.senderId?{senderId:source.senderId}:{}),excerpt:source.text.slice(0,2000)}))};});}catch(e){if(signal.aborted)throw e;p.toast('聊天已保存；这次摘要未能整理，稍后重试。');}
}
