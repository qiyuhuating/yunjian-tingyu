import {z} from 'zod';
import {samplingSchema} from './phone-model';
import {providerSchema,providerBase} from './providers';
import {chatInput,wireRequest,modelsRequest,extractModels,normalizeStream,type ChatInput} from './provider-adapter';
import {extractModelLimits} from './context-window';
import {ProviderError,upstreamFailure} from './provider-errors';
export {ProviderError} from './provider-errors';
export const connectionInput=z.object({provider:providerSchema,apiKey:z.string().trim().min(8).max(2048),baseURL:z.string().trim().max(1500).default('')}).strict();
export const probeInput=connectionInput.extend({model:z.string().trim().min(1).max(160)});
export function connectionProbe(input:z.infer<typeof probeInput>):ChatInput{return chatInput.parse({...input,sampling:samplingSchema.parse({maxTokens:128}),messages:[{role:'system',content:'This is an API connectivity check. Reply briefly.'},{role:'user',content:'请只回复：连接成功。'}]});}
async function upstream(url:string,init:RequestInit,network:typeof fetch,signal:AbortSignal|undefined,timeout:number){
 const timed=AbortSignal.timeout(timeout),combined=signal?AbortSignal.any([signal,timed]):timed;
 try{
  combined.throwIfAborted();const response=await network(url,{...init,signal:combined,redirect:'error'});
  if(!response.ok){
   let error;const reader=response.body?.getReader();if(reader){let text='',size=0;const decoder=new TextDecoder();try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16384)break;text+=decoder.decode(value,{stream:true});}text+=decoder.decode();error=JSON.parse(text).error;}catch{}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}}
   throw upstreamFailure(response.status,error,response.headers.get('Retry-After'));
  }
  if(response.headers.get('content-type')?.includes('text/html')){await response.body?.cancel();throw new ProviderError(502,'API 返回了 HTML 网页。请填写接口地址，而不是控制台或登录页面地址。');}
  return response;
 }catch(error){if(signal?.aborted)throw signal.reason;if(error instanceof ProviderError)throw error;if(timed.aborted||error instanceof Error&&error.name==='TimeoutError')throw new ProviderError(504,'连接超时。请检查网络、服务商状态，或稍后重试。');const safe=error instanceof Error?error.message:'';if(/^(?:模型列表读取超过|等待 AI 首次响应超时|AI 回复长时间没有新数据|无法解析服务商地址|服务商的安全连接校验失败|无法连接服务商|服务商响应超时|接口返回了重定向)/.test(safe))throw new ProviderError(/超时|超过|长时间没有/.test(safe)?504:502,safe);throw new ProviderError(502,'网络连接失败。请检查网络、HTTPS API 地址和服务商可用性。');}
}
export async function fetchModels(input:z.infer<typeof connectionInput>,network:typeof fetch=fetch,signal?:AbortSignal){
 const parsed=connectionInput.parse(input);let wire;try{wire=modelsRequest(parsed.provider,parsed.apiKey,parsed.baseURL);}catch(error){throw new ProviderError(422,error instanceof Error?error.message:'请检查 HTTPS API 地址。');}const response=await upstream(wire.url,{headers:wire.headers},network,signal,20000);
 const text=await response.text();if(text.length>4000000)throw new ProviderError(502,'服务商返回的模型列表过大。');let body;try{body=JSON.parse(text);}catch{throw new ProviderError(502,'接口没有返回有效的模型列表，可手动填写模型 ID 后测试。');}
 if(body.error)throw upstreamFailure(Number(body.error.code)||502,body.error);
 return {models:extractModels(parsed.provider,body),limits:extractModelLimits(parsed.provider,body)};
}
export async function fetchChat(input:ChatInput,network:typeof fetch=fetch,signal?:AbortSignal){
 let wire;try{wire=wireRequest(input);}catch(error){throw new ProviderError(422,error instanceof Error?error.message:'请检查 HTTPS API 地址。');}const response=await upstream(wire.url,{method:'POST',headers:wire.headers,body:JSON.stringify(wire.body)},network,signal,120000);
 if(!response.body)throw new ProviderError(502,'AI 返回了空响应。');
 if(response.headers.get('content-type')?.includes('application/json')){
  const body=await response.json() as {error?:{code?:unknown;message?:unknown;type?:unknown}};if(body.error)throw upstreamFailure(Number(body.error.code)||502,body.error);
  throw new ProviderError(502,'接口未返回流式回复。请确认该地址支持所选服务商的流式聊天协议。');
 }
 return new Response(normalizeStream(response.body,wire.protocol),{headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store'}});
}
export function normalizedConnection(input:z.infer<typeof probeInput>){return {...input,model:input.model.trim(),baseURL:providerBase(input.provider,input.baseURL)};}
