import {z} from 'zod';
import {providerBase} from './providers';

const base={apiKey:z.string().min(8).max(2048),url:z.string().max(1500),model:z.string().trim().min(1).max(160)};
export const mediaInput=z.discriminatedUnion('kind',[
 z.object({...base,kind:z.literal('image'),protocol:z.enum(['openai','gemini']),prompt:z.string().trim().min(1).max(2000)}).strict(),
 z.object({...base,kind:z.literal('transcribe'),data:z.string().min(4).max(11200000).regex(/^[A-Za-z0-9+/]+=*$/),mime:z.enum(['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/x-wav','audio/ogg'])}).strict(),
 z.object({...base,kind:z.literal('gemini-speech'),text:z.string().trim().min(1).max(4096),voice:z.string().min(1).max(100)}).strict(),
]);
export type MediaInput=z.infer<typeof mediaInput>;
export function decodeBase64(data:string){return Uint8Array.from(atob(data),c=>c.charCodeAt(0));}
export function mediaWire(input:MediaInput):{url:string;headers:Record<string,string>;body:BodyInit}{
 const base=providerBase('compatible',input.url);
 if(input.kind==='transcribe'){
  const bytes=decodeBase64(input.data);if(bytes.length>8*1024*1024)throw new Error('转写音频请控制在 8 MB 内。');
  const extensions:Record<string,string>={'audio/webm':'webm','audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/ogg':'ogg'};
  const form=new FormData();form.set('model',input.model);form.set('response_format','json');form.set('file',new Blob([bytes],{type:input.mime}),'voice.'+extensions[input.mime]);
  return {url:base+'/audio/transcriptions',headers:{Authorization:'Bearer '+input.apiKey},body:form as BodyInit};
 }
 const gemini=input.kind==='gemini-speech'||input.protocol==='gemini';
 return {url:base+(gemini?'/interactions':'/images/generations'),headers:gemini?{'x-goog-api-key':input.apiKey,'Content-Type':'application/json'}:{Authorization:'Bearer '+input.apiKey,'Content-Type':'application/json'},body:JSON.stringify(
  input.kind==='gemini-speech'?{model:input.model,store:false,input:input.text,response_format:{type:'audio',mime_type:'audio/wav',sample_rate:24000},generation_config:{speech_config:[{voice:input.voice}]}}:
  input.protocol==='gemini'?{model:input.model,store:false,input:input.prompt,response_format:{type:'image',mime_type:'image/png'}}:
  {model:input.model,prompt:input.prompt,n:1,...(/^gpt-image/.test(input.model)?{output_format:'png'}:{response_format:'b64_json'})}
 )};
}
// Shared by the web gateway and the Android transport; neither stores provider keys or generated payloads.
export async function performMedia(input:MediaInput,network:typeof fetch,signal?:AbortSignal){
 const wire=mediaWire(input),res=await network(wire.url,{method:'POST',headers:wire.headers,body:wire.body,redirect:'error',signal});
 if(!res.ok){await res.body?.cancel();throw new Error(`媒体服务返回 ${res.status}；请检查 Key、模型权限、接口和余额。`);}
 const data=await res.json() as any;
 if(input.kind==='transcribe'){const text=z.string().trim().min(1).max(18000).parse(data.text);return Response.json({text});}
 const blocks=(Array.isArray(data.steps)?data.steps:[]).filter((step:any)=>step.type==='model_output').flatMap((step:any)=>Array.isArray(step.content)?step.content:[]);if(data.status&&data.status!=='completed')throw new Error('媒体生成没有完整结束。');
 const item=input.kind==='gemini-speech'?blocks.filter((b:any)=>b.type==='audio').at(-1)||data.output_audio:input.protocol==='gemini'?blocks.filter((b:any)=>b.type==='image').at(-1)||data.output_image:{data:data.data?.[0]?.b64_json,mime_type:'image/png'};
 const encoded=z.string().min(4).max(28000000).regex(/^[A-Za-z0-9+/]+=*$/).parse(item?.data),mime=z.enum(['image/png','image/jpeg','image/webp','audio/wav','audio/mpeg']).parse(item?.mime_type);
 if(input.kind==='gemini-speech'?!mime.startsWith('audio/'):!mime.startsWith('image/'))throw new Error('媒体服务返回的类型不正确。');
 return new Response(decodeBase64(encoded),{headers:{'Content-Type':mime,'Cache-Control':'private, no-store'}});
}
