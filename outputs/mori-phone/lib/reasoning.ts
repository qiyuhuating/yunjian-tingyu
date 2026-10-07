import type {PhoneState} from './phone-model';
import type {ProviderId} from './providers';
export const reasoningLevels=[{id:'low',name:'低'},{id:'medium',name:'中'},{id:'high',name:'高'},{id:'xhigh',name:'极高'}] as const;
type Effort=PhoneState['sampling']['reasoningEffort'];
const budgets:Record<Effort,number>={low:1024,medium:4096,high:8192,xhigh:16384};
type Plan={supported:boolean;required:boolean;actual:string;note:string;params:Record<string,unknown>;budget:number};
export function reasoningPlan(provider:ProviderId,model:string,enabled:boolean,effort:Effort):Plan{
 const name=reasoningLevels.find(v=>v.id===effort)!.name,budget=budgets[effort];
 const result=(actual:string,note:string,params:Record<string,unknown>,extra=budget,required=false):Plan=>({supported:true,required,actual,note,params,budget:extra});
 const off=(params:Record<string,unknown>={}):Plan=>result('已关闭','启用后按模型能力使用所选强度。思考预算与角色正文长度分别控制。',params,0);
 if(provider==='deepseek'){
  if(!enabled)return off({thinking:{type:'disabled'}});
  if(/^deepseek-(flash|v4-(pro|flash))$/.test(model)){const actual=effort==='low'?'low':effort==='xhigh'?'max':'high';return result(actual,effort==='medium'?'这个模型的中档与高档都使用 high。':`接口实际使用 ${actual}；强度越高可能等待越久。`,{thinking:{type:'enabled'},reasoning_effort:actual});}
  return result('开启',`${model} 未配置四档映射，只启用思考，保留你选择的${name}档。`,{thinking:{type:'enabled'}});
 }
 if(provider==='anthropic'){
  if(/claude-(sonnet|opus)-4-6/.test(model)){if(!enabled)return off();const actual=effort==='xhigh'?'max':effort;return result(actual,`自适应思考使用 ${actual}，正文仍保持所选回复节奏。`,{thinking:{type:'adaptive'},output_config:{effort:actual}});}
  if(/claude-(haiku-4-5|sonnet-4-5|opus-4-[015])/.test(model)){if(!enabled)return off();return result(`${budget.toLocaleString()} tokens`,'四档对应本应用的思考预算，不是模型的原生档名。',{thinking:{type:'enabled',budget_tokens:budget}});}
 }
 if(provider==='gemini'){
  if(/^gemini-3\.[578]-flash/.test(model)){const required=/^gemini-3\.[78]/.test(model),actual=!enabled?(required?'LOW':'MINIMAL'):(effort==='xhigh'?'HIGH':effort.toUpperCase());return result(actual,required?`该模型保留基础思考；当前实际 ${actual}。极高映射 HIGH。`:`当前实际 ${actual}；极高与高使用同一档。`,{thinkingConfig:{thinkingLevel:actual}},enabled?budget:1024,required);}
  if(/^gemini-2\.5/.test(model)){const required=model.includes('pro'),actual=enabled?budget:required?128:0;return result(`${actual.toLocaleString()} tokens`,'2.5 使用本应用设定的思考预算；Pro 无法完全关闭思考。',{thinkingConfig:{thinkingBudget:actual}},actual,required);}
 }
 if(provider==='openai'&&/^(o[134](?:-|$)|gpt-5(?:[.-]|$))/.test(model)&&!/-pro(?:-|$)/.test(model)){
  const full=/^gpt-5\.[24](?:-|$)/.test(model),actual=effort==='xhigh'&&!full?'high':effort;
  // Older reasoning models have no universal disable value. Keep an explicit, honest minimum.
  const chosen=enabled?actual:'low';return result(chosen,enabled&&effort==='xhigh'&&!full?'所选模型的极高映射 high；支持 xhigh 的型号会直接使用极高。':!enabled?'这个推理型号不能用统一参数完全关闭；使用 low。普通型号不发送思考参数。':`接口实际使用 ${chosen}。`,{reasoning_effort:chosen},enabled?budget:1024,true);
 }
 if(provider==='xai'&&/^grok-4\.7(?:-|$)/.test(model))return result(effort,`Grok 4.7 始终思考，使用 ${effort}；正文仍保持简短。`,{reasoning_effort:effort},budget,true);
 if(provider==='siliconflow'){
  if(/DeepSeek-V4/.test(model)){if(!enabled)return off({thinking:{type:'disabled'}});const actual=effort==='xhigh'?'max':'high';return result(actual,'这个端点只区分 high / max；低、中、高都使用 high。',{thinking:{type:'enabled'},reasoning_effort:actual});}
  if(/Qwen3-(?:\d+B)/.test(model)){if(!enabled)return off({enable_thinking:false});return result(`${budget.toLocaleString()} tokens`,'使用本应用的四档思考预算。',{enable_thinking:true,thinking_budget:budget});}
 }
 if(provider==='qwen'&&/^qwen-(plus|turbo)(?:-|$)/.test(model)){if(!enabled)return off({enable_thinking:false});return result(`${budget.toLocaleString()} tokens`,'使用本应用的四档思考预算；旧快照型号需支持深度思考。',{enable_thinking:true,thinking_budget:budget});}
 if(provider==='moonshot'&&/^kimi-k2(?:\.6)?$/.test(model)){if(!enabled)return off({thinking:{type:'disabled'}});return result('开启','此接口只区分开关，四档选择保留，不发送不支持的力度参数。',{thinking:{type:'enabled'}});}
 if(provider==='zhipu'&&/^glm-4\.[567]/.test(model)){if(!enabled)return off({thinking:{type:'disabled'}});return result('开启','此接口只区分开关，四档选择保留；每轮重新思考。',{thinking:{type:'enabled',clear_thinking:true}});}
 if(provider==='openrouter'){
  const modelProvider=model.split('/')[0],modelId=model.slice(modelProvider.length+1),native=reasoningPlan(modelProvider==='google'?'gemini':modelProvider==='anthropic'?'anthropic':modelProvider==='openai'?'openai':'compatible',modelId,enabled,effort);
  if(native.supported){if(!enabled&&!native.required)return off({reasoning:{enabled:false,exclude:true}});const actual=effort==='xhigh'&&!/^openai\/gpt-5\.[24]/.test(model)?'high':effort;return result(actual,`聚合接口使用 ${actual}；极高只对已确认支持 xhigh 的型号发送。`,{reasoning:{effort:actual,exclude:true}},budget,native.required);}
 }
 return {supported:false,required:false,actual:'服务商默认',note:'这个模型尚未配置可验证的思考参数。四档选择仍会保存，不发送未知字段。',params:{},budget:0};
}
