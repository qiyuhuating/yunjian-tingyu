import {z} from 'zod';
import {providerSchema} from '../../../lib/providers';
import {modelsRequest,extractModels} from '../../../lib/provider-adapter';
import {bodyJson,failure,HttpError,identity,originCheck,secureHeaders} from '../../../lib/server-phone';
export async function POST(request:Request){try{
 await identity();originCheck(request);const data=z.object({provider:providerSchema,apiKey:z.string().min(8).max(2048),baseURL:z.string().max(1500).default('')}).strict().safeParse(await bodyJson(request,5000));if(!data.success)throw new HttpError(400,'请填写完整 Key 与连接设定。');
 let wire;try{wire=modelsRequest(data.data.provider,data.data.apiKey,data.data.baseURL);}catch{throw new HttpError(422,'请检查自定义 HTTPS 地址。');}
 let upstream:Response;try{upstream=await fetch(wire.url,{headers:wire.headers,signal:AbortSignal.any([request.signal,AbortSignal.timeout(20000)]),redirect:'error'});}catch{throw new HttpError(504,'模型列表暂时不可用，预填模型仍可使用。');}
 if(!upstream.ok){await upstream.body?.cancel();throw new HttpError(upstream.status===401?401:502,'未能读取模型列表，请检查 Key 与服务地域；也可手动填写模型 ID。');}
 const text=await upstream.text();if(text.length>4000000)throw new HttpError(502,'服务商返回的模型列表过大。');let body;try{body=JSON.parse(text);}catch{throw new HttpError(502,'服务商返回了无法读取的模型列表。');}
 return Response.json({models:extractModels(data.data.provider,body)},{headers:secureHeaders});
}catch(e){return failure(e);}}
