'use client';
import {useEffect,useState} from 'react';
import {CORE_SYSTEM_PROMPT,CORE_PROMPT_VERSION} from '../lib/system-prompt';
import {FormField,usePhone} from './ui';

export default function SystemPromptEditor(){
 const {state,commit,toast,busy}=usePhone(),[draft,setDraft]=useState(state.coreSystemPrompt),[saving,setSaving]=useState(false);
 useEffect(()=>setDraft(state.coreSystemPrompt),[state.coreSystemPrompt]);
 const save=async()=>{if(!draft.trim())return;setSaving(true);try{await commit(s=>{s.coreSystemPrompt=draft;});toast('核心提示词已保存，下次请求使用这份内容。');}catch{}finally{setSaving(false);}};
 return <details className="settings-section disclosure"><summary>核心系统提示词</summary><p className="helper">{state.coreSystemPrompt===CORE_SYSTEM_PROMPT?'正在使用原始核心 · '+CORE_PROMPT_VERSION:'正在使用你保存的自定义核心'}。只有在这里主动保存才会修改；角色卡、世界书和聊天记录不能改写它。</p><FormField label="系统提示词内容"><textarea aria-label="系统提示词内容" rows={16} maxLength={20000} value={draft} onChange={e=>setDraft(e.target.value)} spellCheck={false}/></FormField><p className="helper">保存后对文字聊天和下次实时通话生效。已经连接的通话需挂断重连。后台事实摘要保留独立整理规则。</p><div className="button-row"><button className="primary" disabled={busy||saving||!draft.trim()||draft===state.coreSystemPrompt} onClick={()=>void save()}>{saving?'正在保存…':'保存系统提示词'}</button><button className="soft-button" disabled={saving} onClick={()=>setDraft(CORE_SYSTEM_PROMPT)}>载入原始核心</button><button className="text-button" disabled={saving} onClick={()=>setDraft(state.coreSystemPrompt)}>撤销未保存编辑</button></div></details>;
}
