import {mediaInput,performMedia} from '../../../lib/media-adapter';
import {bodyJson,failure,HttpError,identity,originCheck} from '../../../lib/server-phone';
export async function POST(request:Request){try{
 await identity();originCheck(request);const parsed=mediaInput.safeParse(await bodyJson(request,12000000));if(!parsed.success)throw new HttpError(400,'媒体请求不完整或文件过大。');
 try{return await performMedia(parsed.data,fetch,AbortSignal.any([request.signal,AbortSignal.timeout(180000)]));}catch(e){if(request.signal.aborted)throw e;throw new HttpError(502,e instanceof Error?e.message:'媒体生成失败。');}
}catch(e){return failure(e);}}
