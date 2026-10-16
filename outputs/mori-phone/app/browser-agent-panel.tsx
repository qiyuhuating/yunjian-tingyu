'use client';
import {useEffect,useRef,useState} from 'react';
import {usePhone} from './ui';
import {runBrowserAgent} from '../lib/browser-agent';
import {uid} from '../lib/phone-model';

export default function BrowserAgentPanel({thread,character}:{thread:string;character:string}){
 const p=usePhone(),[goal,setGoal]=useState(''),[url,setUrl]=useState('https://www.bing.com/'),[running,setRunning]=useState(false),[lines,setLines]=useState<string[]>([]);
 const controller=useRef<AbortController|null>(null),active=useRef(false);
 useEffect(()=>()=>controller.current?.abort(),[thread]);
 const start=async()=>{
  if(active.current||p.busy||!goal.trim())return;active.current=true;
  const abort=new AbortController();controller.current=abort;setRunning(true);p.setBusy(true);setLines([]);
  try{
   const summary=await runBrowserAgent({goal:goal.trim(),url,signal:abort.signal,
    request:prompt=>p.requestAI(prompt,character,thread,'compose',undefined,abort.signal),
    log:text=>setLines(previous=>[...previous,text].slice(-20))});
   await p.commit(s=>{(s.threads[thread]??=[]).push({id:uid(),role:'assistant',senderId:character,text:'浏览器任务：'+goal.trim()+'\n'+summary,kind:'notice',timestamp:Date.now()});});
  }catch(error){setLines(previous=>[...previous,error instanceof Error?error.message:'浏览器任务失败']);}
  finally{active.current=false;setRunning(false);p.setBusy(false);controller.current=null;}
 };
 return <section className="form-card" aria-label="浏览器 Agent">
  <h3>让朋友操作 Via 网页</h3><p className="helper">网页内容会发给所选角色的模型，按实际请求计费，每次任务最多12次调用。支持读取、点击、填表、选择和下载；密码、验证码及系统安装确认由你处理。任务中请勿手动切换 Via 标签页。</p>
  <label>起始网址<input aria-label="浏览器任务起始网址" value={url} maxLength={2000} disabled={running} onChange={e=>setUrl(e.target.value)}/></label>
  <label>要完成的事情<textarea aria-label="浏览器任务目标" value={goal} maxLength={2000} disabled={running} onChange={e=>setGoal(e.target.value)} placeholder="例如：查找一个资料页面，阅读并下载其中的PDF"/></label>
  <button className="primary" disabled={running||p.busy||!goal.trim()} onClick={()=>void start()}>开始网页任务</button>
  {running&&<button className="soft-button" onClick={()=>controller.current?.abort()}>停止任务</button>}
  <div role="log" aria-live="polite">{lines.map((line,i)=><p className="helper" key={i}>{line}</p>)}</div>
 </section>;
}
