import type {PhoneState} from './phone-model';
import type {ProviderId} from './providers';
import {connectionStatusMessage} from './connection-reliability';

/** A genuine API probe: no role card, chat history, memory or user media. */
export type ConnectionProbe={provider:ProviderId;model:string;baseURL:string;apiKey:string;sampling:PhoneState['sampling']};
export async function probeAIConnection(input:ConnectionProbe,transport:typeof fetch=fetch):Promise<string>{
 if(input.apiKey.trim().length<8||!input.model.trim())throw new Error('请先保存有效的 Key 和模型 ID。');
 const timeout=AbortSignal.timeout(65000);
 const payload={
  provider:input.provider,model:input.model,baseURL:input.baseURL,apiKey:input.apiKey.trim(),
  sampling:{...input.sampling,maxTokens:128,thinking:false,penalties:false,sendRepetition:false},
  messages:[{role:'system',content:'这是一次 API 连通性检查。请简短回答，不需要角色扮演。'},{role:'user',content:'请只回复：连接成功'}]
 };
 let response:Response;
 try{response=await transport('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:timeout});}
 catch(error){if(timeout.aborted)throw new Error('连接测试超过 65 秒，已停止等待。请检查网络、模型响应速度或服务商状态。');throw error;}
 if(!response.ok){await response.body?.cancel().catch(()=>{});throw new Error(connectionStatusMessage(response.status,'chat'));}
 if(!response.body)throw new Error('连接返回空响应，请核对聊天接口。');
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',answer='',complete=false;
 const consume=(event:string)=>{
  const data=event.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
  if(!data)return;if(data==='[DONE]'){complete=true;return;}
  let item:any;try{item=JSON.parse(data);}catch{throw new Error('连接返回了不完整的流式数据。');}
  if(item.error)throw new Error(item.error.message==='AI 流式回复超时，请检查网络并手动重试。'?item.error.message:'AI 回复传输中断，请重试。');
  const delta=item.choices?.[0]?.delta?.content;
  if(typeof delta==='string')answer=(answer+delta).slice(0,500);
 };
 try{
  for(;;){
   const {value,done}=await reader.read();if(done)break;
   pending+=decoder.decode(value,{stream:true});if(pending.length>131072)throw new Error('连接测试响应过大。');
   pending=pending.replace(/\r\n/g,'\n');let split;
   while((split=pending.indexOf('\n\n'))!==-1){consume(pending.slice(0,split));pending=pending.slice(split+2);}
  }
  pending+=decoder.decode();if(pending.trim())consume(pending);
 }catch(error){if(timeout.aborted)throw new Error('连接测试超过 65 秒，请检查服务商响应速度。');throw error;}
 finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 if(!complete)throw new Error('连接已建立，但 AI 回复提前中断；请检查网络或模型。');
 return answer.trim()||'已收到服务商完整响应';
}
