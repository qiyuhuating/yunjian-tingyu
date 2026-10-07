import {unzipSync} from 'fflate';
export type AttachmentReading={text:string;status:string};
const MAX_TEXT=18000,MAX_FILE=20*1024*1024,MAX_EXPANDED=8*1024*1024;
const textExtension=/\.(txt|md|csv|tsv|json|jsonl|log|xml|html?|css|scss|js|jsx|ts|tsx|py|java|c|cpp|h|rs|go|sh|sql|ya?ml|toml|ini|conf|lrc|svg)$/i;
export function decodeText(bytes:Uint8Array){
 if(bytes[0]===255&&bytes[1]===254)return new TextDecoder('utf-16le').decode(bytes.subarray(2));
 if(bytes[0]===254&&bytes[1]===255)return new TextDecoder('utf-16be').decode(bytes.subarray(2));
 try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return new TextDecoder('gb18030').decode(bytes);}
}
function xmlText(bytes:Uint8Array){const doc=new DOMParser().parseFromString(decodeText(bytes),'application/xml');if(doc.querySelector('parsererror'))throw new Error('文档 XML 无法解析');return Array.from(doc.getElementsByTagName('*')).filter(n=>['t','v','p'].includes(n.localName)&&!n.children.length).map(n=>n.textContent||'').join('\n');}
function spreadsheetText(archive:Record<string,Uint8Array>){
 const parse=(bytes:Uint8Array)=>{const doc=new DOMParser().parseFromString(decodeText(bytes),'application/xml');if(doc.querySelector('parsererror'))throw new Error('表格无法解析');return doc;};
 const strings=archive['xl/sharedStrings.xml']?Array.from(parse(archive['xl/sharedStrings.xml']).getElementsByTagNameNS('*','si')).map(n=>n.textContent||''):[];
 return Object.entries(archive).filter(([name])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([name,bytes])=>'【'+name+'】\n'+Array.from(parse(bytes).getElementsByTagNameNS('*','row')).map(row=>Array.from(row.getElementsByTagNameNS('*','c')).map(cell=>{const type=cell.getAttribute('t'),value=cell.getElementsByTagNameNS('*','v')[0]?.textContent||'',formula=cell.getElementsByTagNameNS('*','f')[0]?.textContent;const resolved=type==='s'?strings[Number(value)]??'[共享文字未读取]':type==='inlineStr'?cell.getElementsByTagNameNS('*','is')[0]?.textContent||'':value;return `${cell.getAttribute('r')||''}: ${resolved}${formula?'（公式：'+formula+'；值为文件保存的结果）':''}`;}).join(' | ')).join('\n')).join('\n\n');
}
function reading(text:string,extra=''):AttachmentReading{const truncated=text.length>MAX_TEXT;return {text:text.slice(0,MAX_TEXT),status:text.trim()?`已读取文字${truncated?'（前 18000 字，后文未发送）':''}${extra}`:'没有提取到文字；原文件已保存，不能声称读过内容'};}
export async function readAttachment(file:File,detectedType=file.type):Promise<AttachmentReading>{
 if(detectedType.startsWith('image/'))return {text:'',status:'图片已保存；理解取决于模型视觉能力、图片格式和大小'};
 if(file.size>MAX_FILE)return {text:'',status:'原文件已保存；自动解析限 20 MB，请拆分后阅读'};
 try{
  if(textExtension.test(file.name)||file.type.startsWith('text/')){const bytes=new Uint8Array(await file.slice(0,1024*1024).arrayBuffer());if(bytes.includes(0)&&!(bytes[0]===255||bytes[0]===254))return {text:'',status:'检测到二进制内容，原文件已保存，未作为文字解析'};return reading(decodeText(bytes),file.size>bytes.length?'；只分析文件前 1 MB':'');}
  if(/\.pdf$/i.test(file.name)){
   const {readPDF}=await import('./pdf-reading');return await readPDF(new Uint8Array(await file.arrayBuffer()));
  }
  if(/\.(docx|pptx|xlsx|odt|zip)$/i.test(file.name)){
   const office=!/\.zip$/i.test(file.name);let total=0,count=0,skipped=0;
   const archive=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>{const wanted=office?/^(?:word\/document\.xml|ppt\/slides\/slide\d+\.xml|xl\/(?:sharedStrings\.xml|worksheets\/sheet\d+\.xml)|content\.xml)$/.test(entry.name):textExtension.test(entry.name);if(!wanted||entry.originalSize>1024*1024||total+entry.originalSize>MAX_EXPANDED||count>=40){if(entry.originalSize)skipped++;return false;}total+=entry.originalSize;count++;return true;}});
   const text=/\.xlsx$/i.test(file.name)?spreadsheetText(archive):Object.entries(archive).sort(([a],[b])=>a.localeCompare(b,undefined,{numeric:true})).map(([name,bytes])=>`【${name}】\n${office?xmlText(bytes):decodeText(bytes)}`).join('\n\n');
   return reading(text,skipped?`；${skipped} 项未解析（非文字或超出限制）`:'');
  }
  return {text:'',status:'原文件已保存；此格式暂未解析，模型没有收到文件内容'};
 }catch{return {text:'',status:'解析失败或文件加密；原文件已保存，不能声称读过内容'};}
}
export async function attachmentText(file:File):Promise<string>{return (await readAttachment(file)).text;}
