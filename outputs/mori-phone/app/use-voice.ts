'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {speechFile} from '../lib/media-client';
import {usePhone} from './ui';
let activeVoice:{owner:symbol;stop:()=>void}|null=null;
export function useVoice(){
 const {ownerId,state,toast}=usePhone(),[playing,setPlaying]=useState(false),owner=useRef(Symbol('voice')),mounted=useRef(true),audio=useRef<HTMLAudioElement|null>(null),controller=useRef<AbortController|null>(null),objectURL=useRef(''),generation=useRef(0);
 const stop=useCallback(()=>{generation.current++;controller.current?.abort();controller.current=null;audio.current?.pause();audio.current=null;if(objectURL.current)URL.revokeObjectURL(objectURL.current);objectURL.current='';if(activeVoice?.owner===owner.current){activeVoice=null;window.speechSynthesis?.cancel();}if(mounted.current)setPlaying(false);},[]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stop();};},[stop]);
 const read=async(text:string)=>{
  stop();if(!text.trim()){toast('还没有可以朗读的回复。');return;}activeVoice?.stop();activeVoice={owner:owner.current,stop};const revision=generation.current;setPlaying(true);
  const finish=()=>{if(revision!==generation.current||activeVoice?.owner!==owner.current)return;activeVoice=null;if(objectURL.current)URL.revokeObjectURL(objectURL.current);objectURL.current='';audio.current=null;controller.current=null;if(mounted.current)setPlaying(false);};
  const v=state.voiceSettings;
  try{
   if(v.engine==='browser'){if(!window.speechSynthesis)throw new Error('这台设备没有系统朗读，可以在设置中连接语音服务。');const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-CN';utterance.rate=v.rate;utterance.onend=finish;utterance.onerror=()=>{if(revision!==generation.current)return;finish();toast('朗读中断，请检查设备音量与系统音色。');};speechSynthesis.speak(utterance);return;}
   const ctrl=new AbortController();controller.current=ctrl;const blob=await speechFile(ownerId,state,text,ctrl.signal);if(ctrl.signal.aborted||revision!==generation.current)return;
   objectURL.current=URL.createObjectURL(blob);const player=new Audio(objectURL.current);audio.current=player;player.onended=finish;player.onerror=()=>{if(revision!==generation.current)return;stop();toast('这台设备未能播放音频。');};await player.play();
  }catch(e){if(revision!==generation.current||e instanceof Error&&e.name==='AbortError')return;finish();toast(e instanceof Error?e.message:'朗读失败。');}
 };
 return {read,stop,playing};
}

