import {bindings,failure,HttpError,identity,originCheck,secureHeaders} from '../../../lib/server-phone';
export const dynamic='force-dynamic';
// Read-only legacy migration. New chat records are never stored here.
export async function GET(){try{
 const user=await identity(),{DB}=bindings(),row=await DB.prepare('SELECT state,version FROM phone_states WHERE user_id=?').bind(user).first<{state:string;version:number}>();
 const assets=await DB.prepare('SELECT id,name,mime,size FROM assets WHERE user_id=?').bind(user).all();
 const key=await DB.prepare('SELECT user_id FROM ai_keys WHERE user_id=?').bind(user).first();
 return Response.json({state:row?JSON.parse(row.state):null,assets:assets.results,hasLegacyKey:!!key,legacyBaseURL:bindings().AI_BASE_URL||''},{headers:secureHeaders});
}catch(e){return failure(e);}}
export async function PUT(request:Request){try{await identity();originCheck(request);throw new HttpError(410,'新版记录保存在设备本机。请刷新旧窗口后继续。');}catch(e){return failure(e);}}
export async function DELETE(request:Request){try{
 const user=await identity();originCheck(request);const {DB,BUCKET}=bindings(),rows=await DB.prepare('SELECT id FROM assets WHERE user_id=?').bind(user).all<{id:string}>();
 for(let i=0;i<rows.results.length;i+=100)await BUCKET.delete(rows.results.slice(i,i+100).map(a=>user+'/'+a.id));
 await DB.batch([DB.prepare('DELETE FROM assets WHERE user_id=?').bind(user),DB.prepare('DELETE FROM phone_states WHERE user_id=?').bind(user),DB.prepare('DELETE FROM ai_keys WHERE user_id=?').bind(user)]);
 return Response.json({removed:true},{headers:secureHeaders});
}catch(e){return failure(e);}}
