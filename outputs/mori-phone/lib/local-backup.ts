import {Zip,ZipPassThrough,ZipDeflate,Unzip,strToU8} from 'fflate';
import {sha256} from '@noble/hashes/sha2.js';
import {freshState,stateSchema,type PhoneState} from './phone-model';
import {assetReferences,getAsset,readLocal,migrateAssets,type LocalAsset,type StagedAsset} from './local-phone';
import {BoundedZipInflate,verifyZipContainer} from './bounded-zip';

type AssetRecord={id:string;name:string;mime:string;size:number;sha256:string};
type StatePart={name:string;size:number;sha256:string};
type Manifest={format:'cloudlet-device';exportedAt:string;assets:AssetRecord[]} & ({version:2;state:PhoneState}|{version:3;stateParts:StatePart[]});
const MB=1024*1024,MAX_ENTRIES=65534,STATE_PART_SIZE=8*MB;
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
// Serialize bounded pieces rather than allocating a second copy of all chat history.
function* jsonPieces(value:unknown):Generator<string>{
 if(Array.isArray(value)){yield '[';for(let i=0;i<value.length;i++){if(i)yield ',';yield* jsonPieces(value[i]);}yield ']';}
 else if(value!==null&&typeof value==='object'){yield '{';let first=true;for(const [key,item] of Object.entries(value)){if(item===undefined)continue;if(!first)yield ',';first=false;yield JSON.stringify(key)+':';yield* jsonPieces(item);}yield '}';}
 else yield JSON.stringify(value)??'null';
}
function* stateParts(state:PhoneState){let bytes=new Uint8Array(STATE_PART_SIZE),used=0;for(const piece of jsonPieces(state)){const encoded=strToU8(piece);for(let offset=0;offset<encoded.length;){const size=Math.min(encoded.length-offset,bytes.length-used);bytes.set(encoded.subarray(offset,offset+size),used);used+=size;offset+=size;if(used===bytes.length){yield bytes;bytes=new Uint8Array(STATE_PART_SIZE);used=0;}}}if(used)yield bytes.subarray(0,used);}
export async function* backupChunks(owner:string,state:PhoneState,progress?:(done:number,total:number)=>void,signal?:AbortSignal,pending?:ReadonlyMap<string,StagedAsset>){
 signal?.throwIfAborted();state=backupState(state);const assets:StagedAsset[]=[],ids=new Set<string>();let total=0,done=0;
 for(const ref of assetReferences(state)){signal?.throwIfAborted();const id=ref.replace(/^local:|^\/api\/assets\//,'');if(ids.has(id))continue;ids.add(id);const a=pending?.get(id)??await getAsset(owner,ref);if(!a)throw new Error('备份中有附件缺失，请先检查原记录。');if(a.id!==id||!Number.isSafeInteger(a.size)||a.size<0||a.size!==a.blob.size||a.size>200*MB||a.name.length>160||a.mime.length>160)throw new Error('附件格式或大小不正确。');total+=a.size;if(total>512*MB)throw new Error('附件总量超过 512 MB，请分批导出文件。');assets.push(a);}
 const manifest:Manifest={format:'cloudlet-device',version:3,exportedAt:new Date().toISOString(),stateParts:[],assets:[]};
 let chunks:Uint8Array[]=[],failure:Error|undefined,archiveSize=0,expanded=total,entries=0;const archive=new Zip((error,chunk)=>{if(error)failure=error;else{archiveSize+=chunk.length;if(archiveSize>550*MB)failure=new Error('备份包不能超过 550 MB。');else chunks.push(chunk);}});
 const check=()=>{signal?.throwIfAborted();if(failure)throw failure;};progress?.(0,total);
 const add=(entry:ZipPassThrough|ZipDeflate)=>{if(++entries>MAX_ENTRIES)throw new Error('备份文件数量过多。');archive.add(entry);};
 try{
  for(const asset of assets){check();const entry=/\.(txt|md|json|csv|ts|tsx|js|css|html|xml|svg|log)$/i.test(asset.name)?new ZipDeflate('assets/'+asset.id,{level:6}):new ZipPassThrough('assets/'+asset.id),hash=sha256.create();add(entry);check();yield* chunks;chunks=[];
   for(let offset=0;offset<asset.size||offset===0;offset+=65536){check();const bytes=new Uint8Array(await asset.blob.slice(offset,offset+65536).arrayBuffer());hash.update(bytes);entry.push(bytes,offset+bytes.length>=asset.size);check();yield* chunks;chunks=[];done+=bytes.length;progress?.(done,total);}
   manifest.assets.push({id:asset.id,name:asset.name,mime:asset.mime,size:asset.size,sha256:hex(hash.digest().buffer as ArrayBuffer)});
  }
  for(const bytes of stateParts(state)){check();expanded+=bytes.length;if(expanded>540*MB)throw new Error('备份解压后过大。');const name='state/'+String(manifest.stateParts.length).padStart(6,'0')+'.json',entry=new ZipDeflate(name,{level:6});manifest.stateParts.push({name,size:bytes.length,sha256:hex(sha256(bytes).buffer as ArrayBuffer)});add(entry);check();yield* chunks;chunks=[];for(let offset=0;offset<bytes.length;offset+=65536){check();entry.push(bytes.subarray(offset,offset+65536),offset+65536>=bytes.length);check();yield* chunks;chunks=[];}}
  const bytes=strToU8(JSON.stringify(manifest));if(bytes.length>20*MB||expanded+bytes.length>540*MB)throw new Error('备份解压后过大。');
  const entry=new ZipDeflate('manifest.json',{level:6});add(entry);check();yield* chunks;chunks=[];
  for(let offset=0;offset<bytes.length;offset+=65536){check();entry.push(bytes.subarray(offset,offset+65536),offset+65536>=bytes.length);check();yield* chunks;chunks=[];}
  archive.end();check();yield* chunks;
 }finally{archive.terminate();}
}
// Small callers and regression fixtures retain the original interface; large device exports stream directly.
export async function makeBackup(owner:string,state:PhoneState){const chunks:Uint8Array[]=[];let size=0;for await(const chunk of backupChunks(owner,state)){size+=chunk.length;if(size>32*1024*1024)throw new Error('大备份请使用设置中的完整备份导出。');chunks.push(chunk);}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;}
export type PreparedBackup={state:PhoneState;assets:Omit<LocalAsset,'owner'>[];legacy:boolean};
function backupState(value:unknown){const parsed=stateSchema.safeParse(value);if(!parsed.success)throw new Error('备份中的角色、群聊或记录格式不正确，现有记录未改变。');return parsed.data;}
export async function readBackup(file:File):Promise<PreparedBackup>{
 if(file.size>550*MB)throw new Error('备份包不能超过 550 MB。');
 if(file.name.toLowerCase().endsWith('.json')){if(file.size>20*1024*1024)throw new Error('记录文件过大。');const raw=JSON.parse(await file.text());return {state:backupState(raw.state||raw),assets:[],legacy:true};}
 await verifyZipContainer(file);
 let total=0,count=0,failure:Error|undefined;const files=new Map<string,{blob:Blob;size:number;sha256:string}>(),names=new Set<string>();
 const archive=new Unzip(entry=>{
  if(!/^(manifest\.json|assets\/[a-f0-9-]{36}|state\/\d{6}\.json)$/.test(entry.name)||names.has(entry.name))throw new Error('备份包含未知或重复文件。');
  names.add(entry.name);if(++count>MAX_ENTRIES)throw new Error('备份文件数量过多。');let size=0;const chunks:Uint8Array[]=[],hash=sha256.create(),limit=entry.name==='manifest.json'?20*MB:entry.name.startsWith('state/')?STATE_PART_SIZE:200*MB;
  if(entry.originalSize!==undefined&&entry.originalSize>limit)throw new Error('备份解压后过大。');
  entry.ondata=(error,chunk,final)=>{if(error){failure=error;return;}size+=chunk.length;total+=chunk.length;if(size>limit||total>540*1024*1024)throw new Error('备份解压后过大。');hash.update(chunk);chunks.push(new Uint8Array(chunk));if(final){files.set(entry.name,{blob:new Blob(chunks as BlobPart[]),size,sha256:hex(hash.digest().buffer as ArrayBuffer)});chunks.length=0;}};entry.start();
 });archive.register(BoundedZipInflate);
 for(let offset=0;offset<file.size;offset+=65536){archive.push(new Uint8Array(await file.slice(offset,offset+65536).arrayBuffer()),offset+65536>=file.size);if(failure)throw failure;}
 if(files.size!==names.size)throw new Error('备份文件传输不完整。');const manifest=files.get('manifest.json');if(!manifest)throw new Error('备份缺少记录清单。');const m=JSON.parse(await manifest.blob.text()) as Manifest;if(!m||m.format!=='cloudlet-device'||![2,3].includes(m.version)||!Array.isArray(m.assets)||m.assets.length>MAX_ENTRIES-1)throw new Error('这不是云朵小手机设备备份。');
 let rawState:unknown,partCount=0;
 if(m.version===2)rawState=m.state;
 else{if(!Array.isArray(m.stateParts)||!m.stateParts.length||m.stateParts.length+m.assets.length+1>MAX_ENTRIES)throw new Error('记录分段清单不正确。');const parts:Blob[]=[];for(const [i,part] of m.stateParts.entries()){const name='state/'+String(i).padStart(6,'0')+'.json';if(!part||part.name!==name)throw new Error('记录分段清单不正确。');const entry=files.get(name);if(!entry||entry.size!==part.size||entry.sha256!==part.sha256)throw new Error('记录完整性校验失败，尚未替换现有记录。');parts.push(entry.blob);}rawState=JSON.parse(await new Blob(parts).text());partCount=parts.length;}
 const state=backupState(rawState),assets:PreparedBackup['assets']=[],ids=new Set<string>();let assetSize=0;
 for(const a of m.assets){
  if(!a||typeof a.id!=='string'||!/^[a-f0-9-]{36}$/.test(a.id)||ids.has(a.id)||typeof a.name!=='string'||typeof a.mime!=='string'||a.name.length>160||a.mime.length>160)throw new Error('附件清单不正确。');ids.add(a.id);
  const entry=files.get('assets/'+a.id);if(!entry||entry.size!==a.size||entry.sha256!==a.sha256)throw new Error('附件完整性校验失败，尚未替换现有记录。');
  assetSize+=entry.size;if(assetSize>512*MB)throw new Error('附件总量超过 512 MB。');assets.push({id:a.id,name:a.name,mime:a.mime,size:a.size,blob:entry.blob.slice(0,entry.size,a.mime)});
 }
 if(files.size!==m.assets.length+partCount+1)throw new Error('备份包含未登记的文件。');
 for(const ref of assetReferences(state))if(!ids.has(ref.replace(/^local:|^\/api\/assets\//,'')))throw new Error('备份缺少某个附件，尚未替换现有记录。');
 return {state,assets,legacy:false};
}
export type StagedBackup={state:PhoneState;assets:StagedAsset[]};
/** Prepare identifiers and rewritten references in memory only. The caller must
 * persist both this state and these blobs in a single IndexedDB transaction. */
export async function stageBackup(owner:string,prepared:PreparedBackup,current?:PhoneState):Promise<StagedBackup>{
 const local=current??(await readLocal(owner))?.state??freshState();
 // Restoring untrusted records must not retarget locally stored keys or replace core rules.
 const restored=stateSchema.parse({...prepared.state,queuedTurns:[],provider:local.provider,model:local.model,baseURL:local.baseURL,vision:local.vision,connections:local.connections,voiceSettings:local.voiceSettings,mediaSettings:{...local.mediaSettings,stickers:prepared.state.mediaSettings.stickers},coreSystemPrompt:local.coreSystemPrompt});
 if(prepared.legacy){for(const ref of assetReferences(restored))if(ref.startsWith('local:')&&!await getAsset(owner,ref))throw new Error('旧 JSON 只有附件引用，缺少原文件。请使用原设备的完整 ZIP 备份。');return {state:await migrateAssets(owner,restored),assets:[]};}
 // New identifiers prevent a failed restore from replacing files belonging to the current snapshot.
 const needed=new Set(assetReferences(restored).map(ref=>ref.replace(/^local:|^\/api\/assets\//,'')));
 const replacements=new Map<string,string>(),assets:StagedAsset[]=[];
 for(const a of prepared.assets){
  if(!needed.has(a.id))continue;
  const id=crypto.randomUUID();replacements.set(a.id,id);
  assets.push({id,blob:a.blob,name:a.name,mime:a.mime,size:a.size});
 }
 const state=structuredClone(restored),rewrite=(ref:string)=>{const id=ref.replace(/^local:|^\/api\/assets\//,'');return replacements.has(id)?'local:'+replacements.get(id):ref;};
 state.wallpaper.asset=rewrite(state.wallpaper.asset);for(const [key,draft] of Object.entries(state.drafts)){if(key.startsWith('editor:characters:')||key.startsWith('editor:cards:'))try{const parsed=JSON.parse(draft),c=key.startsWith('editor:cards:')?parsed?.character:parsed;if(c?.avatar){c.avatar=rewrite(c.avatar);state.drafts[key]=JSON.stringify(parsed);}}catch{}}for(const card of state.characterCards)card.character.avatar=rewrite(card.character.avatar);for(const c of state.characters)c.avatar=rewrite(c.avatar);for(const messages of Object.values(state.threads))for(const m of messages)if(m.asset)m.asset=rewrite(m.asset);for(const a of [...state.gallery,...state.music])a.url=rewrite(a.url);return {state,assets};
}
