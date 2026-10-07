# 云朵小手机

私人 AI 陪伴网页应用，基于 React、TypeScript、Vinext 与 Cloudflare Workers，个人记录、原附件和服务商 Key 保存在设备的 IndexedDB；使用私有 Worker 网关临时转发真实 AI 请求。没有本地预设回复。另提供独立Android APK：前端入口位于android-web，不需要站点登录，Android壳源码单独交付。

## 使用

打开已发布的私人网址，使用创建应用的 ChatGPT 账号登录。设置中先选择服务商预设、填写 Key 并保存连接；常规预设无需填写地址或模型。名字、称呼、主题、模型和参数均可修改。角色支持 TXT、JSON、PNG 导入。日常工具在全部应用内。

首页采用一排聊天、论坛、浏览器、日记，右上角可打开全部应用；日期、一起听与小纸条之间保留景观留白，桌宠以真实 Three.js 3D 模型和对白气泡出现。底栏为首页、日历、记忆、设置。

## 开发

需要 Node.js 22.13+。依赖版本通过 package-lock.json 固定。

```powershell
npm ci
npm run db:generate
npm run build
```

仅在本地开发的 .dev.vars 中配置 KEY_ENCRYPTION_SECRET，为随机的64位十六进制字符串。此变量仅用于迁移旧版云端密钥；旧 AI_BASE_URL 仅供旧兼容连接迁移。新版 Key 由设备保存，不读取 AI_API_KEY 或 AI_MODEL。秘密文件必须保持忽略，不得进入版本控制。

构建后，依次执行 drizzle 中的每个尚未应用的 SQL 文件。以第一个文件为例：

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_colorful_lady_ursula.sql
npm run dev
```

对后续迁移替换文件名。不要重放已经应用的迁移。开发环境的登录地址是 /signin-with-chatgpt?return_to=/，仅回环地址会使用开发身份，生产构建不包含模拟登录。

## 文件与边界

- app/phone.tsx：桌面、状态保存队列、流式请求。
- app/chat.tsx：会话、附件、群聊与消息交互。
- app/modules.tsx：生活工具；app/settings.tsx：服务商与设备设置。
- app/api：临时 AI/模型网关、旧版数据迁移与清理。
- lib/local-phone.ts 与 local-backup.ts：设备状态、附件、Key、完整 ZIP。
- lib/providers.ts 与 provider-adapter.ts：预设、参数兼容与原生流式转换。
- lib/character-import.ts：JSON/TXT/PNG 角色解析。
- lib/attachment-text.ts：文本与受限 DOCX 文字提取。
- db/schema.ts 与 drizzle/：持久化结构和迁移。

API 使用服务端登录身份并要求同源。设备记录用 IndexedDB 事务检查版本，冲突不会覆盖另一窗口。旧附件按账号归属迁移，未知文件类型以附件下载；不执行或自动展开压缩包。AI请求每账号每分钟最多20次，这不是试玩轮数限制。

单个本机附件200 MB，总量受设备空间约束；每线程最多3000条消息。完整 ZIP 包含记录与原附件、SHA-256 清单，不含 Key；附件总量最多512 MB。首次打开迁入旧数据，旧云端副本可在设置中清理。新设备需导入 ZIP 并重新填 Key；清除站点数据会删除本机记录。历史按32条分段，最多保留64条，并受可配置字符预算约束；记忆与世界书有独立预算。固定提示词前缀不含时间与动态背景，实际命中由模型提供方决定。

当前仅验证个人工作流；没有声称通过公共商业负载认证、真实 AI 回复质量验证或应用商店审核。日历提醒在网页打开时生效。钱包与商店使用虚拟云币。

## 美术资源

本轮新增统一界面规则 `app/refinement.css`、角色导入预览、角色/世界书编辑分区、兼容提供方采样设置、实时计量、本机草稿和手机端保存恢复。AI 参数与缓存的依据见 [研究报告](docs/ai-optimization-research.md)，核心验证运行 `node scripts/verify-core.mjs`。没有复制 SillyTavern 或 DeepSeek harness 的源代码，依据公开规范独立实现。本项目采用缓存优先的世界书尾部插入，不声称完整复刻酒馆扩展。

public/wallpaper.png 使用 imagegen 内置工具一次生成。提示方向：原创柔蓝天空壁纸，白云与细微星光，远山、底部蓝顶小屋与睡着的云朵宠物，精细淡彩插画，大量天空留白，无文字、UI、Logo或手机外框。public/button-sprite.png 是主屏和应用启动器的 4×2 手绘功能按钮素材，public/dock-sprite.png 是首页、日历、记忆、设置底部栏的 4×1 手绘素材，public/cloud-pet.png 是透明桌宠插画。Source Serif 4 的本地 woff2 文件位于 public/fonts，主字体声明在 app/globals.css；中文使用本机中文衬线字体回退以覆盖汉字字形。表单和状态控件仍使用 lucide-react 作为可访问的辅助图形，主屏顶部的搜索与刷新图形已移除。

## 本机与多服务商升级

本轮计划、实现和验证见 [本机与多接口验收](docs/local-api-validation.md)，官方来源见 [服务商与 Tavo 调研](docs/provider-presets-research.md)。预设包括 DeepSeek、OpenAI、Claude、Gemini、OpenRouter、硅基流动、百炼、Kimi、智谱、xAI。所有惩罚数值均保留，只有当前接口支持的字段才会发送。原生 Claude/Gemini 的流式和用量单独适配。运行 `node scripts/verify-providers.mjs` 验证适配。

## 陪伴、音乐与语音升级

详见 [最终改进与验证](docs/companion-validation.md)。模型列表填 Key 后自动读取，支持 Custom 手填。阶段摘要、相关旧对话检索和重复重写可单独关闭；摘要与自动重写会额外调用当前模型。桌宠有六种情绪动作，离屏和后台暂停渲染。一起听使用本地音频与 LRC 原文同步，不生成假歌词。OpenAI TTS、兼容 TTS 与设备朗读分开配置；OpenAI Realtime 使用麦克风和真实 WebRTC，文字转录保存到本机会话。

Three.js 使用 MIT 许可，原始许可随 npm 依赖保留。没有复制酒馆源代码。

## Android独立版

运行 `node node_modules/vite/bin/vite.js build --config android-web/vite.config.ts`，生成完整本地界面到相邻android/assets/web。独立版本用固定设备身份、应用内IndexedDB与Android原生HTTPS桥接，直接访问AI提供方；不访问私人网址，不读取云端记录。上传、导出、设备TTS、外部链接和麦克风接Android原生能力。原生壳、打包脚本与安装说明随Android源码.zip交付；使用既有签名更新APK。浏览器桥接协议测试使用测试数据，无真机或真实Key实测。

## 0.0.1 审查修复

恢复在内存替换前验证角色关系与安全编号；状态和解除引用附件的回收使用同一 IndexedDB 事务，近期上传保留保护窗口。未编辑的原角色卡字段完整保留。失败回答不送入下一轮，后台摘要使用独立任务提示，截断或格式错误不推进游标。朗读以所有者和唯一原生任务 ID 隔离。长聊天初始只渲染最近 200 条，支持加载更早历史，容量上限提高至每会话 100000 条。

验证：`node scripts/verify-review.mjs`，另保留 verify-core、verify-providers、verify-voice。APK 的外显版本为 0.0.1、versionCode 3，使用既有签名。
