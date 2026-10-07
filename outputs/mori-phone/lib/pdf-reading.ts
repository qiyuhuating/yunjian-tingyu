import {getDocument,GlobalWorkerOptions} from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerURL from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type {AttachmentReading} from './attachment-text';
GlobalWorkerOptions.workerSrc=workerURL;
export async function readPDF(data:Uint8Array):Promise<AttachmentReading>{
 const task=getDocument({data,isEvalSupported:false,useSystemFonts:true,disableFontFace:true});
 task.onPassword=()=>{void task.destroy();};
 try{const doc=await task.promise;let text='';const pages=Math.min(doc.numPages,80);let read=0;
  for(let page=1;page<=pages&&text.length<18000;page++){const content=await (await doc.getPage(page)).getTextContent();text+=`【第 ${page} 页】\n`+content.items.map(item=>'str' in item?item.str+('hasEOL' in item&&item.hasEOL?'\n':' '):'').join('')+'\n';read=page;}
  const words=text.replace(/【第 \d+ 页】/g,'').trim();return {text:words?text.slice(0,18000):'',status:words?`已读取 PDF 文字 ${read}/${doc.numPages} 页${read<doc.numPages||text.length>18000?'（其余内容未发送）':''}`:'PDF 未含可提取文字；扫描件需要 OCR，原文件已保存'};
 }finally{await task.destroy();}
}
