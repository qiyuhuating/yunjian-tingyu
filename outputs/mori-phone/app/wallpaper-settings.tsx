'use client';
import {useState} from 'react';
import {ChoiceGroup} from './setting-controls';
import {LocalImage,usePhone} from './ui';
export default function WallpaperSettings(){
 const {state,upload,commit,toast}=usePhone(),[busy,setBusy]=useState(false);
 return <section className="settings-section"><h3>壁纸</h3><p className="helper">原图存到本机；切换壁纸不改变分辨率。可选完整显示或铺满屏幕。</p>{state.wallpaper.asset&&<div className="wallpaper-thumbnail"><LocalImage asset={state.wallpaper.asset} name="当前壁纸"/></div>}<label className="soft-button upload-button">{busy?'正在保存…':'选择壁纸'}<input hidden disabled={busy} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);try{const asset=await upload(file);if(!asset.mime.startsWith('image/'))throw new Error('请选择图片。');await commit(s=>{s.wallpaper.asset=asset.url;});toast('壁纸已切换并保存。');}catch(e){toast(e instanceof Error?e.message:'壁纸保存失败。');}finally{setBusy(false);}}}/></label><label className="field"><span>显示方式</span><ChoiceGroup label="壁纸显示方式" value={state.wallpaper.fit} options={[{value:'cover',label:'铺满屏幕'},{value:'contain',label:'完整显示'}]} onChange={value=>void commit(s=>{s.wallpaper.fit=value;}).catch(()=>{})}/></label><button className="text-button" disabled={!state.wallpaper.asset||busy} onClick={()=>void commit(s=>{s.wallpaper.asset='';}).then(()=>toast('已恢复默认壁纸。')).catch(()=>{})}>恢复默认壁纸</button></section>;
}
