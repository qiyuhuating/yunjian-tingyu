import type {PhoneState} from './phone-model';
import {blobDataURL,readDeviceKey} from './local-phone';
import {providerBase} from './providers';

async function mediaKey(owner:string,slot:string,url:string,provider:'openai'|'gemini'){
 const key=await readDeviceKey(owner,slot);if(key)return key;
 if(providerBase('compatible',url)===providerBase(provider))return readDeviceKey(owner,provider);
 return '';
}
async function checked(res:Response){if(!res.ok){let message='媒体请求失败。';try{message=(await res.json() as {error?:string}).error||message;}catch{}throw new Error(message);}return res;}
export async function generatedImage(owner:string,s:PhoneState,prompt:string,signal?:AbortSignal){
 const m=s.mediaSettings;if(!m.imageEnabled)throw new Error('尚未开启生图连接。');const key=await mediaKey(owner,'media:image',m.imageURL,m.imageProtocol);if(!key)throw new Error('请先保存生图服务 Key。');
 const res=await checked(await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'image',protocol:m.imageProtocol,url:m.imageURL,model:m.imageModel,prompt,apiKey:key}),signal}));
 const blob=await res.blob();if(!blob.size||!/^image\/(png|jpeg|webp)$/.test(blob.type))throw new Error('服务未返回可保存的图片。');return new File([blob],'AI图片-'+Date.now()+'.'+(blob.type==='image/jpeg'?'jpg':blob.type.split('/')[1]),{type:blob.type});
}
export async function speechFile(owner:string,s:PhoneState,text:string,signal?:AbortSignal){
 const v=s.voiceSettings;if(v.engine==='browser')throw new Error('设备朗读不能导出语音文件，请连接 TTS 服务。');
 const url=v.engine==='openai'?providerBase('openai'):v.engine==='gemini'?providerBase('gemini'):v.url,key=await mediaKey(owner,'tts:'+v.engine,url,v.engine==='gemini'?'gemini':'openai');if(!key)throw new Error('请先保存语音服务 Key。');
 const payload=v.engine==='gemini'?{kind:'gemini-speech',apiKey:key,url,model:v.model,voice:v.voice,text:text.slice(0,4096)}:{apiKey:key,url,model:v.model,voice:v.voice,input:text.slice(0,4096),speed:v.rate};
 const res=await checked(await fetch(v.engine==='gemini'?'/api/media':'/api/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal})),blob=await res.blob();
 if(!blob.size||!blob.type.startsWith('audio/'))throw new Error('语音服务没有返回音频。');return new File([blob],'AI语音-'+Date.now()+(blob.type==='audio/wav'?'.wav':'.mp3'),{type:blob.type});
}
export async function transcribeFile(owner:string,s:PhoneState,file:File,signal?:AbortSignal){
 const m=s.mediaSettings;if(!m.transcriptionEnabled)throw new Error('未连接语音转写；原录音已保留，模型尚未听到它。');if(file.size>8*1024*1024)throw new Error('转写音频请控制在 8 MB 内，原文件仍可保存。');
 const key=await mediaKey(owner,'media:transcribe',m.transcriptionURL,'openai');if(!key)throw new Error('请先保存转写服务 Key。');
 const data=(await blobDataURL(file)).split(',')[1],res=await checked(await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'transcribe',apiKey:key,url:m.transcriptionURL,model:m.transcriptionModel,mime:file.type.split(';')[0],data}),signal}));return (await res.json() as {text:string}).text as string;
}
