import {characterSchema,loreSchema,uid,type Character,type PhoneState} from './phone-model';
export type ImportedCharacter={character:Character;lore:PhoneState['lore'];warnings:string[];format:string;image?:File};
export function blankCharacter(name='新朋友',description=''):Character{return characterSchema.parse({id:uid(),name:name.slice(0,50)||'新朋友',description:description.slice(0,18000),personality:'',scenario:'',greeting:'你好，很高兴见到你。',examples:'',avatar:'',color:'blue',emoji:'✨',affection:0,trust:30,birthday:'',systemPrompt:''});}
const logic=['andAny','notAll','notAny','andAll'] as const;
export function normalizeLore(e:any,index:number,scope:string,book:any={},archive=false){
 const ext=e.extensions||{},keys=(v:unknown)=>{const list=Array.isArray(v)?v.filter(k=>typeof k==='string'):typeof v==='string'?v.split(/[,，]/):[],kept:string[]=[];let size=0;for(const raw of list){const key=raw.trim();if(!key||size+key.length+(kept.length?1:0)>400)continue;kept.push(key);size+=key.length+(kept.length>1?1:0);}return kept.join(',');};
 const limit=(v:unknown,max:number)=>typeof v==='string'?v.slice(0,max):'';
 const rawDepth=ext.scan_depth??e.scanDepth??book.scan_depth;
 return loreSchema.parse({id:uid(),scope,title:limit(e.name||e.comment,160)||'世界背景 '+(index+1),keys:keys(e.keys??e.key),text:limit(e.content,18000),enabled:e.enabled!==false&&e.disable!==true,constant:e.constant===true,order:Number.isFinite(e.insertion_order??e.order)?e.insertion_order??e.order:100,selective:e.selective===true,secondaryKeys:keys(e.secondary_keys??e.keysecondary),caseSensitive:(e.case_sensitive??ext.case_sensitive??e.caseSensitive)===true,sourceIndex:archive?undefined:index,selectiveLogic:logic[ext.selectiveLogic??e.selectiveLogic]||'andAny',wholeWords:(ext.match_whole_words??e.matchWholeWords)===true,scanDepth:Number.isInteger(rawDepth)?Math.min(100,Math.max(1,rawDepth)):4,recursive:book.recursive_scanning===true,excludeRecursion:(ext.exclude_recursion??e.excludeRecursion)===true,preventRecursion:(ext.prevent_recursion??e.preventRecursion)===true,position:e.position==='before_char'||ext.position===0||e.position===0?'before':'after',sourceExtras:archive?JSON.stringify(e):'{}'});
}
function loreCompatibilityWarnings(e:any,index:number){
 const ext=e.extensions||{},warnings:string[]=[];
 const allKeys=[...(Array.isArray(e.keys??e.key)?e.keys??e.key:[]),...(Array.isArray(e.secondary_keys??e.keysecondary)?e.secondary_keys??e.keysecondary:[])];
 if(allKeys.some(k=>typeof k==='string'&&/^\/.+\/[a-z]*$/i.test(k)))warnings.push(`世界书第 ${index+1} 条含正则样式关键词，本应用按字面关键词处理，不执行正则。`);
 if(allKeys.filter(k=>typeof k==='string').join(',').length>400)warnings.push(`世界书第 ${index+1} 条关键词较长，当前保留400字符预算内的完整关键词；完整原字段仍用于未修改导出。`);
 if((e.content?.length||0)>18000)warnings.push(`世界书第 ${index+1} 条超过18000字，当前使用前18000字；完整原文保留用于未修改导出。`);
 if((e.position!==undefined&&!['before_char','after_char',0,1].includes(e.position))||(ext.position!==undefined&&![0,1].includes(ext.position))||ext.useProbability===true||ext.sticky||ext.cooldown||ext.delay||e.use_regex||e.decorators?.length)warnings.push(`世界书第 ${index+1} 条含未支持的插入位置、正则或定时/概率规则，将使用普通背景匹配；原始规则保留用于导出。`);
 return warnings;
}
export async function parseWorldBook(file:File,scope:string){
 if(file.size>4*1024*1024)throw new Error('世界书文件请控制在4 MB以内。');
 const raw=JSON.parse(await file.text()),book=raw.character_book??raw.data?.character_book??raw;
 if(!book||typeof book!=='object'||!book.entries||typeof book.entries!=='object')throw new Error('请选择含 entries 的 SillyTavern 或角色卡世界书 JSON。');
 const entries=Array.isArray(book.entries)?book.entries:Object.values(book.entries);
 if(!entries.length||entries.length>1000)throw new Error('世界书需要1至1000个条目。');
 const warnings:string[]=[],lore:PhoneState['lore']=entries.map((e:any,i:number)=>{
  if(!e||typeof e!=='object'||typeof e.content!=='string'||!e.content.trim())throw new Error(`世界书第 ${i+1} 条缺少正文。`);
  if(e.content.length>18000||JSON.stringify(e).length>65000)throw new Error(`世界书第 ${i+1} 条过长，请先拆分以完整保留原文。`);
  warnings.push(...loreCompatibilityWarnings(e,i));return normalizeLore(e,i,scope,book,true);
 });
 return {lore,warnings};
}
function sourceRecord(l:PhoneState['lore'][number]){let raw:any={};try{raw=JSON.parse(l.sourceExtras);}catch{}return raw;}
function exportLore(l:PhoneState['lore'][number],source:any={},before?:PhoneState['lore'][number]){
 const unchanged=(field:keyof typeof l)=>before&&JSON.stringify(l[field])===JSON.stringify(before[field]);
 const keep=(value:unknown,key:string,field:keyof typeof l)=>unchanged(field)&&source[key]!==undefined?source[key]:value;
 const extensions={...source.extensions};
 for(const [field,key,value] of [['selectiveLogic','selectiveLogic',logic.indexOf(l.selectiveLogic)],['wholeWords','match_whole_words',l.wholeWords],['scanDepth','scan_depth',l.scanDepth],['excludeRecursion','exclude_recursion',l.excludeRecursion],['preventRecursion','prevent_recursion',l.preventRecursion]] as const){if(!unchanged(field))extensions[key]=value;}
 if(!unchanged('position')&&extensions.position!==undefined)extensions.position=l.position==='before'?0:1;
 return {...source,name:keep(l.title,'name','title'),keys:keep(l.keys.split(/[,，]/).map(k=>k.trim()).filter(Boolean),'keys','keys'),content:keep(l.text,'content','text'),enabled:l.enabled,...(source.disable!==undefined?{disable:!l.enabled}:{}),constant:l.constant,insertion_order:l.order,selective:l.selective,secondary_keys:keep(l.secondaryKeys.split(/[,，]/).map(k=>k.trim()).filter(Boolean),'secondary_keys','secondaryKeys'),case_sensitive:l.caseSensitive,position:keep(l.position==='before'?'before_char':'after_char','position','position'),extensions};
}
export function exportWorldBook(lore:PhoneState['lore']){
 return {name:'云笺世界书',recursive_scanning:lore.some(l=>l.recursive),entries:lore.map(l=>{const source=sourceRecord(l);const before=Object.keys(source).length?normalizeLore(source,0,l.scope,{},true):undefined;return exportLore(l,source,before);})};
}

