import {zip,unzipSync,strToU8,strFromU8} from 'fflate';
import {stateSchema,type PhoneState} from './phone-model';
import {assetReferences,getAsset,migrateAssets,putAsset,removeAssets,type LocalAsset} from './local-phone';
type Manifest={format:'cloudlet-device';version:2;exportedAt:string;state:PhoneState;assets:{id:string;name:string;mime:string;size:number;sha256:string}[]};
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function makeBackup(owner:string,state:PhoneState){
 const manifest:Manifest={format:'cloudlet-device',version:2,exportedAt:new Date().toISOString(),state,assets:[]},files:Record<string,Uint8Array>={};let total=0;
 for(const ref of assetReferences(state)){
  const a=await getAsset(owner,ref);if(!a)throw new Error('备份中有附件缺失，请先检查原记录。');total+=a.size;if(total>512*1024*1024)throw new Error('附件总量超过 512 MB，请分批导出文件。');
  const bytes=new Uint8Array(await a.blob.arrayBuffer());files['assets/'+a.id]=bytes;manifest.assets.push({id:a.id,name:a.name,mime:a.mime,size:a.size,sha256:hex(await crypto.subtle.digest('SHA-256',bytes))});
 }
 files['manifest.json']=strToU8(JSON.stringify(manifest));return await new Promise<Uint8Array>((resolve,reject)=>zip(files,{level:0},(e,data)=>e?reject(e):resolve(data)));
}
export type PreparedBackup={state:PhoneState;assets:Omit<LocalAsset,'owner'>[];legacy:boolean};
function backupState(value:unknown){const parsed=stateSchema.safeParse(value);if(!parsed.success)throw new Error('备份中的角色、群聊或记录格式不正确，现有记录未改变。');return parsed.data;}
export async function readBackup(file:File):Promise<PreparedBackup>{
 if(file.size>550*1024*1024)throw new Error('备份包不能超过 550 MB。');
 if(file.name.toLowerCase().endsWith('.json')){if(file.size>20*1024*1024)throw new Error('记录文件过大。');const raw=JSON.parse(await file.text());return {state:backupState(raw.state||raw),assets:[],legacy:true};}
 let total=0,count=0;const files=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:f=>{
  if(!/^(manifest\.json|assets\/[a-f0-9-]{36})$/.test(f.name))throw new Error('备份包含未知文件。');
  total+=f.originalSize;if(++count>2000||total>540*1024*1024||f.originalSize>(f.name==='manifest.json'?20:200)*1024*1024)throw new Error('备份解压后过大。');return true;
 }});
 if(!files['manifest.json'])throw new Error('备份缺少记录清单。');const m=JSON.parse(strFromU8(files['manifest.json'])) as Manifest;if(m.format!=='cloudlet-device'||m.version!==2||!Array.isArray(m.assets)||m.assets.length>1999)throw new Error('这不是云朵小手机设备备份。');
 const state=backupState(m.state),assets:PreparedBackup['assets']=[],ids=new Set<string>();
 for(const a of m.assets){
  if(!/^[a-f0-9-]{36}$/.test(a.id)||ids.has(a.id)||typeof a.name!=='string'||typeof a.mime!=='string'||a.name.length>160||a.mime.length>160)throw new Error('附件清单不正确。');ids.add(a.id);
  const bytes=files['assets/'+a.id];if(!bytes||bytes.byteLength!==a.size||hex(await crypto.subtle.digest('SHA-256',bytes))!==a.sha256)throw new Error('附件完整性校验失败，尚未替换现有记录。');
  assets.push({id:a.id,name:a.name,mime:a.mime,size:a.size,blob:new Blob([new Uint8Array(bytes)],{type:a.mime})});
 }
 for(const ref of assetReferences(state))if(!ids.has(ref.replace(/^local:|^\/api\/assets\//,'')))throw new Error('备份缺少某个附件，尚未替换现有记录。');
 return {state,assets,legacy:false};
}
export async function stageBackup(owner:string,prepared:PreparedBackup){
 stateSchema.parse(prepared.state);
 if(prepared.legacy){for(const ref of assetReferences(prepared.state))if(ref.startsWith('local:')&&!await getAsset(owner,ref))throw new Error('旧 JSON 只有附件引用，缺少原文件。请使用原设备的完整 ZIP 备份。');return await migrateAssets(owner,prepared.state);}
 // New identifiers prevent a failed restore from replacing files belonging to the current snapshot.
 const replacements=new Map<string,string>();try{for(const a of prepared.assets){const id=crypto.randomUUID();await putAsset(owner,id,a.blob,a.name,a.mime);replacements.set(a.id,id);}}catch(e){await removeAssets(owner,[...replacements.values()]);throw e;}
 const state=structuredClone(prepared.state),rewrite=(ref:string)=>{const id=ref.replace(/^local:|^\/api\/assets\//,'');return replacements.has(id)?'local:'+replacements.get(id):ref;};
 for(const c of state.characters)c.avatar=rewrite(c.avatar);for(const messages of Object.values(state.threads))for(const m of messages)if(m.asset)m.asset=rewrite(m.asset);for(const a of [...state.gallery,...state.music])a.url=rewrite(a.url);return state;
}
