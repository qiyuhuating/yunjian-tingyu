import {z} from 'zod';
export const providerIds=['deepseek','openai','anthropic','gemini','openrouter','siliconflow','qwen','moonshot','zhipu','xai','compatible','compatible-anthropic','compatible-gemini'] as const;
export const providerSchema=z.enum(providerIds);
export type ProviderId=typeof providerIds[number];
export type ProviderPreset={id:ProviderId;name:string;protocol:'openai'|'anthropic'|'gemini';baseURL:string;model:string;models:string[];vision:boolean;penalties:boolean;repetition:boolean;thinking:boolean;temperatureMax:number;frequency?:boolean;presence?:boolean;keyURL:string;note:string};
export const providers:ProviderPreset[]=[
 {id:'deepseek',name:'DeepSeek',protocol:'openai',baseURL:'https://api.deepseek.com',model:'deepseek-flash',models:['deepseek-flash','deepseek-v4-pro'],vision:true,penalties:false,repetition:false,thinking:true,temperatureMax:2,keyURL:'https://platform.deepseek.com/api_keys',note:'日常陪伴与深度思考。地址和模型已预填。'},
 {id:'openai',name:'OpenAI',protocol:'openai',baseURL:'https://api.openai.com/v1',model:'gpt-4.1-mini',models:['gpt-4.1-mini','gpt-4.1','gpt-5-mini'],vision:true,penalties:true,repetition:false,thinking:false,temperatureMax:2,keyURL:'https://platform.openai.com/api-keys',note:'支持文字与图片；可读取账号可用模型。'},
 {id:'anthropic',name:'Claude · Anthropic',protocol:'anthropic',baseURL:'https://api.anthropic.com/v1',model:'claude-haiku-4-5-20251001',models:['claude-haiku-4-5-20251001','claude-sonnet-4-6'],vision:true,penalties:false,repetition:false,thinking:false,temperatureMax:1,keyURL:'https://platform.claude.com/settings/keys',note:'原生 Claude 接口，支持流式回复和图片。'},
 {id:'gemini',name:'Google Gemini',protocol:'gemini',baseURL:'https://generativelanguage.googleapis.com/v1beta',model:'gemini-3.8-flash',models:['gemini-3.8-flash','gemini-3.5-flash-lite','gemini-2.5-flash'],vision:true,penalties:true,repetition:false,thinking:false,temperatureMax:2,keyURL:'https://aistudio.google.com/apikey',note:'原生 Gemini 接口；Key 来自 Google AI Studio。'},
 {id:'openrouter',name:'OpenRouter',protocol:'openai',baseURL:'https://openrouter.ai/api/v1',model:'openai/gpt-4.1-mini',models:['openai/gpt-4.1-mini','anthropic/claude-haiku-4.5','google/gemini-3.8-flash'],vision:true,penalties:true,repetition:true,thinking:false,temperatureMax:2,keyURL:'https://openrouter.ai/settings/keys',note:'一个 Key 使用多家模型。惩罚与图片能力随具体模型变化。'},
 {id:'siliconflow',name:'硅基流动',protocol:'openai',baseURL:'https://api.siliconflow.cn/v1',model:'deepseek-ai/DeepSeek-V4-Flash',models:['deepseek-ai/DeepSeek-V4-Flash','Qwen/Qwen3-8B'],vision:false,penalties:true,repetition:false,thinking:false,temperatureMax:2,presence:false,keyURL:'https://cloud.siliconflow.cn/account/ak',note:'国内模型聚合。官方已停用 repetition_penalty，原设定仍会保留。'},
 {id:'qwen',name:'通义千问 · 百炼',protocol:'openai',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',model:'qwen-plus',models:['qwen-plus','qwen-turbo','qwen-max'],vision:false,penalties:true,frequency:false,repetition:true,thinking:false,temperatureMax:1.99,keyURL:'https://bailian.console.aliyun.com/',note:'中国内地端点。国际地域 Key 请选择自定义连接并使用对应地域地址。'},
 {id:'moonshot',name:'Kimi · Moonshot',protocol:'openai',baseURL:'https://api.moonshot.cn/v1',model:'kimi-k2.6',models:['kimi-k2.6','moonshot-v1-8k'],vision:true,penalties:true,repetition:false,thinking:false,temperatureMax:1,keyURL:'https://platform.moonshot.cn/console/api-keys',note:'使用 Moonshot 开放平台 Key；Kimi App 账号不等于 API Key。'},
 {id:'zhipu',name:'智谱 · GLM',protocol:'openai',baseURL:'https://open.bigmodel.cn/api/paas/v4',model:'glm-4.7-flash',models:['glm-4.7-flash','glm-4.7','glm-4.5-air'],vision:false,penalties:false,repetition:false,thinking:false,temperatureMax:1,keyURL:'https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys',note:'中国平台端点；海外 Z.ai Key 使用其对应端点。'},
 {id:'xai',name:'xAI · Grok',protocol:'openai',baseURL:'https://api.x.ai/v1',model:'grok-4.7',models:['grok-4.7'],vision:true,penalties:false,repetition:false,thinking:false,temperatureMax:2,keyURL:'https://console.x.ai/',note:'使用 xAI 开放平台 Key；Grok App 订阅与 API 分开。'},
 {id:'compatible',name:'自定义 · OpenAI 兼容',protocol:'openai',baseURL:'',model:'',models:[],vision:false,penalties:true,repetition:true,thinking:false,temperatureMax:2,keyURL:'',note:'自定义 OpenAI Chat Completions 协议；需公开 HTTPS 地址。'},
 {id:'compatible-anthropic',name:'自定义 · Anthropic 兼容',protocol:'anthropic',baseURL:'',model:'',models:[],vision:true,penalties:false,repetition:false,thinking:false,temperatureMax:1,keyURL:'',note:'自定义 Claude Messages API；支持 x-api-key / anthropic-version 与流式事件。'},
 {id:'compatible-gemini',name:'自定义 · Gemini 兼容',protocol:'gemini',baseURL:'',model:'',models:[],vision:true,penalties:true,repetition:false,thinking:false,temperatureMax:2,keyURL:'',note:'自定义 Gemini generateContent API；支持 x-goog-api-key 与原生内容格式。'},
];
export const getProvider=(id:ProviderId)=>providers.find(p=>p.id===id)!;
export const isCustomProvider=(id:ProviderId)=>id==='compatible'||id==='compatible-anthropic'||id==='compatible-gemini';
export function capabilities(id:ProviderId,model:string){
 const p=getProvider(id),reasoning=id==='openai'&&/^(o[134]|gpt-5)/.test(model),modernClaude=id==='anthropic'&&/claude-(opus|sonnet)-4-[6-9]/.test(model),kimi=id==='moonshot'&&/^kimi-k2/.test(model),grok=id==='xai'&&/^grok-4/.test(model);
 // The Liquid free endpoint rejects top_p in a live probe despite advertising support.
 return {...p,temperature:!reasoning&&!modernClaude&&!kimi&&!grok,penalties:p.penalties&&!reasoning&&!kimi,frequency:(p.frequency??p.penalties)&&!reasoning&&!kimi,presence:(p.presence??p.penalties)&&!reasoning&&!kimi,topP:!reasoning&&id!=='anthropic'&&!kimi&&!grok&&!(id==='openrouter'&&model==='liquid/lfm-2.5-2.6b:free')};
}
export function providerBase(id:ProviderId,custom=''){
 const base=isCustomProvider(id)?custom:getProvider(id).baseURL;const url=new URL(base);
 const host=url.hostname.toLowerCase();if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port&&url.port!=='443'||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||host==='metadata.google.internal'||host.includes(':')||/^\d+\.\d+\.\d+\.\d+$/.test(host))throw new Error('请输入公开服务商的 HTTPS 地址，不支持本机或内网端点。');
 return url.href.replace(/\/$/,'').replace(/\/(chat\/completions|messages|models)$/,'');
}
