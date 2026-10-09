export class ProviderError extends Error{constructor(public status:number,message:string){super(message);this.name='ProviderError';}}
// Do not echo upstream payloads: providers sometimes include credentials or prompts in errors.
export function upstreamFailure(status:number,error?:{code?:unknown;type?:unknown;message?:unknown;metadata?:{limit_source?:unknown;error_type?:unknown}},retryAfter?:string|null){
 const hint=[error?.code,error?.type,error?.message].filter(v=>typeof v==='string').join(' ').toLowerCase();
 const seconds=Number(retryAfter),wait=Number.isFinite(seconds)&&seconds>0&&seconds<=86400?'请等待 '+Math.ceil(seconds)+' 秒后重试。':'请稍后重试。';
 if(status===429)return new ProviderError(429,'请求受到限流。'+wait+'OpenRouter 免费模型可能有独立限额。（HTTP 429）');
 if(status===402&&error?.metadata?.limit_source==='openrouter_in_flight_budget')return new ProviderError(402,'正在执行的请求已占用临时并发额度。'+wait+'（HTTP 402）');
 if(status===402&&error?.metadata?.limit_source==='openrouter_key_limit')return new ProviderError(402,'此 API Key 的用量限额已耗尽。请检查 OpenRouter 中该 Key 的额度设置。（HTTP 402）');
 if(error?.metadata?.error_type==='context_length_exceeded')return new ProviderError(400,'对话超出模型上下文窗口。请降低上下文预算，或切换到支持更长上下文的模型。（HTTP 400）');
 const message=status===401?'API Key 未通过验证。请重新填写对应服务商的 Key。':status===402||/insufficient|credit|balance|quota/.test(hint)?'账号余额或可用额度不足。请检查服务商控制台；订阅服务与 API 余额分别计算。':status===403?'账号没有访问权限。请检查模型权限、服务地域或服务商的访问限制。':status===404?'接口地址或模型不存在。请检查 API 地址和模型 ID；模型列表不可用时仍可手动填写。':status===429||/rate.?limit/.test(hint)?'请求受到限流。请稍后重试；OpenRouter 免费模型可能有独立限额。':status===400||status===422?'服务商不接受当前模型或参数。请检查模型 ID，尝试关闭思考和额外采样参数。':status>=500?'服务商暂时不可用或模型路由繁忙。请稍后重试，或更换可用模型。':'服务商未能完成请求。请检查账号、模型和连接地址。';
 return new ProviderError(status>=400&&status<=599?status:502,message+(status>=400?'（HTTP '+status+'）':''));
}
