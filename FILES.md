# 文件索引

0.0.2 最终源码、四份草稿整合与验收见 [版本说明](docs/0.0.2.md)。0.0.1 APK 及随包资源为保持校验的历史交付；当前构建候选待原签名。

| 文件 | 用途 | 字节数 |
| --- | --- | ---: |
| [.gitattributes](.gitattributes) | 禁止换行自动转换，确保 Windows 和 Linux 检出后资源及校验值保持一致；路径：.gitattributes | 21 |
| [.github/workflows/release-standalone-v002.yml](.github/workflows/release-standalone-v002.yml) | 独立版签名 APK 的全自动构建、完整回归、加密密钥备份与一次性 Release 发布；路径：.github/workflows/release-standalone-v002.yml | 9891 |
| [.github/workflows/verify.yml](.github/workflows/verify.yml) | 持续集成的文件清单、角色卡仓库与角色扮演浏览器、媒体存储和Android编译门禁；路径：.github/workflows/verify.yml | 4777 |
| [.gitignore](.gitignore) | 排除依赖、私钥与可复现 QA 构建、失败截图等临时文件；路径：.gitignore | 436 |
| [README.md](README.md) | 项目能力、可复用角色卡仓库操作、完整备份迁移和当前草稿与既有APK的发布范围；路径：README.md | 9284 |
| [docs/0.0.1.md](docs/0.0.1.md) | 0.0.1 发布说明、升级要求、安装包哈希、签名证书及验收范围；路径：docs/0.0.1.md | 1219 |
| [docs/0.0.2-integration-results.json](docs/0.0.2-integration-results.json) | 0.0.2 四草稿合并、验收与签名构建交付；路径：docs/0.0.2-integration-results.json | 23214 |
| [docs/0.0.2.md](docs/0.0.2.md) | 0.0.2 四草稿合并、验收与签名构建交付；路径：docs/0.0.2.md | 4237 |
| [docs/P0复验与阶段台账-2026-10-08.md](docs/P0复验与阶段台账-2026-10-08.md) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/P0复验与阶段台账-2026-10-08.md | 15414 |
| [docs/UI-UX与图片优化计划-2026-10-08.md](docs/UI-UX与图片优化计划-2026-10-08.md) | 当前源码与运行界面的深度审视、分批 UX 优化任务及无损图片结果和 APK 发布边界；路径：docs/UI-UX与图片优化计划-2026-10-08.md | 17812 |
| [docs/UI与群聊审视报告.md](docs/UI与群聊审视报告.md) | UI 发现与修复、功能真实性边界、群聊规则与完整验收证据；路径：docs/UI与群聊审视报告.md | 7638 |
| [docs/UI群聊调优计划.md](docs/UI群聊调优计划.md) | 上一版群聊优化交付；该轮计划、UI UX Pro Max 参考与群聊验收标准；路径：docs/UI群聊调优计划.md | 2128 |
| [docs/build-performance-results.json](docs/build-performance-results.json) | 相同工具链独立生产构建的逐文件大小与摘要，区别首屏 JS、总产物和未测 APK/FPS；路径：docs/build-performance-results.json | 3889 |
| [docs/card-library-browser-results.json](docs/card-library-browser-results.json) | 13项真实页面卡片管理和AI拆分验收结果，记录档案草稿恢复和页面异常检查；路径：docs/card-library-browser-results.json | 1227 |
| [docs/card-library-core-results.json](docs/card-library-core-results.json) | 19项角色卡核心检查的具名通过记录，覆盖去重、独立复用、修订与UTF-8总预算；路径：docs/card-library-core-results.json | 1283 |
| [docs/card-library-regression-results.json](docs/card-library-regression-results.json) | 165项核心媒体和仓库检查的完整结果，涵盖世界书、记忆、群聊、路由与模板复用；路径：docs/card-library-regression-results.json | 12538 |
| [docs/core-media-regression-results.json](docs/core-media-regression-results.json) | 103 项核心加 11 项媒体和后台维护检查的具名结果与原生编译范围；路径：docs/core-media-regression-results.json | 8544 |
| [docs/feature-browser-results.json](docs/feature-browser-results.json) | 17项当前源码页面、录音、多模型、媒体与Android二进制桥接的浏览器结果；路径：docs/feature-browser-results.json | 1488 |
| [docs/feature-chat-preview.png](docs/feature-chat-preview.png) | 当前源码中文界面、自然短消息、实际表情图片和音频播放器的测试截图（fixture 媒体）；路径：docs/feature-chat-preview.png | 66931 |
| [docs/image-optimization-browser-audit.json](docs/image-optimization-browser-audit.json) | PNG 与 WebP 两套构建页面的图片自然尺寸、五宽度布局、设置问题与聊天草稿实测；路径：docs/image-optimization-browser-audit.json | 4290 |
| [docs/image-optimization-browser-pixels.json](docs/image-optimization-browser-pixels.json) | Chromium 153 比较半透明合成：alpha和不透明像素一致，三底色最多一个色阶差异；路径：docs/image-optimization-browser-pixels.json | 3497 |
| [docs/image-optimization-draft-audit.json](docs/image-optimization-draft-audit.json) | 实际导航复现日记未保存内容及角色未保存修改丢失的两条证据；路径：docs/image-optimization-draft-audit.json | 134 |
| [docs/image-optimization-results.json](docs/image-optimization-results.json) | 六张原图和输出的尺寸、精确字节数、SHA-256 与完整 RGBA 一致性结果；路径：docs/image-optimization-results.json | 2587 |
| [docs/p0-image-verification.json](docs/p0-image-verification.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-image-verification.json | 1938 |
| [docs/p0-live-aggregate-results.json](docs/p0-live-aggregate-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-aggregate-results.json | 2724 |
| [docs/p0-live-api-results.json](docs/p0-live-api-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-api-results.json | 3934 |
| [docs/p0-live-cache-first-results.json](docs/p0-live-cache-first-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-cache-first-results.json | 4146 |
| [docs/p0-live-cache-liquid-truncated-results.json](docs/p0-live-cache-liquid-truncated-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-cache-liquid-truncated-results.json | 1605 |
| [docs/p0-live-cache-parameter-detail-results.json](docs/p0-live-cache-parameter-detail-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-cache-parameter-detail-results.json | 1341 |
| [docs/p0-live-cache-parameter-results.json](docs/p0-live-cache-parameter-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-cache-parameter-results.json | 1294 |
| [docs/p0-live-cache-top-p-failure.json](docs/p0-live-cache-top-p-failure.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-cache-top-p-failure.json | 1482 |
| [docs/p0-live-cache-truncated-results.json](docs/p0-live-cache-truncated-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-live-cache-truncated-results.json | 1625 |
| [docs/p0-reliability-results.json](docs/p0-reliability-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-reliability-results.json | 692 |
| [docs/p0-storage-scale-results.json](docs/p0-storage-scale-results.json) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/p0-storage-scale-results.json | 2586 |
| [docs/roleplay-browser-results.json](docs/roleplay-browser-results.json) | 10项角色卡分析、原卡下载、独立世界书、实际请求和取消回归的浏览器证据；路径：docs/roleplay-browser-results.json | 1274 |
| [docs/roleplay-core-results.json](docs/roleplay-core-results.json) | 151项核心、协议、独立记忆、角色卡分析、世界书与可复用卡库的具名自动检查结果；路径：docs/roleplay-core-results.json | 11578 |
| [docs/storage-regression-results.json](docs/storage-regression-results.json) | 5000条历史、跨窗口与原子性、模板草稿备份恢复和头像引用回收的13项存储结果；路径：docs/storage-regression-results.json | 1073 |
| [docs/优化实施与验收-2026-10-08.md](docs/优化实施与验收-2026-10-08.md) | 图片画质、存储架构、真实多模态、壁纸、自然对话、功能真实性及发布余项的完整执行验收；路径：docs/优化实施与验收-2026-10-08.md | 13545 |
| [docs/审计计划落实记录.md](docs/审计计划落实记录.md) | 外部审计建议逐项核实、适用修复、未证实判断、延期范围和本轮验收边界；路径：docs/审计计划落实记录.md | 9555 |
| [docs/本机记录与接口边界修复.md](docs/本机记录与接口边界修复.md) | 本轮问题证据、修复计划、停止红队后的功能验收与未覆盖边界；路径：docs/本机记录与接口边界修复.md | 6620 |
| [docs/核心提示词隔离说明.md](docs/核心提示词隔离说明.md) | 用户明确保存的系统核心、角色资料隔离、模型最大窗口、迁移与验证证据；路径：docs/核心提示词隔离说明.md | 7151 |
| [docs/群聊与角色记忆调研.md](docs/群聊与角色记忆调研.md) | Telegram、Hermes、kuihua 与 PDF.js 的一手来源、实施计划和能力边界；路径：docs/群聊与角色记忆调研.md | 4714 |
| [docs/自然群聊与内置Via说明.md](docs/自然群聊与内置Via说明.md) | 自然群聊、Via二进制来源/合包、参考首页回退、系统栏和实际原生验收；路径：docs/自然群聊与内置Via说明.md | 4326 |
| [docs/角色卡仓库-计划决策执行验收-2026-10-09.md](docs/角色卡仓库-计划决策执行验收-2026-10-09.md) | 可复用角色卡仓库的计划决策执行验收、上游整合、容量与版本保护及APK交付边界；路径：docs/角色卡仓库-计划决策执行验收-2026-10-09.md | 6346 |
| [docs/角色扮演导入与记忆-计划决策执行验收-2026-10-09.md](docs/角色扮演导入与记忆-计划决策执行验收-2026-10-09.md) | SillyTavern及角色卡管理项目源码调研、独立卡库、世界书记忆设计与211项验收证据；路径：docs/角色扮演导入与记忆-计划决策执行验收-2026-10-09.md | 14658 |
| [docs/角色持续对话验收-2026-10-08.md](docs/角色持续对话验收-2026-10-08.md) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：docs/角色持续对话验收-2026-10-08.md | 8416 |
| [docs/角色独立AI模型路由.md](docs/角色独立AI模型路由.md) | 角色独立服务商、专属密钥和群聊路由的产品说明、手工配置流程与验收标准；路径：docs/角色独立AI模型路由.md | 3892 |
| [outputs/0.0.1暗夜聊天预览.png](outputs/0.0.1暗夜聊天预览.png) | 界面预览或绘图资源：0.0.1暗夜聊天预览.png；目录 outputs；路径：outputs/0.0.1暗夜聊天预览.png | 83201 |
| [outputs/0.0.1暗夜设置预览.png](outputs/0.0.1暗夜设置预览.png) | 界面预览或绘图资源：0.0.1暗夜设置预览.png；目录 outputs；路径：outputs/0.0.1暗夜设置预览.png | 174224 |
| [outputs/0.0.1暗夜预览.png](outputs/0.0.1暗夜预览.png) | 界面预览或绘图资源：0.0.1暗夜预览.png；目录 outputs；路径：outputs/0.0.1暗夜预览.png | 522338 |
| [outputs/APK安装说明.md](outputs/APK安装说明.md) | 项目说明、调研或验证文档：APK安装说明.md；路径：outputs/APK安装说明.md | 3753 |
| [outputs/Android审计验证-logcat.txt](outputs/Android审计验证-logcat.txt) | 本轮实际模拟器安装、Via与文件选择验收的AndroidRuntime及Chromium日志；路径：outputs/Android审计验证-logcat.txt | 24020 |
| [outputs/Android源码.zip](outputs/Android源码.zip) | 源码归档：Android源码.zip；可直接下载解压，当前推荐带 0.0.1 的归档；路径：outputs/Android源码.zip | 9300566 |
| [outputs/Android验证-Via.png](outputs/Android验证-Via.png) | 内置Via实际网页、桥接隔离和隐藏顶部系统状态栏的模拟器截图；路径：outputs/Android验证-Via.png | 90080 |
| [outputs/Android验证-文件读取.png](outputs/Android验证-文件读取.png) | Android 15 实际系统文件选择器、离线PDF解析与未知二进制消息截图；路径：outputs/Android验证-文件读取.png | 341805 |
| [outputs/Android验证-桌面图标.png](outputs/Android验证-桌面图标.png) | Android 15 系统应用列表实际显示笑脸云朵软件图标的验收截图；路径：outputs/Android验证-桌面图标.png | 212212 |
| [outputs/Android验证-首页.png](outputs/Android验证-首页.png) | 恢复参考首页和四个插画导航、隐藏系统三键栏的实际模拟器截图；路径：outputs/Android验证-首页.png | 2580690 |
| [outputs/UI暗夜-私聊.png](outputs/UI暗夜-私聊.png) | 当前暗夜单人聊天与主要触控操作验收截图；路径：outputs/UI暗夜-私聊.png | 84564 |
| [outputs/UI暗夜-设置.png](outputs/UI暗夜-设置.png) | 当前暗夜服务商设置和可读性验收截图；路径：outputs/UI暗夜-设置.png | 177462 |
| [outputs/UI暗夜-首页.png](outputs/UI暗夜-首页.png) | 当前暗夜首页、留白、插画和卡片层次验收截图；路径：outputs/UI暗夜-首页.png | 522479 |
| [outputs/UI系统隔离-暗夜.png](outputs/UI系统隔离-暗夜.png) | 当前暗夜群聊、输入操作与消息层次的验收截图；路径：outputs/UI系统隔离-暗夜.png | 54084 |
| [outputs/UI系统隔离-浅色.png](outputs/UI系统隔离-浅色.png) | 当前浅色群聊、短消息与文件预览功能的验收截图；路径：outputs/UI系统隔离-浅色.png | 71531 |
| [outputs/UI群聊-暗夜.png](outputs/UI群聊-暗夜.png) | 上一版群聊优化交付；当时暗夜群聊的短消息、成员头像和输入区验收截图；路径：outputs/UI群聊-暗夜.png | 51693 |
| [outputs/UI群聊-浅色.png](outputs/UI群聊-浅色.png) | 上一版群聊优化交付；当时浅色群聊消息、附件与输入区的浏览器验收截图；路径：outputs/UI群聊-浅色.png | 71157 |
| [outputs/UI角色记忆与文件.png](outputs/UI角色记忆与文件.png) | 角色群聊、真实读取状态与新能力的浏览器验收截图；路径：outputs/UI角色记忆与文件.png | 51272 |
| [outputs/android/AndroidManifest.xml](outputs/android/AndroidManifest.xml) | Android 包名、0.0.1 版本、组件及系统权限声明；路径：outputs/android/AndroidManifest.xml | 1524 |
| [outputs/android/README.md](outputs/android/README.md) | 使用或构建指南，适用目录：outputs/android；路径：outputs/android/README.md | 4680 |
| [outputs/android/assets/fonts/SourceSerif4Variable-Roman.ttf](outputs/android/assets/fonts/SourceSerif4Variable-Roman.ttf) | 随包 Source Serif 4 字体资源：SourceSerif4Variable-Roman.ttf；路径：outputs/android/assets/fonts/SourceSerif4Variable-Roman.ttf | 1204208 |
| [outputs/android/assets/licenses/Source-Serif-OFL.txt](outputs/android/assets/licenses/Source-Serif-OFL.txt) | 第三方资源许可与归属声明：outputs/android/assets/licenses/Source-Serif-OFL.txt | 4491 |
| [outputs/android/assets/web/assets/index-Bt4QJ_c-.css](outputs/android/assets/web/assets/index-Bt4QJ_c-.css) | 当前 APK 的随包界面样式，含主题、触控及响应式；路径：outputs/android/assets/web/assets/index-Bt4QJ_c-.css | 100523 |
| [outputs/android/assets/web/assets/index-DLNndW-a.js](outputs/android/assets/web/assets/index-DLNndW-a.js) | 当前 APK 的完整业务脚本，含群聊、预览及系统返回；路径：outputs/android/assets/web/assets/index-DLNndW-a.js | 518643 |
| [outputs/android/assets/web/assets/pdf-reading-CDTX2G17.js](outputs/android/assets/web/assets/pdf-reading-CDTX2G17.js) | 当前 APK 按需加载的 PDF 读取组件和 PDF.js 主库；路径：outputs/android/assets/web/assets/pdf-reading-CDTX2G17.js | 452388 |
| [outputs/android/assets/web/assets/pdf.worker.min-Cr_QfRGn.mjs](outputs/android/assets/web/assets/pdf.worker.min-Cr_QfRGn.mjs) | 当前 APK 随包的 PDF.js 解析 worker，离线加载且不依赖 CDN；路径：outputs/android/assets/web/assets/pdf.worker.min-Cr_QfRGn.mjs | 1128591 |
| [outputs/android/assets/web/assets/three.module-DZ7jnTks.js](outputs/android/assets/web/assets/three.module-DZ7jnTks.js) | 当前 APK 按需加载的 Three.js 运行库，为云朵桌宠提供真实三维渲染；路径：outputs/android/assets/web/assets/three.module-DZ7jnTks.js | 537050 |
| [outputs/android/assets/web/button-sprite.png](outputs/android/assets/web/button-sprite.png) | 桌面应用绘制图标拼图；路径：outputs/android/assets/web/button-sprite.png | 1313405 |
| [outputs/android/assets/web/cloud-pet.png](outputs/android/assets/web/cloud-pet.png) | 桌宠云朵备用绘图；路径：outputs/android/assets/web/cloud-pet.png | 1248793 |
| [outputs/android/assets/web/dock-sprite.png](outputs/android/assets/web/dock-sprite.png) | 底部导航绘制图标拼图；路径：outputs/android/assets/web/dock-sprite.png | 1571700 |
| [outputs/android/assets/web/favicon.svg](outputs/android/assets/web/favicon.svg) | 工程支持文件：outputs/android/assets/web/favicon.svg | 302 |
| [outputs/android/assets/web/fonts/source-serif-4-latin-400.woff2](outputs/android/assets/web/fonts/source-serif-4-latin-400.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-400.woff2；路径：outputs/android/assets/web/fonts/source-serif-4-latin-400.woff2 | 20088 |
| [outputs/android/assets/web/fonts/source-serif-4-latin-600.woff2](outputs/android/assets/web/fonts/source-serif-4-latin-600.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-600.woff2；路径：outputs/android/assets/web/fonts/source-serif-4-latin-600.woff2 | 21532 |
| [outputs/android/assets/web/fonts/source-serif-4-latin-700.woff2](outputs/android/assets/web/fonts/source-serif-4-latin-700.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-700.woff2；路径：outputs/android/assets/web/fonts/source-serif-4-latin-700.woff2 | 21716 |
| [outputs/android/assets/web/icon-192.png](outputs/android/assets/web/icon-192.png) | 界面预览或绘图资源：icon-192.png；目录 outputs/android/assets/web；路径：outputs/android/assets/web/icon-192.png | 5393 |
| [outputs/android/assets/web/icon-512.png](outputs/android/assets/web/icon-512.png) | 界面预览或绘图资源：icon-512.png；目录 outputs/android/assets/web；路径：outputs/android/assets/web/icon-512.png | 18315 |
| [outputs/android/assets/web/index.html](outputs/android/assets/web/index.html) | 工程支持文件：outputs/android/assets/web/index.html | 377 |
| [outputs/android/assets/web/licenses/PDFjs-LICENSE.txt](outputs/android/assets/web/licenses/PDFjs-LICENSE.txt) | APK 内保留的 PDF.js Apache 2.0 许可副本；路径：outputs/android/assets/web/licenses/PDFjs-LICENSE.txt | 10174 |
| [outputs/android/assets/web/licenses/noble-hashes-LICENSE.txt](outputs/android/assets/web/licenses/noble-hashes-LICENSE.txt) | APK内增量SHA256库的MIT许可证副本；路径：outputs/android/assets/web/licenses/noble-hashes-LICENSE.txt | 1109 |
| [outputs/android/assets/web/manifest.webmanifest](outputs/android/assets/web/manifest.webmanifest) | 工程支持文件：outputs/android/assets/web/manifest.webmanifest | 359 |
| [outputs/android/assets/web/music-listen.png](outputs/android/assets/web/music-listen.png) | 一起听笑脸云朵耳机插画；路径：outputs/android/assets/web/music-listen.png | 1200508 |
| [outputs/android/assets/web/via-browser.png](outputs/android/assets/web/via-browser.png) | 随 APK 打包的 Via 入口笑脸云朵原图，离线显示；路径：outputs/android/assets/web/via-browser.png | 985903 |
| [outputs/android/assets/web/wallpaper.png](outputs/android/assets/web/wallpaper.png) | 天空小屋桌面壁纸；路径：outputs/android/assets/web/wallpaper.png | 1822518 |
| [outputs/android/build-apk.py](outputs/android/build-apk.py) | 正式APK构建及原签名指纹前置门控，拒绝缺失或替换签名私钥；路径：outputs/android/build-apk.py | 6976 |
| [outputs/android/merge-via.py](outputs/android/merge-via.py) | 保留Via资源ID，合并清单/资产/双DEX，迁移共享authority并校验DEX顺序；路径：outputs/android/merge-via.py | 6626 |
| [outputs/android/res/drawable/cloud_pet.png](outputs/android/res/drawable/cloud_pet.png) | 用户提供的笑脸耳机云朵原图，作为软件桌面图标的位图主体；路径：outputs/android/res/drawable/cloud_pet.png | 985903 |
| [outputs/android/res/mipmap-anydpi-v26/app_icon.xml](outputs/android/res/mipmap-anydpi-v26/app_icon.xml) | 工程支持文件：outputs/android/res/mipmap-anydpi-v26/app_icon.xml | 484 |
| [outputs/android/res/mipmap-anydpi/app_icon.xml](outputs/android/res/mipmap-anydpi/app_icon.xml) | Android 7 的固定尺寸笑脸云朵图标，避免原图分辨率导致过度缩小；路径：outputs/android/res/mipmap-anydpi/app_icon.xml | 367 |
| [outputs/android/res/values/styles.xml](outputs/android/res/values/styles.xml) | 工程支持文件：outputs/android/res/values/styles.xml | 415 |
| [outputs/android/src/chat/cloudlet/phone/BrowserIntegration.java](outputs/android/src/chat/cloudlet/phone/BrowserIntegration.java) | 内置Via字体、独立返回位置、状态栏/系统导航隐藏与生命周期接入；路径：outputs/android/src/chat/cloudlet/phone/BrowserIntegration.java | 4488 |
| [outputs/android/src/chat/cloudlet/phone/MainActivity.java](outputs/android/src/chat/cloudlet/phone/MainActivity.java) | 保留受信来源和网络边界的 Android 文件/权限/语音桥接，增加二进制 multipart 请求；路径：outputs/android/src/chat/cloudlet/phone/MainActivity.java | 26291 |
| [outputs/android/vendor/via-release-cn.apk](outputs/android/vendor/via-release-cn.apk) | 机主提供的Via7.3.3原始二进制，固定SHA-256，原件未修改；路径：outputs/android/vendor/via-release-cn.apk | 2628334 |
| [outputs/code-review-validation/README.txt](outputs/code-review-validation/README.txt) | 修复前代码审查的缺陷复现材料：README.txt；路径：outputs/code-review-validation/README.txt | 644 |
| [outputs/code-review-validation/review-core.mjs](outputs/code-review-validation/review-core.mjs) | 修复前代码审查的缺陷复现材料：review-core.mjs；路径：outputs/code-review-validation/review-core.mjs | 2493 |
| [outputs/code-review-validation/review-native.mjs](outputs/code-review-validation/review-native.mjs) | 修复前代码审查的缺陷复现材料：review-native.mjs；路径：outputs/code-review-validation/review-native.mjs | 1681 |
| [outputs/code-review-validation/review-restore.mjs](outputs/code-review-validation/review-restore.mjs) | 修复前代码审查的缺陷复现材料：review-restore.mjs；路径：outputs/code-review-validation/review-restore.mjs | 1421 |
| [outputs/mori-phone/.gitignore](outputs/mori-phone/.gitignore) | 工程支持文件：outputs/mori-phone/.gitignore | 624 |
| [outputs/mori-phone/.npmrc](outputs/mori-phone/.npmrc) | 工程支持文件：outputs/mori-phone/.npmrc | 45 |
| [outputs/mori-phone/.openai/hosting.json](outputs/mori-phone/.openai/hosting.json) | 配置或机器可读验证记录：outputs/mori-phone/.openai/hosting.json | 100 |
| [outputs/mori-phone/README.md](outputs/mori-phone/README.md) | 使用或构建指南，适用目录：outputs/mori-phone；路径：outputs/mori-phone/README.md | 7484 |
| [outputs/mori-phone/android-web/index.html](outputs/mori-phone/android-web/index.html) | 工程支持文件：outputs/mori-phone/android-web/index.html | 274 |
| [outputs/mori-phone/android-web/main.tsx](outputs/mori-phone/android-web/main.tsx) | React 界面模块：main；位于 outputs/mori-phone/android-web；路径：outputs/mori-phone/android-web/main.tsx | 450 |
| [outputs/mori-phone/android-web/runtime.ts](outputs/mori-phone/android-web/runtime.ts) | APK 内原生网络、导出与朗读的前端桥接；路径：outputs/mori-phone/android-web/runtime.ts | 10245 |
| [outputs/mori-phone/android-web/vite.config.ts](outputs/mori-phone/android-web/vite.config.ts) | TypeScript 业务或构建模块：vite.config；位于 outputs/mori-phone/android-web；路径：outputs/mori-phone/android-web/vite.config.ts | 344 |
| [outputs/mori-phone/app/ai-controls.tsx](outputs/mori-phone/app/ai-controls.tsx) | 模型采样及思考参数设置界面；路径：outputs/mori-phone/app/ai-controls.tsx | 8727 |
| [outputs/mori-phone/app/api/assets/[id]/route.ts](outputs/mori-phone/app/api/assets/[id]/route.ts) | 可选网页服务 API 路由：assets/[id]/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/assets/[id]/route.ts | 1372 |
| [outputs/mori-phone/app/api/assets/route.ts](outputs/mori-phone/app/api/assets/route.ts) | 可选网页服务 API 路由：assets/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/assets/route.ts | 287 |
| [outputs/mori-phone/app/api/chat/route.ts](outputs/mori-phone/app/api/chat/route.ts) | 可选网页服务 API 路由：chat/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/chat/route.ts | 2038 |
| [outputs/mori-phone/app/api/connection/route.ts](outputs/mori-phone/app/api/connection/route.ts) | 可选网页服务 API 路由：connection/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/connection/route.ts | 770 |
| [outputs/mori-phone/app/api/health/route.ts](outputs/mori-phone/app/api/health/route.ts) | 可选网页服务 API 路由：health/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/health/route.ts | 602 |
| [outputs/mori-phone/app/api/media/route.ts](outputs/mori-phone/app/api/media/route.ts) | 同源校验、请求边界、超时与实际生图/转写/语音媒体网关；路径：outputs/mori-phone/app/api/media/route.ts | 669 |
| [outputs/mori-phone/app/api/models/route.ts](outputs/mori-phone/app/api/models/route.ts) | 可选网页服务 API 路由：models/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/models/route.ts | 1756 |
| [outputs/mori-phone/app/api/realtime/route.ts](outputs/mori-phone/app/api/realtime/route.ts) | 可选网页服务 API 路由：realtime/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/realtime/route.ts | 1502 |
| [outputs/mori-phone/app/api/speech/route.ts](outputs/mori-phone/app/api/speech/route.ts) | 可选网页服务 API 路由：speech/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/speech/route.ts | 1536 |
| [outputs/mori-phone/app/api/state/route.ts](outputs/mori-phone/app/api/state/route.ts) | 可选网页服务 API 路由：state/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/state/route.ts | 1671 |
| [outputs/mori-phone/app/card-analysis-preview.tsx](outputs/mori-phone/app/card-analysis-preview.tsx) | 角色卡AI分析连接选择、取消、失败回退与人物及世界书拆分预览；路径：outputs/mori-phone/app/card-analysis-preview.tsx | 2809 |
| [outputs/mori-phone/app/character-ai-settings.tsx](outputs/mori-phone/app/character-ai-settings.tsx) | 角色 AI 服务商与模型编辑、加密专属 Key 的保存/移除和自定义 HTTPS 接口保护；路径：outputs/mori-phone/app/character-ai-settings.tsx | 5185 |
| [outputs/mori-phone/app/character-library.tsx](outputs/mori-phone/app/character-library.tsx) | 角色卡分类备注与分页、人物及高级世界书编辑、AI拆分和明确复制删除的仓库界面；路径：outputs/mori-phone/app/character-library.tsx | 16673 |
| [outputs/mori-phone/app/characters.tsx](outputs/mori-phone/app/characters.tsx) | 聊天角色编辑、角色卡原始档案、AI分类、默认归档卡库及独立复用/定向更新预览；路径：outputs/mori-phone/app/characters.tsx | 14174 |
| [outputs/mori-phone/app/chat.tsx](outputs/mori-phone/app/chat.tsx) | 聊天与群聊发送、原生媒体收发及附件跟进；允许角色级模型独立连接；路径：outputs/mori-phone/app/chat.tsx | 33391 |
| [outputs/mori-phone/app/chatgpt-auth.ts](outputs/mori-phone/app/chatgpt-auth.ts) | TypeScript 业务或构建模块：chatgpt-auth；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/chatgpt-auth.ts | 2550 |
| [outputs/mori-phone/app/comfort.css](outputs/mori-phone/app/comfort.css) | 聊天导航、群头像、短消息、触控、图片对话框和横屏布局样式；路径：outputs/mori-phone/app/comfort.css | 9906 |
| [outputs/mori-phone/app/companion-settings.tsx](outputs/mori-phone/app/companion-settings.tsx) | React 界面模块：companion-settings；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/companion-settings.tsx | 7764 |
| [outputs/mori-phone/app/focus-timer.tsx](outputs/mori-phone/app/focus-timer.tsx) | React 界面模块：focus-timer；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/focus-timer.tsx | 2709 |
| [outputs/mori-phone/app/globals.css](outputs/mori-phone/app/globals.css) | 全局字体、布局和浅暗主题样式；路径：outputs/mori-phone/app/globals.css | 54005 |
| [outputs/mori-phone/app/layout.tsx](outputs/mori-phone/app/layout.tsx) | React 界面模块：layout；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/layout.tsx | 762 |
| [outputs/mori-phone/app/local-media.tsx](outputs/mori-phone/app/local-media.tsx) | 共享本机Blob预览及按重试版本重新获取原件，释放对象URL；路径：outputs/mori-phone/app/local-media.tsx | 1155 |
| [outputs/mori-phone/app/lore.tsx](outputs/mori-phone/app/lore.tsx) | 独立世界书导入导出、作用域编辑、搜索、分页和真实引擎命中解释；路径：outputs/mori-phone/app/lore.tsx | 10058 |
| [outputs/mori-phone/app/media-settings.tsx](outputs/mori-phone/app/media-settings.tsx) | 真实媒体能力开关、模型/地址和独立 Key 配置入口；路径：outputs/mori-phone/app/media-settings.tsx | 4418 |
| [outputs/mori-phone/app/memory-drawer.tsx](outputs/mori-phone/app/memory-drawer.tsx) | 本地记忆编辑、锁定保护、来源证据、修改历史和按角色筛选；路径：outputs/mori-phone/app/memory-drawer.tsx | 3970 |
| [outputs/mori-phone/app/message-text.tsx](outputs/mori-phone/app/message-text.tsx) | 完整 Markdown 与代码复制、保存、长代码折叠；路径：outputs/mori-phone/app/message-text.tsx | 2016 |
| [outputs/mori-phone/app/modules.tsx](outputs/mori-phone/app/modules.tsx) | React 界面模块：modules；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/modules.tsx | 25637 |
| [outputs/mori-phone/app/music.tsx](outputs/mori-phone/app/music.tsx) | 一起听、本地音乐、歌词及外部音乐链接；路径：outputs/mori-phone/app/music.tsx | 5235 |
| [outputs/mori-phone/app/page.tsx](outputs/mori-phone/app/page.tsx) | React 界面模块：page；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/page.tsx | 255 |
| [outputs/mori-phone/app/pet-3d.tsx](outputs/mori-phone/app/pet-3d.tsx) | 可见时才绘制的低负载 3D 宠物与减少动态效果的静态表情刷新；路径：outputs/mori-phone/app/pet-3d.tsx | 6200 |
| [outputs/mori-phone/app/pet.tsx](outputs/mori-phone/app/pet.tsx) | 桌宠互动、情绪与对话栏状态；路径：outputs/mori-phone/app/pet.tsx | 4746 |
| [outputs/mori-phone/app/phone.tsx](outputs/mori-phone/app/phone.tsx) | 设备提交、模型连接与聊天任务宿主，按UTF-8字节保护大型编辑草稿并拒绝超长输入；路径：outputs/mori-phone/app/phone.tsx | 29993 |
| [outputs/mori-phone/app/realtime-call.tsx](outputs/mori-phone/app/realtime-call.tsx) | React 界面模块：realtime-call；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/realtime-call.tsx | 6236 |
| [outputs/mori-phone/app/recording-preview.tsx](outputs/mori-phone/app/recording-preview.tsx) | 原录音试听与对象 URL 生命周期；路径：outputs/mori-phone/app/recording-preview.tsx | 350 |
| [outputs/mori-phone/app/refinement.css](outputs/mori-phone/app/refinement.css) | 精细界面间距、对比度与交互状态样式；路径：outputs/mori-phone/app/refinement.css | 31305 |
| [outputs/mori-phone/app/render-recovery.tsx](outputs/mori-phone/app/render-recovery.tsx) | 渲染异常恢复界面、当前内存记录备份入口与重新打开确认；路径：outputs/mori-phone/app/render-recovery.tsx | 716 |
| [outputs/mori-phone/app/roleplay-controls.tsx](outputs/mori-phone/app/roleplay-controls.tsx) | 酒馆风格角色扮演预设界面；路径：outputs/mori-phone/app/roleplay-controls.tsx | 1622 |
| [outputs/mori-phone/app/settings.tsx](outputs/mori-phone/app/settings.tsx) | 全局默认 AI 连接设置与明确的全局连接测试，不受角色专用模型覆盖；路径：outputs/mori-phone/app/settings.tsx | 16783 |
| [outputs/mori-phone/app/system-prompt-editor.tsx](outputs/mori-phone/app/system-prompt-editor.tsx) | 核心提示词编辑、明确保存、载入原始版本与撤销草稿的真实入口；路径：outputs/mori-phone/app/system-prompt-editor.tsx | 1846 |
| [outputs/mori-phone/app/ui.tsx](outputs/mori-phone/app/ui.tsx) | 共用界面、稳定的无障碍字段名称、媒体查看与角色卡AI分类请求上下文契约；路径：outputs/mori-phone/app/ui.tsx | 9490 |
| [outputs/mori-phone/app/use-editor-draft.ts](outputs/mori-phone/app/use-editor-draft.ts) | 按编辑器键切换持久草稿，拒绝前一编辑器迟到回调的Hook；路径：outputs/mori-phone/app/use-editor-draft.ts | 1352 |
| [outputs/mori-phone/app/use-recorder.ts](outputs/mori-phone/app/use-recorder.ts) | 真实麦克风、MediaRecorder、最长两分钟录音、试听文件与取消/后台释放；路径：outputs/mori-phone/app/use-recorder.ts | 3201 |
| [outputs/mori-phone/app/use-voice.ts](outputs/mori-phone/app/use-voice.ts) | 设备文字朗读与真实服务 TTS 的统一播放和取消所有权；路径：outputs/mori-phone/app/use-voice.ts | 2572 |
| [outputs/mori-phone/app/wallpaper-settings.tsx](outputs/mori-phone/app/wallpaper-settings.tsx) | 原图壁纸上传、显示方式、保存预览与恢复默认；路径：outputs/mori-phone/app/wallpaper-settings.tsx | 1664 |
| [outputs/mori-phone/build/connector-preview-plugin.mjs](outputs/mori-phone/build/connector-preview-plugin.mjs) | 工程支持文件：outputs/mori-phone/build/connector-preview-plugin.mjs | 7211 |
| [outputs/mori-phone/build/connector-preview-worker.mjs](outputs/mori-phone/build/connector-preview-worker.mjs) | 工程支持文件：outputs/mori-phone/build/connector-preview-worker.mjs | 594 |
| [outputs/mori-phone/build/sites-vite-plugin.LICENSE](outputs/mori-phone/build/sites-vite-plugin.LICENSE) | 第三方资源许可与归属声明：outputs/mori-phone/build/sites-vite-plugin.LICENSE | 1063 |
| [outputs/mori-phone/build/sites-vite-plugin.ts](outputs/mori-phone/build/sites-vite-plugin.ts) | TypeScript 业务或构建模块：sites-vite-plugin；位于 outputs/mori-phone/build；路径：outputs/mori-phone/build/sites-vite-plugin.ts | 7185 |
| [outputs/mori-phone/build/sites-worker.ts](outputs/mori-phone/build/sites-worker.ts) | TypeScript 业务或构建模块：sites-worker；位于 outputs/mori-phone/build；路径：outputs/mori-phone/build/sites-worker.ts | 1279 |
| [outputs/mori-phone/cloudflare-env.d.ts](outputs/mori-phone/cloudflare-env.d.ts) | TypeScript 业务或构建模块：cloudflare-env.d；位于 outputs/mori-phone；路径：outputs/mori-phone/cloudflare-env.d.ts | 99 |
| [outputs/mori-phone/components.json](outputs/mori-phone/components.json) | 配置或机器可读验证记录：outputs/mori-phone/components.json | 420 |
| [outputs/mori-phone/db/index.ts](outputs/mori-phone/db/index.ts) | TypeScript 业务或构建模块：index；位于 outputs/mori-phone/db；路径：outputs/mori-phone/db/index.ts | 423 |
| [outputs/mori-phone/db/schema.ts](outputs/mori-phone/db/schema.ts) | TypeScript 业务或构建模块：schema；位于 outputs/mori-phone/db；路径：outputs/mori-phone/db/schema.ts | 806 |
| [outputs/mori-phone/docs/ai-optimization-research.md](outputs/mori-phone/docs/ai-optimization-research.md) | 项目说明、调研或验证文档：ai-optimization-research.md；路径：outputs/mori-phone/docs/ai-optimization-research.md | 7688 |
| [outputs/mori-phone/docs/companion-validation.md](outputs/mori-phone/docs/companion-validation.md) | 项目说明、调研或验证文档：companion-validation.md；路径：outputs/mori-phone/docs/companion-validation.md | 3672 |
| [outputs/mori-phone/docs/local-api-validation.md](outputs/mori-phone/docs/local-api-validation.md) | 项目说明、调研或验证文档：local-api-validation.md；路径：outputs/mori-phone/docs/local-api-validation.md | 4772 |
| [outputs/mori-phone/docs/night-theme-validation.md](outputs/mori-phone/docs/night-theme-validation.md) | 项目说明、调研或验证文档：night-theme-validation.md；路径：outputs/mori-phone/docs/night-theme-validation.md | 1072 |
| [outputs/mori-phone/docs/optimization-validation.md](outputs/mori-phone/docs/optimization-validation.md) | 项目说明、调研或验证文档：optimization-validation.md；路径：outputs/mori-phone/docs/optimization-validation.md | 4295 |
| [outputs/mori-phone/docs/provider-presets-research.md](outputs/mori-phone/docs/provider-presets-research.md) | 项目说明、调研或验证文档：provider-presets-research.md；路径：outputs/mori-phone/docs/provider-presets-research.md | 11177 |
| [outputs/mori-phone/docs/tavern-roleplay-research.md](outputs/mori-phone/docs/tavern-roleplay-research.md) | 项目说明、调研或验证文档：tavern-roleplay-research.md；路径：outputs/mori-phone/docs/tavern-roleplay-research.md | 13520 |
| [outputs/mori-phone/drizzle.config.ts](outputs/mori-phone/drizzle.config.ts) | TypeScript 业务或构建模块：drizzle.config；位于 outputs/mori-phone；路径：outputs/mori-phone/drizzle.config.ts | 148 |
| [outputs/mori-phone/drizzle/0000_colorful_lady_ursula.sql](outputs/mori-phone/drizzle/0000_colorful_lady_ursula.sql) | 网页服务数据库迁移或快照：0000_colorful_lady_ursula.sql；路径：outputs/mori-phone/drizzle/0000_colorful_lady_ursula.sql | 497 |
| [outputs/mori-phone/drizzle/0001_flashy_natasha_romanoff.sql](outputs/mori-phone/drizzle/0001_flashy_natasha_romanoff.sql) | 网页服务数据库迁移或快照：0001_flashy_natasha_romanoff.sql；路径：outputs/mori-phone/drizzle/0001_flashy_natasha_romanoff.sql | 55 |
| [outputs/mori-phone/drizzle/0002_friendly_mysterio.sql](outputs/mori-phone/drizzle/0002_friendly_mysterio.sql) | 网页服务数据库迁移或快照：0002_friendly_mysterio.sql；路径：outputs/mori-phone/drizzle/0002_friendly_mysterio.sql | 94 |
| [outputs/mori-phone/drizzle/meta/0000_snapshot.json](outputs/mori-phone/drizzle/meta/0000_snapshot.json) | 网页服务数据库迁移或快照：0000_snapshot.json；路径：outputs/mori-phone/drizzle/meta/0000_snapshot.json | 3109 |
| [outputs/mori-phone/drizzle/meta/0001_snapshot.json](outputs/mori-phone/drizzle/meta/0001_snapshot.json) | 网页服务数据库迁移或快照：0001_snapshot.json；路径：outputs/mori-phone/drizzle/meta/0001_snapshot.json | 3278 |
| [outputs/mori-phone/drizzle/meta/0002_snapshot.json](outputs/mori-phone/drizzle/meta/0002_snapshot.json) | 网页服务数据库迁移或快照：0002_snapshot.json；路径：outputs/mori-phone/drizzle/meta/0002_snapshot.json | 3855 |
| [outputs/mori-phone/drizzle/meta/_journal.json](outputs/mori-phone/drizzle/meta/_journal.json) | 网页服务数据库迁移或快照：_journal.json；路径：outputs/mori-phone/drizzle/meta/_journal.json | 506 |
| [outputs/mori-phone/eslint.config.mjs](outputs/mori-phone/eslint.config.mjs) | 工程支持文件：outputs/mori-phone/eslint.config.mjs | 846 |
| [outputs/mori-phone/examples/d1/app/api/notes/route.ts](outputs/mori-phone/examples/d1/app/api/notes/route.ts) | 可选网页服务 API 路由：notes/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/examples/d1/app/api/notes/route.ts | 1700 |
| [outputs/mori-phone/examples/d1/db/schema.ts](outputs/mori-phone/examples/d1/db/schema.ts) | TypeScript 业务或构建模块：schema；位于 outputs/mori-phone/examples/d1/db；路径：outputs/mori-phone/examples/d1/db/schema.ts | 370 |
| [outputs/mori-phone/lib/asset-transport.ts](outputs/mori-phone/lib/asset-transport.ts) | TypeScript 业务或构建模块：asset-transport；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/asset-transport.ts | 1081 |
| [outputs/mori-phone/lib/attachment-text.ts](outputs/mori-phone/lib/attachment-text.ts) | 文本编码、Office共享字符串、ZIP限额、未知格式与读取状态；路径：outputs/mori-phone/lib/attachment-text.ts | 5746 |
| [outputs/mori-phone/lib/bounded-zip.ts](outputs/mori-phone/lib/bounded-zip.ts) | 限制每次压缩输入的共用解码器和ZIP文件头/尾目录完整性校验；路径：outputs/mori-phone/lib/bounded-zip.ts | 1456 |
| [outputs/mori-phone/lib/card-analysis.ts](outputs/mori-phone/lib/card-analysis.ts) | 原文单元编号、AI连续分类契约、全覆盖校验和不改写的本地重组；路径：outputs/mori-phone/lib/card-analysis.ts | 3529 |
| [outputs/mori-phone/lib/character-ai.ts](outputs/mori-phone/lib/character-ai.ts) | 角色 AI 覆盖规则、全局默认继承与同服务商独立密钥槽位选择；路径：outputs/mori-phone/lib/character-ai.ts | 1327 |
| [outputs/mori-phone/lib/character-import.ts](outputs/mori-phone/lib/character-import.ts) | TXT/JSON/PNG角色卡与独立世界书解析、兼容告知、原字段保留和导出；路径：outputs/mori-phone/lib/character-import.ts | 16473 |
| [outputs/mori-phone/lib/character-library.ts](outputs/mori-phone/lib/character-library.ts) | 独立卡片捕获与复用、原卡规范化去重、复制后缀与修订校验和保留聊天状态的应用逻辑；路径：outputs/mori-phone/lib/character-library.ts | 5988 |
| [outputs/mori-phone/lib/character-memory.ts](outputs/mori-phone/lib/character-memory.ts) | 原话证据、任务基线、时间检查点和满库整批原子的独立角色记忆更新；路径：outputs/mori-phone/lib/character-memory.ts | 5413 |
| [outputs/mori-phone/lib/chat-maintenance.ts](outputs/mori-phone/lib/chat-maintenance.ts) | 验证每条摘要原消息并拒绝过期、失败或空白结果的后台维护；路径：outputs/mori-phone/lib/chat-maintenance.ts | 1854 |
| [outputs/mori-phone/lib/chat-prompt.ts](outputs/mori-phone/lib/chat-prompt.ts) | 分类任务隔离及按世界书引擎组装角色前后背景和历史预算；路径：outputs/mori-phone/lib/chat-prompt.ts | 8987 |
| [outputs/mori-phone/lib/companion-capabilities.ts](outputs/mori-phone/lib/companion-capabilities.ts) | 中文与语言切换、角色偏好和编程数学美术教学的质量预设；路径：outputs/mori-phone/lib/companion-capabilities.ts | 2729 |
| [outputs/mori-phone/lib/connector-context.ts](outputs/mori-phone/lib/connector-context.ts) | TypeScript 业务或构建模块：connector-context；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-context.ts | 612 |
| [outputs/mori-phone/lib/connector-contract.mts](outputs/mori-phone/lib/connector-contract.mts) | TypeScript 业务或构建模块：connector-contract；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-contract.mts | 5362 |
| [outputs/mori-phone/lib/connector-errors.mts](outputs/mori-phone/lib/connector-errors.mts) | TypeScript 业务或构建模块：connector-errors；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-errors.mts | 2717 |
| [outputs/mori-phone/lib/connector-preview.d.ts](outputs/mori-phone/lib/connector-preview.d.ts) | TypeScript 业务或构建模块：connector-preview.d；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-preview.d.ts | 433 |
| [outputs/mori-phone/lib/connectors.ts](outputs/mori-phone/lib/connectors.ts) | TypeScript 业务或构建模块：connectors；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connectors.ts | 416 |
| [outputs/mori-phone/lib/context-window.ts](outputs/mori-phone/lib/context-window.ts) | 服务商模型上限字段解析、按地址隔离元数据、官方回退及输入预算；路径：outputs/mori-phone/lib/context-window.ts | 4009 |
| [outputs/mori-phone/lib/continuity.ts](outputs/mori-phone/lib/continuity.ts) | 长期记忆与旧对话检索、重复识别和可验证原消息的阶段摘要任务；路径：outputs/mori-phone/lib/continuity.ts | 3324 |
| [outputs/mori-phone/lib/conversation-reply.ts](outputs/mori-phone/lib/conversation-reply.ts) | 统一解析自然短消息、接话选项及真实媒体命令；路径：outputs/mori-phone/lib/conversation-reply.ts | 767 |
| [outputs/mori-phone/lib/file-export.ts](outputs/mori-phone/lib/file-export.ts) | 48KiB原生下载块与取消清理，以及网页版OPFS导出，不聚合完整备份；路径：outputs/mori-phone/lib/file-export.ts | 1411 |
| [outputs/mori-phone/lib/group-cadence.ts](outputs/mori-phone/lib/group-cadence.ts) | 自然打字与分泡的等待范围、快速模式和 AbortSignal 清理；路径：outputs/mori-phone/lib/group-cadence.ts | 852 |
| [outputs/mori-phone/lib/group-chat.ts](outputs/mori-phone/lib/group-chat.ts) | 群成员轮换、@指定、角色身份和短消息格式校验；路径：outputs/mori-phone/lib/group-chat.ts | 4523 |
| [outputs/mori-phone/lib/local-backup.ts](outputs/mori-phone/lib/local-backup.ts) | 流式完整ZIP备份与恢复校验，覆盖角色卡仓库及草稿的头像原文件和共享引用重映射；路径：outputs/mori-phone/lib/local-backup.ts | 8571 |
| [outputs/mori-phone/lib/local-phone.ts](outputs/mori-phone/lib/local-phone.ts) | 本机状态与会话事务、附件去重清理、库卡及草稿头像引用、旧资源迁移和加密密钥；路径：outputs/mori-phone/lib/local-phone.ts | 15312 |
| [outputs/mori-phone/lib/lyrics.ts](outputs/mori-phone/lib/lyrics.ts) | LRC 歌词解析和播放时间定位；路径：outputs/mori-phone/lib/lyrics.ts | 1165 |
| [outputs/mori-phone/lib/media-adapter.ts](outputs/mori-phone/lib/media-adapter.ts) | Web/Android 共用的 OpenAI 生图/转写与 Gemini Interactions 图像/语音协议；路径：outputs/mori-phone/lib/media-adapter.ts | 4047 |
| [outputs/mori-phone/lib/media-client.ts](outputs/mori-phone/lib/media-client.ts) | 真实生成文件和转写客户端，独立服务 Key 与官方地址复用规则；路径：outputs/mori-phone/lib/media-client.ts | 3479 |
| [outputs/mori-phone/lib/media-contract.ts](outputs/mori-phone/lib/media-contract.ts) | 媒体设置与有界工具命令，只有实际启用能力和授权表情进入提示词；路径：outputs/mori-phone/lib/media-contract.ts | 2536 |
| [outputs/mori-phone/lib/media-validation.ts](outputs/mori-phone/lib/media-validation.ts) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：outputs/mori-phone/lib/media-validation.ts | 1555 |
| [outputs/mori-phone/lib/native-media.ts](outputs/mori-phone/lib/native-media.ts) | 有界原生图片/音频文件解码与 Gemini 24 kHz PCM 的 WAV 包装；路径：outputs/mori-phone/lib/native-media.ts | 2245 |
| [outputs/mori-phone/lib/pdf-reading.ts](outputs/mori-phone/lib/pdf-reading.ts) | 随包 PDF.js worker 读取 PDF 文字，提示页数、截断、扫描件及加密失败；路径：outputs/mori-phone/lib/pdf-reading.ts | 1178 |
| [outputs/mori-phone/lib/phone-model.ts](outputs/mori-phone/lib/phone-model.ts) | 聊天、卡片与世界书严格契约，200张及12MB仓库预算、源卡修订和旧状态默认值；路径：outputs/mori-phone/lib/phone-model.ts | 15609 |
| [outputs/mori-phone/lib/provider-adapter.ts](outputs/mori-phone/lib/provider-adapter.ts) | 服务商请求与响应协议适配；路径：outputs/mori-phone/lib/provider-adapter.ts | 10661 |
| [outputs/mori-phone/lib/providers.ts](outputs/mori-phone/lib/providers.ts) | 服务商端点和能力预设；路径：outputs/mori-phone/lib/providers.ts | 6837 |
| [outputs/mori-phone/lib/reasoning.ts](outputs/mori-phone/lib/reasoning.ts) | 思考强度与模型能力转换；路径：outputs/mori-phone/lib/reasoning.ts | 5898 |
| [outputs/mori-phone/lib/roleplay.ts](outputs/mori-phone/lib/roleplay.ts) | 保持人物价值观和示例边界、为技术任务保留完整回答的节奏预设；路径：outputs/mori-phone/lib/roleplay.ts | 3748 |
| [outputs/mori-phone/lib/server-phone.ts](outputs/mori-phone/lib/server-phone.ts) | TypeScript 业务或构建模块：server-phone；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/server-phone.ts | 2736 |
| [outputs/mori-phone/lib/system-prompt.ts](outputs/mori-phone/lib/system-prompt.ts) | 用户聊天核心与后台事实整理器的隔离指令；记忆任务按JSON契约输出，摘要按普通条目输出；路径：outputs/mori-phone/lib/system-prompt.ts | 3315 |
| [outputs/mori-phone/lib/world-info.ts](outputs/mori-phone/lib/world-info.ts) | 作用域、四类关键词逻辑、完整条目预算、模板和有界递归的世界书引擎；路径：outputs/mori-phone/lib/world-info.ts | 3333 |
| [outputs/mori-phone/next.config.ts](outputs/mori-phone/next.config.ts) | TypeScript 业务或构建模块：next.config；位于 outputs/mori-phone；路径：outputs/mori-phone/next.config.ts | 133 |
| [outputs/mori-phone/package-lock.json](outputs/mori-phone/package-lock.json) | 可重复安装依赖的版本锁定清单：outputs/mori-phone；路径：outputs/mori-phone/package-lock.json | 397678 |
| [outputs/mori-phone/package.json](outputs/mori-phone/package.json) | 依赖与运行命令配置：outputs/mori-phone；路径：outputs/mori-phone/package.json | 1726 |
| [outputs/mori-phone/postcss.config.mjs](outputs/mori-phone/postcss.config.mjs) | 工程支持文件：outputs/mori-phone/postcss.config.mjs | 94 |
| [outputs/mori-phone/public/button-sprite.webp](outputs/mori-phone/public/button-sprite.webp) | 保持原分辨率与原完整 RGBA 的无损 UI 插画：button-sprite；路径：outputs/mori-phone/public/button-sprite.webp | 920416 |
| [outputs/mori-phone/public/cloud-pet.webp](outputs/mori-phone/public/cloud-pet.webp) | 保持原分辨率与原完整 RGBA 的无损 UI 插画：cloud-pet；路径：outputs/mori-phone/public/cloud-pet.webp | 846276 |
| [outputs/mori-phone/public/dock-sprite.webp](outputs/mori-phone/public/dock-sprite.webp) | 保持原分辨率与原完整 RGBA 的无损 UI 插画：dock-sprite；路径：outputs/mori-phone/public/dock-sprite.webp | 1064052 |
| [outputs/mori-phone/public/favicon.svg](outputs/mori-phone/public/favicon.svg) | 工程支持文件：outputs/mori-phone/public/favicon.svg | 302 |
| [outputs/mori-phone/public/fonts/source-serif-4-latin-400.woff2](outputs/mori-phone/public/fonts/source-serif-4-latin-400.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-400.woff2；路径：outputs/mori-phone/public/fonts/source-serif-4-latin-400.woff2 | 20088 |
| [outputs/mori-phone/public/fonts/source-serif-4-latin-600.woff2](outputs/mori-phone/public/fonts/source-serif-4-latin-600.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-600.woff2；路径：outputs/mori-phone/public/fonts/source-serif-4-latin-600.woff2 | 21532 |
| [outputs/mori-phone/public/fonts/source-serif-4-latin-700.woff2](outputs/mori-phone/public/fonts/source-serif-4-latin-700.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-700.woff2；路径：outputs/mori-phone/public/fonts/source-serif-4-latin-700.woff2 | 21716 |
| [outputs/mori-phone/public/icon-192.png](outputs/mori-phone/public/icon-192.png) | 界面预览或绘图资源：icon-192.png；目录 outputs/mori-phone/public；路径：outputs/mori-phone/public/icon-192.png | 5393 |
| [outputs/mori-phone/public/icon-512.png](outputs/mori-phone/public/icon-512.png) | 界面预览或绘图资源：icon-512.png；目录 outputs/mori-phone/public；路径：outputs/mori-phone/public/icon-512.png | 18315 |
| [outputs/mori-phone/public/licenses/PDFjs-LICENSE.txt](outputs/mori-phone/public/licenses/PDFjs-LICENSE.txt) | 随包 PDF.js 的 Apache 2.0 许可证；路径：outputs/mori-phone/public/licenses/PDFjs-LICENSE.txt | 10174 |
| [outputs/mori-phone/public/licenses/immer-LICENSE.txt](outputs/mori-phone/public/licenses/immer-LICENSE.txt) | 新增 Immer 状态依赖的 MIT 分发许可；路径：outputs/mori-phone/public/licenses/immer-LICENSE.txt | 1074 |
| [outputs/mori-phone/public/licenses/noble-hashes-LICENSE.txt](outputs/mori-phone/public/licenses/noble-hashes-LICENSE.txt) | 增量哈希库@noble/hashes的MIT许可证，随前端源码保留；路径：outputs/mori-phone/public/licenses/noble-hashes-LICENSE.txt | 1109 |
| [outputs/mori-phone/public/manifest.webmanifest](outputs/mori-phone/public/manifest.webmanifest) | 工程支持文件：outputs/mori-phone/public/manifest.webmanifest | 359 |
| [outputs/mori-phone/public/music-listen.webp](outputs/mori-phone/public/music-listen.webp) | 保持原分辨率与原完整 RGBA 的无损 UI 插画：music-listen；路径：outputs/mori-phone/public/music-listen.webp | 706036 |
| [outputs/mori-phone/public/via-browser.webp](outputs/mori-phone/public/via-browser.webp) | 保持原分辨率与原完整 RGBA 的无损 UI 插画：via-browser；路径：outputs/mori-phone/public/via-browser.webp | 706622 |
| [outputs/mori-phone/public/wallpaper.webp](outputs/mori-phone/public/wallpaper.webp) | 保持原分辨率与原完整 RGBA 的无损 UI 插画：wallpaper；路径：outputs/mori-phone/public/wallpaper.webp | 1396454 |
| [outputs/mori-phone/scripts/build-verified.sh](outputs/mori-phone/scripts/build-verified.sh) | 工程支持文件：outputs/mori-phone/scripts/build-verified.sh | 661 |
| [outputs/mori-phone/scripts/connector-preview/connector-preview-session.mjs](outputs/mori-phone/scripts/connector-preview/connector-preview-session.mjs) | 工程支持文件：outputs/mori-phone/scripts/connector-preview/connector-preview-session.mjs | 6842 |
| [outputs/mori-phone/scripts/connector-preview/host-binding.mjs](outputs/mori-phone/scripts/connector-preview/host-binding.mjs) | 工程支持文件：outputs/mori-phone/scripts/connector-preview/host-binding.mjs | 7793 |
| [outputs/mori-phone/scripts/connector-preview/protocol.mjs](outputs/mori-phone/scripts/connector-preview/protocol.mjs) | 工程支持文件：outputs/mori-phone/scripts/connector-preview/protocol.mjs | 1781 |
| [outputs/mori-phone/scripts/execution-profile.mjs](outputs/mori-phone/scripts/execution-profile.mjs) | 工程支持文件：outputs/mori-phone/scripts/execution-profile.mjs | 624 |
| [outputs/mori-phone/scripts/install-ci.mjs](outputs/mori-phone/scripts/install-ci.mjs) | 工程支持文件：outputs/mori-phone/scripts/install-ci.mjs | 1685 |
| [outputs/mori-phone/scripts/install-ci.sh](outputs/mori-phone/scripts/install-ci.sh) | 工程支持文件：outputs/mori-phone/scripts/install-ci.sh | 6783 |
| [outputs/mori-phone/scripts/install-pnpm.sh](outputs/mori-phone/scripts/install-pnpm.sh) | 工程支持文件：outputs/mori-phone/scripts/install-pnpm.sh | 9015 |
| [outputs/mori-phone/scripts/live-p0.mjs](outputs/mori-phone/scripts/live-p0.mjs) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：outputs/mori-phone/scripts/live-p0.mjs | 8110 |
| [outputs/mori-phone/scripts/npm-install.mjs](outputs/mori-phone/scripts/npm-install.mjs) | 工程支持文件：outputs/mori-phone/scripts/npm-install.mjs | 7025 |
| [outputs/mori-phone/scripts/pnpm-install.mjs](outputs/mori-phone/scripts/pnpm-install.mjs) | 工程支持文件：outputs/mori-phone/scripts/pnpm-install.mjs | 10633 |
| [outputs/mori-phone/scripts/run-framework.mjs](outputs/mori-phone/scripts/run-framework.mjs) | 工程支持文件：outputs/mori-phone/scripts/run-framework.mjs | 993 |
| [outputs/mori-phone/scripts/sites-env.mjs](outputs/mori-phone/scripts/sites-env.mjs) | 工程支持文件：outputs/mori-phone/scripts/sites-env.mjs | 906 |
| [outputs/mori-phone/scripts/sites-env.sh](outputs/mori-phone/scripts/sites-env.sh) | 工程支持文件：outputs/mori-phone/scripts/sites-env.sh | 1530 |
| [outputs/mori-phone/scripts/verify-card-library.mjs](outputs/mori-phone/scripts/verify-card-library.mjs) | 19项独立角色卡核心验收，包含语义去重、反复复用、关系隔离、满库与过期任务拒绝；路径：outputs/mori-phone/scripts/verify-card-library.mjs | 10566 |
| [outputs/mori-phone/scripts/verify-companion.mjs](outputs/mori-phone/scripts/verify-companion.mjs) | 21项独立角色连接、锁定记忆、原文更正、群聊节奏及权限回归；路径：outputs/mori-phone/scripts/verify-companion.mjs | 11645 |
| [outputs/mori-phone/scripts/verify-context.mjs](outputs/mori-phone/scripts/verify-context.mjs) | 11 项最大上下文和系统编辑回归，含600条大请求与旧备份迁移；路径：outputs/mori-phone/scripts/verify-context.mjs | 6151 |
| [outputs/mori-phone/scripts/verify-core.mjs](outputs/mori-phone/scripts/verify-core.mjs) | 26 项模型状态、角色导入和提示词核心检查；路径：outputs/mori-phone/scripts/verify-core.mjs | 12865 |
| [outputs/mori-phone/scripts/verify-group.mjs](outputs/mori-phone/scripts/verify-group.mjs) | 20 项群聊回归，包含稳定缓存前缀、作用域与摘要发言者；路径：outputs/mori-phone/scripts/verify-group.mjs | 9866 |
| [outputs/mori-phone/scripts/verify-media.mjs](outputs/mori-phone/scripts/verify-media.mjs) | 11 项媒体协议、能力提示、原生媒体与后台摘要并发检查；路径：outputs/mori-phone/scripts/verify-media.mjs | 8678 |
| [outputs/mori-phone/scripts/verify-p0.mjs](outputs/mori-phone/scripts/verify-p0.mjs) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：outputs/mori-phone/scripts/verify-p0.mjs | 4956 |
| [outputs/mori-phone/scripts/verify-providers.mjs](outputs/mori-phone/scripts/verify-providers.mjs) | 17 项服务商参数及协议检查；路径：outputs/mori-phone/scripts/verify-providers.mjs | 10337 |
| [outputs/mori-phone/scripts/verify-review.mjs](outputs/mori-phone/scripts/verify-review.mjs) | 7 项审查缺陷修复回归检查；路径：outputs/mori-phone/scripts/verify-review.mjs | 4486 |
| [outputs/mori-phone/scripts/verify-roleplay.mjs](outputs/mori-phone/scripts/verify-roleplay.mjs) | 27项AI片段覆盖、世界书往返、递归、记忆并发与摘要过期回归；路径：outputs/mori-phone/scripts/verify-roleplay.mjs | 13693 |
| [outputs/mori-phone/scripts/verify-voice.mjs](outputs/mori-phone/scripts/verify-voice.mjs) | 6 项语音与原生桥接检查；路径：outputs/mori-phone/scripts/verify-voice.mjs | 4501 |
| [outputs/mori-phone/tsconfig.json](outputs/mori-phone/tsconfig.json) | 配置或机器可读验证记录：outputs/mori-phone/tsconfig.json | 800 |
| [outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.LICENSE.md](outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.LICENSE.md) | 第三方资源许可与归属声明：outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.LICENSE.md | 1063 |
| [outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.css](outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.css) | 工程支持文件：outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.css | 16041 |
| [outputs/mori-phone/vite-assets.d.ts](outputs/mori-phone/vite-assets.d.ts) | PDF worker URL 资源的严格 TypeScript 声明；路径：outputs/mori-phone/vite-assets.d.ts | 62 |
| [outputs/mori-phone/vite.config.ts](outputs/mori-phone/vite.config.ts) | TypeScript 业务或构建模块：vite.config；位于 outputs/mori-phone；路径：outputs/mori-phone/vite.config.ts | 3115 |
| [outputs/一起听预览.png](outputs/一起听预览.png) | 界面预览或绘图资源：一起听预览.png；目录 outputs；路径：outputs/一起听预览.png | 113740 |
| [outputs/云朵小手机.apk](outputs/云朵小手机.apk) | 历史版本安装包，保留交付记录：云朵小手机.apk；路径：outputs/云朵小手机.apk | 9357498 |
| [outputs/云朵小手机.apk.idsig](outputs/云朵小手机.apk.idsig) | APK 的附属增量签名文件：云朵小手机.apk.idsig；路径：outputs/云朵小手机.apk.idsig | 79859 |
| [outputs/云朵小手机源码.zip](outputs/云朵小手机源码.zip) | 源码归档：云朵小手机源码.zip；可直接下载解压，当前推荐带 0.0.1 的归档；路径：outputs/云朵小手机源码.zip | 7568148 |
| [outputs/云笺听雨-0.0.1-系统隔离版.apk](outputs/云笺听雨-0.0.1-系统隔离版.apk) | 当前同签名独立APK，修复恢复与ZIP读取和原生边界，0.0.1 / versionCode 7；路径：outputs/云笺听雨-0.0.1-系统隔离版.apk | 13307276 |
| [outputs/云笺听雨-0.0.1-系统隔离版.apk.idsig](outputs/云笺听雨-0.0.1-系统隔离版.apk.idsig) | 当前系统隔离 APK 的增量安装签名元数据，普通安装无需使用；路径：outputs/云笺听雨-0.0.1-系统隔离版.apk.idsig | 112627 |
| [outputs/云笺听雨-0.0.1-系统隔离版.apk.sha256](outputs/云笺听雨-0.0.1-系统隔离版.apk.sha256) | 当前系统隔离签名 APK 的 SHA-256 校验摘要；路径：outputs/云笺听雨-0.0.1-系统隔离版.apk.sha256 | 106 |
| [outputs/云笺听雨-0.0.1-群聊优化.apk](outputs/云笺听雨-0.0.1-群聊优化.apk) | 上一版群聊优化交付；当时可覆盖安装的独立签名 APK，0.0.1 / versionCode 4；路径：outputs/云笺听雨-0.0.1-群聊优化.apk | 9353204 |
| [outputs/云笺听雨-0.0.1-群聊优化.apk.idsig](outputs/云笺听雨-0.0.1-群聊优化.apk.idsig) | 上一版群聊优化交付；构建工具生成的增量安装签名元数据，普通安装只需 APK；路径：outputs/云笺听雨-0.0.1-群聊优化.apk.idsig | 79859 |
| [outputs/云笺听雨-0.0.1-群聊优化.apk.sha256](outputs/云笺听雨-0.0.1-群聊优化.apk.sha256) | 上一版群聊优化交付；当时签名 APK 的完整 SHA-256 摘要；路径：outputs/云笺听雨-0.0.1-群聊优化.apk.sha256 | 103 |
| [outputs/云笺听雨-0.0.1.apk](outputs/云笺听雨-0.0.1.apk) | 当前 0.0.1 正式安装包：云笺听雨-0.0.1.apk；路径：outputs/云笺听雨-0.0.1.apk | 9345012 |
| [outputs/云笺听雨-0.0.1.apk.idsig](outputs/云笺听雨-0.0.1.apk.idsig) | APK 的附属增量签名文件：云笺听雨-0.0.1.apk.idsig；路径：outputs/云笺听雨-0.0.1.apk.idsig | 79859 |
| [outputs/云笺听雨-0.0.1.apk.sha256](outputs/云笺听雨-0.0.1.apk.sha256) | 安装包 SHA-256 校验值：云笺听雨-0.0.1.apk.sha256；路径：outputs/云笺听雨-0.0.1.apk.sha256 | 90 |
| [outputs/云笺听雨.apk](outputs/云笺听雨.apk) | 历史版本安装包，保留交付记录：云笺听雨.apk；路径：outputs/云笺听雨.apk | 9357498 |
| [outputs/云笺听雨.apk.idsig](outputs/云笺听雨.apk.idsig) | APK 的附属增量签名文件：云笺听雨.apk.idsig；路径：outputs/云笺听雨.apk.idsig | 79859 |
| [outputs/云笺听雨0.0.1Android源码.zip](outputs/云笺听雨0.0.1Android源码.zip) | 源码归档：云笺听雨0.0.1Android源码.zip；可直接下载解压，当前推荐带 0.0.1 的归档；路径：outputs/云笺听雨0.0.1Android源码.zip | 9288672 |
| [outputs/云笺听雨0.0.1修复与验证报告.md](outputs/云笺听雨0.0.1修复与验证报告.md) | 项目说明、调研或验证文档：云笺听雨0.0.1修复与验证报告.md；路径：outputs/云笺听雨0.0.1修复与验证报告.md | 5156 |
| [outputs/云笺听雨0.0.1修复计划.md](outputs/云笺听雨0.0.1修复计划.md) | 项目说明、调研或验证文档：云笺听雨0.0.1修复计划.md；路径：outputs/云笺听雨0.0.1修复计划.md | 1176 |
| [outputs/云笺听雨0.0.1浏览器回归.json](outputs/云笺听雨0.0.1浏览器回归.json) | 配置或机器可读验证记录：outputs/云笺听雨0.0.1浏览器回归.json | 3772 |
| [outputs/云笺听雨0.0.1源码.zip](outputs/云笺听雨0.0.1源码.zip) | 源码归档：云笺听雨0.0.1源码.zip；可直接下载解压，当前推荐带 0.0.1 的归档；路径：outputs/云笺听雨0.0.1源码.zip | 7484074 |
| [outputs/云笺听雨0.0.1签名与完整性报告.md](outputs/云笺听雨0.0.1签名与完整性报告.md) | 项目说明、调研或验证文档：云笺听雨0.0.1签名与完整性报告.md；路径：outputs/云笺听雨0.0.1签名与完整性报告.md | 1204 |
| [outputs/云笺听雨0.0.1系统隔离版Android源码.zip](outputs/云笺听雨0.0.1系统隔离版Android源码.zip) | 当前完整原生源码与随包资产，含明确来源和外部跳转策略，内部版本7；路径：outputs/云笺听雨0.0.1系统隔离版Android源码.zip | 12915200 |
| [outputs/云笺听雨0.0.1系统隔离版源码.zip](outputs/云笺听雨0.0.1系统隔离版源码.zip) | 当前完整前端源码归档，包含核心编辑、模型预算及所有核心测试；路径：outputs/云笺听雨0.0.1系统隔离版源码.zip | 8512235 |
| [outputs/云笺听雨0.0.1群聊优化Android源码.zip](outputs/云笺听雨0.0.1群聊优化Android源码.zip) | 上一版群聊优化交付；当时原生壳、清单、系统桥接、构建脚本与全部随包资源归档；路径：outputs/云笺听雨0.0.1群聊优化Android源码.zip | 9293534 |
| [outputs/云笺听雨0.0.1群聊优化源码.zip](outputs/云笺听雨0.0.1群聊优化源码.zip) | 上一版群聊优化交付；当时完整前端源码归档，含群聊、样式、角色卡、API 和核心测试；路径：outputs/云笺听雨0.0.1群聊优化源码.zip | 7491780 |
| [outputs/云笺听雨0.0.1自动检查.json](outputs/云笺听雨0.0.1自动检查.json) | 配置或机器可读验证记录：outputs/云笺听雨0.0.1自动检查.json | 4432 |
| [outputs/云笺听雨0.0.1资源校验清单.json](outputs/云笺听雨0.0.1资源校验清单.json) | 配置或机器可读验证记录：outputs/云笺听雨0.0.1资源校验清单.json | 4601 |
| [outputs/云笺听雨Android内置Via验证.json](outputs/云笺听雨Android内置Via验证.json) | 本轮APK实际Android15/WebView124与旧内核模拟器通过结果；路径：outputs/云笺听雨Android内置Via验证.json | 42612 |
| [outputs/云笺听雨UI群聊浏览器回归.json](outputs/云笺听雨UI群聊浏览器回归.json) | 上一版群聊优化交付；五组浏览器回归结果，包含新增 21 类界面流程；路径：outputs/云笺听雨UI群聊浏览器回归.json | 5272 |
| [outputs/云笺听雨UI群聊签名与完整性报告.md](outputs/云笺听雨UI群聊签名与完整性报告.md) | 上一版群聊优化交付；该轮 APK 签名、完整性与资源核对结论及设备验证边界；路径：outputs/云笺听雨UI群聊签名与完整性报告.md | 1270 |
| [outputs/云笺听雨UI群聊自动检查.json](outputs/云笺听雨UI群聊自动检查.json) | 上一版群聊优化交付；72 项核心、类型与空白检查的该轮结构化结果；路径：outputs/云笺听雨UI群聊自动检查.json | 5549 |
| [outputs/云笺听雨UI群聊资源校验清单.json](outputs/云笺听雨UI群聊资源校验清单.json) | 上一版群聊优化交付；versionCode 4 的 APK、签名证书和 24 个资源大小/摘要；路径：outputs/云笺听雨UI群聊资源校验清单.json | 4601 |
| [outputs/云笺听雨原生安全验证-修复前.json](outputs/云笺听雨原生安全验证-修复前.json) | 先前版本实际原生地址/来源判断结果，仅方法级断言，不冒充真实越权；路径：outputs/云笺听雨原生安全验证-修复前.json | 4901 |
| [outputs/云笺听雨原生安全验证-修复后.json](outputs/云笺听雨原生安全验证-修复后.json) | 内部版本7的原生边界通过记录，保留正常公开地址、音乐协议与网页来源；路径：outputs/云笺听雨原生安全验证-修复后.json | 5517 |
| [outputs/云笺听雨原生导出队列验证.json](outputs/云笺听雨原生导出队列验证.json) | 实际产品APK的三文件保存、队列日志恢复、字节一致性及DNS/TLS分类验收记录；路径：outputs/云笺听雨原生导出队列验证.json | 4237 |
| [outputs/云笺听雨安全回归-修复前.json](outputs/云笺听雨安全回归-修复前.json) | 停止红队前的三个失败及两个原有边界通过证据，全部使用虚拟Key和地址；路径：outputs/云笺听雨安全回归-修复前.json | 2155 |
| [outputs/云笺听雨安全回归-修复后.json](outputs/云笺听雨安全回归-修复后.json) | 六组当前备份/ZIP功能边界通过记录，区分源辅助库与编译资源摘要；路径：outputs/云笺听雨安全回归-修复后.json | 2409 |
| [outputs/云笺听雨审计优化回归.json](outputs/云笺听雨审计优化回归.json) | 七组本轮审计浏览器回归结果及50MiB真实数据往返、块大小与编译资源证据；路径：outputs/云笺听雨审计优化回归.json | 1447 |
| [outputs/云笺听雨构建签名门禁验证.json](outputs/云笺听雨构建签名门禁验证.json) | 两组真实签名预检失败场景的结果与临时密钥清理证据；路径：outputs/云笺听雨构建签名门禁验证.json | 270 |
| [outputs/云笺听雨深度代码审查.md](outputs/云笺听雨深度代码审查.md) | 项目说明、调研或验证文档：云笺听雨深度代码审查.md；路径：outputs/云笺听雨深度代码审查.md | 13094 |
| [outputs/云笺听雨签名与完整性报告.md](outputs/云笺听雨签名与完整性报告.md) | 项目说明、调研或验证文档：云笺听雨签名与完整性报告.md；路径：outputs/云笺听雨签名与完整性报告.md | 1199 |
| [outputs/云笺听雨系统隔离浏览器回归.json](outputs/云笺听雨系统隔离浏览器回归.json) | 八套当前APK编译资源回归，包含本轮时间、退出码与资源SHA256；路径：outputs/云笺听雨系统隔离浏览器回归.json | 14766 |
| [outputs/云笺听雨系统隔离签名与完整性报告.md](outputs/云笺听雨系统隔离签名与完整性报告.md) | 内部版本7签名、逐项资源及功能检查结果与未覆盖范围；路径：outputs/云笺听雨系统隔离签名与完整性报告.md | 1386 |
| [outputs/云笺听雨系统隔离自动检查.json](outputs/云笺听雨系统隔离自动检查.json) | 151项核心功能及严格TypeScript、空白检查的全量执行记录，覆盖独立卡库和记忆；路径：outputs/云笺听雨系统隔离自动检查.json | 11578 |
| [outputs/云笺听雨系统隔离资源校验清单.json](outputs/云笺听雨系统隔离资源校验清单.json) | 内部版本7安装包与376个资源及原签名证书的一致性记录；路径：outputs/云笺听雨系统隔离资源校验清单.json | 63362 |
| [outputs/云笺听雨资源校验清单.json](outputs/云笺听雨资源校验清单.json) | 配置或机器可读验证记录：outputs/云笺听雨资源校验清单.json | 5080 |
| [outputs/优化计划与验收.md](outputs/优化计划与验收.md) | 项目说明、调研或验证文档：优化计划与验收.md；路径：outputs/优化计划与验收.md | 1949 |
| [outputs/使用说明.md](outputs/使用说明.md) | 项目说明、调研或验证文档：使用说明.md；路径：outputs/使用说明.md | 11096 |
| [outputs/夜间界面预览.png](outputs/夜间界面预览.png) | 界面预览或绘图资源：夜间界面预览.png；目录 outputs；路径：outputs/夜间界面预览.png | 289982 |
| [outputs/暗夜主题预览.png](outputs/暗夜主题预览.png) | 界面预览或绘图资源：暗夜主题预览.png；目录 outputs；路径：outputs/暗夜主题预览.png | 70227 |
| [outputs/暗夜聊天预览.png](outputs/暗夜聊天预览.png) | 界面预览或绘图资源：暗夜聊天预览.png；目录 outputs；路径：outputs/暗夜聊天预览.png | 83851 |
| [outputs/暗夜设置预览.png](outputs/暗夜设置预览.png) | 界面预览或绘图资源：暗夜设置预览.png；目录 outputs；路径：outputs/暗夜设置预览.png | 174551 |
| [outputs/暗夜预览.png](outputs/暗夜预览.png) | 界面预览或绘图资源：暗夜预览.png；目录 outputs；路径：outputs/暗夜预览.png | 523737 |
| [outputs/最终改进与验收.md](outputs/最终改进与验收.md) | 项目说明、调研或验证文档：最终改进与验收.md；路径：outputs/最终改进与验收.md | 3911 |
| [outputs/桌宠预览.png](outputs/桌宠预览.png) | 界面预览或绘图资源：桌宠预览.png；目录 outputs；路径：outputs/桌宠预览.png | 76439 |
| [outputs/模型参数预览.png](outputs/模型参数预览.png) | 界面预览或绘图资源：模型参数预览.png；目录 outputs；路径：outputs/模型参数预览.png | 188640 |
| [outputs/浅色主题预览.png](outputs/浅色主题预览.png) | 界面预览或绘图资源：浅色主题预览.png；目录 outputs；路径：outputs/浅色主题预览.png | 367961 |
| [outputs/界面预览.png](outputs/界面预览.png) | 界面预览或绘图资源：界面预览.png；目录 outputs；路径：outputs/界面预览.png | 367429 |
| [outputs/聊天预览.png](outputs/聊天预览.png) | 界面预览或绘图资源：聊天预览.png；目录 outputs；路径：outputs/聊天预览.png | 122335 |
| [outputs/角色设定预览.png](outputs/角色设定预览.png) | 界面预览或绘图资源：角色设定预览.png；目录 outputs；路径：outputs/角色设定预览.png | 179728 |
| [outputs/设置预览.png](outputs/设置预览.png) | 界面预览或绘图资源：设置预览.png；目录 outputs；路径：outputs/设置预览.png | 204931 |
| [outputs/调研与功能设计.md](outputs/调研与功能设计.md) | 项目说明、调研或验证文档：调研与功能设计.md；路径：outputs/调研与功能设计.md | 3978 |
| [outputs/验收记录.md](outputs/验收记录.md) | 项目说明、调研或验证文档：验收记录.md；路径：outputs/验收记录.md | 2613 |
| [scripts/optimize-ui-images.py](scripts/optimize-ui-images.py) | 六张插画白名单无损转码，逐字节校验完整 RGBA 并输出哈希；不处理用户附件或角色卡；路径：scripts/optimize-ui-images.py | 3647 |
| [scripts/verify-delivery.py](scripts/verify-delivery.py) | 验证全仓库文件覆盖、独立说明、SHA-256、APK CRC 和随包资源字节；路径：scripts/verify-delivery.py | 2407 |
| [work/check-browser-release.py](work/check-browser-release.py) | 运行八套编译产物浏览器回归，覆盖既有业务和新增本机恢复/ZIP边界；路径：work/check-browser-release.py | 1076 |
| [work/check-release.py](work/check-release.py) | 聚合151项核心与卡库检查、严格TypeScript和差异空白检查并生成具名验收记录；路径：work/check-release.py | 1501 |
| [work/package-core-sources.py](work/package-core-sources.py) | 生成系统隔离版前端与原生完整源码归档、摘要及安装说明；路径：work/package-core-sources.py | 5587 |
| [work/package-release-sources.py](work/package-release-sources.py) | 生成发布源码压缩包并检查文件范围；路径：work/package-release-sources.py | 3225 |
| [work/package-ui-sources.py](work/package-ui-sources.py) | 上一版群聊优化交付；打包当时完整前端及原生源码、CRC 检查与安装说明，保留历史归档；路径：work/package-ui-sources.py | 3861 |
| [work/qa/README.md](work/qa/README.md) | 当前源码浏览器入口、环境变量与历史 APK 专项测试说明；路径：work/qa/README.md | 2610 |
| [work/qa/android-diagnose.mjs](work/qa/android-diagnose.mjs) | 历史专项浏览器检查或开发工具：android-diagnose；使用时核对对应版本、路径和端口；路径：work/qa/android-diagnose.mjs | 467 |
| [work/qa/android.mjs](work/qa/android.mjs) | 历史专项浏览器检查或开发工具：android；使用时核对对应版本、路径和端口；路径：work/qa/android.mjs | 4410 |
| [work/qa/audit-regressions.mjs](work/qa/audit-regressions.mjs) | 七组真实回归：50MiB ZIP往返、桥接取消、排队导航、菜单返回、渲染恢复及图片重试；路径：work/qa/audit-regressions.mjs | 11085 |
| [work/qa/card-library.mjs](work/qa/card-library.mjs) | 13项仓库页面验收，覆盖分类收藏、AI拆分、反复应用、条目增删和600KB档案草稿恢复；路径：work/qa/card-library.mjs | 22072 |
| [work/qa/check.mjs](work/qa/check.mjs) | 历史专项浏览器检查或开发工具：check；使用时核对对应版本、路径和端口；路径：work/qa/check.mjs | 9950 |
| [work/qa/companion.mjs](work/qa/companion.mjs) | 历史专项浏览器检查或开发工具：companion；使用时核对对应版本、路径和端口；路径：work/qa/companion.mjs | 4883 |
| [work/qa/continuity.mjs](work/qa/continuity.mjs) | 长期记忆与摘要游标控制；路径：work/qa/continuity.mjs | 3603 |
| [work/qa/contrast-home.mjs](work/qa/contrast-home.mjs) | 历史专项浏览器检查或开发工具：contrast-home；使用时核对对应版本、路径和端口；路径：work/qa/contrast-home.mjs | 3335 |
| [work/qa/current-previews.mjs](work/qa/current-previews.mjs) | 历史专项浏览器检查或开发工具：current-previews；使用时核对对应版本、路径和端口；路径：work/qa/current-previews.mjs | 1622 |
| [work/qa/features.mjs](work/qa/features.mjs) | 实际页面与媒体17项回归，刷新前验证持久化并定位已保存的流式消息；路径：work/qa/features.mjs | 23378 |
| [work/qa/fixtures/encrypted.pdf](work/qa/fixtures/encrypted.pdf) | 自行生成的密码保护 PDF，验证解析失败结算而非悬挂；路径：work/qa/fixtures/encrypted.pdf | 1785 |
| [work/qa/fixtures/reading.pdf](work/qa/fixtures/reading.pdf) | 自行生成的一页明文 PDF，验证实际文字读取与 Android 文件选择器；路径：work/qa/fixtures/reading.pdf | 1356 |
| [work/qa/fixtures/unknown.bin](work/qa/fixtures/unknown.bin) | 五字节未知格式资料，验证任何扩展名的本地附件保存及诚实状态；路径：work/qa/fixtures/unknown.bin | 5 |
| [work/qa/focus.mjs](work/qa/focus.mjs) | 历史专项浏览器检查或开发工具：focus；使用时核对对应版本、路径和端口；路径：work/qa/focus.mjs | 1600 |
| [work/qa/group-v2.mjs](work/qa/group-v2.mjs) | 历史专项浏览器检查或开发工具：group-v2；使用时核对对应版本、路径和端口；路径：work/qa/group-v2.mjs | 1223 |
| [work/qa/image-pixels.mjs](work/qa/image-pixels.mjs) | 在真实浏览器比较基线 PNG 与 WebP，检查尺寸、alpha、不透明像素和三个背景上的合成差异；路径：work/qa/image-pixels.mjs | 3954 |
| [work/qa/legacy-live.mjs](work/qa/legacy-live.mjs) | 历史专项浏览器检查或开发工具：legacy-live；使用时核对对应版本、路径和端口；路径：work/qa/legacy-live.mjs | 1804 |
| [work/qa/live-card-entry.ts](work/qa/live-card-entry.ts) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：work/qa/live-card-entry.ts | 646 |
| [work/qa/live-cards.mjs](work/qa/live-cards.mjs) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：work/qa/live-cards.mjs | 20559 |
| [work/qa/local-providers.mjs](work/qa/local-providers.mjs) | 历史专项浏览器检查或开发工具：local-providers；使用时核对对应版本、路径和端口；路径：work/qa/local-providers.mjs | 18592 |
| [work/qa/local-recovery.mjs](work/qa/local-recovery.mjs) | 历史专项浏览器检查或开发工具：local-recovery；使用时核对对应版本、路径和端口；路径：work/qa/local-recovery.mjs | 4140 |
| [work/qa/make-pdf-fixtures.py](work/qa/make-pdf-fixtures.py) | 用 ReportLab 4.4.9 重建可重复的明文及加密 PDF 测试资料；路径：work/qa/make-pdf-fixtures.py | 535 |
| [work/qa/modules.mjs](work/qa/modules.mjs) | 历史专项浏览器检查或开发工具：modules；使用时核对对应版本、路径和端口；路径：work/qa/modules.mjs | 3296 |
| [work/qa/native/QueueAudit.java](work/qa/native/QueueAudit.java) | 独立instrumentation源文件，调用产品原生桥接、恢复日志并通过三个真实SAF窗口保存；路径：work/qa/native/QueueAudit.java | 6764 |
| [work/qa/native/SecurityAudit.java](work/qa/native/SecurityAudit.java) | 仅测试用原生instrumentation：实际地址/来源判断与跳转意图构造，不连接测试地址；路径：work/qa/native/SecurityAudit.java | 4726 |
| [work/qa/night-theme.mjs](work/qa/night-theme.mjs) | 历史专项浏览器检查或开发工具：night-theme；使用时核对对应版本、路径和端口；路径：work/qa/night-theme.mjs | 3394 |
| [work/qa/optimization.mjs](work/qa/optimization.mjs) | 历史专项浏览器检查或开发工具：optimization；使用时核对对应版本、路径和端口；路径：work/qa/optimization.mjs | 8472 |
| [work/qa/p0-reliability.mjs](work/qa/p0-reliability.mjs) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：work/qa/p0-reliability.mjs | 16535 |
| [work/qa/p0-storage-scale.mjs](work/qa/p0-storage-scale.mjs) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：work/qa/p0-storage-scale.mjs | 7780 |
| [work/qa/package-lock.json](work/qa/package-lock.json) | 可重复安装依赖的版本锁定清单：work/qa；路径：work/qa/package-lock.json | 1069 |
| [work/qa/package.json](work/qa/package.json) | 依赖与运行命令配置：work/qa；路径：work/qa/package.json | 56 |
| [work/qa/preview.mjs](work/qa/preview.mjs) | 历史专项浏览器检查或开发工具：preview；使用时核对对应版本、路径和端口；路径：work/qa/preview.mjs | 2794 |
| [work/qa/probe-local.mjs](work/qa/probe-local.mjs) | 历史专项浏览器检查或开发工具：probe-local；使用时核对对应版本、路径和端口；路径：work/qa/probe-local.mjs | 1559 |
| [work/qa/repair-companion.mjs](work/qa/repair-companion.mjs) | 16 类文档解析、真实界面记忆编辑、长代码下载、接话排队与取消回归；路径：work/qa/repair-companion.mjs | 13481 |
| [work/qa/repair-csp.mjs](work/qa/repair-csp.mjs) | 实际原生 CSP 下 APK 页面和桥接功能验证；路径：work/qa/repair-csp.mjs | 4963 |
| [work/qa/repair-library.ts](work/qa/repair-library.ts) | 浏览器回归使用的真实业务模块与组件测试入口；路径：work/qa/repair-library.ts | 1932 |
| [work/qa/repair-review.mjs](work/qa/repair-review.mjs) | 13 类存储、网络和朗读浏览器回归；路径：work/qa/repair-review.mjs | 10123 |
| [work/qa/repair-summary.mjs](work/qa/repair-summary.mjs) | 5 类摘要隔离与群聊删除浏览器回归；路径：work/qa/repair-summary.mjs | 6157 |
| [work/qa/repair-theme.mjs](work/qa/repair-theme.mjs) | 当前浅暗主题、字体、十处对比度与响应式检查；保留旧截图文件；路径：work/qa/repair-theme.mjs | 3994 |
| [work/qa/review-live-cards.mjs](work/qa/review-live-cards.mjs) | P0 复验、真实接口/角色持续对话的可复现源码或验收证据；路径：work/qa/review-live-cards.mjs | 6121 |
| [work/qa/review-native.mjs](work/qa/review-native.mjs) | 历史专项浏览器检查或开发工具：review-native；使用时核对对应版本、路径和端口；路径：work/qa/review-native.mjs | 1681 |
| [work/qa/review-restore.mjs](work/qa/review-restore.mjs) | 历史专项浏览器检查或开发工具：review-restore；使用时核对对应版本、路径和端口；路径：work/qa/review-restore.mjs | 1421 |
| [work/qa/roleplay.mjs](work/qa/roleplay.mjs) | 角色卡AI拆分、原卡下载、世界书请求、移动布局及取消的10项浏览器流程；路径：work/qa/roleplay.mjs | 12684 |
| [work/qa/security-library.ts](work/qa/security-library.ts) | 边界回归注入的源辅助库：实际备份、文件读取与请求构造，无真实Key；路径：work/qa/security-library.ts | 672 |
| [work/qa/security-regressions.mjs](work/qa/security-regressions.mjs) | 六组本机恢复和ZIP读取回归；保留修复前失败证据，检查正常文件完整性；路径：work/qa/security-regressions.mjs | 8186 |
| [work/qa/storage-entry.ts](work/qa/storage-entry.ts) | 真实存储回归的状态附件、ZIP及仓库模板捕获与删除测试导出入口；路径：work/qa/storage-entry.ts | 412 |
| [work/qa/storage.mjs](work/qa/storage.mjs) | 13项IndexedDB与备份回归，验证卡片草稿头像重映射和最后引用删除后的附件回收；路径：work/qa/storage.mjs | 8743 |
| [work/qa/ui-group.mjs](work/qa/ui-group.mjs) | 25 类群聊与真实界面流程的浏览器回归，覆盖 24 个应用入口；路径：work/qa/ui-group.mjs | 23991 |
| [work/qa/update-csp.py](work/qa/update-csp.py) | 历史测试维护脚本：update-csp；记录当时测试代码的调整；路径：work/qa/update-csp.py | 671 |
| [work/qa/update-repair-tests.py](work/qa/update-repair-tests.py) | 历史测试维护脚本：update-repair-tests；记录当时测试代码的调整；路径：work/qa/update-repair-tests.py | 2256 |
| [work/qa/update-theme.py](work/qa/update-theme.py) | 历史测试维护脚本：update-theme；记录当时测试代码的调整；路径：work/qa/update-theme.py | 294 |
| [work/qa/visual-v2.mjs](work/qa/visual-v2.mjs) | 历史专项浏览器检查或开发工具：visual-v2；使用时核对对应版本、路径和端口；路径：work/qa/visual-v2.mjs | 1170 |
| [work/refresh-file-catalog.py](work/refresh-file-catalog.py) | 更新逐文件说明与 SHA-256，扫描源码和归档内的签名凭据或密钥；路径：work/refresh-file-catalog.py | 20478 |
| [work/review-core.mjs](work/review-core.mjs) | 工程支持文件：work/review-core.mjs | 2493 |
| [work/verify-core-apk.py](work/verify-core-apk.py) | 系统隔离版 APK 的 v2/v3 同证书、对齐、CRC 和源资产逐字节核对；路径：work/verify-core-apk.py | 5412 |
| [work/verify-native-export.py](work/verify-native-export.py) | 构建并运行同签名临时instrumentation APK，验证导出队列与原生错误分类；不打入产品；路径：work/verify-native-export.py | 3468 |
| [work/verify-native-security.py](work/verify-native-security.py) | 构建并运行本地原生边界验收，记录APK摘要及命令，测试APK不入产品；路径：work/verify-native-security.py | 4820 |
| [work/verify-native-via.py](work/verify-native-via.py) | 实际模拟器升级、Via浏览、文件选择及持久化流程；旧内核测试为可选项；路径：work/verify-native-via.py | 12299 |
| [work/verify-release-apk.py](work/verify-release-apk.py) | 0.0.1 签名、CRC、资源集合和字节一致性检查；路径：work/verify-release-apk.py | 4535 |
| [work/verify-renamed-apk.py](work/verify-renamed-apk.py) | 历史更名版本的签名与资源验证；路径：work/verify-renamed-apk.py | 4291 |
| [work/verify-signing-gate.py](work/verify-signing-gate.py) | 通过真实构建预检验证缺少私钥和替换私钥均被拒绝，临时测试密钥自动销毁；路径：work/verify-signing-gate.py | 2029 |
| [work/verify-ui-apk.py](work/verify-ui-apk.py) | 上一版群聊优化交付；当时群聊版的签名、同证书、对齐、CRC 和源资源一致性检查；路径：work/verify-ui-apk.py | 4652 |
| [work/write-release-report.py](work/write-release-report.py) | 汇总发布检查结果与安装信息；路径：work/write-release-report.py | 5889 |
