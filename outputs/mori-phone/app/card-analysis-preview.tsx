'use client';
import {useEffect,useRef,useState} from 'react';
import type {ImportedCharacter} from '../lib/character-import';
import {cardAnalysisPrompt,applyCardAnalysis} from '../lib/card-analysis';
import {FormField,usePhone} from './ui';
export default function CardAnalysisPreview({card,onApply,disabled}:{card:ImportedCharacter;onApply:(card:ImportedCharacter)=>void;disabled:boolean}){
 const {state,requestAI}=usePhone(),[connection,setConnection]=useState(state.primary),[proposal,setProposal]=useState<ImportedCharacter|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),active=useRef<AbortController|null>(null);
 useEffect(()=>{setProposal(null);setError('');return()=>active.current?.abort();},[card]);
 const analyze=async()=>{
  if(busy||disabled)return;const controller=new AbortController();active.current=controller;setBusy(true);setError('');setProposal(null);
  try{const result=await requestAI(cardAnalysisPrompt(card),connection,connection,'analysis',undefined,controller.signal);controller.signal.throwIfAborted();setProposal(applyCardAnalysis(card,result));}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'AI 分析失败，原卡已保留。');}finally{if(active.current===controller){setBusy(false);active.current=null;}}
 };
 return <details className="settings-section disclosure"><summary>用 AI 整理人物与世界背景</summary><p className="helper">仅将这张卡的人设正文发送给所选连接。AI 分类原文，不改写设定；分析结果先预览，保存前可以撤销。没有连接时可直接导入原卡。</p><FormField label="用于角色卡分析的连接"><select disabled={busy||disabled} value={connection} onChange={e=>setConnection(e.target.value)}>{state.characters.map(c=><option key={c.id} value={c.id}>{c.name} · {c.aiConnection?.model||'默认连接'}</option>)}</select></FormField><div className="button-row"><button className="soft-button" disabled={busy||disabled||!card.character.description.trim()} onClick={()=>void analyze()}>{busy?'正在分析…':'分析并预览拆分'}</button>{busy&&<button className="text-button" onClick={()=>{active.current?.abort();setBusy(false);}}>取消分析</button>}</div>{error&&<p role="alert" className="import-warning">{error}</p>}{proposal&&<div className="analysis-proposal"><h3>人物设定</h3><div className="preview-description">{proposal.character.description}</div><h3>新拆出的世界背景</h3>{proposal.lore.slice(card.lore.length).map(l=><article className="memory-card" key={l.id}><strong>{l.title}</strong><small>{l.constant?'常驻背景':'触发词：'+l.keys}</small><p>{l.text}</p></article>)}<button className="primary" disabled={disabled} onClick={()=>onApply(proposal)}>采用这份拆分</button></div>}</details>;
}
