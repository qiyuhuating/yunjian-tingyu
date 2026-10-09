import {sha256} from '@noble/hashes/sha2.js';
import {cardCharacterSchema,characterSchema,savedCardSchema,uid,type Character,type PhoneState,type SavedCard} from './phone-model';
import {blankCharacter,type ImportedCharacter} from './character-import';
import {renderTemplate} from './chat-prompt';

export function cardSettings(character:Character){const {aiConnection:_ai,affection:_affection,trust:_trust,sourceCardId:_source,sourceCardRevision:_revision,...settings}=character;return cardCharacterSchema.parse(settings);}

// Templates contain authored settings, never a live character's relationship or AI connection.
export function makeSavedCard(character:Character,lore:PhoneState['lore'],now=Date.now()):SavedCard{
 const id=uid(),settings=cardSettings(character);
 return savedCardSchema.parse({id,character:{...settings,id},lore:lore.filter(l=>l.scope===character.id).map(l=>({...l,id:uid(),scope:id})),revision:1,createdAt:now,updatedAt:now});
}
export function blankSavedCard(){return makeSavedCard(blankCharacter('新角色卡'),[]);}
export function cardCharacter(card:SavedCard):Character{return characterSchema.parse({...card.character,affection:0,trust:30});}
export function previewSavedCard(card:SavedCard):ImportedCharacter{
 const character={...cardCharacter(card),id:uid(),sourceCardId:card.id,sourceCardRevision:card.revision};
 return {character,lore:card.lore.map(l=>({...l,id:uid(),scope:character.id})),warnings:[],format:'卡库 · 第 '+card.revision+' 版'};
}
function stable(value:unknown):unknown{
 if(Array.isArray(value))return value.map(stable);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,stable(v)]));
 return value;
}
export function cardFingerprint(card:SavedCard){
 const {id:_id,...settings}=card.character;
 // Raw archives are included: different extensions or original text are distinct cards.
 const content={settings,lore:card.lore.map(({id:_id,scope:_scope,...l})=>l)};
 const bytes=sha256(new TextEncoder().encode(JSON.stringify(stable(content))));return Array.from(bytes,v=>v.toString(16).padStart(2,'0')).join('');
}
export function addSavedCard(state:PhoneState,card:SavedCard){
 const parsed=savedCardSchema.parse(card),fingerprint=cardFingerprint(parsed),same=state.characterCards.find(c=>cardFingerprint(c)===fingerprint);
 if(same)return {id:same.id,duplicate:true};
 if(state.characterCards.length>=200)throw new Error('角色卡仓库最多保存 200 张卡，请先导出并整理。');
 state.characterCards.push(parsed);return {id:parsed.id,duplicate:false};
}
export function editSavedCard(state:PhoneState,card:SavedCard,expectedRevision:number){
 const index=state.characterCards.findIndex(c=>c.id===card.id),current=state.characterCards[index];
 if(!current||current.revision!==expectedRevision)throw new Error('这张卡片已被修改或删除，请返回卡库重新打开。未保存草稿仍保留。');
 const parsed=savedCardSchema.parse({...card,character:cardCharacterSchema.parse(card.character),revision:current.revision+1,createdAt:current.createdAt,updatedAt:Date.now()});
 state.characterCards[index]=parsed;
}
export function copySavedCard(card:SavedCard){
 const copy=makeSavedCard(cardCharacter(card),card.lore);return {...copy,folder:card.folder,notes:card.notes,character:{...copy.character,name:(card.character.name+' 副本').slice(0,50)}};
}
export function removeSavedCard(state:PhoneState,id:string){state.characterCards=state.characterCards.filter(c=>c.id!==id);delete state.drafts['editor:cards:'+id];}

// Every application creates fresh runtime IDs. Updates are deliberate and retain all live state.
export function installCharacterCard(state:PhoneState,settings:Character,lore:PhoneState['lore'],targetId='',greetingIndex=0,includeLore=true){
 const existing=targetId?state.characters.find(c=>c.id===targetId):undefined;
 if(targetId&&!existing)throw new Error('要更新的角色已不存在，请重新选择。');
 if(!existing&&state.characters.length>=80)throw new Error('最多保存 80 位聊天角色，请先整理。');
 if(includeLore&&state.lore.length-(existing?state.lore.filter(l=>l.scope===existing.id).length:0)+lore.length>1000)throw new Error('世界书总数会超过 1000 条，请先整理或取消导入世界书。');
 const character=characterSchema.parse({...settings,id:existing?.id||uid(),affection:existing?.affection??0,trust:existing?.trust??30,aiConnection:existing?.aiConnection,avatar:existing?.avatar||settings.avatar});
 if(existing)state.characters[state.characters.findIndex(c=>c.id===existing.id)]=character;
 else{state.characters.push(character);state.threads[character.id]=[{id:uid(),role:'assistant',text:renderTemplate([character.greeting,...character.alternateGreetings][greetingIndex]||character.greeting,state,character),timestamp:Date.now(),kind:'text',read:true}];}
 if(includeLore){state.lore=state.lore.filter(l=>l.scope!==character.id);state.lore.push(...lore.map(l=>({...l,id:uid(),scope:character.id})));}
 return character;
}
