# AI 请求优化与角色卡兼容性核对

核对日期：2026-10-06。仅使用提供方文档、项目官方仓库及规范作者仓库。以下「建议」为本项目设计推论；未使用真实 API Key 做命中率或回复质量实测。

## DeepSeek 缓存

官方上下文缓存默认开启，匹配的是输入前缀，不是保存整段答案。当前规则要求完整匹配已经落盘的前缀单元：请求的用户输入末端、模型输出末端、检测到的公共前缀、长输入/输出的固定间隔均可能生成单元。`A+B` 后请求 `A+C` 不保证立即命中 `A`；检测到公共前缀并落盘后，`A+D` 才可能复用。构建需数秒、清理与命中属于 best effort；不承诺固定命中比例，也不沿用旧文档的 64 token 块说法。[DeepSeek Context Caching](https://api-docs.deepseek.com/guides/kv_cache/)

建议：将稳定主指令、角色定义、固定世界设定放在前部；时间、当前状态、按关键词激活的世界书和当轮指令放在靠后位置。保持角色字段序列化、消息角色和顺序稳定；历史以追加方式增长。角色设定变更、摘要重写、截断旧历史均可能缩短公共前缀。优先保留正确上下文，不为缓存保留过时设定。

## 流式计量

`usage.prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` 分别是输入命中/未命中 token。当前官方流式说明：`[DONE]` 前的最终终止 chunk 携带完整 usage；`include_usage:true` 时前面 chunk 的 usage 为 null，最终 chunk 并非单独的 usage-only chunk。[DeepSeek Chat Completions](https://api-docs.deepseek.com/api/create-chat-completion/)

建议：先读取每个 chunk 的非空 usage，再处理可选 `choices[0].delta`，以兼容代理的 `choices:[]` usage chunk。计量缺失、主动中止、网络断流时显示「未返回」，不能伪造为 0。实际输入缓存比例用 `hit/(hit+miss)`，只在两个提供方计数均存在且总数大于 0 时展示；汇总用总 token 加权，不平均每轮百分比。`prompt_tokens_details.cached_tokens` 可作为支持该字段的提供方后备命中来源，但不要推导未知 miss 为 0。

## 参数必须按提供方与模式发送

| 参数 | 当前官方 DeepSeek 行为 | 本项目建议 |
|---|---|---|
| `temperature` | 0–2；thinking 模式无效 | 非 thinking 时可用；thinking 时禁用说明 |
| `top_p` | thinking 有效范围 0.95–1；低于 0.95 按 0.95；非 thinking 固定 1 | 不把 0.1–0.9 伪装成有效控制 |
| `frequency_penalty` / `presence_penalty` | 当前 API 标 deprecated，传入不生效 | 官方 DeepSeek 隐藏/禁用；其他兼容端按自身能力开启 |
| `repetition_penalty` | 官方 DeepSeek 请求规范没有列出 | 仅明确支持的本地/兼容服务发送 |
| `thinking` / `reasoning_effort` | 默认 thinking 开启、high；可显式关闭 | 普通聊天模式应明确选择，避免意外延迟/推理消耗 |

来源：[DeepSeek API 参数](https://api-docs.deepseek.com/api/create-chat-completion/)、[Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/)。例如 vLLM 把 `repetition_penalty`、`frequency_penalty`、`presence_penalty` 定义成三个独立参数，因此不得改名互换；也不能仅因一个端点宣称 OpenAI compatible 就默认它支持全部扩展。[vLLM SamplingParams](https://docs.vllm.ai/en/latest/api/vllm/sampling_params/)

## DeepSeek Harness 是真实项目

`deepseek-ai/deepseek-harness` 是 DeepSeek 官方的 `dsh` agent harness，MIT，当前为 developer preview；它不是开启 API 缓存所必需的 SDK。[官方仓库](https://github.com/deepseek-ai/deepseek-harness)

可借鉴其机制：稳定 system 渲染与工具 schema 顺序、追加历史、记录输入/输出消耗；修改早期 prompt 会从首次差异处影响前缀复用。它的 in-history prompt replacement 依赖明确的路由能力，不能当成所有 Chat Completions 服务都支持的通用行为。[System Prompt 包文档](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/system-prompt/README.md)

建议本项目独立实现小型 prompt compiler、provider adapter 和 usage 记录，不为了聊天引入整个 agent runtime。`prefix:true` 的 Chat Prefix Completion 是 assistant 预填续写功能，与上下文缓存不是同一个开关。[DeepSeek Chat Prefix Completion](https://api-docs.deepseek.com/guides/chat_prefix_completion/)

## SillyTavern 可借鉴的提示词与数据语义

Prompt Manager 的列表由上至下决定发送顺序，可开关段落并设置角色；In-Chat 的 depth=0 在最新消息之后，depth=1 在最新消息之前；该设置忽略列表相对位置。PHI 通常放在上下文末尾。[官方 Prompt Manager](https://docs.sillytavern.app/usage/prompts/prompt-manager/)

建议提供可检查的最终 prompt 预览，并保留两种明确用途：缓存优先模板将动态 lore 放在历史后的尾部；角色卡兼容模板遵守 before_char / after_char，接受这些动态位置会影响缓存。不要宣称两者行为完全相同。PHI 可放尾部，但它不是模型安全优先级的保证。

V2 JSON 使用 `spec:chara_card_v2`、`spec_version:2.0`、`data`。应导入 description/personality/scenario/first_mes/mes_example、system_prompt、post_history_instructions、alternate_greetings、character_book；`{{original}}` 代表对应全局指令。备选开场白供新聊天选择，不能把所有开场白拼进每轮 prompt。creator_notes、creator、tags 等元数据不注入；未知 extensions 应保留。V2 selective=true 时须主 keys 与 secondary_keys 都命中；insertion_order 较小者在前。[V2 作者规范](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md)

V3 使用 `chara_card_v3` / `3.0`，保留 V2 基础字段并增加 nickname、assets、group_only_greetings 等；nickname 可用于 `{{char}}`。其 lorebook 扩展与 decorators 不能以「能读 V3 JSON」冒充完整支持。建议保留原始导入数据，明确列出未实现的 PNG/CHARX、媒体资产、decorators 或扩展功能。[V3 作者规范](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md)

世界书有 enabled、constant、扫描深度、token budget 和插入位置；selective 的 AND ANY/AND ALL/NOT ANY/NOT ALL 是不同逻辑。预算不足时 constant 优先，再考虑较大 order；输出顺序则是较小 order 在前。递归扫描可让条目触发其他条目，应默认关闭或有明确上限。中文匹配不宜默认英语 whole-word 边界。仅 content 注入，memo/触发词不是正文。[官方 World Info](https://docs.sillytavern.app/usage/core-concepts/worldinfo/)

## 代码复用边界与验收

SillyTavern 主仓库采用 AGPL-3.0。本次建议按公开字段与行为独立实现，未复制其源码；如后续确需复制，须检查实际文件许可并履行相应授权要求。DeepSeek Harness 主仓库 MIT，复制其代码也要保留版权/许可并检查第三方依赖许可。[SillyTavern LICENSE](https://github.com/SillyTavern/SillyTavern/blob/release/LICENSE)、[Harness LICENSE](https://github.com/deepseek-ai/deepseek-harness/blob/master/LICENSE)

建议验收：固定输入产生相同序列化前缀；动态状态变化只影响预定尾部；备用开场白一次只选一条；主/次关键词组合、enabled=false、constant 和排序均有针对性断言；SSE 覆盖 usage 在终止 chunk、usage-only chunk、null usage、断流与取消。真实命中率与回复质量需用用户自己的端点及代表性会话测量，文档核对不能替代实测。