function fromJson(raw:any,fileName:string):ImportedCharacter{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('角色卡需要是一个 JSON 对象。');
 const data=raw.data&&typeof raw.data==='object'&&!Array.isArray(raw.data)?raw.data:raw,warnings:string[]=[];
 const str=(v:unknown,label:string,max=18000)=>{if(typeof v!=='string')return '';if(v.length>max)warnings.push(`${label}超过 ${max} 字，导入时会截取。原始字段保留在备份中；导出时保留未修改的长字段。`);return v.slice(0,max);};
 const character=blankCharacter(str(data.name,'姓名',50)||fileName.replace(/\.[^.]+$/,''),str(data.description||data.persona||data.prompt,'人设'));
 character.personality=str(data.personality,'性格');character.scenario=str(data.scenario,'场景');character.greeting=str(data.first_mes||data.greeting,'开场白')||character.greeting;
 character.examples=str(data.mes_example||data.examples,'示例');character.systemPrompt=str(data.system_prompt||data.systemPrompt,'补充设定');character.postHistory=str(data.post_history_instructions,'后置指令');
 character.alternateGreetings=(Array.isArray(data.alternate_greetings)?data.alternate_greetings:[]).filter((v:unknown)=>typeof v==='string').slice(0,30).map((v:string)=>str(v,'备选开场白'));
 if(data.alternate_greetings?.length>30)warnings.push('应用最多使用 30 个备选开场白，完整列表仍保留在原始卡中。');
 character.tags=(Array.isArray(data.tags)?data.tags:[]).filter((v:unknown)=>typeof v==='string').slice(0,40).map((v:string)=>v.slice(0,160));
 character.creator=str(data.creator,'作者',160);character.creatorNotes=str(data.creator_notes,'作者说明');character.cardVersion=str(data.character_version,'卡片版本',160);
 const original=JSON.stringify(raw);if(original.length>1000000)throw new Error('角色数据超过 100 万字符。请拆分大型世界书后再导入，以完整保留卡片字段。');character.cardExtras=original;
 const entries=data.character_book?.entries,lore:PhoneState['lore']=[];
 if(Array.isArray(entries)){
  if(entries.length>1000)throw new Error('角色卡包含超过 1000 个世界书条目，请先拆分。');
  for(const [index,e] of entries.entries()){
   if(!e||typeof e!=='object')throw new Error(`第 ${index+1} 个世界书条目格式不正确。`);
   lore.push(normalizeLore(e,index,character.id,data.character_book));
   if(JSON.stringify(e).length>65000)throw new Error('单条世界书原始数据过大，请拆分。');
   warnings.push(...loreCompatibilityWarnings(e,index));
  }
 }
 if(!character.description&&!character.personality&&!character.systemPrompt)throw new Error('角色卡里没有 description、personality 或人设内容。');
 if(raw.spec==='chara_card_v3'||data.assets?.length||data.extensions||entries?.some((e:any)=>e?.extensions||e?.position))warnings.push('扩展、媒体引用与世界书插入位置会保留用于导出；本应用支持有界递归、主次条件和角色前后背景；深度/示例/作者注插入位置、正则、概率、定时效果、第三方脚本与 V3 装饰器保留但不执行。');
 return {character:characterSchema.parse(character),lore,warnings,format:raw.spec==='chara_card_v3'?'JSON V3':raw.spec==='chara_card_v2'?'JSON V2':'JSON V1 / 人设'};
}
async function inflate(data:Uint8Array):Promise<string>{
 const reader=new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();const parts:Uint8Array[]=[];let total=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>1024*1024)throw new Error('角色信息解压后超过 1 MB。');parts.push(value);}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
 return new TextDecoder('utf-8',{fatal:true}).decode(await new Blob(parts as BlobPart[]).arrayBuffer());
}
export function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
export async function parseCharacter(file:File):Promise<ImportedCharacter>{
 if(file.size>4*1024*1024)throw new Error('角色卡请控制在 4 MB 以内。');const ext=file.name.toLowerCase().split('.').pop(),buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer);
 if(ext==='txt'){
  let value='',encoding='UTF-8';try{value=new TextDecoder(bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8',{fatal:true}).decode(bytes);}catch{value=new TextDecoder('gb18030').decode(bytes);encoding='GB18030';}
  if(!value.trim())throw new Error('TXT 文件是空的。');if(value.length>18000)throw new Error('TXT 人设超过 18000 字，请拆分后导入。');
  return {character:blankCharacter(file.name.replace(/\.txt$/i,''),value),lore:[],format:'TXT 人设',warnings:encoding==='GB18030'?['检测到非 UTF-8 编码，已按 GB18030 解码，请在预览中检查文字。']:[]};
 }
 if(ext==='json'){try{return fromJson(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),file.name);}catch(e){if(e instanceof SyntaxError)throw new Error('JSON 格式不正确，请检查文件。');throw e;}}
 if(ext!=='png')throw new Error('请选择 TXT、JSON 或 PNG 角色卡。');
 if(bytes.length<8||[137,80,78,71,13,10,26,10].some((v,i)=>bytes[i]!==v))throw new Error('文件不是有效的 PNG。');
 const view=new DataView(buffer),decoder=new TextDecoder();let card='',priority=0,ended=false,header=false;
 for(let offset=8;offset<bytes.length;){
  if(offset+12>bytes.length)throw new Error('PNG 数据块不完整。');const length=view.getUint32(offset),end=offset+length+12;if(end>bytes.length)throw new Error('PNG 数据块不完整。');
  const type=decoder.decode(bytes.subarray(offset+4,offset+8)),chunk=bytes.subarray(offset+8,offset+8+length);
  if(crc32(bytes.subarray(offset+4,offset+8+length))!==view.getUint32(offset+8+length))throw new Error('PNG 校验失败，文件可能损坏。');
  if(offset===8){if(type!=='IHDR'||length!==13)throw new Error('PNG 图像头不正确。');header=true;}
  if(['tEXt','zTXt','iTXt'].includes(type)){
   const zero=chunk.indexOf(0),key=zero>=0?decoder.decode(chunk.subarray(0,zero)):'';
   if(['chara','ccv3'].includes(key)){
    let value='';if(type==='tEXt')value=decoder.decode(chunk.subarray(zero+1));
    if(type==='zTXt'){if(chunk[zero+1]!==0)throw new Error('PNG 压缩方式不支持。');value=await inflate(chunk.subarray(zero+2));}
    if(type==='iTXt'){const flag=chunk[zero+1],method=chunk[zero+2];let start=zero+3;for(let i=0;i<2;i++){const n=chunk.indexOf(0,start);if(n<0)throw new Error('PNG 文本信息不完整。');start=n+1;}if(flag===0)value=decoder.decode(chunk.subarray(start));else if(flag===1&&method===0)value=await inflate(chunk.subarray(start));else throw new Error('PNG 文本压缩方式不支持。');}
    const rank=key==='ccv3'?2:1;if(rank>=priority){card=value;priority=rank;}
   }
  }
  offset=end;if(type==='IEND'){if(length!==0)throw new Error('PNG 结束块不正确。');ended=true;break;}
 }
 if(!header||!ended)throw new Error('PNG 数据不完整，缺少图像头或结束块。');
 if(!card)return {character:blankCharacter(file.name.replace(/\.png$/i,''),'请在角色设定里填写这位朋友的人设。'),lore:[],image:file,format:'PNG 头像',warnings:['这张 PNG 没有嵌入角色设定，将作为头像导入。']};
 try{const json=card.trim().startsWith('{')?card:new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(card.trim()),c=>c.charCodeAt(0)));return {...fromJson(JSON.parse(json),file.name),format:priority===2?'PNG V3':'PNG V2',image:file};}catch(e){throw new Error('PNG 中的角色数据无法解析：'+(e instanceof Error?e.message:'格式不支持'));}
}
export function exportCharacter(character:Character,lore:PhoneState['lore']){
 let raw:any={};try{raw=JSON.parse(character.cardExtras);}catch{}const original=raw.data&&typeof raw.data==='object'?raw.data:raw;
 let baseline:ImportedCharacter|undefined;try{baseline=fromJson(raw,'original.json');}catch{}
 const keep=(value:unknown,key:string,field:keyof Character,alias?:string)=>baseline&&JSON.stringify(value)===JSON.stringify(baseline.character[field])?(original[key]??(alias?original[alias]:undefined)??value):value;
 const data={...original,name:keep(character.name,'name','name'),description:keep(character.description,'description','description',original.persona?'persona':'prompt'),personality:keep(character.personality,'personality','personality'),scenario:keep(character.scenario,'scenario','scenario'),first_mes:keep(character.greeting,'first_mes','greeting','greeting'),mes_example:keep(character.examples,'mes_example','examples','examples'),system_prompt:keep(character.systemPrompt,'system_prompt','systemPrompt','systemPrompt'),post_history_instructions:keep(character.postHistory,'post_history_instructions','postHistory'),alternate_greetings:keep(character.alternateGreetings,'alternate_greetings','alternateGreetings'),tags:keep(character.tags,'tags','tags'),creator:keep(character.creator,'creator','creator'),creator_notes:keep(character.creatorNotes,'creator_notes','creatorNotes'),character_version:keep(character.cardVersion,'character_version','cardVersion'),extensions:original.extensions||{}};
 const entries=lore.filter(l=>l.scope===character.id).map(l=>{
  const source=l.sourceIndex===undefined?sourceRecord(l):original.character_book?.entries?.[l.sourceIndex]||{},before=l.sourceIndex===undefined?(Object.keys(source).length?normalizeLore(source,0,l.scope,{},true):undefined):baseline?.lore.find(v=>v.sourceIndex===l.sourceIndex);
  return exportLore(l,source,before);
 });
 if(entries.length||original.character_book)data.character_book={...original.character_book,recursive_scanning:lore.filter(l=>l.scope===character.id).some(l=>l.recursive),entries};
 return {...raw,spec:raw.spec==='chara_card_v3'?'chara_card_v3':'chara_card_v2',spec_version:raw.spec==='chara_card_v3'?'3.0':'2.0',data};
}

