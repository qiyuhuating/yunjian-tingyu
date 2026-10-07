'use client';
import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {Cloud,MessageCircle,BookOpen,Globe,NotebookPen,Users,Headphones,CalendarDays,Images,ShoppingBag,Briefcase,Radio,Video,Wallet,CheckCheck,Timer,Sun,StickyNote,Brain,Settings,LayoutGrid,Heart,UserRound,Sparkles,type LucideIcon} from 'lucide-react';
import type {AIUsage} from '../lib/chat-prompt';
import type {ProviderId} from '../lib/providers';
import type {PreparedBackup} from '../lib/local-backup';
import {useLocalMedia} from './local-media';
import {useVoice} from './use-voice';
import MessageText from './message-text';
export type AIStats={last:AIUsage|null;requests:number;prompt:number;completion:number;firstTokenMs:number|null;durationMs:number|null;finishReason:string};
import type {PhoneState,Character,Message} from '../lib/phone-model';
export type Commit=(change:(s:PhoneState)=>void)=>Promise<void>;
export type PhoneContextType={ownerId:string;legacyArchive:boolean;clearLegacy:()=>Promise<void>;selectProvider:(provider:ProviderId)=>Promise<void>;saveKey:(remove?:boolean)=>Promise<void>;restoreBackup:(prepared:PreparedBackup)=>Promise<void>;state:PhoneState;snapshot:()=>PhoneState;commit:Commit;setDraft:(thread:string,text:string)=>void;aiStats:AIStats;open:(app:string,detail?:string)=>void;detail:string;app:string;toast:(message:string)=>void;apiKey:string;setApiKey:(value:string)=>void;serverAI:boolean;savedAI:boolean;vision:boolean;setVision:(value:boolean)=>void;requestAI:(text:string,characterId:string,thread:string,mode?:'chat'|'face'|'group'|'live'|'summary'|'compose',onDelta?:(value:string)=>void,signal?:AbortSignal)=>Promise<string>;upload:(file:File)=>Promise<{url:string;id:string;mime:string;size:number;name:string}>;sync:string;reload:()=>Promise<void>;exportBackup:()=>Promise<void>;busy:boolean;setBusy:(v:boolean)=>void;};
export const PhoneContext=createContext<PhoneContextType|null>(null);
export const usePhone=()=>{const c=useContext(PhoneContext);if(!c)throw new Error('Phone context unavailable');return c;};
export const icons:Record<string,LucideIcon>={chat:MessageCircle,forum:Users,browser:Globe,diary:NotebookPen,moments:Heart,music:Headphones,calendar:CalendarDays,gallery:Images,shop:ShoppingBag,work:Briefcase,weibo:Radio,live:Video,face:UserRound,wallet:Wallet,pet:Cloud,tasks:CheckCheck,focus:Timer,weather:Sun,notes:StickyNote,memories:Brain,lore:BookOpen,characters:Users,settings:Settings,all:LayoutGrid,favorites:Heart};
// Each crop follows the painted outline, so unequal sprite padding cannot shift a button.
const buttonCrops:Record<string,[number,number,number,number]>={chat:[87,150,356,262],forum:[520,137,334,275],browser:[923,125,332,294],diary:[1319,127,384,296],moments:[85,507,368,273],gallery:[515,489,353,307],shop:[924,478,351,317],all:[1371,488,311,290]};
const dockCrops:Record<string,[number,number,number,number]>={home:[91,100,430,502],calendar:[599,144,443,456],memories:[1121,146,446,438],settings:[1649,140,445,459]};
function SpriteArt({name,dock=false}:{name:string;dock?:boolean}){const [x,y,w,h]=(dock?dockCrops:buttonCrops)[name],side=Math.max(w,h),width=dock?2172:1774,height=dock?724:887;return <span aria-hidden="true" className={dock?'dock-art':'button-art'}><span className="illustration-crop" style={{width:w/side*100+'%',height:h/side*100+'%'}}><img alt="" draggable={false} src={dock?'/dock-sprite.png':'/button-sprite.png'} style={{width:width/w*100+'%',height:height/h*100+'%',left:-x/w*100+'%',top:-y/h*100+'%'}}/></span></span>;}
export function ButtonArt({name}:{name:string}){return <SpriteArt name={name}/>;}
export function DockArt({name}:{name:string}){return <SpriteArt name={name} dock/>;}
export function ImagePreview({url,name,children}:{url:string|undefined;name:string;children:React.ReactNode}){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const node=dialog.current;if(!node)return;if(open&&!node.open)node.showModal();else if(!open&&node.open)node.close();return()=>{if(node.open)node.close();};},[open]);
 return <><button className="image-preview-button" aria-label={'查看图片 '+name} disabled={!url} onClick={()=>setOpen(true)}>{children}</button><dialog ref={dialog} className="media-viewer" aria-label={'图片预览 '+name} onClose={()=>setOpen(false)}><header><strong>{name}</strong><button className="icon-button" aria-label="关闭图片预览" onClick={()=>setOpen(false)}>×</button></header>{open&&<img src={url} alt={name}/>}<a className="soft-button" href={url} download={name}>保存这张图片</a></dialog></>;
}
export function LocalImage({asset,name,linked=false}:{asset:string;name:string;linked?:boolean}){const {ownerId}=usePhone(),url=useLocalMedia(ownerId,asset);const content=url?<img loading="lazy" src={url} alt={name}/>:<span className="media-placeholder">读取图片…</span>;return linked?<ImagePreview url={url} name={name}>{content}</ImagePreview>:content;}
export function Avatar({character,size=''}:{character:Character;size?:string}){return <span className={`avatar ${character.color} ${size}`}>{character.avatar?<LocalImage asset={character.avatar} name={character.name}/>:character.emoji}</span>;}
export function GroupAvatar({characters}:{characters:Character[]}){return <span className="group-avatar" aria-hidden="true">{characters.slice(0,4).map(c=><Avatar key={c.id} character={c} size="tiny"/>)}</span>;}
export function Empty({icon:Icon=Sparkles,title,children}:{icon?:LucideIcon;title:string;children?:React.ReactNode}){return <div className="empty"><Icon size={32} strokeWidth={1.4}/><h3>{title}</h3><p>{children}</p></div>;}
export function FormField({label,children}:{label:string;children:React.ReactNode}){return <label className="field"><span>{label}</span>{children}</label>;}
export function downloadJson(value:unknown,name:string){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function formatSize(bytes=0){return bytes<1024?bytes+' B':bytes<1024*1024?(bytes/1024).toFixed(1)+' KB':(bytes/1024/1024).toFixed(1)+' MB';}
export function MessageCard({message,onFavorite}:{message:Message;onFavorite?:()=>void}){
 const {ownerId}=usePhone(),assetURL=useLocalMedia(ownerId,message.asset),voice=useVoice();
 const special=['packet','transfer','kinship'].includes(message.kind);
 return <div className={`message-card ${special?'money-card '+message.kind:''}`}>
  {special?<><Wallet size={25}/><strong>{message.kind==='packet'?'心意红包':message.kind==='kinship'?'亲属卡':'云币转账'}</strong><b>{message.amount} 云币</b><p>{message.text}</p><small>虚拟心意 · 已记录</small></>:message.kind==='image'?<><ImagePreview url={assetURL} name={message.fileName||'图片'}><img className="message-image" src={assetURL||undefined} alt={message.fileName||'图片'}/></ImagePreview><p>{message.text}</p><small>{message.attachmentStatus}</small></>:message.kind==='file'?<><a className="file-bubble" href={assetURL||undefined} download={message.fileName}><BookOpen size={25}/><span><strong>{message.fileName}</strong><small>{formatSize(message.fileSize)} · 点击下载</small></span></a><small>{message.attachmentStatus||(message.extracted?'已提取文字供 AI 阅读':'原文件已保存，暂未解析内容')}</small><p>{message.text}</p></>:message.kind==='voice'?<button className="voice-bubble" onClick={()=>void voice.read(message.text)} aria-label="播放语音" aria-pressed={voice.playing}><Radio size={20}/><span>{voice.playing?'正在朗读…':'听这条消息'}</span><small>朗读</small></button>:<MessageText text={message.text}/>}
  {onFavorite&&<div className="message-card-footer"><button className={`favorite-message ${message.favorite?'active':''}`} onClick={onFavorite} aria-label={message.favorite?'取消收藏':'收藏消息'}><Heart size={13} fill={message.favorite?'currentColor':'none'}/>{message.favorite?'取消收藏':'收藏消息'}</button></div>}
 </div>;
}
