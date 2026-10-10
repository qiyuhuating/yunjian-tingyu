'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,AudioLines,Brain,ChevronRight,Download,HardDrive,KeyRound,MessageCircle,Palette,Search,ShieldCheck,SlidersHorizontal,Upload,UserRound,X} from 'lucide-react';
import {getProvider} from '../lib/providers';
import {readBackup,type PreparedBackup} from '../lib/local-backup';
import AIControls from './ai-controls';
import SystemPromptEditor from './system-prompt-editor';
import RoleplayControls from './roleplay-controls';
import CompanionSettings from './companion-settings';
import WallpaperSettings from './wallpaper-settings';
import MediaSettings from './media-settings';
import ConnectionSettings from './connection-settings';
import {useEditorDraft} from './use-editor-draft';
import {FormField,formatSize,usePhone} from './ui';
const categories=[
 {id:'connection',name:'API 连接',note:'服务商、模型与连接诊断',icon:KeyRound,keywords:'deepseek openrouter key api 地址 接口 模型 网络 测试 余额 限流 中转'},
 {id:'conversation',name:'对话与模型',note:'回复风格、思考与参数',icon:MessageCircle,keywords:'回复 长度 节奏 剧情 预设 采样 temperature top p token 上下文 缓存 思考 参数 群聊 接话'},
 {id:'memory',name:'记忆与连续性',note:'自动记忆、召回与摘要',icon:Brain,keywords:'记忆 提取 频率 召回 摘要 连续 重复 原话'},
 {id:'voice',name:'声音与媒体',note:'朗读、语音和图片能力',icon:AudioLines,keywords:'声音 语音 朗读 tts 音色 语速 音频 视频 转写 图片 生图 gemini'},
 {id:'appearance',name:'外观与壁纸',note:'主题配色与桌面背景',icon:Palette,keywords:'主题 配色 浅色 暗夜 深色 夜间 蓝 粉 壁纸 背景 图片 铺满'},
 {id:'profile',name:'个人资料',note:'名字、称呼与生日',icon:UserRound,keywords:'个人 名字 昵称 称呼 生日 档案 主人'},
 {id:'storage',name:'数据与备份',note:'设备存储、导出与恢复',icon:HardDrive,keywords:'存储 数据 备份 恢复 导入 导出 zip 本机 空间 清理 持久'},
 {id:'system',name:'系统与扩展',note:'核心提示词与音乐链接',icon:SlidersHorizontal,keywords:'核心 系统 提示词 prompt 音乐 软件 链接 扩展'},
] as const;
type Category=typeof categories[number]['id'];
export default function Settings(){
 const p=usePhone(),{state,commit,toast}=p,nativeAndroid=typeof window!=='undefined'&&'Android' in window;
 const [category,setCategory]=useState<Category|null>(categories.some(c=>c.id===p.detail)?p.detail as Category:null),[query,setQuery]=useState(''),panel=useRef<HTMLDivElement>(null),title=useRef<HTMLHeadingElement>(null);
 const [name,setName]=useEditorDraft('editor:profile:name',state.profile.name),[address,setAddress]=useEditorDraft('editor:profile:address',state.profile.address),[birthday,setBirthday]=useEditorDraft('editor:profile:birthday',state.profile.birthday);
 const [working,setWorking]=useState(''),[restore,setRestore]=useState<PreparedBackup|null>(null),[storage,setStorage]=useState({usage:0,quota:0,persisted:false});
 useEffect(()=>{void Promise.all([navigator.storage?.estimate(),navigator.storage?.persisted()]).then(([size,persisted])=>setStorage({usage:size?.usage||0,quota:size?.quota||0,persisted:!!persisted})).catch(()=>{});},[category,working]);
 useEffect(()=>{const back=(event:Event)=>{if(category||query){event.preventDefault();setCategory(null);setQuery('');}};window.addEventListener('cloudlet-settings-back',back);return()=>window.removeEventListener('cloudlet-settings-back',back);},[category,query]);
 useEffect(()=>{if(panel.current)panel.current.scrollTop=0;title.current?.focus({preventScroll:true});},[category]);
 const action=async(label:string,fn:()=>Promise<void>)=>{setWorking(label);try{await fn();}catch(e){toast(e instanceof Error?e.message:'操作未完成。');}finally{setWorking('');}};
 const disabled=!!working||p.busy,selected=categories.find(c=>c.id===category),tokens=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),matches=categories.filter(c=>tokens.every(t=>(c.name+' '+c.note+' '+c.keywords).toLocaleLowerCase().includes(t)));
 const visit=(id:Category)=>{setCategory(id);setQuery('');};
 const row=(item:typeof categories[number])=><button type="button" className="settings-destination" key={item.id} onClick={()=>visit(item.id)}><span className={'settings-destination-icon '+item.id}><item.icon size={20} strokeWidth={1.7}/></span><span><strong>{item.name}</strong><small>{item.note}</small></span><ChevronRight size={17}/></button>;
 return <div ref={panel} className="scroll-panel settings-workspace">
  <div className="settings-top"><div className="settings-title-row">{category&&<button type="button" className="icon-button" aria-label="返回全部设置" onClick={()=>setCategory(null)}><ArrowLeft size={20}/></button>}<div><span className="eyebrow">MAKE IT YOURS</span><h2 ref={title} tabIndex={-1}>{selected?.name||'让这里，更像你'}</h2></div>{!category&&<span className="settings-title-mark"><SlidersHorizontal size={23}/></span>}</div><label className="settings-search"><Search size={18}/><input type="search" aria-label="搜索设置" placeholder="搜索设置，例如模型、壁纸、记忆" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button type="button" aria-label="清空设置搜索" className="icon-button" onClick={()=>setQuery('')}><X size={16}/></button>}</label></div>
  {tokens.length?<section className="settings-results" aria-label="设置搜索结果"><p className="settings-group-label" role="status">找到 {matches.length} 个相关分类</p><div className="settings-directory">{matches.map(row)}</div>{!matches.length&&<div className="settings-no-results"><Search size={25}/><strong>没有找到相关设置</strong><p>试试“连接”“声音”或“备份”。</p><button type="button" className="text-button" onClick={()=>setQuery('')}>查看全部设置</button></div>}</section>:!category?<>
   <button type="button" className="settings-connection-summary" onClick={()=>visit('connection')}><span className="summary-symbol"><KeyRound size={21}/></span><span><small>当前默认连接</small><strong>{getProvider(state.provider).name}</strong><span className="summary-model">{state.model||'还没有选择模型'}</span></span><span className={'credential-badge '+(p.savedAI?'saved':'')}>{p.savedAI?'Key 已保存':'待配置'}</span><ChevronRight size={16}/></button>
   <p className="settings-group-label">连接与陪伴</p><div className="settings-directory">{categories.slice(0,4).map(row)}</div>
   <p className="settings-group-label">我的空间</p><div className="settings-directory">{categories.slice(4).map(row)}</div>
   <div className="settings-shortcuts"><button type="button" onClick={()=>p.open('characters')}>角色设定 <ChevronRight size={14}/></button><button type="button" onClick={()=>p.open('lore')}>世界书 <ChevronRight size={14}/></button></div>
   <div className="settings-device-note"><ShieldCheck size={15}/><span>聊天与设置保存在当前设备 · Key 不进入备份</span></div>
  </>:<div className="settings-category-content" key={category}>
   {category==='connection'&&<ConnectionSettings/>}
   {category==='conversation'&&<><RoleplayControls/><AIControls provider={state.provider}/><CompanionSettings section="group"/></>}
   {category==='memory'&&<CompanionSettings section="memory"/>}
   {category==='voice'&&<><CompanionSettings section="voice"/><MediaSettings/></>}
   {category==='appearance'&&<><section className="settings-section"><h3>选一份喜欢的颜色</h3><p className="helper">立即切换，自动保存在本机。</p><div className="theme-picker" role="radiogroup" aria-label="主题配色">{(['sky','rose','night'] as const).map(t=><button type="button" key={t} role="radio" aria-checked={state.theme===t} tabIndex={state.theme===t?0:-1} onKeyDown={event=>{const options=['sky','rose','night'] as const,direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(!direction)return;event.preventDefault();const next=(options.indexOf(t)+direction+options.length)%options.length;void commit(s=>{s.theme=options[next];}).catch(()=>{});event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next].focus();}} className={`theme-choice ${t} ${state.theme===t?'active':''}`} onClick={()=>void commit(s=>{s.theme=t;}).catch(()=>{})}><span/>{t==='sky'?'云朵蓝':t==='rose'?'莓果粉':'月光夜'}</button>)}</div></section><WallpaperSettings/></>}
   {category==='profile'&&<section className="settings-section"><h3>想让朋友怎样认识你</h3><FormField label="你的名字"><input aria-label="你的名字" maxLength={30} value={name} onChange={e=>setName(e.target.value)}/></FormField><FormField label="希望角色如何称呼你"><input maxLength={30} value={address} onChange={e=>setAddress(e.target.value)} placeholder="你喜欢的昵称"/></FormField><FormField label="你的生日"><input type="date" value={birthday} onChange={e=>setBirthday(e.target.value)}/></FormField><button type="button" className="primary" disabled={disabled} onClick={()=>void action('个人设定',async()=>{if(!name.trim()||!address.trim())throw new Error('名字与称呼不能为空。');await commit(s=>{s.profile={name:name.trim(),address:address.trim(),birthday};});toast('个人资料已保存。');})}>保存个人设定</button></section>}
   {category==='system'&&<><SystemPromptEditor/><CompanionSettings section="music"/></>}
   {category==='storage'&&<section className="settings-section"><h3><ShieldCheck size={17}/>把小日常稳稳收好</h3><p className="helper">聊天、草稿、角色卡、记忆和附件原文件保存在当前设备。单个附件上限 200 MB，总容量取决于设备空间。</p><div className="local-storage-row"><span>{storage.usage?formatSize(storage.usage)+' 已使用':'本机数据库'}</span><span>{storage.persisted?'已获得持久存储':'建议定期备份'}</span></div>{storage.quota>0&&<div className="storage-meter" role="meter" aria-label="设备存储使用量" aria-valuemin={0} aria-valuemax={storage.quota} aria-valuenow={storage.usage}><span style={{width:Math.min(100,storage.usage/storage.quota*100)+'%'}}/></div>}{!storage.persisted&&<button type="button" className="text-button" disabled={disabled} onClick={()=>void action('申请持久存储',async()=>{if(!navigator.storage?.persist)throw new Error('当前内核不提供持久存储申请，请定期导出备份。');const persisted=await navigator.storage.persist();setStorage(v=>({...v,persisted}));toast(persisted?'设备已授予持久存储，仍建议定期备份。':'设备暂未授予持久存储，请定期导出备份。');})}>申请持久存储保护</button>}<p className="helper">{nativeAndroid?'卸载或清除应用数据会删除本机记录与 Key。':'清除浏览器站点数据会删除本机记录与 Key。'}换设备前请导出完整 ZIP；备份不包含 Key。</p>
    <div className="button-row"><button type="button" className="soft-button" disabled={disabled} onClick={()=>void action('导出备份',p.exportBackup)}><Download size={15}/>导出完整 ZIP</button><label className="soft-button upload-button"><Upload size={15}/>读取备份<input hidden type="file" accept=".zip,.json" disabled={disabled} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(file)await action('读取备份',async()=>{setRestore(await readBackup(file));});}}/></label></div>
    {restore&&<div className="form-card"><strong>准备恢复 {restore.state.characters.length} 位角色、{Object.values(restore.state.threads).reduce((n,a)=>n+a.length,0)} 条消息、{restore.assets.length} 个原附件</strong><p className="helper">恢复会替换当前记录；本机 AI 连接、语音设置、Key 和核心系统提示词保持不变。先导出当前完整 ZIP，再恢复。{restore.legacy?'旧 JSON 的附件必须能从原站点或本机找回。':''}</p><div className="button-row"><button type="button" className="primary" disabled={disabled} onClick={()=>void action('恢复备份',async()=>{await p.restoreBackup(restore);setRestore(null);toast('记录与附件已恢复到本机。');})}>{working==='恢复备份'?'正在恢复…':'恢复这份备份'}</button><button type="button" className="text-button" onClick={()=>setRestore(null)}>取消</button></div></div>}
    <button type="button" className="text-button" disabled={disabled} onClick={()=>{if(confirm('重新读取会替换本页未保存内容，请先导出备份。'))void p.reload();}}>读取设备记录</button>
    {p.legacyArchive&&<div className="form-card legacy-archive"><strong>旧版云端副本</strong><p className="helper">旧记录和附件已迁入本机。导出完整 ZIP 后，可删除旧副本。</p><button type="button" className="text-button danger" disabled={disabled} onClick={()=>{if(confirm('请确认完整 ZIP 已保存。删除旧云端副本不会删除本机记录，但无法从云端恢复。'))void action('清理旧副本',async()=>{await p.clearLegacy();toast('旧云端记录、附件与密钥副本已清理。');});}}>清理旧云端副本</button></div>}
    <p className="helper">保存状态：{p.sync==='saved'?'已保存到设备':p.sync==='saving'?'正在保存':'需要处理'}。日记不会自动发送给 AI。</p>{!nativeAndroid&&<button type="button" className="text-button" onClick={()=>toast('Chrome / Edge：菜单 → 安装应用；iPhone Safari：分享 → 添加到主屏幕。')}>添加到手机桌面</button>}
   </section>}
   <button type="button" className="settings-back-all" onClick={()=>setCategory(null)}><ArrowLeft size={15}/>全部设置</button>
  </div>}
 </div>;
}
