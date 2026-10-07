import {bindings,failure,HttpError,identity,originCheck,secureHeaders,savedKey} from '../../../lib/server-phone';
export async function POST(request:Request){try{const user=await identity();originCheck(request);return Response.json({apiKey:await savedKey(user)},{headers:secureHeaders});}catch(e){return failure(e);}}
export async function PUT(request:Request){try{await identity();originCheck(request);throw new HttpError(410,'新版密钥只保存在设备。');}catch(e){return failure(e);}}
export async function DELETE(request:Request){try{const user=await identity();originCheck(request);await bindings().DB.prepare('DELETE FROM ai_keys WHERE user_id=?').bind(user).run();return Response.json({removed:true},{headers:secureHeaders});}catch(e){return failure(e);}}
