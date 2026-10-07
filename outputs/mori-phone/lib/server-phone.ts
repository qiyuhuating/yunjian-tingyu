import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export function bindings(){return env as unknown as {DB:D1Database;BUCKET:R2Bucket;AI_API_KEY?:string;AI_BASE_URL?:string;AI_MODEL?:string;KEY_ENCRYPTION_SECRET?:string};}
export async function identity(){const user=await getChatGPTUser();if(!user)throw new HttpError(401,'请先登录，再打开你的小手机。');return user.userId;}
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export function originCheck(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new HttpError(403,'请求来源不匹配，请刷新后重试。');}
export async function bodyJson(request:Request,max=1900000){
 if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'需要 JSON 数据。');const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'数据为空。');const decoder=new TextDecoder();let text='',size=0;
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new HttpError(413,'数据太大，请先导出备份并整理记录。');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();try{return JSON.parse(text);}catch{throw new HttpError(400,'JSON 数据格式不正确。');}
}
export function failure(error:unknown){if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status,headers:secureHeaders});console.error('phone_operation_failed',error instanceof Error?error.name:'unknown');return Response.json({error:'云端暂时不可用，你的输入已保留，请稍后重试。'},{status:503,headers:secureHeaders});}
export const secureHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
async function encryptionKey(){const secret=bindings().KEY_ENCRYPTION_SECRET;if(!secret||!/^[a-f0-9]{64}$/.test(secret))throw new HttpError(503,'密钥保险箱尚未配置，可以先使用当前页面的临时密钥。');const bytes=Uint8Array.from(secret.match(/.{2}/g)!,v=>parseInt(v,16));return crypto.subtle.importKey('raw',bytes,{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function savedKey(user:string){const row=await bindings().DB.prepare('SELECT ciphertext FROM ai_keys WHERE user_id=?').bind(user).first<{ciphertext:string}>();if(!row)return '';const bytes=Uint8Array.from(row.ciphertext.match(/.{2}/g)!,v=>parseInt(v,16));return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:new TextEncoder().encode(user)},await encryptionKey(),bytes.slice(12)));}
