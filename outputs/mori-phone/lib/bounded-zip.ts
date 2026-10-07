import {UnzipInflate} from 'fflate';
// Limit expansion per decoder call before consumer byte budgets are checked.
export class BoundedZipInflate extends UnzipInflate{
 push(chunk:Uint8Array,final:boolean){
  if(!chunk.length){super.push(chunk,final);return;}
  for(let offset=0;offset<chunk.length;offset+=256)super.push(chunk.subarray(offset,offset+256),final&&offset+256>=chunk.length);
 }
}
// Streaming decoders can otherwise accept arbitrary bytes as an empty archive.
export async function verifyZipContainer(file:Blob){
 if(file.size<22)throw new Error('压缩包不完整');
 const head=new DataView(await file.slice(0,4).arrayBuffer()),tail=new DataView(await file.slice(Math.max(0,file.size-65557)).arrayBuffer());
 if(![0x04034b50,0x06054b50].includes(head.getUint32(0,true)))throw new Error('压缩包文件头不正确');
 for(let offset=tail.byteLength-22;offset>=0;offset--){
  if(tail.getUint32(offset,true)!==0x06054b50||offset+22+tail.getUint16(offset+20,true)!==tail.byteLength)continue;
  const entries=tail.getUint16(offset+10,true),size=tail.getUint32(offset+12,true),start=tail.getUint32(offset+16,true),end=file.size-tail.byteLength+offset;
  if(tail.getUint16(offset+4,true)||tail.getUint16(offset+6,true)||tail.getUint16(offset+8,true)!==entries||entries===65535||start+size!==end)throw new Error('压缩包目录不正确或格式不支持');
  return;
 }
 throw new Error('压缩包缺少完整目录');
}
