import {chatInput,wireRequest,normalizeStream} from '../../../lib/provider-adapter';
import {getProvider} from '../../../lib/providers';
import {bindings,bodyJson,failure,HttpError,identity,originCheck,secureHeaders} from '../../../lib/server-phone';
export async function POST(request:Request){try{
 const user=await identity();originCheck(request);const parsed=chatInput.safeParse(await bodyJson(request,14000000));if(!parsed.success)throw new HttpError(400,'对话请求不正确，请检查模型与连接设定。');
 const minute=Math.floor(Date.now()/60000),rate=await bindings().DB.prepare('INSERT INTO rate_windows(user_id,window,count) VALUES (?,?,1) ON CONFLICT(user_id) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count').bind(user,minute).first<{count:number}>();if(!rate||rate.count>20)throw new HttpError(429,'消息有些密集，请稍等一分钟。');
 let wire;try{wire=wireRequest(parsed.data);}catch{throw new HttpError(422,'请检查自定义 HTTPS 地址。');}
 let upstream:Response;try{upstream=await fetch(wire.url,{method:'POST',headers:wire.headers,body:JSON.stringify(wire.body),signal:AbortSignal.any([request.signal,AbortSignal.timeout(120000)]),redirect:'error'});}catch{throw new HttpError(504,'AI 暂时没有响应，你可以重试这条消息。');}
 if(!upstream.ok){await upstream.body?.cancel();throw new HttpError(upstream.status===429?429:502,upstream.status===401||upstream.status===403?'密钥未通过验证，请检查 Key、账号权限与服务地域。':upstream.status===404?'该账号无法使用这个模型，请读取模型列表后重选。':`${getProvider(parsed.data.provider).name} 返回错误（${upstream.status}）。请检查模型、参数和余额。`);}
 if(!upstream.body)throw new HttpError(502,'AI 返回了空响应。');
 return new Response(normalizeStream(upstream.body,wire.protocol),{headers:{...secureHeaders,'Content-Type':'text/event-stream; charset=utf-8'}});
}catch(e){return failure(e);}}
