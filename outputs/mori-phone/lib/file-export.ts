export async function exportChunks(chunks:AsyncIterable<Uint8Array>,name:string,mime:string,signal?:AbortSignal){
 const bridge=window.Android,id=crypto.randomUUID();
 if(bridge){
  if(bridge.startDownload(id,name,mime)===false)throw new Error('设备无法创建导出文件，请检查空间。');
  try{for await(const chunk of chunks){signal?.throwIfAborted();for(let i=0;i<chunk.length;i+=49152){const part=chunk.subarray(i,i+49152);if(bridge.downloadChunk(id,btoa(String.fromCharCode(...part)))===false)throw new Error('文件写入失败，请检查设备空间。');}}signal?.throwIfAborted();if(bridge.finishDownload(id)===false)throw new Error('导出文件未能准备好。');}
  catch(e){bridge.cancelDownload?.(id);throw e;}return;
 }
 const directory=await navigator.storage.getDirectory(),entry=await directory.getFileHandle('export-'+id,{create:true}),writer=await entry.createWritable();let url='';
 try{for await(const chunk of chunks){signal?.throwIfAborted();await writer.write(new Uint8Array(chunk));}await writer.close();const file=await entry.getFile();url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>{URL.revokeObjectURL(url);void directory.removeEntry('export-'+id).catch(()=>{});},60000);}
 catch(e){await writer.abort().catch(()=>{});await directory.removeEntry('export-'+id).catch(()=>{});throw e;}
}
