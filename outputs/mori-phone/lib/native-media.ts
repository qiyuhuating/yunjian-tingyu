import {z} from 'zod';
export const nativeMediaSchema=z.object({mime:z.preprocess(value=>typeof value==='string'&&/^audio\/L16(?:;\s*codec=pcm;\s*rate=24000)?$/i.test(value)?'audio/L16':value,z.enum(['image/png','image/jpeg','image/webp','audio/wav','audio/mpeg','audio/ogg','audio/L16','video/mp4','video/webm'])),data:z.string().min(4).max(11200000).regex(/^[A-Za-z0-9+/]+=*$/)}).strict();
export type NativeMediaPart=z.infer<typeof nativeMediaSchema>;
export function nativeMediaFile(value:unknown){
 const part=nativeMediaSchema.parse(value),bytes=Uint8Array.from(atob(part.data),c=>c.charCodeAt(0));let blob:Blob;
 if(part.mime==='audio/L16'){
  if(bytes.length%2)throw new Error('原生 PCM 音频长度不正确。');
  const header=new Uint8Array(44),view=new DataView(header.buffer);const text=(at:number,text:string)=>{for(let i=0;i<text.length;i++)header[at+i]=text.charCodeAt(i);};text(0,'RIFF');view.setUint32(4,36+bytes.length,true);text(8,'WAVE');text(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,24000,true);view.setUint32(28,48000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,bytes.length,true);blob=new Blob([header,bytes],{type:'audio/wav'});
 }else blob=new Blob([bytes],{type:part.mime});
 return new File([blob],'AI媒体-'+Date.now()+'.'+(({ 'image/jpeg':'jpg','audio/mpeg':'mp3','audio/L16':'wav'} as Record<string,string>)[part.mime]||part.mime.split('/')[1]),{type:blob.type});
}
export function nativeMediaFiles(parts:NativeMediaPart[]){
 const files:File[]=[],pcm:Uint8Array[]=[];let size=0;
 for(const part of parts){if(part.mime==='audio/L16'){const bytes=Uint8Array.from(atob(part.data),c=>c.charCodeAt(0));pcm.push(bytes);size+=bytes.length;}else files.push(nativeMediaFile(part));}
 if(size){const bytes=new Uint8Array(size);let offset=0;for(const chunk of pcm){bytes.set(chunk,offset);offset+=chunk.length;}const chunks:string[]=[];for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));files.push(nativeMediaFile({mime:'audio/L16',data:btoa(chunks.join(''))}));}
 if(files.length>2)throw new Error('单轮原生媒体最多接收两份。');return files;
}
