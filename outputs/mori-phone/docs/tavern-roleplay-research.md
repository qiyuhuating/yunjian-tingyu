# 酒馆角色扮演与四档思考调研

核对日期：2026-10-06。仅调研官方文档、项目作者公开源码和 GitHub 讨论；没有调用真实付费 Key。下文的回复长度、预算数字和交互策略是针对云朵小手机的实施建议，不是模型效果保证。

## 最小实施方案

1. 保留独立思考开关和低 / 中 / 高 / 极高四档。按服务商与型号转换为已确认字段；接口只支持两档、三档或开关时显示实际档位，不伪造四种能力。选择值在本机保留，切换服务商不清空。思考深度和正文长度分开控制。
2. 新增一个默认开启的「轻盈陪伴」角色扮演预设，再提供「沉浸剧情」与「自然聊天」。预设只改变通用回复规则，不覆盖导入卡片的人设、示例或世界书。
3. 稳定 system 区放人设与通用规则；本轮末尾放简短 PHI，重申短回、单个场景节拍、尊重用户自主权。当前接口约束只允许首条 system，因此尾部通过已有本轮 user 内容提交；这借鉴 PHI 的位置原则，不等同于 SillyTavern 独立 system PHI 的优先级。
4. 回复末尾可附 2–3 个简短接话方向。使用应用定义的纯文本标记或 JSON 小片段，由本地解析成按钮；不渲染模型生成的 HTML / JavaScript。按钮填入用户草稿，用户可修改并发送；只显示最新完成回复的按钮，生成中禁用，点击不覆盖已有草稿。
5. 对未识别或损坏的选项标记，保留原文且不执行。选项可为空，不能为了凑数跳转场景、预设用户感受或强迫选择。列表必须限量、去重、限长，历史提示去掉 UI 标记以减少重复与上下文噪声。

推荐原创通用规则：自然扮演当前角色，回应用户刚说的重点；日常每轮 1–3 个短段落，约 80–180 个汉字，内容简单时更短；沉浸剧情可约 150–300 字。一次推进一个动作或情绪节拍，至多引入一个新话题。用一个具体细节和角色语言表达情绪，不堆砌修辞、设定解释或内心独白。不替用户说话、行动、决定或定义感受，留出回应空间。可给 2–3 个不同方向的短接话建议，始终允许用户自由输入。请求详细解释时先回应最关键一点，再等待后续追问。

这些字符范围是软提示。不要用字符串裁切伪装模型已完整遵守；被 token 上限截断时保留内容并显示继续 / 重试入口。

## SillyTavern 与社区依据

