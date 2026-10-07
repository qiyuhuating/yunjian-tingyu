import type {PhoneState} from './phone-model';
export const roleplayPresets=[
 {id:'everyday',name:'日常轻聊',note:'像手机消息一样自然，一次聊一件小事。',prompt:'用自然的手机聊天语气回应。最多一个短动作，不写大段旁白。不为凑剧情制造冲突。'},
 {id:'story',name:'温柔剧情',note:'一句对白、一点动作，故事慢慢往前。',prompt:'用简短对白和动作描写交替推进。只写眼前一个场景节拍，不跳时间、不一口气完成整场戏。'},
 {id:'slowburn',name:'细腻共演',note:'留意情绪与细节，把决定留给你。',prompt:'保持慢节奏的角色共演。用一个具体细节表达情绪，允许沉默、犹豫和性格差异。不强行升温关系。'},
] as const;
export function roleplayInstructions(state:PhoneState){
 const p=state.roleplay,preset=roleplayPresets.find(v=>v.id===p.preset)!;
 return `角色扮演预设：${preset.name}。${preset.prompt}\n保持角色卡的人设、口吻、场景和示例风格；不照抄示例或上一轮的措辞。只写当前角色的台词与动作，不代写用户的台词、想法、情绪或选择，不替用户决定关系和剧情。\n闲聊每轮只接住当前话题，信息不足时最多问一个问题，不机械复盘背景或总结。编程、数学、绘画、分析和教学按任务需要完整作答，不套用闲聊字数或段数限制；保持角色口吻，但不能省掉必要步骤、代码与结果。${p.length==='short'?'普通闲聊优先 60–160 个汉字，两小段以内。':'普通闲聊优先 160–280 个汉字，三小段以内。'}除非用户明确要求详细解释，否则保持此节奏；思考强度不改变回复长度。`;
}
export function choiceInstructions(enabled:boolean){return enabled?'若当前话题有自然的分支，正文后另起一行，附最多两个适合用户说出或做出的简短接话选项，每项不超过 22 个汉字。不要替用户作决定，不要重复正文问题，也不强行在告别或无需回复时加选项。格式严格为 <cloudlet-choices>["选项一","选项二"]</cloudlet-choices>；只输出 JSON 字符串数组，不输出说明。用户仍可以自由输入。':'只输出角色正文，不附接话选项或格式标签。';}
// The trailer is presentation metadata; it never becomes chat history or user input by itself.
export function splitRoleplayReply(answer:string){
 const start=answer.search(/(?:^|\n)<cloudlet-choices>/);if(start<0)return {text:answer.trim(),suggestions:[] as string[]};
 const body=answer.slice(0,start).trim(),trailer=answer.slice(start).trim();if(!body)return {text:answer.trim(),suggestions:[] as string[]};
 const match=trailer.match(/^<cloudlet-choices>([\s\S]*?)<\/cloudlet-choices>\s*$/);let suggestions:string[]=[];
 if(match)try{const value=JSON.parse(match[1]);if(Array.isArray(value)&&value.length<=2&&value.every(v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=40&&!/[\n\r<>]/.test(v)))suggestions=[...new Set(value.map(v=>v.trim()))];}catch{}
 // Hide unfinished metadata while streaming, but preserve ordinary prose following a tag.
 return match||!trailer.includes('</cloudlet-choices>')?{text:body,suggestions}:{text:answer.trim(),suggestions:[] as string[]};
}
