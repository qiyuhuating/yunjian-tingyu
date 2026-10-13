import {turnReceiptsSchema} from './turn-receipts';
import {mediaOutboxSchema} from './media-outbox';
import {queuedTurnsSchema} from './durable-turn-queue';
import {workspaceSchema} from './agent-workspace';
import {agentJobsSchema} from './agent-orchestrator';
import { z } from 'zod';
import {mediaSettingsSchema} from './media-contract';
import {providerSchema} from './providers';
import {CORE_SYSTEM_PROMPT} from './system-prompt';
import {MAX_CONTEXT_TOKENS,modelLimitSchema} from './context-window';
const short=z.string().max(160), text=z.string().max(18000), id=z.string().min(1).max(100).refine(value=>!Object.prototype.hasOwnProperty.call(Object.prototype,value),'记录编号不正确。');
const asset=z.string().regex(/^$|^(?:\/api\/assets\/|local:)[a-f0-9-]{36}$/);
export const characterAIConnectionSchema=z.object({provider:providerSchema,model:z.string().trim().min(1).max(160),baseURL:z.string().max(1500).default(''),vision:z.boolean().default(false),keyScope:z.enum(['provider','character']).default('provider')}).strict();
export const characterSchema=z.object({id,name:z.string().min(1).max(50),description:text,personality:text,scenario:text,greeting:text,examples:text,avatar:asset,color:z.enum(['blue','pink','green','peach','purple']),emoji:z.string().max(8),affection:z.number().int().min(0).max(100),trust:z.number().int().min(0).max(100),birthday:z.string().max(10),systemPrompt:text,postHistory:text.default(''),alternateGreetings:z.array(text).max(30).default([]),tags:z.array(short).max(40).default([]),creator:short.default(''),creatorNotes:text.default(''),cardVersion:short.default(''),cardExtras:z.string().max(1000000).default('{}'),sourceCardId:id.optional(),sourceCardRevision:z.number().int().min(1).optional(),aiConnection:characterAIConnectionSchema.optional()}).strict();
export type Character=z.infer<typeof characterSchema>;
export const messageSchema=z.object({id,role:z.enum(['user','assistant','system']),text,timestamp:z.number().finite().min(0).max(8640000000000000),duration:z.number().min(0).max(120).optional(),kind:z.enum(['text','voice','packet','transfer','kinship','image','file','notice']),amount:z.number().int().min(0).max(100000).optional(),asset:asset.optional(),fileName:short.optional(),fileSize:z.number().int().min(0).optional(),mime:short.optional(),extracted:z.string().max(18000).optional(),attachmentStatus:z.string().max(400).optional(),replyTo:id.optional(),sender:short.optional(),senderId:id.optional(),turnId:id.optional(),favorite:z.boolean().optional(),read:z.boolean().optional(),failed:z.boolean().optional(),failureReason:z.string().max(600).optional(),suggestions:z.array(z.string().min(1).max(40)).max(2).optional()}).strict();
export type Message=z.infer<typeof messageSchema>;
export const samplingSchema=z.object({temperature:z.number().min(0).max(2).default(.9),topP:z.number().min(.01).max(1).default(.98),maxTokens:z.number().int().min(128).max(4096).default(1200),contextChars:z.number().int().min(8000).max(64000).default(24000),contextMode:z.enum(['max','manual']).default('max'),contextTokens:z.number().int().min(1024).max(MAX_CONTEXT_TOKENS).default(32768),thinking:z.boolean().default(false),reasoningEffort:z.enum(['low','medium','high','xhigh']).default('medium'),penalties:z.boolean().default(false),frequencyPenalty:z.number().min(-2).max(2).default(.2),presencePenalty:z.number().min(-2).max(2).default(.1),repetitionPenalty:z.number().min(1).max(2).default(1.08),sendRepetition:z.boolean().default(false)}).strict();
export const roleplaySchema=z.object({preset:z.enum(['everyday','story','slowburn']).default('everyday'),length:z.enum(['short','balanced']).default('short'),choices:z.boolean().default(true)}).strict();
export const loreSchema=z.object({id,title:short,keys:z.string().max(400),text,enabled:z.boolean(),scope:id.default('global'),constant:z.boolean().default(false),order:z.number().finite().default(100),selective:z.boolean().default(false),secondaryKeys:z.string().max(400).default(''),caseSensitive:z.boolean().default(false),sourceIndex:z.number().int().min(0).optional(),selectiveLogic:z.enum(['andAny','notAll','notAny','andAll']).default('andAny'),wholeWords:z.boolean().default(false),scanDepth:z.number().int().min(1).max(100).default(4),recursive:z.boolean().default(false),excludeRecursion:z.boolean().default(false),preventRecursion:z.boolean().default(false),position:z.enum(['before','after']).default('after'),sourceExtras:z.string().max(65000).default('{}')}).strict();
export const cardCharacterSchema=characterSchema.omit({aiConnection:true,affection:true,trust:true,sourceCardId:true,sourceCardRevision:true});
export const savedCardSchema=z.object({id,character:cardCharacterSchema,lore:z.array(loreSchema).max(1000),folder:short.default(''),favorite:z.boolean().default(false),notes:z.string().max(4000).default(''),revision:z.number().int().min(1),createdAt:z.number().finite().min(0),updatedAt:z.number().finite().min(0)}).strict().superRefine((card,ctx)=>{if(card.character.id!==card.id||card.lore.some(l=>l.scope!==card.id)||new Set(card.lore.map(l=>l.id)).size!==card.lore.length)ctx.addIssue({code:'custom',message:'卡片与世界书编号不正确。'});});
export type SavedCard=z.infer<typeof savedCardSchema>;
export const stateSchema=z.object({
  schemaVersion:z.literal(1),appearanceRevision:z.literal(1).optional(),profile:z.object({name:z.string().min(1).max(30),address:z.string().min(1).max(30),birthday:short}).strict(),theme:z.enum(['sky','night','rose']),wallpaper:z.object({asset:asset.default(''),fit:z.enum(['cover','contain']).default('cover')}).strict().default({}),mediaSettings:mediaSettingsSchema.default({}),primary:id,
  characters:z.array(characterSchema).min(1).max(80),characterCards:z.array(savedCardSchema).max(200).default([]).superRefine((cards,ctx)=>{if(new TextEncoder().encode(JSON.stringify(cards)).length>12*1024*1024)ctx.addIssue({code:'custom',message:'角色卡仓库超过12 MB，请导出后整理。'});}),threads:z.record(z.array(messageSchema).max(100000)),groups:z.array(z.object({id,name:short,members:z.array(id).min(1).max(12)}).strict()).max(30),
  notes:z.array(z.object({id,text,from:short,date:short}).strict()).max(200),diaries:z.array(z.object({id,text,date:short,mood:z.string().max(8)}).strict()).max(500),todos:z.array(z.object({id,text:short,done:z.boolean()}).strict()).max(200),
  memories:z.array(z.object({id,text,scope:id,date:short,origin:z.enum(['manual','auto']).default('manual'),key:z.string().max(100).optional(),category:z.enum(['preference','fact','commitment']).optional(),sourceThread:id.optional(),sourceAt:z.number().finite().min(0).optional(),sourceIds:z.array(id).max(8).optional(),evidence:z.string().max(1000).optional(),locked:z.boolean().default(false),revisions:z.array(z.object({text,date:short}).strict()).max(5).default([])}).strict()).max(300),lore:z.array(loreSchema).max(1000),
  posts:z.array(z.object({id,text,author:short,emoji:z.string().max(8),date:short,likes:z.number().int().min(0),liked:z.boolean(),comments:z.array(short).max(100),kind:z.enum(['moments','forum','weibo'])}).strict()).max(500),
  pet:z.object({name:short,hunger:z.number().int().min(0).max(100),energy:z.number().int().min(0).max(100),love:z.number().int().min(0).max(100),personality:text.default('温柔、好奇、记得你的日常；开心时会撒娇，疲惫时会安静陪伴。'),catchphrase:short.default('今天也把一点点快乐叠好。')}).strict(),wallet:z.number().int().min(0).max(10000000),ledger:z.array(z.object({id,title:short,amount:z.number().int(),date:short}).strict()).max(1000),inventory:z.array(z.object({id,name:short,emoji:z.string().max(8),to:short}).strict()).max(300),
  gallery:z.array(z.object({id,url:asset,name:short}).strict()).max(100),music:z.array(z.object({id,url:asset,name:short,lyrics:text.default('')}).strict()).max(50),events:z.array(z.object({id,date:short,title:short,time:short,enabled:z.boolean()}).strict()).max(200),
  bookmarks:z.array(z.object({id,name:short,url:z.string().url().max(1500).refine(v=>/^https?:\/\//.test(v))}).strict()).max(100),claimed:z.array(short).max(100),workDate:short,focusMinutes:z.number().int().min(0).max(100000),focusSession:z.object({duration:z.number().int().min(1).max(120),remaining:z.number().int().min(0).max(7200),running:z.boolean(),deadline:z.number().min(0)}).strict().default({duration:25,remaining:1500,running:false,deadline:0}),longChat:z.boolean(),provider:providerSchema,model:short,baseURL:z.string().max(1500).default(''),vision:z.boolean().default(false),connections:z.record(z.object({model:short,baseURL:z.string().max(1500),vision:z.boolean()}).strict()).default({}),
  coreSystemPrompt:z.string().min(1).max(20000).refine(v=>!!v.trim(),'系统提示词不能为空。').default(CORE_SYSTEM_PROMPT),modelLimits:z.record(modelLimitSchema).default({}),
  sampling:samplingSchema.default({}),roleplay:roleplaySchema.default({}),drafts:z.record(z.string().max(12*1024*1024)).default({}),
  continuity:z.record(z.object({text:z.string().max(6000),through:id,updatedAt:z.number().finite().min(0),sourceDigest:z.string().regex(/^[0-9a-f]{64}$/).optional(),sources:z.array(z.object({id,role:z.enum(['user','assistant']),timestamp:z.number().finite().min(0),senderId:id.optional(),excerpt:z.string().max(2000)}).strict()).max(100).optional()}).strict()).default({}),
  turnReceipts:turnReceiptsSchema,
  queuedTurns:queuedTurnsSchema,
  mediaOutbox:mediaOutboxSchema,
  workspaceFiles:workspaceSchema,
  agentJobs:agentJobsSchema,
  memoryCursors:z.record(z.record(id)).default({}),memoryWatermarks:z.record(z.record(z.number().finite().min(0))).default({}),groupSettings:z.object({cadence:z.enum(['natural','fast']).default('natural'),maxResponders:z.number().int().min(1).max(4).default(2)}).strict().default({}),
  memorySettings:z.object({autoExtract:z.boolean().default(true),extractEvery:z.number().int().min(1).max(16).default(4),autoSummary:z.boolean().default(true),interval:z.number().int().min(16).max(100).default(32),recall:z.boolean().default(true),antiRepeat:z.boolean().default(true)}).strict().default({}),
  voiceSettings:z.object({engine:z.enum(['browser','openai','custom','gemini']).default('browser'),url:z.string().max(1500).default('https://api.openai.com/v1'),model:short.default('gpt-4o-mini-tts'),voice:short.default('coral'),rate:z.number().min(.5).max(2).default(.92),autoRead:z.boolean().default(false)}).strict().default({}),
  musicLink:z.string().max(1500).default('https://music.163.com/'),
}).strict().superRefine((state,ctx)=>{
 const characters=new Set(state.characters.map(c=>c.id)),groups=new Set(state.groups.map(g=>g.id));
 const invalid=(message:string)=>ctx.addIssue({code:'custom',message});
 if(new Set(state.characterCards.map(c=>c.id)).size!==state.characterCards.length)invalid('角色卡编号重复。');
 if(!characters.has(state.primary))invalid('默认角色不存在，请检查备份。');
 if(characters.size!==state.characters.length||groups.size!==state.groups.length||state.groups.some(g=>characters.has(g.id)))invalid('角色或群聊编号重复。');
 if(state.groups.some(g=>new Set(g.members).size!==g.members.length||g.members.some(id=>!characters.has(id))))invalid('群聊成员不存在或重复。');
});
export type PhoneState=z.infer<typeof stateSchema>;
export const uid=()=>crypto.randomUUID();
export const localDate=()=>new Date().toLocaleDateString('sv-SE');
export const timeLabel=()=>new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
const roster=[
 ['云汐','温柔但有自己的想法，记得小事，尊重彼此的生活。喜欢云朵、植物和一起听歌。','☁️','blue','窗边的云又变了形状。今天想和我一起做些什么？'],
 ['林晚晴','温柔安静的自由职业者。喜欢月亮、夜晚、散步。','🌙','purple','今晚如果有月亮，我们一起看看吧。'],
 ['陆沉','冷静理性的程序员，喜欢效率与规划，也愿意耐心倾听。','☕','blue','先休息一下，事情可以一件件来。'],
 ['苏小满','活泼开朗的奶茶店店员，喜欢奶茶、美食与日常趣事。','🍓','pink','你来啦！今天想喝什么？'],
 ['顾之舟','阳光热血的运动员，喜欢篮球与明确的目标。','🏀','peach','今天一起出门活动一下？'],
 ['沈知意','内敛文艺的图书管理员，喜欢书籍、文学与思考。','📖','green','你上次说的那本书，我找到了。'],
 ['江野','直率爽朗的健身教练，喜欢跑步、户外与健身。','🌿','green','我准备去散步，你要不要一起？'],
 ['温言','体贴细心的医生角色，关心日常作息，不提供诊断。','🍵','green','记得按时吃饭。今天过得怎么样？'],
 ['赵铁柱','朴实憨厚的农民，喜欢村里的日常与农活。','🌻','peach','院子里的花开了，给你留了一朵。'],
 ['秦不渡','冷峻克制的虚构守将，尊重边界，任何时候允许中止剧情。','🗝️','purple','回来了？坐吧，我在这里。'],
 ['程梨','温柔安静的花店店员，喜欢花茶、雨声、写信。','🌷','pink','今天的花很漂亮，想送你一枝。'],
 ['季川','直率爽朗的快递员，喜欢骑行、吉他与夜市。','🎸','blue','晚上的夜市开了，要去看看吗？'],
 ['宋栀','活泼开朗的成年大学生，喜欢拍照、甜点与贴纸。','🍰','pink','今天看到一片特别像爱心的云！'],
 ['许砚','冷静理性的程序员，喜欢咖啡、数据与象棋。','♟️','blue','忙完了。现在可以好好听你说。'],
 ['简星','内敛文艺的图书管理员，喜欢诗集、旧书店与看星星。','⭐','purple','给你留了一页喜欢的诗。'],
];
export function freshState():PhoneState{
 const date=localDate();const characters=roster.map((r,i)=>characterSchema.parse({id:'char-'+i,name:r[0],description:r[1],personality:r[1],scenario:'云朵小镇，轻松的日常生活。',greeting:r[4],examples:'',avatar:'',color:r[3],emoji:r[2],affection:30,trust:50,birthday:'',systemPrompt:''}));
 return stateSchema.parse({schemaVersion:1,profile:{name:'小主人',address:'主人',birthday:''},theme:'sky',primary:'char-0',characters,threads:Object.fromEntries(characters.map((c,i)=>[c.id,[{id:'hello-'+i,role:'assistant' as const,text:c.greeting,timestamp:Date.now(),kind:'text' as const,read:i>3}]])),groups:[{id:'group-cloud',name:'云朵小镇居民群',members:['char-0','char-3','char-5']}],
 notes:[{id:'note-welcome',text:'这个家什么都有，还留了一处能随时对你说话的地方。\n今天的第一张小纸条，送给你。',from:'云汐',date}],diaries:[],todos:[{id:'todo-water',text:'喝一杯水，照顾好自己',done:false},{id:'todo-sky',text:'记录一件今天的小确幸',done:false}],
 memories:[{id:'memory-welcome',text:'我们在云朵小镇认识了。这里是属于我们的家。',scope:'char-0',date}],lore:[{id:'lore-home',title:'云朵小镇',keys:'家,小镇,云朵',text:'云朵小镇有一间靠近花园的小屋，窗边放着一盆绿植。小云是住在这里的云朵宠物。',enabled:true,scope:'global'}],posts:[],pet:{name:'小云',hunger:72,energy:85,love:18,personality:'温柔、好奇、记得你的日常；开心时会撒娇，疲惫时会安静陪伴。',catchphrase:'今天也把一点点快乐叠好。'},wallet:520,ledger:[{id:'ledger-welcome',title:'搬家礼物',amount:520,date}],inventory:[],gallery:[],music:[],events:[],
 bookmarks:[{id:'book-st',name:'SillyTavern 角色与世界书',url:'https://docs.sillytavern.app/usage/characters/'},{id:'book-cloud',name:'Small Cloud 小手机',url:'https://github.com/Guaizai-s/small-cloud'}],claimed:[],workDate:'',focusMinutes:0,focusSession:{duration:25,remaining:1500,running:false,deadline:0},longChat:true,provider:'deepseek',model:'deepseek-flash'});
}
export const APP_NAMES:Record<string,string>={home:'首页',chat:'聊天',forum:'论坛',browser:'浏览器',diary:'日记',moments:'朋友圈',music:'一起听',calendar:'日历',gallery:'相册',shop:'云朵商店',work:'工作',weibo:'小镇微博',live:'直播',face:'面对面',wallet:'钱包',pet:'小云',tasks:'任务',focus:'专注',weather:'天气',notes:'小纸条',memories:'记忆',lore:'世界书',characters:'角色设定',settings:'设置',all:'全部应用',favorites:'收藏'};

