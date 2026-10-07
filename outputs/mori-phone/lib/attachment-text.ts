import {unzipSync} from 'fflate';
export async function attachmentText(file:File):Promise<string>{
 if(/\.(txt|md|csv|json|log)$/i.test(file.name)&&file.size<=256000)return (await file.text()).slice(0,18000);
 if(!/\.docx$/i.test(file.name)||file.size>20*1024*1024)return '';
 try{
  const archive=unzipSync(new Uint8Array(await file.arrayBuffer()),{filter:entry=>entry.name==='word/document.xml'&&entry.originalSize<=1024*1024});
  if(!archive['word/document.xml'])return '';
  const xml=new DOMParser().parseFromString(new TextDecoder().decode(archive['word/document.xml']),'application/xml');if(xml.getElementsByTagName('parsererror').length)return '';
  const ns='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  return Array.from(xml.getElementsByTagNameNS(ns,'p')).map(p=>Array.from(p.getElementsByTagNameNS(ns,'t')).map(t=>t.textContent).join('')).join('\n').slice(0,18000);
 }catch{return '';}
}