[官方 Prompts](https://docs.sillytavern.app/usage/prompts/)区分 Main Prompt、历史及 Post-History Instructions：通用规则放主提示，本轮约束可放历史后。官方还强调尊重用户自主权与用 Example Messages 示范期望风格，历史本身会影响文风，修改主提示不能保证马上摆脱旧的冗长风格。建议保留卡片示例，并在本轮尾部轻量重申节奏。

[角色定义文档](https://docs.sillytavern.app/usage/characters/)把 description、personality、scenario、examples 和角色级 system / post-history 分开。本应用导入的字段应分别保留，`{{char}}`、`{{user}}` 和 `{{original}}` 只能按已支持的规则解释，不能静默丢失导入卡片的尾部要求。

[GitHub 官方 Default.json](https://github.com/SillyTavern/SillyTavern/blob/release/default/content/presets/openai/Default.json)实际包含 Main Prompt、Chat Examples、Chat History、Post-History Instructions 等有序构件。参考其构造思想即可，本轮无需复制完整 Prompt Manager 或把整份默认配置迁入应用。

[官方 Quick Replies / STscript](https://docs.sillytavern.app/usage/st-script/)允许在输入栏附近放可切换的快捷按钮。[社区作者的 HTML 注入扩展](https://github.com/zHdna/SillyTavern-html-inject)展示了每轮动态行动选项、点击填入并发送和选项压缩为纯文本的方案。云朵小手机适合保留动态选项思想，用普通 React 按钮与草稿确认代替该扩展的 DOM 注入、自动发送和完整 HTML 模板。

[官方 reasoning 文档](https://docs.sillytavern.app/usage/prompts/reasoning/)提醒内部思考会占用输出 token 额度；[GitHub #3536](https://github.com/SillyTavern/SillyTavern/discussions/3536)讨论了输出上限依赖模型 API。实现应把正文短回软约束与思考总输出预算分开，不能为短回复把推理模型上限压到几百 token。

## 已核实的思考字段与映射

下表「低 / 中 / 高 / 极高」依次列应用四档对应的真实请求值。预算是本应用建议的数值，不能叫作服务商原生四档。

| 服务商 / 型号 | 请求字段 | 低 / 中 / 高 / 极高 | 约束与界面说明 |
|---|---|---|---|
| DeepSeek V4 / deepseek-flash | `thinking.type=enabled` + `reasoning_effort` | `low / high / high / max` | 官方 `medium` 映射 high，`xhigh` 也映射 high；極高须发 max。关闭时 `thinking.type=disabled`，不同时发开启的 effort |
| OpenAI GPT-5.2、GPT-5.4 | 顶层 `reasoning_effort` | `low / medium / high / xhigh` | 模型页明确支持四档；GPT-4.1 系列不发送。旧 GPT-5 / mini、o 系列极高只可按已知最高 high 处理，不假定都有 xhigh |
| Claude Sonnet 4.6、Opus 4.6 | `thinking.type=adaptive` + `output_config.effort` | `low / medium / high / max` | **Sonnet 4.6 也支持 max**，没有 xhigh；不发 manual budget。4.7+ 禁止旧 enabled + budget_tokens |
| Claude Haiku 4.5 / Sonnet 4.5 | `thinking.type=enabled` + `budget_tokens` | `1024 / 4096 / 8192 / 16384` | 不支持 adaptive；budget 至少 1024，必须小于 max_tokens。开启 manual thinking 时避免带用户非默认 temperature/top_p |
| Gemini 3.8 / 3.7 Flash | `generationConfig.thinkingConfig.thinkingLevel` | `LOW / MEDIUM / HIGH / HIGH` | 不支持 MINIMAL，会报错；极高说明按当前最高 HIGH。无法完全关闭思考，关闭应用开关时可说明仍使用最低 LOW |
| Gemini 3.5 Flash / 3.5 Flash-Lite | 同上 | `LOW / MEDIUM / HIGH / HIGH` | 支持 MINIMAL，可用于应用思考开关关闭时，但它不保证零思考 |
| Gemini 2.5 Flash | `thinkingConfig.thinkingBudget` | `1024 / 4096 / 8192 / 16384` | 合法范围 0–24576；关闭 0。不能发送 thinkingLevel |
| Gemini 2.5 Pro / Flash-Lite | `thinkingConfig.thinkingBudget` | 同上 | Pro 128–32768 且不可关闭；Lite 开启 512–24576、关闭 0 |
| OpenRouter 已确认推理型号 | `reasoning:{effort,exclude:true}` | 模型支持的 `low / medium / high / xhigh` 或映射 | `/models` 元数据 `reasoning.supported_efforts` 可确认能力；缺省 / 非推理 / 动态 router 不应盲发。Google xhigh 被网关映射 high。exclude 仅隐藏正文之外的思考，仍收费 |
| SiliconFlow DeepSeek V4 | `enable_thinking` + `reasoning_effort` | `high / high / high / max` | 当前网关只声明 high/max；不要套用官方 DeepSeek 新增 low 的能力 |
| SiliconFlow Qwen3 混合推理型号 | `enable_thinking` + `thinking_budget` | `1024 / 4096 / 8192 / 16384` | 网关 budget 合法范围 128–32768；仅对已确认支持的型号发送 |
| 百炼 qwen-plus / qwen-turbo / Qwen3 混合型号 | `enable_thinking` + `thinking_budget` | `1024 / 4096 / 8192 / 16384` | qwen-plus、latest、2025-04-28+ 及 qwen-turbo 官方说明可开关；HTTP 扩展字段在 body 顶层，不使用 SDK extra_body 包裹 |
| Kimi K2.6 | `thinking:{type:'enabled'}` | 都是开启 | 未支持 effort / budget，界面说明不区分四档。关闭 disabled。不要设置固定 temperature/top_p/penalties；不加 keep:all，则历史只保存正文仍能普通无工具聊天 |
| GLM 4.7 系列 | `thinking:{type:'enabled',clear_thinking:true}` | 都是开启 | `reasoning_effort` 官方仅 5.2+；4.7 不发 budget/effort。关闭 disabled。clear_thinking 在 thinking 对象内 |
| xAI Grok 4.7 / 4.6 | 顶层 `reasoning_effort` | `low / medium / high / xhigh` | 思考无法关闭；4.5 的 xhigh 实际 high。推理模型不接受 presence/frequency/stop |
| 自定义兼容 / 未确认型号 | 不自动发思考扩展 | 保存四档选择，显示未确认支持 | 不以模型名字含某个词就默认全部字段兼容 |

对应第一手来源：

- [DeepSeek 思考模式与官方映射](https://api-docs.deepseek.com/guides/thinking_mode/)与[对话 API](https://api-docs.deepseek.com/api/create-chat-completion/)。无 tools 请求无需回传 reasoning_content；思考时 temperature 和两种标准惩罚无效，Top-P 生效范围 .95–1。英文页 web 抓取超时后，使用同一官方域名 HTTP 正文核实。
- [OpenAI official reasoning documentation](https://developers.openai.com/api/docs/guides/reasoning)、[GPT-5.2](https://developers.openai.com/api/docs/models/gpt-5.2)、[GPT-5.4](https://developers.openai.com/api/docs/models/gpt-5.4)、[Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create)。接口值以具体型号为准；低 effort 不等于短正文。
- [Claude Effort](https://platform.claude.com/docs/en/build-with-claude/effort)、[Thinking 配置矩阵](https://platform.claude.com/docs/en/build-with-claude/thinking)、[Manual extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)。不同代际能力分开处理，effort 是行为信号，budget 也不保证全部用满。
- [Gemini generateContent 思考说明](https://ai.google.dev/gemini-api/docs/generate-content/thinking)和[原生 ThinkingConfig schema](https://ai.google.dev/api/generate-content#ThinkingConfig)。不要拿新 Interactions API 的 snake_case 字段直接塞给现有 generateContent。
- [OpenRouter reasoning 与模型能力发现](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)、[服务商路由](https://openrouter.ai/docs/guides/routing/provider-selection)。未支持字段可能被后端忽略；发送惩罚时继续保留 require_parameters 且正确处理无匹配后端错误。
- [SiliconFlow 对话定义](https://docs.siliconflow.cn/docs/api/chat-completions-post)：网关 effort 与官方 DeepSeek 不是同一能力表。
- [百炼深度思考](https://help.aliyun.com/zh/model-studio/deep-thinking)、[OpenAI 兼容字段](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)。深度思考页 web 抓取失败后，读取同域 HTTP HTML 正文交叉核实。
- [Kimi 参数矩阵](https://platform.kimi.ai/docs/api/models-overview)、[Kimi thinking 与 keep](https://platform.kimi.ai/docs/guide/use-thinking-models)。K3、K2.7 Code 强制保留历史思考，不适合作为当前只存正文流程的默认推理型号。
- [GLM 思考模式](https://docs.bigmodel.cn/cn/guide/capabilities/thinking-mode.md)、[GLM 官方 API schema](https://docs.bigmodel.cn/api-reference/模型-api/对话补全.md)。web 抓取不可用时，同域 `.md` 经 HTTP 读取验证。
- [xAI reasoning](https://docs.x.ai/developers/model-capabilities/text/reasoning)明确 4.6+ 支持 xhigh、默认 high、不可关闭思考。

## 缓存与输出预算注意点

固定角色设定、示例、通用预设保持稳定；时间、命中世界书与可变本轮要求留在尾部。仅修改本轮尾部不会解决所有服务商的配置缓存失效：Claude 顶层 effort / manual budget 的变化和 Kimi K3 effort 变化可使旧前缀缓存失效，不能承诺随意切换四档仍保持命中。[Claude effort 缓存说明](https://platform.claude.com/docs/en/build-with-claude/effort)、[Claude manual budget 缓存说明](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)、[Kimi 参数说明](https://platform.kimi.ai/docs/api/models-overview)

本应用可用短回复 prompt 约束正文，并给 manual budget 留至少 1024–2048 token 的最终回复空间；没有 manual budget 的高力度模型应给足总输出余量且显式展示实际额度。允许高级用户改上限，参数校验与 UI 都不把总输出额度误称为「正文最大字数」。不得将思考原文伪装为角色回复，正文流暂空时应显示等待、允许停止；截断必须如实告知。

Qwen3.8 是另一个需单独适配的型号族：low/medium/xhigh 三档，高实际映射 xhigh，effort 与 budget 不能同时发送；默认要求历史 reasoning_content 原样回传。本轮最小方案可先适配 qwen-plus 与已确认的旧 Qwen3，未知新型号不激进开启 preserved thinking。[百炼参数定义](https://help.aliyun.com/zh/model-studio/qwen-api-via-openai-chat-completions)

## 复用范围与许可证

[SillyTavern 仓库 LICENSE](https://github.com/SillyTavern/SillyTavern/blob/release/LICENSE)为 AGPL-3.0。若直接移植其受许可证保护源码 / 默认配置，需要保留来源与许可证，并按许可证条件处理分发和网络提供源代码。本轮建议只参考通用构造思想，独立写小型 preset / parser / adapter，不复制完整酒馆源码。[社区 HTML 注入仓库](https://github.com/zHdna/SillyTavern-html-inject)当前文件列表没有明确 LICENSE，故不复制其实现或提示词，只引用作者公开展示的交互思路。

本次研究不评估模型对预设的真实遵循率，也不宣称四档与角色行为在各模型上具有等价质量。最终应验证协议字段、极高映射、老数据缺省、预设切换、本地备份和选项草稿交互；真实人设一致性与长度遵循仍需用户账户实聊观察。
