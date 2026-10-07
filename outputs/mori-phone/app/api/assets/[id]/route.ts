import {bindings,failure,HttpError,identity} from '../../../../lib/server-phone';
import {migrationStream} from '../../../../lib/asset-transport';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{
 const user=await identity(),{id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))throw new HttpError(404,'文件不存在。');const {DB,BUCKET}=bindings();const row=await DB.prepare('SELECT mime,name FROM assets WHERE id=? AND user_id=?').bind(id,user).first<{mime:string;name:string}>();if(!row)throw new HttpError(404,'文件不存在。');const object=await BUCKET.get(`${user}/${id}`);if(!object)throw new HttpError(404,'文件不存在。');
 if(new URL(_request.url).searchParams.get('migration')==='1')return new Response(migrationStream(object.body,{mime:row.mime,name:row.name,size:object.size}),{headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 return new Response(object.body,{headers:{'Content-Type':row.mime,'Content-Length':String(object.size),'Content-Disposition':`${row.mime.startsWith('image/')||row.mime.startsWith('audio/')?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(row.name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return failure(e);}}

