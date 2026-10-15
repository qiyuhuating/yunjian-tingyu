# 云笺听雨

为自己留一处能聊天、听歌、写日记的小天地。

个人使用的 Android 陪伴应用，界面与资源随 APK 打包，聊天、附件、角色卡和设置保存在设备本地，无需登录。调用 AI 服务需要网络和自己的 API Key。另提供可选网页运行方式。

## 当前状态

更新于 **2026-10-15**。当前整合源码已采用 v6 UI，并完成死代码清理；源码更新在 `integration/v6-ui-verified-20261015` 分支，尚未合入 main；已从该分支源码发布 [0.0.3 正式版](https://github.com/qiyuhuating/yunjian-tingyu/releases/tag/v0.0.3)。

| 对象 | 状态与范围 |
|---|---|
| 当前源码 | 草稿兼容整合、可靠性修复、v6 UI 与死代码清理已完成；最近产品代码提交为 `5827cbe` |
| 0.0.3 正式 APK | 2026-10-15 构建，versionCode 15，包名 `chat.cloudlet.phone.v002`；包含 v6 UI 与死代码清理，沿用原独立版签名 |
| 历史本地签名候选 APK | 2026-10-14 构建，版本 0.0.3.2 / versionCode 14，独立包名 `chat.cloudlet.phone.v002`；**不包含后续 v6 UI 和死代码清理** |
| 仓库历史 APK | 下方 0.0.1 下载及随包页面为历史交付，不代表当前源码 |
| 源码版本模板 | package.json 与 AndroidManifest 保留 0.0.2 / code 8；正式候选在暂存目录设置新版本，不能据模板判断已交付 APK 版本 |

现有安装不会自动获得新界面。请从下方 Release 下载并安装 0.0.3；安装前导出完整备份。本包尚未完成实际覆盖升级验收。

## 当前功能

- **聊天与模型连接**：单聊、群聊、引用、@、逐条发送、取消及显式重试；支持 DeepSeek、OpenRouter 等连接配置、分类设置、关键词搜索和独立连接测试。失败诊断刷新后保留。角色可使用各自模型连接。
- **角色与记忆**：角色设定、世界书、角色卡仓库、长期记忆和阶段摘要。卡片支持 TXT、JSON、PNG 导入与保存、编辑、收藏、分类、搜索及重复创建角色。固定核心提示词与角色资料分开，记忆保留原文、来源和修订历史，用户编辑内容受到保护。
- **附件与媒体**：附件发送、保存和下载，单文件上限 200 MB；常见文本、源码、办公文档、PDF 文字和 ZIP 内文字可本地解析。提供录音、图片、表情包、语音及 Gemini 原生音视频适配；具体能力取决于服务商和模型，解析与截断边界明确显示。
- **回合与 Agent 工作区**：回合队列、发送回执、媒体任务持久化与崩溃后的保守恢复；版本化文本工作区、多角色审阅与交接、权限检查和请求数量上限。数量上限不等于费用或 token 预算。
- **日常页面**：日记、便条、任务、日历、专注、一起听及其他陪伴页面。本地音乐和歌词导入、歌词跳转与刷新留存已有浏览器验收。支持浅色、暗夜、玫瑰主题、壁纸与手机横屏布局。
- **本地保存与备份**：聊天和附件分离存储，附件按摘要去重；保存失败可重试或导出紧急备份，完整备份采用分段 ZIP。新代码可读取旧备份，旧 APK 不能读取新 v3 ZIP；升级前先导出完整备份。
- **原生能力与内置 Via**：系统文件选择与导出、Android TTS、按需麦克风与相机授权；浏览器进入随 APK 合入的 Via 7.3.3，本地主界面与外部网页的桥接权限分离。

全新安装默认创建云汐，保留欢迎内容、记忆和世界书；已有安装优先沿用原本的角色、群聊和本地状态。私人社区与云币属于有明确标识的本地虚构互动；日历关闭应用后不提供系统闹钟。真实通话依赖 Realtime 服务，文字朗读另行提供。

角色卡最多 200 张、合计 12 MB。编辑模板不会自动修改已创建的角色；JSON 卡片导出不携带本机头像，跨设备迁移请使用完整备份。Via 的独立数据库不包含在小手机 ZIP 备份中。

## UI 更新与清理结果

v6 页面精修已整合，统一材质、间距、聊天输入区与按钮细节，加入联系人搜索结果、清空入口及选择状态。合入时修复了暗夜/玫瑰主题焦点不可见、渐变按钮文字对比不足和消息操作透明度叠加三处退化。

死代码清理删除了 2 个不可达模块、7 个无调用函数、9 类无生成方的旧样式和 72 条被同文件后续规则覆盖的声明。保留框架自动入口、动态类名、原生桥接和实际使用的网页后端代码。产品源码净减少 11,087 字节，生产 CSS 从约 154.81 kB 降至 151.77 kB，gzip 从约 31.76 kB 降至 31.03 kB。

已完成的本地验证：

- 291 项核心检查与严格 TypeScript 通过；Android 网页与完整 Vinext/Cloudflare 网页生产构建通过。
- 12 页 × 3 主题 × 4 尺寸，共 144 个状态、495 项 UI 检查通过，无页面异常或缺失资源。
- 音乐文件选择、歌词跳转和持久化、专注与日记选择等 6 项交互检查通过。
- 清理前后 48 组页面的计算样式、几何、图标数量及可见插画解码结果一致。严格截图像素对比存在少量差异，同一未修改页面重复绘制也有差异，因此不宣称截图像素全等。

这些结果来自本地锁定依赖、Chromium 与合成数据。未调用真实付费 API，未验收本次新源码的物理设备表现，已将 v6 UI / 清理后的源码打包为 0.0.3，并在最终入包页面上重跑上述 UI 和交互检查；实际覆盖安装仍待独立验收。

详细依据：[UI 验收与合并](docs/v6-ui-validation-2026-10-15.md) · [死代码清理记录](docs/dead-code-cleanup-2026-10-15.md) · [草稿逐项审核与整合](docs/2026-10-14-draft-integration-review.md)。

## 下载与安装

**[下载 0.0.3 正式版 APK](https://github.com/qiyuhuating/yunjian-tingyu/releases/download/v0.0.3/yunjian-tingyu-0.0.3.apk)** · [Release 与校验附件](https://github.com/qiyuhuating/yunjian-tingyu/releases/tag/v0.0.3)

版本 0.0.3 / versionCode 15，10,572,220 字节。SHA256：`79086f7d6bdf244e97f06b47d0caa1fa2db888ce845e54d46bc416f5221ead7a`。从源码 `92fc65d` 构建；签名 v2/v3、包身份、对齐、CRC、DEX 与 35 项入包资源字节核对通过，未完成实际覆盖安装或真机验收。

[历史 0.0.1 系统隔离 APK](outputs/云笺听雨-0.0.1-系统隔离版.apk) · [历史安装说明](outputs/APK安装说明.md) · [历史签名与完整性报告](outputs/云笺听雨系统隔离签名与完整性报告.md)

Android 要求：Android 7+、Android System WebView 120+。

2026-10-14 的独立签名候选 `yunjian-tingyu-0.0.3.2-integrated.apk` 是本地交付产物，未作为本仓库 Release 提供下载。其 SHA256 为 `22d2225aa3f3dba11efa0fded5f0c5988bf28a52a315017711ff50b44abb4b6d`，使用既有独立版证书；已检查签名、包名、版本和资源完整性，**尚未完成该 APK 的实际覆盖升级验收**。历史包的设备验证不能代替新候选验收。

## 源码目录

| 路径 | 用途 |
|---|---|
| `outputs/mori-phone/` | React 界面、模型适配、角色卡、记忆、本地存储与可选网页服务 |
| `outputs/mori-phone/android-web/` | Android 本地网页入口与 Vite 配置 |
| `outputs/android/` | 原生桥接、系统文件选择与导出、TTS、Via 合并和 APK 构建脚本 |
| `work/qa/` | 当前浏览器回归与历史专项验收脚本 |
| `scripts/` | 严格交付校验、文件清单同步和独立前端导出 |
| `docs/` | 设计、草稿取舍、构建经验和按日期记录的验收证据 |

[逐文件介绍与校验清单](FILES.md)。仓库中的历史测试报告、截图和 `outputs/android/assets/web` 不作为当前源码的生产构建或本轮通过证据。

## 本地开发与网页构建

需要 Node **22.13+**、Python 3、Git；浏览器回归还需要 Chromium。以下命令从仓库根目录执行；Windows 使用 `python`，Linux 可替换为 `python3`。

```sh
npm run install:ci --prefix outputs/mori-phone
npm ci --prefix work/qa
npm exec --prefix work/qa -- playwright install chromium
```

可选网页开发与生产构建：

```sh
npm run dev --prefix outputs/mori-phone
# 停止开发服务后再执行生产构建
npm run build --prefix outputs/mori-phone
```

Android 使用独立 Vite 入口。先构建当前页面，再运行校验；不要用历史随包页面代替：

```sh
node outputs/mori-phone/node_modules/vite/bin/vite.js build --config outputs/mori-phone/android-web/vite.config.ts --outDir ../../../work/feature-build
python scripts/verify-delivery.py
python work/check-release.py
node outputs/mori-phone/scripts/verify-media.mjs
node outputs/mori-phone/scripts/verify-p0.mjs
node work/qa/apk-assets.mjs
node work/qa/connection-ui.mjs
node work/qa/features.mjs
node work/qa/storage.mjs
node work/qa/save-recovery.mjs
node work/qa/media-save-retry.mjs
node work/qa/v6-ui.mjs
node work/qa/v6-ui-interactions.mjs
```

上述浏览器脚本默认构建目录为 `work/feature-build`；其他目录通过 `FEATURE_BUILD_DIR` 指定。资源裁剪校验必须显式指定该目录，PowerShell 示例：

```powershell
$env:FEATURE_BUILD_DIR=(Resolve-Path work/feature-build).Path
python work/verify-apk-assets.py
```

Linux 对应 `FEATURE_BUILD_DIR=work/feature-build python3 work/verify-apk-assets.py`。已有浏览器可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。每步检查退出码，失败后停止依赖它的后续操作。完整回归集合见 [验证工作流](.github/workflows/verify.yml)；文中的历史检查数量不能代替实际运行结果。

浏览器脚本可能写入已跟踪的历史报告或截图；提交前检查差异，将本轮证据单独保存。变更源码后同步并校验文件清单：

```sh
python scripts/sync-file-inventory.py
python scripts/verify-delivery.py
```

新文件需先补充清单脚本中的用途说明并加入 Git 索引，再同步；不要放宽校验来绕过缺失文件。

## Android 打包

完整步骤见 [独立构建工作流](docs/yunjian-build-workflow.md)，其中包括 ASCII 暂存、版本设置、签名、资源裁剪、包身份检查和升级验收。使用该文档中的示例时，替换本机路径、未来版本和实际产物摘要。

1. 准备完整 JDK、Android platform 35 / Build Tools 35.0.0、经摘要校验的 Apktool 3.0.3，以及既有独立版签名材料。Windows 使用 ASCII 构建与 SDK 路径，避免 aapt2 中文路径问题。
2. 从最终源码生成新鲜 Vite 构建，将原生工程复制到本任务独立暂存目录。新发布的 versionCode 必须大于所有已交付候选；当前正式版为 code 15，不要直接复用历史示例 code 14 或已发布的 code 15。
3. 在暂存目录调用 `build-apk.py`，显式传入新鲜网页目录、公共资源目录、SDK/JDK、签名和 Apktool。独立版使用 `--independent`，包名为 `chat.cloudlet.phone.v002`。
4. 核对 APK 签名证书与旧独立版一致，检查包名、版本、zipalign、资源摘要和裁剪后页面。无原签名时可用 `--unsigned` 做结构验证，不能作为可安装更新交付。
5. 在可丢弃模拟器中用合成数据进行覆盖安装、数据保留与离线冷启动验收。不得清空旧数据后将全新安装说成升级通过。

普通 [Verify 工作流](.github/workflows/verify.yml) 仍保留模板 0.0.2/code 8 的未签名构建；[独立候选工作流](.github/workflows/build-agent-v003-candidate.yml) 记录 0.0.3.2/code 14 的候选流程。远端工作流结果需单独核对，不由本地通过或源码推送推断。

## 进一步阅读

- [AI 调用经验 README](docs/README-AI-experience.md)：调用思路、关键决策、遇到的问题、解决方案与可复用实践。
- [独立构建工作流](docs/yunjian-build-workflow.md)：适用场景、工具准备、构建、签名及验收步骤。
- [可靠性修复与验收](docs/reliability-fixes-2026-10-13.md)：附件失败恢复、分段备份、记忆原文与输出上限。
- [角色卡仓库](docs/角色卡仓库-计划决策执行验收-2026-10-09.md) · [固定核心提示词](docs/核心提示词隔离说明.md) · [群聊与角色记忆](docs/群聊与角色记忆调研.md)。
- [可靠回合与 Agent 工作区](docs/可靠回合与Agent工作区-2026-10-10.md) · [API 连接与设置重设计](docs/API连接与设置重设计-2026-10-09.md)。
- [APK 精简验收](docs/apk-trim-2026-10-14.md) · [内置 Via 说明](docs/自然群聊与内置Via说明.md)。

按日期记录的文档保留当时版本与验收边界；当前入口说明以本 README 为准，实际 APK 身份以对应构建报告和摘要为准。

## 文件范围与隐私

仓库应保持 private。源码、历史 APK、测试、报告、截图与字体许可可以保留；签名私钥、密码、真实 API Key、个人聊天备份、依赖目录和临时构建缓存不得纳入提交或交付压缩包。APK 本地主界面不依赖网页托管或登录，联网 AI 请求仍受所选服务商条件约束。
