import {chatInput} from '../../../lib/provider-adapter';
import {fetchChat,ProviderError} from '../../../lib/provider-transport';
import {bindings,bodyJson,failure,HttpError,identity,originCheck,secureHeaders} from '../../../lib/server-phone';
export async function POST(request:Request){try{
 const user=await identity();originCheck(request);const parsed=chatInput.safeParse(await bodyJson(request,64000000));if(!parsed.success)throw new HttpError(400,'对话请求不正确，请检查模型与连接设定。');
 const minute=Math.floor(Date.now()/60000),rate=await bindings().DB.prepare('INSERT INTO rate_windows(user_id,window,count) VALUES (?,?,1) ON CONFLICT(user_id) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count').bind(user,minute).first<{count:number}>();if(!rate||rate.count>20)throw new HttpError(429,'消息有些密集，请稍等一分钟。');
 const response=await fetchChat(parsed.data,fetch,request.signal);
 return new Response(response.body,{headers:{...secureHeaders,'Content-Type':'text/event-stream; charset=utf-8'}});
}catch(e){return failure(e instanceof ProviderError?new HttpError(e.status,e.message):e);}}
