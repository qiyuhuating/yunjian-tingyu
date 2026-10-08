'use client';
import {useEffect,useState} from 'react';
import type {Character} from '../lib/phone-model';
import {characterKeySlot} from '../lib/character-ai';
import {readDeviceKey,saveDeviceKey} from '../lib/local-phone';
import {getProvider,providers,type ProviderId} from '../lib/providers';
import {FormField,usePhone} from './ui';

export default function CharacterAISettings({character,onChange,persisted}:{character:Character;onChange:(value:Character)=>void;persisted:boolean}){
 const p=usePhone(),connection=character.aiConnection;
 const [key,setKey]=useState(''),[hasSavedKey,setHasSavedKey]=useState(false),[saving,setSaving]=useState(false);
 const slot=connection?characterKeySlot(character.id,connection.provider):'';
 useEffect(()=>{let active=true;setKey('');setHasSavedKey(false);if(!persisted||!slot)return;
  void readDeviceKey(p.ownerId,slot).then(value=>{if(active)setHasSavedKey(!!value);}).catch(()=>{if(active)p.toast('无法读取角色专属 Key 状态。');});
  return()=>{active=false;};
 },[p.ownerId,slot,persisted]);
 const update=(next:Partial<NonNullable<Character['aiConnection']>>)=>{if(connection)onChange({...character,aiConnection:{...connection,...next}});};
 const choose=(value:string)=>{if(!value){onChange({...character,aiConnection:undefined});return;}
  const provider=value as ProviderId,setting=getProvider(provider);
  onChange({...character,aiConnection:{provider,model:setting.model,baseURL:setting.baseURL,vision:setting.vision,keyScope:provider==='compatible'?'character':'provider'}});
 };
 const dedicated=!!connection&&(connection.provider==='compatible'||connection.keyScope==='character');
 const save=async(remove=false)=>{if(!slot||!persisted)return;const value=remove?'':key.trim();if(value&&value.length<8){p.toast('请填写完整的角色 API Key。');return;}
  setSaving(true);try{await saveDeviceKey(p.ownerId,slot,value);if(await readDeviceKey(p.ownerId,slot)!==value)throw new Error('角色密钥保存校验失败。');
   setKey('');setHasSavedKey(!!value);p.toast(value?'角色专属 Key 已加密保存在本机。':'角色专属 Key 已移除。');
  }catch(error){p.toast(error instanceof Error?error.message:'密钥保存失败。');}finally{setSaving(false);}
 };
 return <section className="settings-section">
  <h3>这位角色使用的 AI</h3>
  <p className="helper">每位角色可以选择不同服务商与模型。群聊、记忆整理和文件理解跟随发言角色；不改变其他角色的连接。API Key 仅保存在本机，不会导出进角色卡或备份。</p>
  <FormField label="聊天模型连接"><select aria-label="角色 AI 服务商" value={connection?.provider||''} onChange={e=>choose(e.target.value)}>
   <option value="">继承全局默认 · {getProvider(p.state.provider).name} / {p.state.model}</option>
   {providers.map(provider=><option key={provider.id} value={provider.id}>{provider.name}</option>)}
  </select></FormField>
  {connection&&<>
   <FormField label="模型 ID"><input aria-label="角色模型 ID" list={'role-models-'+character.id} maxLength={160} value={connection.model} onChange={e=>update({model:e.target.value})}/></FormField>
   <datalist id={'role-models-'+character.id}>{getProvider(connection.provider).models.map(model=><option key={model} value={model}/>)}</datalist>
   {connection.provider==='compatible'&&<FormField label="OpenAI 兼容 HTTPS 地址"><input aria-label="角色 API 地址" type="url" maxLength={1500} value={connection.baseURL} placeholder="https://api.example.com/v1" onChange={e=>update({baseURL:e.target.value})}/></FormField>}
   <label className="check-label"><input type="checkbox" checked={connection.vision} onChange={e=>update({vision:e.target.checked})}/>这个角色的模型支持图片理解</label>
   {connection.provider!=='compatible'&&<FormField label="API Key 使用方式"><select aria-label="角色 Key 使用方式" value={connection.keyScope} onChange={e=>update({keyScope:e.target.value as 'provider'|'character'})}><option value="provider">共用此服务商已保存的 Key</option><option value="character">使用这位角色自己的 Key</option></select></FormField>}
   {dedicated&&<>
    <FormField label="角色专属 API Key"><input aria-label="角色专属 API Key" type="password" autoComplete="off" spellCheck={false} maxLength={2048} value={key} placeholder={hasSavedKey?'已保存，可输入新 Key 替换':'填写角色自己的 API Key'} onChange={e=>setKey(e.target.value)}/></FormField>
    <div className="button-row"><button type="button" className="soft-button" disabled={!persisted||saving||key.trim().length<8} onClick={()=>void save()}>保存角色 Key</button><button type="button" className="text-button" disabled={!persisted||saving||!hasSavedKey} onClick={()=>void save(true)}>清除角色 Key</button></div>
    <p className="helper">{!persisted?'请先保存新角色，再设置专属 Key。':hasSavedKey?'该角色已有独立的加密凭据。':'还没有为此角色保存独立凭据。'} 使用自定义兼容地址时必须使用角色独立 Key，防止把其他地址的凭据发错服务。</p>
   </>}
  </>}
 </section>;
}
