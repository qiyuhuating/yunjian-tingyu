import {connectionInput,fetchModels,ProviderError} from '../../../lib/provider-transport';
import {bodyJson,failure,HttpError,identity,originCheck,secureHeaders} from '../../../lib/server-phone';
export async function POST(request:Request){try{
 await identity();originCheck(request);const data=connectionInput.safeParse(await bodyJson(request,5000));if(!data.success)throw new HttpError(400,'请填写完整 Key 与连接设定。');
 return Response.json(await fetchModels(data.data,fetch,request.signal),{headers:secureHeaders});
}catch(e){return failure(e instanceof ProviderError?new HttpError(e.status,e.message):e);}}
