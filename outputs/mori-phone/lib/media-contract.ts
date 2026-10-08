import {z} from 'zod';
import type {PhoneState} from './phone-model';

export const mediaSettingsSchema=z.object({
 imageEnabled:z.boolean().default(false),imageProtocol:z.enum(['openai','gemini']).default('openai'),imageURL:z.string().max(1500).default('https://api.openai.com/v1'),imageModel:z.string().max(160).default('gpt-image-1'),
 transcriptionEnabled:z.boolean().default(false),transcriptionURL:z.string().max(1500).default('https://api.openai.com/v1'),transcriptionModel:z.string().max(160).default('gpt-4o-mini-transcribe'),
 aiVoice:z.boolean().default(false),nativeAudio:z.boolean().default(false),nativeVideo:z.boolean().default(false),stickers:z.array(z.string().max(100)).max(100).default([]),
}).strict();
const command=z.discriminatedUnion('type',[
 z.object({type:z.literal('image'),prompt:z.string().trim().min(1).max(2000)}).strict(),
 z.object({type:z.literal('voice'),text:z.string().trim().min(1).max(4096)}).strict(),
 z.object({type:z.literal('sticker'),id:z.string().min(1).max(100)}).strict(),
]);
export type MediaCommand=z.infer<typeof command>;
// Only a complete trailing envelope is executable. Code blocks and quoted material are never tools.
export function parseMediaReply(reply:string){
 const match=reply.match(/\n?<cloudlet-media>([\s\S]{1,12000})<\/cloudlet-media>\s*$/);
 if(!match||reply.slice(0,match.index).split('```').length%2===0)return {text:reply,commands:[] as MediaCommand[]};
 const commands=z.array(command).max(2).parse(JSON.parse(match[1]));
 return {text:reply.slice(0,match.index).trim(),commands};
}
export function visibleReply(reply:string){const at=reply.search(/<cloudlet-(?:media|messages)>/);return at<0?reply.replace(/<cloudlet(?:-(?:media|messages))?[^>]*$/,''):reply.slice(0,at).trimEnd();}
export function mediaInstructions(s:PhoneState){
 const m=s.mediaSettings,stickers=s.gallery.filter(g=>m.stickers.includes(g.id));
 return `真实媒体工具：${JSON.stringify({image:m.imageEnabled,voice:m.aiVoice&&s.voiceSettings.engine!=='browser',stickers:stickers.map(g=>({id:g.id,name:g.name}))})}。有能力且本轮适合时，可在正文末尾加 <cloudlet-media>[{"type":"image","prompt":"完整绘图描述"},{"type":"voice","text":"要说的话"}]</cloudlet-media>；表情包用 {"type":"sticker","id":"列表中的编号"}。最多两项，不放在代码块内；未启用的工具不可调用。不要每轮强制用工具，不写已完成或已发送，应用成功生成并保存后才会显示媒体。图片输入能力与生图能力相互独立。`;
}
