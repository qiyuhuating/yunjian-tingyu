# 本地保存与多服务商预设调研

核对日期：2026-10-06。仅使用服务商、Tavo 官方文档；本文是接入设计依据，不是付费 API 实测报告。模型的可用性仍取决于账户权限、地区、余额与服务商后续更新。

## Tavo 的参考点

[Tavo 隐私说明](https://docs.tavoai.dev/en/privacy-policy/)明确把聊天记录、偏好、API Key、角色资料放在设备本地；AI 请求发送配置好的角色、历史、世界书、记忆和参数。Tavo 自身还采用设备直连服务商、不经 Tavo 中转的模式。本项目网页使用临时请求网关解决跨域，因此只参考其本地保存及连接体验，不能声称请求从不经过本项目服务器。

[API 设置](https://docs.tavoai.dev/en/guides/api-setting/api-setting-1/)采用添加连接、选择平台和模型、保存的流程；[模型设置](https://docs.tavoai.dev/en/guides/api-setting/select-model/)允许切换默认连接，区分全局参数和连接参数，连接参数优先。本项目可提供平台预设及推荐模型，普通用户只填 Key，高级用户再展开模型和参数。

[备份说明](https://docs.tavoai.dev/en/guides/others/backup/)支持完整备份、恢复、备份提醒及可选密钥；[空间管理](https://docs.tavoai.dev/en/guides/others/storage-space/)区分可清缓存与聊天等核心数据。设计建议：本项目完整 ZIP 默认包括聊天和附件，不含 Key；更换浏览器、清除站点数据前必须先导出备份。

## 可用于预设的接口

以下均为 HTTPS。除 Claude、Gemini 外，鉴权为 `Authorization: Bearer <key>`，使用 OpenAI Chat Completions 的 `messages` 和 SSE 格式。推荐模型优先考虑正常陪伴聊天和参数兼容，非“最新最强”排行。

| 服务商 | 默认请求地址 | 推荐默认模型 | 关键适配 |
|---|---|---|---|
| DeepSeek | `https://api.deepseek.com/chat/completions` | `deepseek-flash` | 显式 `thinking.type=disabled`；思考时仅 Top-P 生效 |
| OpenAI | `https://api.openai.com/v1/chat/completions` | `gpt-4.1-mini` | `max_completion_tokens`、`store:false`、`stream_options.include_usage:true` |
| Anthropic | `https://api.anthropic.com/v1/messages` | `claude-haiku-4-5-20251001` | `X-Api-Key`、`anthropic-version:2023-06-01`，原生 Messages 协议 |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse` | `gemini-3.8-flash` | `x-goog-api-key`，原生 `contents`/`generationConfig`，不把 Key 放 URL |
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | `openai/gpt-4.1-mini` | 参数支持随具体模型/后端变化，提供模型列表刷新 |
| SiliconFlow 中国 | `https://api.siliconflow.cn/v1/chat/completions` | `deepseek-ai/DeepSeek-V4-Flash` | 文档当前请求示例；模型列表应刷新，不沿用已下线模型 |
| 阿里百炼中国 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-plus` | 支持实际 repetition/presence；混合思考型号用 `enable_thinking` |
| 阿里百炼国际 | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` | `qwen-plus` | 与中国地区 Key 分开保存；旧通用域名仍可用 |
| Kimi 中国 | `https://api.moonshot.cn/v1/chat/completions` | `kimi-k2.6` | 陪伴默认 `thinking.type=disabled`，不发送固定采样值 |
| Kimi 国际 | `https://api.moonshot.ai/v1/chat/completions` | `kimi-k2.6` | 独立地区预设，避免把 Key 发错地区 |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | `glm-4.7-flash` | 采样温度上限 1，普通聊天关闭思考 |
| xAI Grok | `https://api.x.ai/v1/chat/completions` | `grok-4.7` | Chat Completions 为仍受支持的旧接口；省略惩罚和 stop |

来源分别为 [DeepSeek 首次调用](https://api-docs.deepseek.com/)、[OpenAI 模型页](https://developers.openai.com/api/docs/models/gpt-4.1-mini)、[Claude Messages](https://platform.claude.com/docs/en/api/messages/create)、[Gemini 模型页](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash)、[OpenRouter 快速开始](https://openrouter.ai/docs/quickstart)、[SiliconFlow 对话接口](https://docs.siliconflow.cn/docs/api/chat-completions-post)、[百炼 OpenAI 对话接口](https://help.aliyun.com/en/model-studio/qwen-api-via-openai-chat-completions)、[Kimi 中国对话接口](https://platform.kimi.com/docs/api/chat)、[Kimi 国际对话接口](https://platform.kimi.ai/docs/api/chat)、[智谱 OpenAI 兼容说明](https://docs.bigmodel.cn/cn/guide/develop/openai/introduction.md)、[Grok Chat Completions](https://docs.x.ai/developers/model-capabilities/legacy/chat-completions)。

## 重复惩罚必须按能力发送

| 接口/型号 | 温度与 Top-P | Frequency | Presence | Repetition |
|---|---|---|---|---|
| DeepSeek 当前 V4 | 非思考仅温度；思考仅 Top-P，0.95–1 | 已弃用 | 已弃用 | 未声明支持 |
| OpenAI GPT-4.1 Mini | 支持 | 支持 | 支持 | 非标准参数，不发送 |
| Claude Haiku 4.5 | 温度 0–1；不要同时修改两者 | 未声明支持 | 未声明支持 | 未声明支持 |
| 新版 Claude（Opus 4.7 及以后） | 非默认值会报错，应省略 | 未声明支持 | 未声明支持 | 未声明支持 |
| Gemini 原生 generationConfig | 支持 | `frequencyPenalty` | `presencePenalty` | 未声明支持 |
| OpenRouter | 取决于模型后端 | 按能力 | 按能力 | 按能力，可用 `require_parameters:true` 保证后端支持 |
| SiliconFlow | 支持 | 支持 | 未声明支持 | 2026-09-15 起忽略，固定 1 |
| 百炼 Qwen | 支持，温度小于 2 | 未声明支持 | 支持 | 支持，HTTP 顶层 `repetition_penalty` |
| Kimi K2.6 | 固定温度：思考 1、非思考 0.6；Top-P 固定 0.95 | 固定 0 | 固定 0 | 未声明支持 |
| 智谱 GLM | 温度 0–1、Top-P 0.01–1 | 未声明支持 | 未声明支持 | 未声明支持 |
| Grok 4.7 推理 | 不假定旧采样设置全兼容 | 不支持 | 不支持 | 未声明支持 |

设计上保留所有设定值，切换服务商不清空。无效选项禁用并说明原因，请求只发送被核实支持的字段。自定义兼容接口的 repetition 作为用户显式开启的扩展能力，不能假定所有兼容接口都支持。

具体核对：[DeepSeek 当前 API](https://api-docs.deepseek.com/api/create-chat-completion/)已把频率/存在惩罚标为无效；[思考说明](https://api-docs.deepseek.com/guides/thinking_mode/)说明温度与 Top-P 的有效模式。[OpenAI Chat API](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)使用 `max_completion_tokens`，旧 `max_tokens` 已弃用且不兼容 o 系列。[Claude 弃用说明](https://docs.anthropic.com/en/docs/about-claude/model-deprecations)说明新版采样参数限制。[SiliconFlow 更新公告](https://docs.siliconflow.cn/docs/release-notes/overview)覆盖重复惩罚的停用，不应依赖旧教程。[Kimi 参数对照](https://platform.kimi.ai/docs/api/models-overview)明确固定参数传其他值会报错。[智谱原生接口定义](https://docs.bigmodel.cn/api-reference/%E6%A8%A1%E5%9E%8B-api/%E5%AF%B9%E8%AF%9D%E8%A1%A5%E5%85%A8.md)提供采样上限，但无三种惩罚字段。[Grok 推理说明](https://docs.x.ai/developers/model-capabilities/text/reasoning)说明推理模型不接受存在/频率惩罚与 stop。

OpenRouter 的[参数说明](https://openrouter.ai/docs/api_reference/parameters)声明支持 repetition 但须看具体后端；[服务商路由说明](https://openrouter.ai/docs/guides/routing/provider-selection)表明默认可忽略不支持的字段。实际发送 repetition 时可加 `provider:{require_parameters:true}`；若无后端支持应返回可理解的错误，不能显示“已生效”或自动暗中换模型。

## 原生协议转换和用量

- Claude：system 放顶层；会话仅 user/assistant；图片转换为 `image` block 的 base64 source；必需 `max_tokens`。读取 `content_block_delta` 的 `text_delta`；忽略 ping、未知非正文事件。`message_delta` 用量为累计值，覆盖旧值，`message_stop` 才是成功终点。遇到 `error` 或中途断流必须失败。[原生 Messages](https://platform.claude.com/docs/en/api/messages/create)、[流式事件](https://platform.claude.com/docs/en/build-with-claude/streaming)
- Claude 缓存：总输入是 `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`，命中是 cache_read；只用 input_tokens 会把命中比例算错。可给稳定 system block 加 `cache_control:{type:'ephemeral'}`，动态时间、命中世界书留后部；无缓存返回时不制造命中数字。[提示缓存](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Gemini：systemInstruction 文本；assistant 转为 model；图像转 `inlineData:{mimeType,data}`；读 candidates[0].content.parts 中非 thought 的 text。`MAX_TOKENS` 对应截断；正常候选终点后才发送统一 DONE，安全阻断等应有明确信息。用量：输入 promptTokenCount，输出 candidatesTokenCount 加 thoughtsTokenCount，缓存 cachedContentTokenCount；缺字段显示未知，不当作 0。[生成接口](https://ai.google.dev/api/generate-content)、[Key 说明](https://ai.google.dev/gemini-api/docs/api-key)
- OpenAI、兼容接口：支持末尾空 choices 的 usage chunk，以及内容终点携带 usage 的形式；必须独立解析用量。OpenAI 可 `store:false` 避免主动创建平台可查询对话状态；供应商自身的日志和保留政策仍独立于本项目本地数据库。[Chat API](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)

## 预设边界

Gemini 2.5 尚未退休，但官方已限制为此前使用过的账户，故不作新用户默认。[Gemini 2.5 模型页](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash)建议新项目选择 3.5 Flash-Lite 或 3.8 Flash。

Kimi K3、K2.7 Code 为持续推理型号，历史需保留完整 reasoning_content；不宜在只存普通正文的现有陪伴流程里直接设为默认。默认 K2.6 非思考能免去该要求。[Kimi 参数对照](https://platform.kimi.ai/docs/api/models-overview)

百炼建议迁移到含 WorkspaceId 的地区域名，但旧中国/国际域名仍正常，适合 Key-only 常规连接；子工作空间或特殊地区需高级地址设置。[百炼接口](https://help.aliyun.com/en/model-studio/qwen-api-via-openai-chat-completions)

智谱网页检索器无法打开部分页面，以上结论通过同域官方 `.md` 和官方 `llms.txt` 的 HTTP 内容交叉核对。GLM Coding Plan 与按量 API 不是同一接入合同，不应把 Coding Plan 的 Key 或专用地址自动当通用 API Key。

“只填 Key”指普通服务商预设自动填地址及推荐模型；它不能跳过服务商的开户、额度、权限或网络要求，也不涵盖需要部署 ID 的 Azure/专有部署接口。没有用户真实 Key，本轮只可验证请求结构、流式夹具和本地持久化，不能宣称所有真实账户已经连通。
