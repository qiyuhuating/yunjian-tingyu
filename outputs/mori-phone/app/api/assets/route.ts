import {failure,HttpError,identity,originCheck} from '../../../lib/server-phone';
export async function POST(request:Request){try{await identity();originCheck(request);throw new HttpError(410,'新版附件只存入设备，请刷新旧窗口后继续。');}catch(e){return failure(e);}}
