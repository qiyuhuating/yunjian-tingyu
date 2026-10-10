import {sha256} from '@noble/hashes/sha2.js';
import {freshState,stateSchema,type PhoneState} from './phone-model';
import {assetReferences} from './asset-references';
import {readStoredThreads,syncStoredThreads} from './local-thread-store';
export {assetReferences} from './asset-references';

const DB_NAME='cloudlet-device',DB_VERSION=3;
type Snapshot={owner:string;state:PhoneState;version:number;updatedAt:number;legacyArchive?:boolean;threadStorage?:1;assetIds?:string[]};
export type LocalAsset={id:string;owner:string;blob:Blob;name:string;mime:string;size:number;createdAt?:number;sha256?:string};
let database:Promise<IDBDatabase>|undefined;
const persisted=new Map<string,{version:number;state:PhoneState}>();
function db(){
 if(!database)database=new Promise<IDBDatabase>((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,DB_VERSION);
  request.onupgradeneeded=()=>{const d=request.result;if(!d.objectStoreNames.contains('threads')){const threads=d.createObjectStore('threads',{keyPath:['owner','id']});threads.createIndex('owner','owner');}if(!d.objectStoreNames.contains('states'))d.createObjectStore('states',{keyPath:'owner'});const assets=d.objectStoreNames.contains('assets')?request.transaction!.objectStore('assets'):d.createObjectStore('assets',{keyPath:['owner','id']});if(!assets.indexNames.contains('content'))assets.createIndex('content',['owner','sha256']);if(!d.objectStoreNames.contains('keys'))d.createObjectStore('keys',{keyPath:['owner','provider']});if(!d.objectStoreNames.contains('crypto'))d.createObjectStore('crypto',{keyPath:'owner'});};
  request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();database=undefined;};resolve(request.result);};
  request.onerror=()=>{database=undefined;reject(new Error('无法打开本机数据库，请允许此站点使用设备存储。'));};
  request.onblocked=()=>{database=undefined;reject(new Error('请关闭其他旧版小手机窗口，再重试。'));};
 });return database;
}
function result<T>(request:IDBRequest<T>){return new Promise<T>((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
function complete(tx:IDBTransaction){return new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(new Error(tx.error?.name==='QuotaExceededError'?'设备空间不足。请导出备份并释放空间后重试。':'本机保存未成功，请重试。'));tx.onerror=()=>{};});}
export class LocalConflict extends Error{constructor(){super('另一个窗口已更新本机记录。请先导出本页备份，再读取设备记录。');}}
export async function readLocal(owner:string){
 const d=await db(),tx=d.transaction(['states','threads'],'readonly'),done=complete(tx);
 const [row,threads]=await Promise.all([result(tx.objectStore('states').get(owner)) as Promise<Snapshot|undefined>,result(readStoredThreads(tx,owner))]);await done;if(!row)return null;
 const state=stateSchema.parse({...row.state,threads:row.threadStorage?Object.fromEntries(threads.map(t=>[t.id,t.messages])):row.state.threads,groups:row.state.groups.filter(g=>g.members.length>0)});persisted.set(owner,{version:row.version,state});return {...row,state};
}
export async function writeLocal(owner:string,state:PhoneState,version:number,legacyArchive?:boolean,validated=false){
 const parsed=validated?state:stateSchema.parse(state),refs=assetReferences(parsed).map(ref=>ref.replace(/^local:|^\/api\/assets\//,''));
 const d=await db(),tx=d.transaction(['states','threads'],'readwrite'),done=complete(tx),store=tx.objectStore('states');let conflict=false;
 const request=store.get(owner);request.onsuccess=()=>{
  const old=request.result as Snapshot|undefined;if((old?.version??0)!==version){conflict=true;tx.abort();return;}
  const cached=persisted.get(owner),previous=cached?.version===version&&old?.threadStorage?cached.state:null;
  syncStoredThreads(tx,owner,parsed.threads,previous?.threads||old?.state.threads||{},!!previous);
  store.put({owner,state:{...parsed,threads:{}},version:version+1,updatedAt:Date.now(),legacyArchive:legacyArchive??old?.legacyArchive??false,threadStorage:1,assetIds:refs});
 };
 try{await done;}catch(e){if(conflict)throw new LocalConflict();throw e;}persisted.set(owner,{version:version+1,state:parsed});return version+1;
}
export async function getAsset(owner:string,ref:string){const id=ref.replace(/^local:|^\/api\/assets\//,'');const d=await db();return await result(d.transaction('assets').objectStore('assets').get([owner,id])) as LocalAsset|undefined;}
export async function putAsset(owner:string,id:string,blob:Blob,name:string,mime:string,sha256?:string){
 // Untrusted backups may declare active HTML/SVG. Preserve bytes but never give a local preview executable content types.
 mime=/^application\/pdf$|^video\/(mp4|webm)$|^image\/(png|jpeg|gif|webp)$|^audio\/(mpeg|mp3|wav|x-wav|ogg|mp4|x-m4a|aac|flac|webm|3gpp)$/.test(mime)?mime:'application/octet-stream';blob=blob.slice(0,blob.size,mime);
 const d=await db(),tx=d.transaction('assets','readwrite'),done=complete(tx);const asset={owner,id,blob,name:name.slice(0,160),mime,size:blob.size,createdAt:Date.now(),...(sha256?{sha256}:{})};tx.objectStore('assets').put(asset);await done;return {url:'local:'+id,id,mime,size:blob.size,name:asset.name};
}
export async function removeAssets(owner:string,ids:string[]){const d=await db(),tx=d.transaction('assets','readwrite'),done=complete(tx);for(const id of ids)tx.objectStore('assets').delete([owner,id]);await done;}
export async function uploadLocal(owner:string,file:File){
 if(file.size>200*1024*1024)throw new Error('单个附件请控制在 200 MB 以内。');
 const b=new Uint8Array(await file.slice(0,16).arrayBuffer());let mime='application/octet-stream';
 if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)mime='image/png';else if(b[0]===255&&b[1]===216&&b[2]===255)mime='image/jpeg';else if(String.fromCharCode(...b.slice(0,6)).match(/^GIF8[79]a$/))mime='image/gif';else if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')mime='image/webp';else if(String.fromCharCode(...b.slice(0,5))==='%PDF-')mime='application/pdf';else if(file.type==='video/mp4'&&String.fromCharCode(...b.slice(4,8))==='ftyp')mime='video/mp4';else if(file.type==='video/webm'&&b[0]===26&&b[1]===69&&b[2]===223&&b[3]===163)mime='video/webm';else if(file.type.startsWith('audio/'))mime=file.type;
 const hash=sha256.create();for(let offset=0;offset<file.size;offset+=1024*1024)hash.update(new Uint8Array(await file.slice(offset,offset+1024*1024).arrayBuffer()));const digest=Array.from(hash.digest(),v=>v.toString(16).padStart(2,'0')).join(''),d=await db(),saved=await result(d.transaction('assets').objectStore('assets').index('content').get([owner,digest])) as LocalAsset|undefined;if(saved&&saved.mime===mime)return {url:'local:'+saved.id,id:saved.id,mime,size:saved.size,name:file.name.slice(0,160)};
 const h=digest.slice(0,32),id=h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);const collision=await getAsset(owner,'local:'+id);return putAsset(owner,collision&&collision.sha256!==digest?crypto.randomUUID():id,file.slice(0,file.size,mime),file.name,mime,digest);
}
async function legacyBlob(ref:string,expected:number){
 const response=await fetch(ref,{cache:'no-store'});if(response.ok){const blob=await response.blob();if(response.status!==204&&(!expected||blob.size===expected))return blob;}
 // Retry via an explicit migration format without treating an empty download response as a valid file.
 const encoded=await fetch(ref+'?migration=1',{cache:'no-store'});if(!encoded.ok)throw new Error('旧附件尚未完整迁入，请重试。旧记录不会被清空。');
 try{const data=await encoded.json() as {base64:string;mime:string;size:number;createdAt?:number;sha256?:string};if(typeof data.base64!=='string'||data.base64.length>28000000||typeof data.mime!=='string'||!Number.isInteger(data.size)||data.size<0||data.size>20*1024*1024)throw new Error();const binary=atob(data.base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));if(bytes.length!==data.size||expected&&bytes.length!==expected)throw new Error();return new Blob([bytes],{type:data.mime});}catch{throw new Error('旧附件完整性校验失败，请重试。旧记录不会被清空。');}
}
export async function migrateAssets(owner:string,state:PhoneState,extra: {id:string;name:string;mime:string;size:number}[]=[],progress?:(text:string)=>void){
 const refs=new Map(assetReferences(state).filter(ref=>ref.startsWith('/api/assets/')).map(ref=>[ref.slice(12),{id:ref.slice(12),name:ref.slice(12),mime:'',size:0}]));for(const a of extra)refs.set(a.id,a);
 let count=0;for(const a of refs.values()){
  progress?.(`正在迁入附件 ${++count} / ${refs.size}…`);const ref='/api/assets/'+a.id;let saved=await getAsset(owner,ref);
  if(!saved){const blob=await legacyBlob(ref,a.size);await putAsset(owner,a.id,blob,a.name,a.mime||blob.type);saved=await getAsset(owner,ref);if(!saved||saved.size!==blob.size)throw new Error('附件落盘校验失败，迁移已停止。');}
  if(a.size&&saved.size!==a.size)throw new Error('本机附件不完整，请先导出备份再处理。');
 }
 const rewrite=(ref:string)=>ref.startsWith('/api/assets/')?'local:'+ref.slice(12):ref;
 const local=structuredClone(state);local.wallpaper.asset=rewrite(local.wallpaper.asset);for(const [key,draft] of Object.entries(local.drafts)){if(key.startsWith('editor:characters:')||key.startsWith('editor:cards:'))try{const parsed=JSON.parse(draft),c=key.startsWith('editor:cards:')?parsed?.character:parsed;if(c?.avatar){c.avatar=rewrite(c.avatar);local.drafts[key]=JSON.stringify(parsed);}}catch{}}for(const card of local.characterCards)card.character.avatar=rewrite(card.character.avatar);for(const c of local.characters)c.avatar=rewrite(c.avatar);for(const messages of Object.values(local.threads))for(const m of messages)if(m.asset)m.asset=rewrite(m.asset);for(const a of [...local.gallery,...local.music])a.url=rewrite(a.url);return local;
}
export async function initializeLocal(owner:string,progress?:(text:string)=>void){
 const stored=await readLocal(owner);if(stored)return stored;
 progress?.('正在检查旧版记录…');const response=await fetch('/api/state',{cache:'no-store'});const body=await response.json() as {state?:unknown;assets?:{id:string;name:string;mime:string;size:number}[];hasLegacyKey?:boolean;legacyBaseURL?:string;error?:string};if(!response.ok)throw new Error(body.error||'旧记录检查失败，请重试。');
 const state=body.state?stateSchema.parse(body.state):freshState();if(state.provider==='compatible'&&!state.baseURL&&body.legacyBaseURL)state.baseURL=body.legacyBaseURL;
 const initial=await migrateAssets(owner,state,body.assets||[],progress);
 if(body.hasLegacyKey&&!await readDeviceKey(owner,initial.provider)){progress?.('正在迁入你的原密钥…');const response=await fetch('/api/connection',{method:'POST'});const legacy=await response.json() as {apiKey?:string};if(!response.ok)throw new Error('原密钥尚未迁入，请重试。');if(legacy.apiKey){await saveDeviceKey(owner,initial.provider,legacy.apiKey);if(await readDeviceKey(owner,initial.provider)!==legacy.apiKey)throw new Error('原密钥落盘校验失败。');}}
 // Complete the state only after all referenced files are durably stored. Concurrent first-open tabs must not overwrite one another.
 try{await writeLocal(owner,initial,0,!!body.state||!!body.assets?.length||!!body.hasLegacyKey);}catch(e){if(!(e instanceof LocalConflict))throw e;}
 const saved=await readLocal(owner);if(!saved)throw new Error('本机记录校验失败。');return saved;
}
export async function clearLegacyArchive(owner:string){
 const saved=await readLocal(owner);if(!saved)throw new Error('请先完成本机记录迁移。');
 const response=await fetch('/api/state',{method:'DELETE'});if(!response.ok){const body=await response.json() as {error?:string};throw new Error(body.error||'旧副本清理失败。');}
 const d=await db(),tx=d.transaction('states','readwrite'),done=complete(tx),store=tx.objectStore('states'),request=store.get(owner);request.onsuccess=()=>{if(request.result)store.put({...request.result,legacyArchive:false});};await done;
}
async function encryptionKey(owner:string){
 const d=await db(),existing=await result(d.transaction('crypto').objectStore('crypto').get(owner));if(existing)return existing.key as CryptoKey;
 const generated=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const tx=d.transaction('crypto','readwrite'),done=complete(tx);let key=generated;const store=tx.objectStore('crypto'),request=store.get(owner);request.onsuccess=()=>{if(request.result)key=request.result.key;else store.put({owner,key:generated});};await done;return key;
}
export async function readDeviceKey(owner:string,provider:string){const d=await db(),row=await result(d.transaction('keys').objectStore('keys').get([owner,provider]));if(!row)return '';const key=await encryptionKey(owner);const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:row.iv,additionalData:new TextEncoder().encode(owner+':'+provider)},key,row.ciphertext);return new TextDecoder().decode(bytes);}
export async function saveDeviceKey(owner:string,provider:string,value:string){
 const d=await db();if(!value){const tx=d.transaction('keys','readwrite'),done=complete(tx);tx.objectStore('keys').delete([owner,provider]);await done;return;}
 const key=await encryptionKey(owner),iv=crypto.getRandomValues(new Uint8Array(12)),ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(owner+':'+provider)},key,new TextEncoder().encode(value));const tx=d.transaction('keys','readwrite'),done=complete(tx);tx.objectStore('keys').put({owner,provider,iv,ciphertext});await done;
}
export async function blobDataURL(blob:Blob){return await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('图片读取失败。'));r.readAsDataURL(blob);});}
