import {Zip,ZipPassThrough,Unzip,strToU8} from 'fflate';
import {sha256} from '@noble/hashes/sha2.js';
import {freshState,stateSchema,type PhoneState} from './phone-model';
import {assetReferences,getAsset,readLocal,migrateAssets,putAsset,removeAssets,type LocalAsset} from './local-phone';
import {BoundedZipInflate,verifyZipContainer} from './bounded-zip';

type Manifest={format:'cloudlet-device';version:2;exportedAt:string;state:PhoneState;assets:{id:string;name:string;mime:string;size:number;sha256:string}[]};
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function* backupChunks(owner:string,state:PhoneState,progress?:(done:number,total:number)=>void,signal?:AbortSignal){
 const assets:LocalAsset[]=[];let total=0,done=0;
 for(const ref of assetReferences(state)){const a=await getAsset(owner,ref);if(!a)throw new Error('备份中有附件缺失，请先检查原记录。');total+=a.size;if(total>512*1024*1024)throw new Error('附件总量超过 512 MB，请分批导出文件。');assets.push(a);}
 const manifest:Manifest={format:'cloudlet-device',version:2,exportedAt:new Date().toISOString(),state,assets:[]};
 let chunks:Uint8Array[]=[],failure:Error|undefined;const archive=new Zip((error,chunk)=>{if(error)failure=error;else chunks.push(chunk);});
 const check=()=>{signal?.throwIfAborted();if(failure)throw failure;};progress?.(0,total);
 try{
  for(const asset of assets){check();const entry=new ZipPassThrough('assets/'+asset.id),hash=sha256.create();archive.add(entry);check();yield* chunks;chunks=[];
   for(let offset=0;offset<asset.size||offset===0;offset+=65536){check();const bytes=new Uint8Array(await asset.blob.slice(offset,offset+65536).arrayBuffer());hash.update(bytes);entry.push(bytes,offset+bytes.length>=asset.size);check();yield* chunks;chunks=[];done+=bytes.length;progress?.(done,total);}
   manifest.assets.push({id:asset.id,name:asset.name,mime:asset.mime,size:asset.size,sha256:hex(hash.digest().buffer as ArrayBuffer)});
  }
  const bytes=strToU8(JSON.stringify(manifest));if(bytes.length>20*1024*1024)throw new Error('记录清单超过 20 MB，请先分批导出聊天。');
  const entry=new ZipPassThrough('manifest.json');archive.add(entry);check();yield* chunks;chunks=[];
  for(let offset=0;offset<bytes.length;offset+=65536){check();entry.push(bytes.subarray(offset,offset+65536),offset+65536>=bytes.length);check();yield* chunks;chunks=[];}
  archive.end();check();yield* chunks;
 }finally{archive.terminate();}
}
// Small callers and regression fixtures retain the original interface; large device exports stream directly.
export async function makeBackup(owner:string,state:PhoneState){const chunks:Uint8Array[]=[];let size=0;for await(const chunk of backupChunks(owner,state)){size+=chunk.length;if(size>32*1024*1024)throw new Error('大备份请使用设置中的完整备份导出。');chunks.push(chunk);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;}
export type PreparedBackup={state:PhoneState;assets:Omit<LocalAsset,'owner'>[];legacy:boolean};
function backupState(value:unknown){const parsed=stateSchema.safeParse(value);if(!parsed.success)throw new Error('备份中的角色、群聊或记录格式不正确，现有记录未改变。');return parsed.data;}
export async function readBackup(file:File):Promise<PreparedBackup>{
 if(file.size>550*1024*1024)throw new Error('备份包不能超过 550 MB。');
 if(file.name.toLowerCase().endsWith('.json')){if(file.size>20*1024*1024)throw new Error('记录文件过大。');const raw=JSON.parse(await file.text());return {state:backupState(raw.state||raw),assets:[],legacy:true};}
 await verifyZipContainer(file);
 let total=0,count=0,failure:Error|undefined;const files=new Map<string,{blob:Blob;size:number;sha256:string}>(),names=new Set<string>();
 const archive=new Unzip(entry=>{
  if(!/^(manifest\.json|assets\/[a-f0-9-]{36})$/.test(entry.name)||names.has(entry.name))throw new Error('备份包含未知或重复文件。');
  names.add(entry.name);if(++count>2000)throw new Error('备份文件数量过多。');let size=0;const chunks:Uint8Array[]=[],hash=sha256.create(),limit=(entry.name==='manifest.json'?20:200)*1024*1024;
  if(entry.originalSize!==undefined&&entry.originalSize>limit)throw new Error('备份解压后过大。');
  entry.ondata=(error,chunk,final)=>{if(error){failure=error;return;}size+=chunk.length;total+=chunk.length;if(size>limit||total>540*1024*1024)throw new Error('备份解压后过大。');hash.update(chunk);chunks.push(new Uint8Array(chunk));if(final){files.set(entry.name,{blob:new Blob(chunks as BlobPart[]),size,sha256:hex(hash.digest().buffer as ArrayBuffer)});chunks.length=0;}};entry.start();
 });archive.register(BoundedZipInflate);
 for(let offset=0;offset<file.size;offset+=65536){archive.push(new Uint8Array(await file.slice(offset,offset+65536).arrayBuffer()),offset+65536>=file.size);if(failure)throw failure;}
 if(files.size!==names.size)throw new Error('备份文件传输不完整。');const manifest=files.get('manifest.json');if(!manifest)throw new Error('备份缺少记录清单。');const m=JSON.parse(await manifest.blob.text()) as Manifest;if(m.format!=='cloudlet-device'||m.version!==2||!Array.isArray(m.assets)||m.assets.length>1999)throw new Error('这不是云朵小手机设备备份。');
 const state=backupState(m.state),assets:PreparedBackup['assets']=[],ids=new Set<string>();
 for(const a of m.assets){
  if(!/^[a-f0-9-]{36}$/.test(a.id)||ids.has(a.id)||typeof a.name!=='string'||typeof a.mime!=='string'||a.name.length>160||a.mime.length>160)throw new Error('附件清单不正确。');ids.add(a.id);
  const entry=files.get('assets/'+a.id);if(!entry||entry.size!==a.size||entry.sha256!==a.sha256)throw new Error('附件完整性校验失败，尚未替换现有记录。');
  assets.push({id:a.id,name:a.name,mime:a.mime,size:a.size,blob:entry.blob.slice(0,entry.size,a.mime)});
 }
 if(files.size!==m.assets.length+1)throw new Error('备份包含未登记的附件。');
 for(const ref of assetReferences(state))if(!ids.has(ref.replace(/^local:|^\/api\/assets\//,'')))throw new Error('备份缺少某个附件，尚未替换现有记录。');
 return {state,assets,legacy:false};
}
export async function stageBackup(owner:string,prepared:PreparedBackup,current?:PhoneState){
 const local=current??(await readLocal(owner))?.state??freshState();
 // Restoring untrusted records must not retarget locally stored keys or replace core rules.
 const restored=stateSchema.parse({...prepared.state,provider:local.provider,model:local.model,baseURL:local.baseURL,vision:local.vision,connections:local.connections,voiceSettings:local.voiceSettings,coreSystemPrompt:local.coreSystemPrompt});
 if(prepared.legacy){for(const ref of assetReferences(restored))if(ref.startsWith('local:')&&!await getAsset(owner,ref))throw new Error('旧 JSON 只有附件引用，缺少原文件。请使用原设备的完整 ZIP 备份。');return await migrateAssets(owner,restored);}
 // New identifiers prevent a failed restore from replacing files belonging to the current snapshot.
 const replacements=new Map<string,string>();try{for(const a of prepared.assets){const id=crypto.randomUUID();await putAsset(owner,id,a.blob,a.name,a.mime);replacements.set(a.id,id);}}catch(e){await removeAssets(owner,[...replacements.values()]);throw e;}
 const state=structuredClone(restored),rewrite=(ref:string)=>{const id=ref.replace(/^local:|^\/api\/assets\//,'');return replacements.has(id)?'local:'+replacements.get(id):ref;};
 for(const c of state.characters)c.avatar=rewrite(c.avatar);for(const messages of Object.values(state.threads))for(const m of messages)if(m.asset)m.asset=rewrite(m.asset);for(const a of [...state.gallery,...state.music])a.url=rewrite(a.url);return state;
}
