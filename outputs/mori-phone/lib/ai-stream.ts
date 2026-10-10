import {parseUsage,type AIUsage} from './chat-prompt';
import {nativeMediaSchema,type NativeMediaPart} from './native-media';

/**
 * A single bounded SSE decoder for browser and Android bridge responses.
 * Only [DONE] is a successful completion. A truncated stream is never committed.
 * Media is staged until the complete response passes validation.
 */
export type ChatStreamResult={
 answer:string;usage:AIUsage|null;firstTokenMs:number|null;finishReason:string;generated:NativeMediaPart[];
};
export type ChatStreamOptions={
 signal?:AbortSignal;onDelta?:(answer:string)=>void;allowMedia?:boolean;started:number;
};
const MAX_EVENT_BYTES=12*1024*1024,MAX_ANSWER_CHARS=18000,MAX_MEDIA_CHARS=11200000;
export async function readChatStream(response:Response,options:ChatStreamOptions):Promise<ChatStreamResult>{
 const reader=response.body?.getReader();
 if(!reader)throw new Error('AI 返回了空响应。');
 const decoder=new TextDecoder(),generated:NativeMediaPart[]=[];
 let pending='',crPending=false,doneMarker=false,answer='',finishReason='',usage:AIUsage|null=null;
 let firstTokenMs:number|null=null,mediaChars=0;
 const append=(part:string)=>{
  const joined=(crPending?'\\r':'')+part;
  crPending=joined.endsWith('\\r');
  const ready=crPending?joined.slice(0,-1):joined;
  pending+=ready.replace(/\\r\\n?/g,'\\n');
  if(pending.length>MAX_EVENT_BYTES)throw new Error('AI 返回的流式事件过大，已中止接收。');
 };
 const frame=(raw:string)=>{
  const lines=raw.split('\\n');
  const data=lines.filter(line=>line==='data'||line.startsWith('data:')).map(line=>line==='data'?'':line.slice(5).trimStart()).join('\\n');
  if(!data)return;
  if(data==='[DONE]'){doneMarker=true;return;}
  if(doneMarker)throw new Error('AI 在结束标记后仍返回了数据。');
  let item:unknown;
  try{item=JSON.parse(data);}catch{throw new Error('AI 返回了无法读取的流式数据。');}
  if(!item||typeof item!=='object')throw new Error('AI 返回了不正确的流式结构。');
  const value=item as Record<string,unknown>;
  if(value.error){const detail=value.error as {message?:unknown};throw new Error(typeof detail?.message==='string'?detail.message:'AI 服务中断了回复，请重试。');}
  if(value.media){
   if(!options.allowMedia)throw new Error('此操作不接收媒体回复。');
   if(!Array.isArray(value.media))throw new Error('AI 返回了不正确的媒体结构。');
   for(const part of value.media){
    const media=nativeMediaSchema.parse(part);
    mediaChars+=media.data.length;
    if(mediaChars>MAX_MEDIA_CHARS||generated.length>=4096)throw new Error('原生媒体超过接收预算。');
    generated.push(media);
   }
  }
  const reported=parseUsage(value.usage);
  if(reported)usage=reported;
  const choice=Array.isArray(value.choices)?value.choices[0] as {delta?:{content?:unknown};finish_reason?:unknown}|undefined:undefined;
  if(typeof choice?.finish_reason==='string')finishReason=choice.finish_reason;
  if(typeof choice?.delta?.content==='string'){
   const delta=choice.delta.content;
   if(delta&&firstTokenMs===null)firstTokenMs=performance.now()-options.started;
   answer+=delta;
   if(answer.length>MAX_ANSWER_CHARS)throw new Error('回复太长，请在模型设置中缩短回复。');
   if(delta)options.onDelta?.(answer);
  }
 };
 const consume=()=>{
  let at:number;
  while((at=pending.indexOf('\\n\\n'))!==-1){
   const raw=pending.slice(0,at);pending=pending.slice(at+2);
   frame(raw);
  }
 };
 try{
  for(;;){
   options.signal?.throwIfAborted();
   const {value,done}=await reader.read();
   if(done)break;
   append(decoder.decode(value,{stream:true}));consume();
  }
  append(decoder.decode());
  if(crPending){crPending=false;pending+='\\n';}
  consume();
  if(pending.trim())frame(pending);
  options.signal?.throwIfAborted();
  if(!doneMarker)throw new Error('回复传输中断，请检查网络后手动重试。');
  return {answer,usage,firstTokenMs,finishReason,generated};
 }finally{
  await reader.cancel().catch(()=>{});
  reader.releaseLock();
 }
}
