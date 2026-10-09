'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,CheckCircle2,Eye,EyeOff,KeyRound,LoaderCircle,Plug,RefreshCw,TriangleAlert,Trash2} from 'lucide-react';
import {connectionKeySlot,getProvider,providers,type ProviderId} from '../lib/providers';
import {normalizedConnection,probeInput} from '../lib/provider-transport';
import {testConnection} from '../lib/connection-client';
import {readDeviceKey} from '../lib/local-phone';
import {modelLimitKey,rememberRouterParameters,type ModelLimit} from '../lib/context-window';
import {FormField,usePhone} from './ui';
import {useEditorDraft} from './use-editor-draft';
import {SearchPicker} from './setting-controls';
type Result={kind:'idle'|'checking'|'success'|'error'|'cancelled';message:string;seconds?:string};
export default function ConnectionSettings(){
 const p=usePhone(),{state,commit,toast}=p,preset=getProvider(state.provider);
 const [model,setModel,clearModel]=useEditorDraft('editor:model:'+state.provider,state.model),[baseURL,setBaseURL,clearBase]=useEditorDraft('editor:baseURL:'+state.provider,state.baseURL||preset.baseURL);
 const slot=connectionKeySlot(state.provider,baseURL),[credential,setCredential]=useState({slot:'',value:'',saved:false}),key=credential.slot===slot?credential.value:'';
 const [showKey,setShowKey]=useState(false),[working,setWorking]=useState(''),[models,setModels]=useState<string[]>([]),[modelStatus,setModelStatus]=useState('预设仅供参考；可读取账号列表，也可直接填写模型 ID。'),[result,setResult]=useState<Result>({kind:'idle',message:'保存配置后，发送一条独立消息验证连接。'});
 const request=useRef<AbortController|null>(null),revision=useRef(0),mounted=useRef(true),latest=useRef('');latest.current=state.provider+'|'+baseURL+'|'+key;
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;request.current?.abort();};},[]);
 useEffect(()=>{let active=true;const version=revision.current;setShowKey(false);void readDeviceKey(p.ownerId,slot).then(value=>{if(active&&version===revision.current)setCredential({slot,value,saved:!!value});}).catch(()=>toast('本机 Key 读取失败，请重新填写。'));return()=>{active=false;};},[p.ownerId,slot,toast]);
 useEffect(()=>{request.current?.abort();setModels([]);setModelStatus('预设仅供参考；可读取账号列表，也可直接填写模型 ID。');setResult({kind:'idle',message:'保存配置后，发送一条独立消息验证连接。'});},[state.provider]);
 const resetResult=()=>setResult({kind:'idle',message:'配置已修改，需要重新测试。'});
 const disabled=!!working||p.busy;
 const action=async(label:string,fn:()=>Promise<void>)=>{if(disabled)return;setWorking(label);try{await fn();}catch(error){if(!mounted.current)return;const message=error instanceof Error?error.message:'操作未完成。';if(label==='测试')setResult({kind:error instanceof Error&&error.name==='AbortError'?'cancelled':'error',message});else if(label==='读取模型')setModelStatus(message+' 可以手动填写模型 ID 后测试。');else toast(message);}finally{if(mounted.current)setWorking('');}};
 const save=async()=>{
  const parsed=probeInput.safeParse({provider:state.provider,baseURL,model,apiKey:key});if(!parsed.success)throw new Error('请填写完整的 API Key 和模型 ID。');const connection=normalizedConnection(parsed.data);
  await p.saveKey(false,connection);await commit(s=>{if(s.provider!==connection.provider)throw new Error('连接已切换，请重新保存。');s.model=connection.model;s.baseURL=connection.baseURL;s.connections[s.provider]={model:s.model,baseURL:s.baseURL,vision:s.vision};});
  clearModel(connection.model,model);clearBase(connection.baseURL,baseURL);setCredential({slot:connectionKeySlot(connection.provider,connection.baseURL),value:connection.apiKey,saved:true});return connection;
 };
 const readModels=async()=>{
  const connection=normalizedConnection(probeInput.parse({provider:state.provider,model:model.trim()||'model-list',baseURL,apiKey:key})),identity=latest.current,controller=new AbortController();request.current?.abort();request.current=controller;setModelStatus('正在读取账号可用模型…');
  const response=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:connection.provider,baseURL:connection.baseURL,apiKey:connection.apiKey}),signal:controller.signal});let body:{error?:string;models?:string[];limits?:Record<string,ModelLimit>};try{body=await response.json();}catch{throw new Error('接口未返回有效模型列表。');}if(!response.ok)throw new Error(body.error||'模型列表读取失败。');if(controller.signal.aborted||!mounted.current||latest.current!==identity)return;
  setModels(body.models||[]);setModelStatus(body.models?.length?'已读取 '+body.models.length+' 个模型；点击“浏览模型”搜索。':'接口没有提供模型列表，可直接填写模型 ID 后测试。');
  if(body.limits)await commit(s=>{for(const [id,limit] of Object.entries(body.limits!)){const {supportedParameters,...stored}=limit;if(connection.provider==='openrouter'&&supportedParameters)rememberRouterParameters(id,supportedParameters);s.modelLimits[modelLimitKey(connection.provider,connection.baseURL,id)]=stored;}});
 };
 const test=async()=>{const connection=await save(),controller=new AbortController();request.current?.abort();request.current=controller;setResult({kind:'checking',message:'正在发送测试消息…'});const start=performance.now(),answer=await testConnection(connection,controller.signal);if(!mounted.current||controller.signal.aborted)return;setResult({kind:'success',message:'服务商已响应：'+answer,seconds:((performance.now()-start)/1000).toFixed(1)});};
 const options=[...new Set([...models,...preset.models])];
 return <>
  <section className="settings-section connection-section"><div className="setting-heading"><span className="eyebrow">CONNECTION</span><h3>把喜欢的 AI 接进来</h3><p className="helper">服务商、Key、模型。三步就能开始聊天。</p></div>
   <FormField label="服务商"><SearchPicker label="服务商预设" value={state.provider} disabled={disabled} options={providers.map(v=>({value:v.id,label:v.name,note:v.protocol==='anthropic'?'Claude 原生协议':v.protocol==='gemini'?'Gemini 原生协议':'OpenAI 兼容协议'}))} placeholder="搜索服务商，例如 DeepSeek" onChange={value=>void action('切换',()=>p.selectProvider(value as ProviderId))}/></FormField>
   <div className="provider-note"><Plug size={16}/><span>{preset.note}</span></div>
   <FormField label="API Key"><div className="key-input"><input aria-label="API Key" type={showKey?'text':'password'} disabled={disabled} maxLength={2048} autoComplete="off" spellCheck={false} value={key} onChange={e=>{revision.current++;setCredential({slot,value:e.target.value,saved:false});resetResult();}} placeholder="填写当前连接的 API Key"/><button type="button" className="icon-button" aria-label={showKey?'隐藏 Key':'显示 Key'} onClick={()=>setShowKey(!showKey)}>{showKey?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></FormField>
   <div className="key-caption"><span>{credential.slot===slot&&credential.saved?<><Check size={13}/>已保存在本机</>:'按服务商与地址分别保存'}</span>{preset.keyURL&&<a href={preset.keyURL} target="_blank" rel="noopener noreferrer">获取 Key ↗</a>}</div>
   <FormField label="模型 ID"><input aria-label="模型 ID" disabled={disabled} value={model} maxLength={160} spellCheck={false} placeholder="输入模型 ID，或从列表选择" onChange={e=>{setModel(e.target.value);resetResult();}}/></FormField>
   <div className="model-actions"><SearchPicker label="浏览模型" value="" disabled={disabled} options={options.map(id=>({value:id,label:id,note:models.includes(id)?'账号实时模型':'预设 · 以账号权限为准'}))} onChange={value=>{setModel(value);resetResult();}} placeholder="搜索模型 ID" empty="还没有模型。可先读取列表，或直接填写 ID。"/><button type="button" className="soft-button" disabled={disabled||key.trim().length<8} onClick={()=>void action('读取模型',readModels)}><RefreshCw size={15} className={working==='读取模型'?'spin':''}/>{working==='读取模型'?'读取中':'读取列表'}</button></div>
   <p className="helper model-status" role="status">{modelStatus}</p>
   <FormField label="API 地址"><input aria-label="API 地址" type="url" disabled={disabled} maxLength={1500} spellCheck={false} placeholder="https://你的服务商/v1" value={baseURL} onChange={e=>{setBaseURL(e.target.value);setModels([]);setModelStatus('地址已修改，可重新读取模型列表。');resetResult();}}/></FormField>
   <p className="helper">{slot!==state.provider?'此地址单独保存 Key，原连接的 Key 不会自动发送到新地址。':'预设已填好官方地址；使用中转或其他地域时可修改。'}</p>
   <label className="check-label"><input type="checkbox" checked={p.vision} disabled={disabled} onChange={e=>p.setVision(e.target.checked)}/>所选模型支持图片输入</label>
   <div className="connection-buttons"><button type="button" className="primary" disabled={disabled} onClick={()=>void action('测试',test)}>{working==='测试'?<LoaderCircle size={16} className="spin"/>:<Plug size={16}/>}保存并测试</button><button type="button" className="soft-button" disabled={disabled} onClick={()=>void action('保存',async()=>{await save();toast('连接已保存到本机。');})}>保存连接</button></div>
   <div className={'connection-result '+result.kind} role={result.kind==='error'?'alert':'status'} aria-live="polite">{result.kind==='success'?<CheckCircle2 size={19}/>:result.kind==='error'?<TriangleAlert size={19}/>:result.kind==='checking'?<LoaderCircle size={19} className="spin"/>:<KeyRound size={19}/>}<div><strong>{result.kind==='success'?'连接成功':result.kind==='error'?'连接未完成':result.kind==='checking'?'正在连接':result.kind==='cancelled'?'已取消':'等待测试'}{result.seconds&&<small> · {result.seconds} 秒</small>}</strong><p>{result.message}</p></div>{working==='测试'&&<button type="button" className="text-button" onClick={()=>request.current?.abort()}>取消</button>}</div>
   <p className="helper">测试会产生一次简短 API 调用，不发送聊天、人设或附件。模型列表失败不代表聊天失败。Key 不进入备份。</p>
   {credential.slot===slot&&credential.saved&&<button type="button" className="text-button danger" disabled={disabled} onClick={()=>void action('移除',async()=>{await p.saveKey(true,{provider:state.provider,baseURL,apiKey:''});setCredential({slot,value:'',saved:false});resetResult();toast('此连接的 Key 已移除。');})}><Trash2 size={14}/>移除此连接的 Key</button>}
  </section>
  <aside className="connection-help"><strong>连接遇到问题？</strong><p>DeepSeek：检查开放平台余额与模型 ID。OpenRouter：检查 API 额度、免费模型限额及当前模型路由。</p><p>先用默认参数测试。测试成功而角色聊天失败时，请检查该角色是否配置了独立模型。</p></aside>
 </>;
}
