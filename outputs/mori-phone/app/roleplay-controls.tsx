'use client';
import {roleplayPresets} from '../lib/roleplay';
import {ChoiceGroup} from './setting-controls';
import {usePhone} from './ui';
export default function RoleplayControls(){
 const {state,commit,busy}=usePhone(),p=state.roleplay;
 return <section className="settings-section roleplay-section"><div className="setting-heading"><span className="eyebrow">OUR STORY</span><h3>把话慢慢说，把故事慢慢写</h3></div><div className="preset-options" role="radiogroup" aria-label="角色扮演预设">{roleplayPresets.map(v=><button type="button" key={v.id} role="radio" aria-checked={p.preset===v.id} className={p.preset===v.id?'active':''} disabled={busy} onClick={()=>void commit(s=>{s.roleplay.preset=v.id;}).catch(()=>{})}><span className="preset-dot"/><span><strong>{v.name}</strong><small>{v.note}</small></span></button>)}</div><div className="setting-line"><span><strong>每次聊多少</strong><small>只推进一个话题，留出接话空间</small></span><ChoiceGroup label="回复节奏" value={p.length} disabled={busy} options={[{value:'short',label:'轻巧短回'},{value:'balanced',label:'稍多一点'}]} onChange={value=>void commit(s=>{s.roleplay.length=value;}).catch(()=>{})}/></div><label className="check-label"><input type="checkbox" checked={p.choices} disabled={busy} onChange={e=>void commit(s=>{s.roleplay.choices=e.target.checked;}).catch(()=>{})}/>给我简短的接话选项</label><p className="helper">最多两个选项，点击后填入草稿，由你决定何时发送。角色不会代替你说话或行动，也可以直接自由输入。设定自动保存在本机。</p></section>;
}
