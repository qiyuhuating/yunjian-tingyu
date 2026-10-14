# 浏览器测试说明

2026-10-13 新增 `save-recovery.mjs`：从当前生产源码构建真实界面，注入两次附件事务失败，验证失败时紧急备份、再次重试及冷重载后的原文件字节。使用本地 Chromium 与合成数据，无真实服务商调用。分段备份、原文记忆及输出上限的完整验证见 [本轮记录](../../docs/reliability-fixes-2026-10-13.md)。

2026-10-09 API 与设置重设计的生产构建验收：

- `connection-ui.mjs`：23 项设置分类、搜索、模型列表与手填、凭据隔离、独立测试、HTTP/SSE 错误、取消、草稿、聊天恢复、暗夜对比度、响应布局和原生桥接检查。默认自建本地服务；支持 `CONNECTION_BUILD_DIR`、`CONNECTION_OUTPUT_DIR` 与 `CONNECTION_BASE_URL`。
- `features.mjs`：17 项完整功能流程；`roleplay.mjs`：10 项导入与世界书；`card-library.mjs`：14 项卡库；`p0-reliability.mjs`：10 项异步保存与媒体可靠性；`storage.mjs`：14 项本机存储与备份。
- 新界面验收报告与截图见 [本轮报告](../../docs/API连接与设置重设计-2026-10-09.md)。设置相关旧测试只调整导航和控件选择方式，保留业务断言；直接注入服务商的 fixture 同时指定其地址。

2026-10-08 源码升级的历史入口：

- `features.mjs`：当前源码生产构建的 16 项端到端流程，包括数据库升级、编辑草稿、壁纸、旧消息定位、真实录音 Blob、媒体输出及失败、转写上下文、授权表情、Gemini 原生媒体、全部应用导航与 Android multipart 桥接。
- `storage.mjs` / `storage-entry.ts`：真实存储与备份业务模块的 9 项浏览器检查，覆盖 5000 条历史、只写变更会话、跨窗口冲突、并发去重、压缩、完整恢复与原子性。
- `image-pixels.mjs`：PNG/WebP 原尺寸、alpha、不透明像素与三底色合成对比。需要原图目录 `BASELINE_IMAGES_DIR` 或原始 Git 提交参数。

默认构建目录 `work/feature-build`，可设置 `FEATURE_BUILD_DIR`。已有 Chromium 可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。生产构建命令和发布边界见根 README。界面截图使用运行环境的中文字体；字体不作为新增 APK 资源。

历史验收脚本保留在下方，按对应版本和页面结构运行。本轮 CI 改测当前源码，不把新版 v3 存储注入历史 v1 APK 页面。签名 APK 与资源的完整性门禁保留。所有接口 Key 为 fixture，无真实付费调用；模拟麦克风不等同真机收音验收。

## 历史验收入口

当前 0.0.1 / versionCode 4 的五组回归入口：

- `repair-review.mjs`：原生网络边界、取消、附件回收、ZIP 恢复冲突、朗读所有权和草稿恢复。
- `repair-summary.mjs`：真正的页面聊天流程，摘要请求隔离、截断摘要拒绝和空群删除。
- `repair-theme.mjs`：浅色默认、暗夜可读性、字体、十处文字对比度、四档宽度和截图。
- `repair-csp.mjs`：读取实际 Java CSP，验证无登录、本地资源、模型列表、流式回复、附件恢复、TTS 和 ZIP 导出桥接。
- `ui-group.mjs`：21 类真实界面流程，群成员独立调用、轮换、@、旁白格式重写、取消重试、成员管理、群记忆、图片预览、触控/横屏、通话入口、本地歌词、真实本地数据操作和 24 个应用导航。
- `repair-library.ts`：供浏览器注入的真实存储、备份及双阅读器组件，不是替代业务实现。

其余文件是完整开发过程中的专项测试、截图工具或测试维护脚本。旧 `review-*` 用于复现修复前缺陷；旧 `legacy-live` 测试针对网页模式。不要将历史失败或旧页面选择器当成当前版验收结论。模拟 Key 都是 fixture，不会调用真实付费服务。运行方式见仓库根 README。
