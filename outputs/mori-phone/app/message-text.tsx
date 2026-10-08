'use client';
import {useState} from 'react';
import {usePhone} from './ui';
const extensions:Record<string,string>={html:'html',css:'css',javascript:'js',js:'js',typescript:'ts',ts:'ts',python:'py',py:'py',svg:'svg',json:'json',sql:'sql',java:'java',cpp:'cpp',bash:'sh'};
export default function MessageText({text}:{text:string}){
 const {toast}=usePhone(),[expanded,setExpanded]=useState<Record<number,boolean>>({}),parts:Array<{text:string;language?:string}>=[];let at=0;
 for(const match of text.matchAll(/```([\w+-]*)\s*\n([\s\S]*?)```/g)){if(match.index!>at)parts.push({text:text.slice(at,match.index)});parts.push({text:match[2],language:match[1]||'text'});at=match.index!+match[0].length;}
 if(at<text.length)parts.push({text:text.slice(at)});
 if(!at&&/^(?:const |function |def |class |<!doctype|<html|<svg|<style)/i.test(text))parts.splice(0,parts.length,{text,language:/^</.test(text)?'html':'text'});
 const save=(code:string,language:string)=>{const url=URL.createObjectURL(new Blob([code],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='云笺作品.'+(extensions[language.toLowerCase()]||'txt');a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('已准备保存完整代码；可用相应软件打开。');};
 return <>{parts.map((part,i)=>part.language?<section className="code-message" key={i}><header><small>{part.language}</small><button className="text-button" onClick={()=>void navigator.clipboard?.writeText(part.text).then(()=>toast('代码已复制。')).catch(()=>toast('未能复制，请保存代码文件。'))}>复制代码</button><button className="text-button" onClick={()=>save(part.text,part.language!)}>保存代码</button></header><pre className={expanded[i]?'expanded':''}><code>{part.text}</code></pre>{part.text.split('\n').length>16&&<button className="text-button" onClick={()=>setExpanded(v=>({...v,[i]:!v[i]}))}>{expanded[i]?'收起代码':'展开完整代码'}</button>}</section>:<p key={i}>{part.text}</p>)}</>;
}

