/**
 * Android and web connection diagnostics. No API keys, prompts or responses are logged.
 * A model-catalog failure never proves a chat connection is invalid.
 */
export const MODEL_CATALOG_TIMEOUT_MS=25000;
export const CHAT_HEADERS_TIMEOUT_MS=90000;
export const CHAT_IDLE_TIMEOUT_MS=120000;
export type ConnectionScope='models'|'chat';
export function connectionStatusMessage(status:number,scope:ConnectionScope):string{
 if(status===401||status===403)return 'API Key 被拒绝（HTTP '+status+'），请核对密钥、权限和服务地域。';
 if(status===429)return '服务商正在限流（HTTP 429），请稍后重试或更换允许使用的模型。';
 if(status===404)return scope==='models'?'此服务商未提供模型列表接口（HTTP 404），可手动输入模型 ID 并测试真实连接。':'所选模型或聊天接口不存在（HTTP 404），请核对模型 ID 与地址。';
 if(status===408||status===504)return '服务商请求超时（HTTP '+status+'），请检查网络并稍后再试。';
 if(status===400||status===422)return scope==='models'?'模型列表请求不被接受（HTTP '+status+'），可手动填写模型。':'服务商拒绝了当前模型参数（HTTP '+status+'），请检查模型与采样设置。';
 if(status===402)return '账号余额或额度不足（HTTP 402），请检查服务商账户。';
 if(status>=500)return '服务商暂时不可用（HTTP '+status+'），稍后再试；已经发送的聊天不会自动重复提交。';
 return scope==='models'?'模型列表读取失败（HTTP '+status+'）；请手动选择模型并测试聊天。':'AI 连接失败（HTTP '+status+'），请检查网络和所选模型。';
}
export function connectionTimeoutMessage(scope:ConnectionScope,phase:'headers'|'stream'='headers'):string{
 if(scope==='models')return '模型列表读取超过 25 秒，已停止等待；可手动填写模型 ID，不代表聊天连接失效。';
 return phase==='headers'?'等待 AI 首次响应超时，已取消本次连接；请检查网络或选择响应更快的模型。':'AI 回复长时间没有新数据，连接已取消；请检查网络后手动重试，避免重复计费。';
}
