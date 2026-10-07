import type {Character,Message,PhoneState} from './phone-model';

export const groupInstructions='群聊是手机上的文字消息，不是小说、剧本或面对面场景。只发送当前角色会亲手打出的消息，保留人设、关系和口吻。禁止旁白、动作、心理独白、环境描写、舞台提示、角色名前缀、Markdown 和接话选项；角色卡中的剧情写法仅作为性格资料，不照搬。一次接住眼前的话题，也可以回应群里刚说话的人；不代替其他成员发言，不要求所有人依次表态。用自然中文口语，不机械复述问题，不总结整段聊天，不每次用同一句问候或结尾。通常每条 5—40 个字，最多 60 字；一次 1—3 条，总计最多 180 字。短回应可以只是几个字；有用的信息要说清，不为短而敷衍。嗯、哈哈、等下、真的假的、我也是等表达按性格和情境使用，避免每句都堆语气词或表情。示例只是节奏参考，不能照抄：别人问今晚吃什么，可以说“我想吃面”“你们呢”；别人说刚下班，可以说“辛苦了”“先歇会儿吧”。严格输出 <cloudlet-messages>["第一条消息","可选的第二条"]</cloudlet-messages>，数组中只有当前角色的消息，不加其他字段或说明。';

export function groupSpeakers(state:PhoneState,thread:string,text:string){
 const group=state.groups.find(g=>g.id===thread);if(!group)return [];
 const members=group.members.filter(id=>state.characters.some(c=>c.id===id));
 const mentioned=members.filter(id=>text.includes('@'+state.characters.find(c=>c.id===id)!.name));
 if(mentioned.length)return mentioned;
 if(/@所有人|@大家/.test(text))return members;
 const previous=[...(state.threads[thread]||[])].reverse().find(m=>m.role==='assistant'&&!m.failed&&members.some(id=>m.senderId?m.senderId===id:state.characters.find(c=>c.id===id)?.name===m.sender));
 const last=previous?members.findIndex(id=>previous.senderId?previous.senderId===id:state.characters.find(c=>c.id===id)?.name===previous.sender):-1;
 return Array.from({length:Math.min(2,members.length)},(_,i)=>members[(last+1+i)%members.length]);
}

export function conversationRole(message:Message,character:Character,group:boolean):'assistant'|'user'{
 if(message.role!=='assistant')return 'user';
 return !group||(message.senderId?message.senderId===character.id:message.sender===character.name)?'assistant':'user';
}

export function parseGroupReply(answer:string){
 const value=answer.trim(),match=value.match(/^<cloudlet-messages>([\s\S]*?)<\/cloudlet-messages>$/);
 let lines:unknown;
 if(match){try{lines=JSON.parse(match[1]);}catch{throw new Error('群消息格式不正确。');}}
 else lines=value.split(/\n+/).map(line=>line.trim()).filter(Boolean);
 if(!Array.isArray(lines)||!lines.length||lines.length>3||lines.some(line=>typeof line!=='string'))throw new Error('群回复需要一到三条文字消息。');
 const messages=(lines as string[]).map(line=>line.trim());
 if(messages.some(line=>!line||Array.from(line).length>60||/[\n\r<>*`]|^(?:旁白|动作|环境|场景|内心|心理描写)[：:]/.test(line))||messages.reduce((n,line)=>n+Array.from(line).length,0)>180)throw new Error('群回复应是简短消息，不含旁白或动作描写。');
 return messages;
}
