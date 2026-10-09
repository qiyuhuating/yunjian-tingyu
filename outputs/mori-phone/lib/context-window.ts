import {z} from 'zod';
import type {PhoneState} from './phone-model';
import {getProvider,isCustomProvider,type ProviderId} from './providers';
import {reasoningPlan} from './reasoning';

export const MAX_CONTEXT_TOKENS=16777216;
const tokens=z.number().int().min(1).max(MAX_CONTEXT_TOKENS);
export const modelLimitSchema=z.object({contextTokens:tokens.optional(),inputTokens:tokens.optional(),outputTokens:tokens.optional()}).strict();
export type ModelLimit=z.infer<typeof modelLimitSchema>&{supportedParameters?:string[]};
const routerParameters=new Map<string,string[]>();
export const routerModelParameters=(model:string)=>routerParameters.get(model);
export function rememberRouterParameters(model:string,parameters:string[]){routerParameters.set(model,parameters);}
export function modelLimitKey(provider:ProviderId,baseURL:string,model:string){return provider+'|'+(isCustomProvider(provider)?baseURL.trim().replace(/\/$/,''):getProvider(provider).baseURL)+'|'+model;}
export function extractModelLimits(provider:ProviderId,body:any){
 const rows=getProvider(provider).protocol==='gemini'?body.models:body.data,result:Record<string,ModelLimit>={};
 if(!Array.isArray(rows))return result;
 const valid=(value:unknown)=>tokens.safeParse(value).success?value as number:undefined;
 for(const row of rows.slice(0,2500)){
  const id=getProvider(provider).protocol==='gemini'?row.name?.replace(/^models\//,''):row.id;if(typeof id!=='string'||!id.length||id.length>160)continue;
  const supportedParameters=provider==='openrouter'&&Array.isArray(row.supported_parameters)?row.supported_parameters.filter((p:unknown)=>typeof p==='string'&&p.length>0&&p.length<=80).slice(0,80) as string[]:undefined;
  const limit={contextTokens:valid(row.context_window??row.context_length??row.top_provider?.context_length),inputTokens:valid(row.inputTokenLimit??row.max_input_tokens),outputTokens:valid(row.outputTokenLimit??row.max_output_tokens??row.max_tokens??row.top_provider?.max_completion_tokens),...(supportedParameters?{supportedParameters}:{})};
  if(limit.contextTokens||limit.inputTokens)result[id]=limit;
 }
 return result;
}
// Official fallback snapshots; live endpoint metadata takes precedence.
function officialLimit(provider:ProviderId,model:string):ModelLimit|undefined{
 if(provider==='deepseek'&&['deepseek-flash','deepseek-v4-pro'].includes(model))return {contextTokens:1048576};
 if(provider==='openai'&&/^gpt-4\.1(?:-mini|-nano)?(?:-2025-04-14)?$/.test(model))return {contextTokens:1047576};
 if(provider==='openai'&&['gpt-realtime-2.1','gpt-realtime-2.1-mini'].includes(model))return {contextTokens:128000};
 if(provider==='openai'&&model==='gpt-5-mini')return {contextTokens:400000};
 if(provider==='anthropic'&&/^claude-haiku-4-5(?:-20251001)?$/.test(model))return {contextTokens:200000};
 if(provider==='xai'&&model==='grok-4.7')return {contextTokens:500000};
 if(provider==='qwen'&&model==='qwen-plus')return {contextTokens:1000000};
 return undefined;
}
export function contextPlan(state:Pick<PhoneState,'provider'|'model'|'baseURL'|'modelLimits'|'sampling'>){
 const live=state.modelLimits[modelLimitKey(state.provider,state.baseURL,state.model)],known=live||officialLimit(state.provider,state.model),maximum=known?.contextTokens??known?.inputTokens;
 const manual=state.sampling.contextMode==='manual',window=manual?Math.min(state.sampling.contextTokens,maximum??MAX_CONTEXT_TOKENS):maximum??32768;
 const output=state.sampling.maxTokens+reasoningPlan(state.provider,state.model,state.sampling.thinking,state.sampling.reasoningEffort).budget;
 return {window,inputTokens:Math.max(0,Math.min(known?.inputTokens??window,window-output)),outputReserve:output,source:manual?'手动预算':live?'服务商模型列表':known?'官方预设':'上限未披露 · 暂用 32K',known:!!known};
}
// Conservative byte-based bound, not a claim of exact provider tokenization.
export function estimateTokens(text:string){return new TextEncoder().encode(text).length;}
