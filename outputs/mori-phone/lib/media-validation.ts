// Provider MIME headers are declarations; decode generated files before reporting success.
export async function validateGeneratedMedia(file:File){
 if(!file.size)throw new Error('服务返回了空媒体文件。');
 if(file.size>20*1024*1024)throw new Error('生成媒体超过 20 MB 接收上限，未发送。');
 if(file.type==='image/png'){const tail=new Uint8Array(await file.slice(-12).arrayBuffer());if(tail.length!==12||new DataView(tail.buffer).getUint32(0)!==0||String.fromCharCode(...tail.subarray(4,8))!=='IEND')throw new Error('生成 PNG 文件未完整结束，未发送。');}
 if(file.type==='image/webp'||file.type==='audio/wav'){const head=new Uint8Array(await file.slice(0,12).arrayBuffer());if(head.length!==12||String.fromCharCode(...head.subarray(0,4))!=='RIFF'||new DataView(head.buffer).getUint32(4,true)+8!==file.size)throw new Error('生成媒体容器不完整，未发送。');}
 if(/^image\/(png|jpeg|webp)$/.test(file.type)){
  try{const image=await createImageBitmap(file);if(!image.width||!image.height)throw new Error();image.close();}catch{throw new Error('生成图片无法完整解码，未发送。');}
 }else if(/^audio\/(wav|mpeg|ogg)$/.test(file.type)){
  const context=new AudioContext();try{const audio=await context.decodeAudioData(await file.arrayBuffer());if(!audio.length||!audio.duration)throw new Error();}catch{throw new Error('生成音频无法完整解码，未发送。');}finally{await context.close();}
 }else throw new Error('生成媒体的格式无法验证，未发送。');
 return file;
}
