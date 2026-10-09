import {connectionProbe,normalizedConnection,type probeInput} from './provider-transport';
import type {z} from 'zod';
export async function testConnection(input:z.infer<typeof probeInput>,signal?:AbortSignal){
 const timeout=AbortSignal.timeout(45000),combined=signal?AbortSignal.any([signal,timeout]):timeout;
 try{
  const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(connectionProbe(normalizedConnection(input))),signal:combined});
  if(!response.ok){let message='连接未完成，请检查 Key、模型和 API 地址。';try{const body=await response.json() as {error?:string};if(typeof body.error==='string')message=body.error;}catch{}throw new Error(message);}
  const reader=response.body?.getReader();if(!reader)throw new Error('服务商返回了空响应。');const decoder=new TextDecoder();let pending='',answer='',complete=false,finishReason='';
  const event=(raw:string)=>{const data=raw.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!data)return;if(data==='[DONE]'){complete=true;return;}const body=JSON.parse(data);if(body.error)throw new Error(body.error.message||'服务商中断了连接。');answer+=body.choices?.[0]?.delta?.content||'';finishReason=body.choices?.[0]?.finish_reason||finishReason;if(answer.length>4000)throw new Error('测试回复异常过长，请检查接口协议。');};
  try{for(;;){const {value,done}=await reader.read();pending+=done?decoder.decode():decoder.decode(value,{stream:true});pending=pending.replace(/\r\n/g,'\n');if(pending.length>64000)throw new Error('接口返回的数据无法识别，请检查 API 地址。');let at;while((at=pending.indexOf('\n\n'))!==-1){event(pending.slice(0,at));pending=pending.slice(at+2);}if(done)break;}if(pending.trim())event(pending);}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  if(!complete)throw new Error('回复传输中断，请检查网络后重试。');if(!answer.trim())throw new Error('服务商没有返回正文，请检查模型权限。');if(finishReason==='length')throw new Error('测试回复达到长度上限，请尝试非思考模型。');return answer.trim().slice(0,160);
 }catch(error){if(signal?.aborted)throw new DOMException('已取消连接测试。','AbortError');if(timeout.aborted)throw new Error('连接测试超时。请检查网络，或尝试其他模型。');throw error;}
}
