import {z} from 'zod';
import {nativeMediaSchema} from './native-media';
import {samplingSchema} from './phone-model';
import {samplingParameters} from './chat-prompt';
import {capabilities,getProvider,providerBase,providerSchema} from './providers';
import {reasoningPlan} from './reasoning';
import {ProviderError,upstreamFailure} from './provider-errors';
const image=z.object({type:z.literal('image_url'),image_url:z.object({url:z.string().max(5700000).regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/)}).strict()}).strict();
const nativeMedia=z.object({type:z.literal('native_media'),native_media:z.object({mimeType:z.enum(['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/flac','audio/aac','video/mp4','video/webm']),data:z.string().max(11200000).regex(/^[A-Za-z0-9+/]+=*$/)}).strict()}).strict();
const text=z.object({type:z.literal('text'),text:z.string().max(200000)}).strict();
export const chatInput=z.object({provider:providerSchema,model:z.string().min(1).max(160),apiKey:z.string().min(8).max(2048),baseURL:z.string().max(1500).default(''),sampling:samplingSchema,supportedParameters:z.array(z.string().min(1).max(80)).max(80).optional(),messages:z.array(z.object({role:z.enum(['system','user','assistant']),content:z.union([z.string().max(200000),z.array(z.union([image,text,nativeMedia])).max(3)])}).strict()).min(2).max(100010)}).strict().superRefine((data,ctx)=>{
 let images=0,chars=0;for(const m of data.messages){if(typeof m.content==='string')chars+=m.content.length;else for(const p of m.content){if(p.type==='image_url')images++;else if(p.type==='native_media'){images++;if(data.provider!=='gemini')ctx.addIssue({code:'custom',message:'当前适配器不支持原生音视频，请使用转写文本。'});}else chars+=p.text.length;}if(m.role==='system'&&typeof m.content!=='string')ctx.addIssue({code:'custom',message:'系统背景只能包含文字'});}
 if(images>2||chars>16777216||data.messages[0].role!=='system'||data.messages.slice(1).some(m=>m.role==='system'))ctx.addIssue({code:'custom',message:'对话上下文格式不正确或过大'});
});
export type ChatInput=z.infer<typeof chatInput>;
function imageData(part:z.infer<typeof image>|z.infer<typeof text>|z.infer<typeof nativeMedia>){if(part.type!=='image_url')throw new Error('此服务商不支持原生音视频。');return part.image_url.url;}
export function wireRequest(data:ChatInput){
 const preset=getProvider(data.provider),base=providerBase(data.provider,data.baseURL),p=data.sampling,c=capabilities(data.provider,data.model),reasoning=reasoningPlan(data.provider==='openrouter'&&(data.supportedParameters?!data.supportedParameters.includes('reasoning'):data.model.endsWith(':free')||data.model==='openrouter/free')?'compatible':data.provider,data.model,p.thinking,p.reasoningEffort),thinking=reasoning.budget>0,maxTokens=p.maxTokens+reasoning.budget;
 const headers:Record<string,string>={'Content-Type':'application/json','Accept':'text/event-stream'};
 let url:string,body:Record<string,unknown>;
 if(preset.protocol==='anthropic'){
  headers['x-api-key']=data.apiKey;headers['anthropic-version']='2023-06-01';url=base+'/messages';
  const convert=(content:ChatInput['messages'][number]['content'])=>typeof content==='string'?content:content.map(part=>part.type==='text'?part:{type:'image',source:{type:'base64',media_type:imageData(part).match(/^data:([^;]+)/)![1],data:imageData(part).split(',')[1]}});
  const messages:{role:string;content:any[]}[]=[];
  for(const m of data.messages.slice(1)){const converted=convert(m.content),blocks=typeof converted==='string'?[{type:'text',text:converted}]:converted;const last=messages.at(-1);if(last?.role===m.role)last.content.push(...blocks);else messages.push({role:m.role,content:blocks});}
  const stable=messages.slice(0,-1).at(-1)?.content.at(-1);if(stable?.type==='text')stable.cache_control={type:'ephemeral'};
  body={model:data.model,system:[{type:'text',text:data.messages[0].content,cache_control:{type:'ephemeral'}}],messages,max_tokens:maxTokens,stream:true,...(c.temperature&&!thinking?{temperature:Math.min(1,p.temperature)}:{}),...reasoning.params};
 }else if(preset.protocol==='gemini'){
  headers['x-goog-api-key']=data.apiKey;url=base+'/models/'+encodeURIComponent(data.model)+':streamGenerateContent?alt=sse';
  const contents:{role:string;parts:any[]}[]=[];
  for(const m of data.messages.slice(1)){const parts=typeof m.content==='string'?[{text:m.content}]:m.content.map(part=>part.type==='text'?{text:part.text}:part.type==='native_media'?{inlineData:part.native_media}:{inlineData:{mimeType:imageData(part).match(/^data:([^;]+)/)![1],data:imageData(part).split(',')[1]}}),role=m.role==='assistant'?'model':'user',last=contents.at(-1);if(last?.role===role)last.parts.push(...parts);else contents.push({role,parts});}
  body={systemInstruction:{parts:[{text:data.messages[0].content}]},contents,generationConfig:{...(/(?:image|nano-banana)/i.test(data.model)?{responseModalities:['TEXT','IMAGE']}:{}),maxOutputTokens:maxTokens,temperature:Math.min(c.temperatureMax,p.temperature),topP:p.topP,...(c.penalties?{frequencyPenalty:p.frequencyPenalty,presencePenalty:p.presencePenalty}:{}),...reasoning.params}};
 }else{
  headers.Authorization='Bearer '+data.apiKey;url=base+'/chat/completions';
  const params=samplingParameters(data,data.supportedParameters);
  body={model:data.model,messages:data.messages,stream:true,...params,[data.provider==='openai'?'max_completion_tokens':'max_tokens']:maxTokens,...reasoning.params,...(data.provider==='openai'?{store:false}:{}),...(!['deepseek','zhipu','compatible'].includes(data.provider)?{stream_options:{include_usage:true}}:{}),...(data.provider==='openrouter'&&(['frequency_penalty','presence_penalty','repetition_penalty'].some(key=>key in params)||reasoning.supported)?{provider:{require_parameters:true}}:{})};
 }
 return {url,headers,body,protocol:preset.protocol};
}
export function modelsRequest(provider:ChatInput['provider'],apiKey:string,baseURL=''){
 const p=getProvider(provider),base=providerBase(provider,baseURL),headers:Record<string,string>={Accept:'application/json'};
 if(p.protocol==='anthropic'){headers['x-api-key']=apiKey;headers['anthropic-version']='2023-06-01';}else if(p.protocol==='gemini')headers['x-goog-api-key']=apiKey;else headers.Authorization='Bearer '+apiKey;
 return {url:base+'/models',headers};
}
export function extractModels(provider:ChatInput['provider'],body:any){const list=getProvider(provider).protocol==='gemini'?(body.models||[]).filter((m:any)=>m.supportedGenerationMethods?.includes('generateContent')).map((m:any)=>m.name?.replace(/^models\//,'')):(body.data||[]).map((m:any)=>m.id);return [...new Set(list.filter((id:unknown)=>typeof id==='string'&&id.length>0&&id.length<=160))].slice(0,1200) as string[];}

// Normalize native events without storing a request or response. A completion marker is required for a successful stream.
export function normalizeStream(source:ReadableStream<Uint8Array>,protocol:'openai'|'anthropic'|'gemini'){
 const reader=source.getReader(),decoder=new TextDecoder(),encoder=new TextEncoder();let pending='',finished=false,ended=false,finishReason='',usage:any=null,parts:Uint8Array[]=[];
 const emit=(v:unknown)=>parts.push(encoder.encode('data: '+(typeof v==='string'?v:JSON.stringify(v))+'\n\n'));
 const delta=(s:string)=>{if(s)emit({choices:[{delta:{content:s},finish_reason:null}]});};
 const finish=()=>{if(finished)return;finished=true;if(usage)emit({choices:[],usage});if(finishReason)emit({choices:[{delta:{},finish_reason:finishReason}]});emit('[DONE]');};
 const event=(raw:string)=>{
  const lines=raw.split('\n'),data=lines.filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!data)return;if(data==='[DONE]'){finish();return;}const obj=JSON.parse(data);if(obj.error||obj.type==='error'||obj.choices?.[0]?.error||obj.choices?.[0]?.finish_reason==='error'){const error=obj.error||obj.choices?.[0]?.error||obj;throw upstreamFailure(Number(error.code)||502,error);}
  if(protocol==='openai'){if(obj.usage)usage=obj.usage;if(obj.choices?.[0]?.finish_reason)finishReason=obj.choices[0].finish_reason;emit(obj);}
  else if(protocol==='anthropic'){
   if(obj.type==='message_start'){const u=obj.message?.usage;if(u&&typeof u.input_tokens==='number'&&typeof u.output_tokens==='number')usage={prompt_tokens:u.input_tokens+(u.cache_creation_input_tokens||0)+(u.cache_read_input_tokens||0),completion_tokens:u.output_tokens,...(typeof u.cache_read_input_tokens==='number'?{prompt_cache_hit_tokens:u.cache_read_input_tokens}:{})};}
   if(obj.type==='content_block_delta'&&obj.delta?.type==='text_delta')delta(obj.delta.text);
   if(obj.type==='message_delta'){if(obj.usage&&usage)usage.completion_tokens=obj.usage.output_tokens??usage.completion_tokens;finishReason=obj.delta?.stop_reason==='max_tokens'?'length':obj.delta?.stop_reason?'stop':finishReason;}
   if(obj.type==='message_stop')finish();
  }else{
   for(const p of obj.candidates?.[0]?.content?.parts||[]){if(p.thought)continue;if(typeof p.text==='string')delta(p.text);if(p.inlineData){const media=nativeMediaSchema.parse({mime:p.inlineData.mimeType,data:p.inlineData.data});emit({media:[media]});}}
   const reason=obj.candidates?.[0]?.finishReason;if(reason&&reason!=='MAX_TOKENS'&&reason!=='STOP')throw new Error('blocked_response');if(reason)finishReason=reason==='MAX_TOKENS'?'length':'stop';
   const u=obj.usageMetadata;if(u&&typeof u.promptTokenCount==='number'&&typeof u.candidatesTokenCount==='number')usage={prompt_tokens:u.promptTokenCount,completion_tokens:u.candidatesTokenCount+(u.thoughtsTokenCount||0),...(typeof u.cachedContentTokenCount==='number'?{prompt_cache_hit_tokens:u.cachedContentTokenCount}:{})};
  }
 };
 return new ReadableStream<Uint8Array>({async pull(controller){
  try{while(!parts.length&&!ended){const {value,done}=await reader.read();pending+=done?decoder.decode():decoder.decode(value,{stream:true});if(pending.length>24*1024*1024)throw new Error('oversized_event');pending=pending.replace(/\r\n/g,'\n');let split:number;while((split=pending.indexOf('\n\n'))!==-1){const raw=pending.slice(0,split);pending=pending.slice(split+2);event(raw);}if(finished){ended=true;await reader.cancel();reader.releaseLock();}else if(done){if(pending.trim())event(pending);if(!finished){if(protocol==='gemini'&&finishReason)finish();else throw new Error('incomplete_stream');}ended=true;reader.releaseLock();}}
   const next=parts.shift();if(next)controller.enqueue(next);else if(ended)controller.close();
  }catch(error){await reader.cancel().catch(()=>{});ended=true;parts=[];controller.enqueue(encoder.encode('data: '+JSON.stringify({error:{message:error instanceof ProviderError?error.message:error instanceof Error&&/^(?:AI 回复长时间没有新数据|等待 AI 首次响应超时|模型列表读取超过)/.test(error.message)?error.message:'回复传输中断，请检查网络后重试。'}})+'\n\n'));controller.close();}
 },async cancel(reason){ended=true;await reader.cancel(reason).catch(()=>{});}});
}
