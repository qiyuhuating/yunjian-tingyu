'use client';
import {useEffect,useRef,useState} from 'react';

export function useRecorder(onError:(message:string)=>void){
 const [status,setStatus]=useState<'idle'|'requesting'|'recording'|'ready'>('idle'),[seconds,setSeconds]=useState(0),[file,setFile]=useState<File|null>(null);
 const recorder=useRef<MediaRecorder|null>(null),stream=useRef<MediaStream|null>(null),chunks=useRef<Blob[]>([]),started=useRef(0),revision=useRef(0),interval=useRef<ReturnType<typeof setInterval>|null>(null);
 const release=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(interval.current)clearInterval(interval.current);interval.current=null;};
 const cancel=()=>{revision.current++;if(recorder.current?.state==='recording')recorder.current.stop();recorder.current=null;release();chunks.current=[];setFile(null);setSeconds(0);setStatus('idle');};
 const stop=()=>{if(recorder.current?.state==='recording')recorder.current.stop();};
 useEffect(()=>()=>{revision.current++;if(recorder.current?.state==='recording')recorder.current.stop();release();},[]);
 useEffect(()=>{const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 const start=async()=>{
  cancel();const own=revision.current;setStatus('requesting');
  try{
   if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined')throw new Error('此设备无法直接录音，可用附件按钮发送音频文件。');
   const media=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});if(own!==revision.current){media.getTracks().forEach(t=>t.stop());return;}stream.current=media;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
   const r=new MediaRecorder(media,{...(mime?{mimeType:mime}:{}),audioBitsPerSecond:48000});recorder.current=r;chunks.current=[];started.current=performance.now();
   r.ondataavailable=e=>{if(own===revision.current&&e.data.size)chunks.current.push(e.data);};
   r.onerror=()=>{if(own!==revision.current)return;cancel();onError('录音中断，请重试。');};
   r.onstop=()=>{if(own!==revision.current)return;release();const type=r.mimeType.split(';')[0],blob=new Blob(chunks.current,{type}),duration=Math.min(120,Math.round((performance.now()-started.current)/1000));chunks.current=[];recorder.current=null;if(!blob.size){cancel();onError('没有录到声音，请重试。');return;}setSeconds(duration);setFile(new File([blob],'语音-'+Date.now()+(type==='audio/mp4'?'.m4a':type==='audio/ogg'?'.ogg':'.webm'),{type}));setStatus('ready');};
   r.start(1000);setStatus('recording');interval.current=setInterval(()=>{const value=Math.floor((performance.now()-started.current)/1000);setSeconds(value);if(value>=120)stop();},250);
  }catch(e){if(own!==revision.current)return;release();setStatus('idle');onError(e instanceof Error&&e.name==='NotAllowedError'?'麦克风权限未授予。请在系统设置中允许录音。':e instanceof Error?e.message:'录音未启动。');}
 };
 return {status,seconds,file,start,stop,cancel};
}
