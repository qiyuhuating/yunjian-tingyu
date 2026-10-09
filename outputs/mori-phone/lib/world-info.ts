import type {PhoneState,Message} from './phone-model';
import {contextPlan,estimateTokens} from './context-window';
export type LoreTrace={id:string;title:string;reason:'disabled'|'scope'|'noMatch'|'recursion'|'budget'|'selected';tokens:number;round:number};
export type SelectedLore={id:string;title:string;content:string};
const words=(keys:string)=>keys.split(/[,，]/).map(k=>k.trim()).filter(Boolean);
function hasKey(haystack:string,key:string,whole:boolean){
 if(!whole||/[\u3400-\u9fff]/.test(key))return haystack.includes(key);
 // Only literal matching. Imported regular expressions are not executed.
 let at=haystack.indexOf(key);
 while(at>=0){const before=haystack[at-1]||'',after=haystack[at+key.length]||'';if(!/[\p{L}\p{N}_]/u.test(before)&&!/[\p{L}\p{N}_]/u.test(after))return true;at=haystack.indexOf(key,at+1);}
 return false;
}
export function selectLore(state:PhoneState,character:string,text:string,history:Message[],fill:(s:string)=>string=s=>s,budgetOverride?:number){
 const budget=Math.max(0,Math.floor(budgetOverride??Math.min(2048,contextPlan(state).inputTokens*.12))),trace=new Map<string,LoreTrace>(),selected=new Map<string,SelectedLore>(),before:SelectedLore[]=[],after:SelectedLore[]=[];
 let tokens=0,recursiveText='';const scanCache=new Map<number,string>();
 const recent=history.filter(m=>!m.failed&&m.role!=='system');
 const scan=(depth:number)=>{if(!scanCache.has(depth))scanCache.set(depth,[text,...recent.slice(-depth).map(m=>m.text)].join('\n'));return scanCache.get(depth)!;};
 const entries=[...state.lore].sort((a,b)=>Number(b.constant)-Number(a.constant)||a.order-b.order||a.id.localeCompare(b.id));
 // Three expansion passes plus the direct scan. Cycles cannot select twice.
 for(let round=0;round<=3;round++){
  let added=false,next='';
  for(const e of entries){
   if(selected.has(e.id))continue;
   const record=(reason:LoreTrace['reason'],size=0)=>trace.set(e.id,{id:e.id,title:e.title,reason,tokens:size,round});
   if(!e.enabled){record('disabled');continue;}if(!e.text.trim()){record('noMatch');continue;}if(e.scope!=='global'&&e.scope!==character){record('scope');continue;}
   if(round>0&&(!e.recursive||e.excludeRecursion)){continue;}
   const raw=scan(e.scanDepth??4)+(round?'\n'+recursiveText:'');
   const hay=e.caseSensitive?raw:raw.toLocaleLowerCase(),match=(key:string)=>{const value=fill(key);return hasKey(hay,e.caseSensitive?value:value.toLocaleLowerCase(),e.wholeWords??false);};
   const secondary=words(e.secondaryKeys||'').map(match),logic=e.selectiveLogic??'andAny';
   const secondaryOK=!e.selective||!secondary.length||(logic==='andAll'?secondary.every(Boolean):logic==='notAll'?!secondary.every(Boolean):logic==='notAny'?!secondary.some(Boolean):secondary.some(Boolean));
   if(!e.constant&&(!words(e.keys).some(match)||!secondaryOK)){record(round===3?'recursion':'noMatch');continue;}
   const content=fill(e.text),size=estimateTokens(e.title+'：'+content)+8;
   if(tokens+size>budget){record('budget',size);continue;}
   const value={id:e.id,title:e.title,content};selected.set(e.id,value);(e.position==='before'?before:after).push(value);tokens+=size;record('selected',size);added=true;
   if(!e.preventRecursion)next+='\n'+content;
  }
  recursiveText+=next;if(!added||!next)break;
 }
 return {before,after,trace:[...trace.values()],tokens,budget};
}
