# 逐文件介绍

每个交付文件单独列出用途。完整哈希见 `FILE_MANIFEST.json`；旧版本和历史测试有明确标注。签名私钥、密码及真实个人数据不在仓库。

| 文件 | 用途 | 字节 |
| --- | --- | ---: |
| [.gitattributes](.gitattributes) | 交付支持文件；路径：.gitattributes | 8 |
| [.github/workflows/verify.yml](.github/workflows/verify.yml) | GitHub Actions 自动执行文件完整性、核心检查和四组浏览器回归；路径：.github/workflows/verify.yml | 1054 |
| [.gitignore](.gitignore) | 工程支持文件：.gitignore | 248 |
| [README.md](README.md) | 使用或构建指南，适用目录：.；路径：README.md | 3241 |
| [docs/0.0.1.md](docs/0.0.1.md) | 交付支持文件；路径：docs/0.0.1.md | 1219 |
| [outputs/0.0.1暗夜聊天预览.png](outputs/0.0.1暗夜聊天预览.png) | 界面预览或绘图资源：0.0.1暗夜聊天预览.png；目录 outputs；路径：outputs/0.0.1暗夜聊天预览.png | 83201 |
| [outputs/0.0.1暗夜设置预览.png](outputs/0.0.1暗夜设置预览.png) | 界面预览或绘图资源：0.0.1暗夜设置预览.png；目录 outputs；路径：outputs/0.0.1暗夜设置预览.png | 174224 |
| [outputs/0.0.1暗夜预览.png](outputs/0.0.1暗夜预览.png) | 界面预览或绘图资源：0.0.1暗夜预览.png；目录 outputs；路径：outputs/0.0.1暗夜预览.png | 522338 |
| [outputs/APK安装说明.md](outputs/APK安装说明.md) | 项目说明、调研或验证文档：APK安装说明.md；路径：outputs/APK安装说明.md | 2108 |
| [outputs/Android源码.zip](outputs/Android源码.zip) | 源码归档：Android源码.zip；可直接下载解压，当前推荐带 0.0.1 的归档；路径：outputs/Android源码.zip | 9300566 |
| [outputs/android/AndroidManifest.xml](outputs/android/AndroidManifest.xml) | Android 包名、0.0.1 版本、组件及系统权限声明；路径：outputs/android/AndroidManifest.xml | 1525 |
| [outputs/android/README.md](outputs/android/README.md) | 使用或构建指南，适用目录：outputs/android；路径：outputs/android/README.md | 2174 |
| [outputs/android/assets/fonts/SourceSerif4Variable-Roman.ttf](outputs/android/assets/fonts/SourceSerif4Variable-Roman.ttf) | 随包 Source Serif 4 字体资源：SourceSerif4Variable-Roman.ttf；路径：outputs/android/assets/fonts/SourceSerif4Variable-Roman.ttf | 1204208 |
| [outputs/android/assets/licenses/Source-Serif-OFL.txt](outputs/android/assets/licenses/Source-Serif-OFL.txt) | 第三方资源许可与归属声明：outputs/android/assets/licenses/Source-Serif-OFL.txt | 4491 |
| [outputs/android/assets/web/assets/index-B4dO8WMG.css](outputs/android/assets/web/assets/index-B4dO8WMG.css) | 0.0.1 前端编译资源：index-B4dO8WMG.css；与随包界面对应；路径：outputs/android/assets/web/assets/index-B4dO8WMG.css | 89598 |
| [outputs/android/assets/web/assets/index-DQs-j8sE.js](outputs/android/assets/web/assets/index-DQs-j8sE.js) | 0.0.1 前端编译资源：index-DQs-j8sE.js；与随包界面对应；路径：outputs/android/assets/web/assets/index-DQs-j8sE.js | 473143 |
| [outputs/android/assets/web/assets/three.module-K64BOjC1.js](outputs/android/assets/web/assets/three.module-K64BOjC1.js) | 0.0.1 前端编译资源：three.module-K64BOjC1.js；与随包界面对应；路径：outputs/android/assets/web/assets/three.module-K64BOjC1.js | 537050 |
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
| [outputs/android/assets/web/manifest.webmanifest](outputs/android/assets/web/manifest.webmanifest) | 工程支持文件：outputs/android/assets/web/manifest.webmanifest | 359 |
| [outputs/android/assets/web/music-listen.png](outputs/android/assets/web/music-listen.png) | 一起听笑脸云朵耳机插画；路径：outputs/android/assets/web/music-listen.png | 1200508 |
| [outputs/android/assets/web/wallpaper.png](outputs/android/assets/web/wallpaper.png) | 天空小屋桌面壁纸；路径：outputs/android/assets/web/wallpaper.png | 1822518 |
| [outputs/android/build-apk.py](outputs/android/build-apk.py) | 编译 Java、生成 DEX、打包并签名 APK；路径：outputs/android/build-apk.py | 3540 |
| [outputs/android/res/drawable/app_icon.xml](outputs/android/res/drawable/app_icon.xml) | 工程支持文件：outputs/android/res/drawable/app_icon.xml | 337 |
| [outputs/android/res/drawable/cloud_pet.png](outputs/android/res/drawable/cloud_pet.png) | 界面预览或绘图资源：cloud_pet.png；目录 outputs/android/res/drawable；路径：outputs/android/res/drawable/cloud_pet.png | 1248793 |
| [outputs/android/res/mipmap-anydpi-v26/app_icon.xml](outputs/android/res/mipmap-anydpi-v26/app_icon.xml) | 工程支持文件：outputs/android/res/mipmap-anydpi-v26/app_icon.xml | 269 |
| [outputs/android/res/values/styles.xml](outputs/android/res/values/styles.xml) | 工程支持文件：outputs/android/res/values/styles.xml | 415 |
| [outputs/android/src/chat/cloudlet/phone/MainActivity.java](outputs/android/src/chat/cloudlet/phone/MainActivity.java) | Android WebView、HTTPS、文件导入导出及 TTS 生命周期；路径：outputs/android/src/chat/cloudlet/phone/MainActivity.java | 18927 |
| [outputs/code-review-validation/README.txt](outputs/code-review-validation/README.txt) | 修复前代码审查的缺陷复现材料：README.txt；路径：outputs/code-review-validation/README.txt | 644 |
| [outputs/code-review-validation/review-core.mjs](outputs/code-review-validation/review-core.mjs) | 修复前代码审查的缺陷复现材料：review-core.mjs；路径：outputs/code-review-validation/review-core.mjs | 2493 |
| [outputs/code-review-validation/review-native.mjs](outputs/code-review-validation/review-native.mjs) | 修复前代码审查的缺陷复现材料：review-native.mjs；路径：outputs/code-review-validation/review-native.mjs | 1681 |
| [outputs/code-review-validation/review-restore.mjs](outputs/code-review-validation/review-restore.mjs) | 修复前代码审查的缺陷复现材料：review-restore.mjs；路径：outputs/code-review-validation/review-restore.mjs | 1421 |
| [outputs/mori-phone/.gitignore](outputs/mori-phone/.gitignore) | 工程支持文件：outputs/mori-phone/.gitignore | 624 |
| [outputs/mori-phone/.npmrc](outputs/mori-phone/.npmrc) | 工程支持文件：outputs/mori-phone/.npmrc | 45 |
| [outputs/mori-phone/.openai/hosting.json](outputs/mori-phone/.openai/hosting.json) | 配置或机器可读验证记录：outputs/mori-phone/.openai/hosting.json | 100 |
| [outputs/mori-phone/README.md](outputs/mori-phone/README.md) | 使用或构建指南，适用目录：outputs/mori-phone；路径：outputs/mori-phone/README.md | 7484 |
| [outputs/mori-phone/android-web/index.html](outputs/mori-phone/android-web/index.html) | 工程支持文件：outputs/mori-phone/android-web/index.html | 274 |
| [outputs/mori-phone/android-web/main.tsx](outputs/mori-phone/android-web/main.tsx) | React 界面模块：main；位于 outputs/mori-phone/android-web；路径：outputs/mori-phone/android-web/main.tsx | 333 |
| [outputs/mori-phone/android-web/runtime.ts](outputs/mori-phone/android-web/runtime.ts) | APK 内原生网络、导出与朗读的前端桥接；路径：outputs/mori-phone/android-web/runtime.ts | 8830 |
| [outputs/mori-phone/android-web/vite.config.ts](outputs/mori-phone/android-web/vite.config.ts) | TypeScript 业务或构建模块：vite.config；位于 outputs/mori-phone/android-web；路径：outputs/mori-phone/android-web/vite.config.ts | 344 |
| [outputs/mori-phone/app/ai-controls.tsx](outputs/mori-phone/app/ai-controls.tsx) | 模型采样及思考参数设置界面；路径：outputs/mori-phone/app/ai-controls.tsx | 7388 |
| [outputs/mori-phone/app/api/assets/[id]/route.ts](outputs/mori-phone/app/api/assets/[id]/route.ts) | 可选网页服务 API 路由：assets/[id]/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/assets/[id]/route.ts | 1372 |
| [outputs/mori-phone/app/api/assets/route.ts](outputs/mori-phone/app/api/assets/route.ts) | 可选网页服务 API 路由：assets/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/assets/route.ts | 287 |
| [outputs/mori-phone/app/api/chat/route.ts](outputs/mori-phone/app/api/chat/route.ts) | 可选网页服务 API 路由：chat/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/chat/route.ts | 2038 |
| [outputs/mori-phone/app/api/connection/route.ts](outputs/mori-phone/app/api/connection/route.ts) | 可选网页服务 API 路由：connection/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/connection/route.ts | 770 |
| [outputs/mori-phone/app/api/health/route.ts](outputs/mori-phone/app/api/health/route.ts) | 可选网页服务 API 路由：health/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/health/route.ts | 602 |
| [outputs/mori-phone/app/api/models/route.ts](outputs/mori-phone/app/api/models/route.ts) | 可选网页服务 API 路由：models/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/models/route.ts | 1585 |
| [outputs/mori-phone/app/api/realtime/route.ts](outputs/mori-phone/app/api/realtime/route.ts) | 可选网页服务 API 路由：realtime/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/realtime/route.ts | 1395 |
| [outputs/mori-phone/app/api/speech/route.ts](outputs/mori-phone/app/api/speech/route.ts) | 可选网页服务 API 路由：speech/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/speech/route.ts | 1536 |
| [outputs/mori-phone/app/api/state/route.ts](outputs/mori-phone/app/api/state/route.ts) | 可选网页服务 API 路由：state/route.ts；APK 使用原生直连接口；路径：outputs/mori-phone/app/api/state/route.ts | 1671 |
| [outputs/mori-phone/app/characters.tsx](outputs/mori-phone/app/characters.tsx) | 角色卡管理界面；路径：outputs/mori-phone/app/characters.tsx | 11037 |
| [outputs/mori-phone/app/chat.tsx](outputs/mori-phone/app/chat.tsx) | 聊天列表、流式回复、附件与历史加载界面；路径：outputs/mori-phone/app/chat.tsx | 18371 |
| [outputs/mori-phone/app/chatgpt-auth.ts](outputs/mori-phone/app/chatgpt-auth.ts) | TypeScript 业务或构建模块：chatgpt-auth；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/chatgpt-auth.ts | 2550 |
| [outputs/mori-phone/app/companion-settings.tsx](outputs/mori-phone/app/companion-settings.tsx) | React 界面模块：companion-settings；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/companion-settings.tsx | 5743 |
| [outputs/mori-phone/app/focus-timer.tsx](outputs/mori-phone/app/focus-timer.tsx) | React 界面模块：focus-timer；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/focus-timer.tsx | 2709 |
| [outputs/mori-phone/app/globals.css](outputs/mori-phone/app/globals.css) | 全局字体、布局和浅暗主题样式；路径：outputs/mori-phone/app/globals.css | 54031 |
| [outputs/mori-phone/app/layout.tsx](outputs/mori-phone/app/layout.tsx) | React 界面模块：layout；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/layout.tsx | 738 |
| [outputs/mori-phone/app/local-media.tsx](outputs/mori-phone/app/local-media.tsx) | React 界面模块：local-media；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/local-media.tsx | 1030 |
| [outputs/mori-phone/app/lore.tsx](outputs/mori-phone/app/lore.tsx) | React 界面模块：lore；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/lore.tsx | 5082 |
| [outputs/mori-phone/app/modules.tsx](outputs/mori-phone/app/modules.tsx) | React 界面模块：modules；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/modules.tsx | 25976 |
| [outputs/mori-phone/app/music.tsx](outputs/mori-phone/app/music.tsx) | 一起听、本地音乐、歌词及外部音乐链接；路径：outputs/mori-phone/app/music.tsx | 5235 |
| [outputs/mori-phone/app/page.tsx](outputs/mori-phone/app/page.tsx) | React 界面模块：page；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/page.tsx | 255 |
| [outputs/mori-phone/app/pet-3d.tsx](outputs/mori-phone/app/pet-3d.tsx) | Three.js 桌宠几何、表情与动作渲染；路径：outputs/mori-phone/app/pet-3d.tsx | 5701 |
| [outputs/mori-phone/app/pet.tsx](outputs/mori-phone/app/pet.tsx) | 桌宠互动、情绪与对话栏状态；路径：outputs/mori-phone/app/pet.tsx | 4736 |
| [outputs/mori-phone/app/phone.tsx](outputs/mori-phone/app/phone.tsx) | React 界面模块：phone；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/phone.tsx | 23619 |
| [outputs/mori-phone/app/realtime-call.tsx](outputs/mori-phone/app/realtime-call.tsx) | React 界面模块：realtime-call；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/realtime-call.tsx | 6133 |
| [outputs/mori-phone/app/refinement.css](outputs/mori-phone/app/refinement.css) | 精细界面间距、对比度与交互状态样式；路径：outputs/mori-phone/app/refinement.css | 31775 |
| [outputs/mori-phone/app/roleplay-controls.tsx](outputs/mori-phone/app/roleplay-controls.tsx) | 酒馆风格角色扮演预设界面；路径：outputs/mori-phone/app/roleplay-controls.tsx | 1622 |
| [outputs/mori-phone/app/settings.tsx](outputs/mori-phone/app/settings.tsx) | 连接、模型和个人设置界面；路径：outputs/mori-phone/app/settings.tsx | 13559 |
| [outputs/mori-phone/app/ui.tsx](outputs/mori-phone/app/ui.tsx) | React 界面模块：ui；位于 outputs/mori-phone/app；路径：outputs/mori-phone/app/ui.tsx | 6710 |
| [outputs/mori-phone/app/use-voice.ts](outputs/mori-phone/app/use-voice.ts) | 朗读任务所有权和播放停止控制；路径：outputs/mori-phone/app/use-voice.ts | 3181 |
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
| [outputs/mori-phone/lib/attachment-text.ts](outputs/mori-phone/lib/attachment-text.ts) | TypeScript 业务或构建模块：attachment-text；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/attachment-text.ts | 920 |
| [outputs/mori-phone/lib/character-import.ts](outputs/mori-phone/lib/character-import.ts) | TXT/JSON/PNG 角色卡解析与无损导出；路径：outputs/mori-phone/lib/character-import.ts | 11273 |
| [outputs/mori-phone/lib/chat-prompt.ts](outputs/mori-phone/lib/chat-prompt.ts) | 聊天提示词排序、上下文选择与采样参数；路径：outputs/mori-phone/lib/chat-prompt.ts | 6060 |
| [outputs/mori-phone/lib/connector-context.ts](outputs/mori-phone/lib/connector-context.ts) | TypeScript 业务或构建模块：connector-context；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-context.ts | 612 |
| [outputs/mori-phone/lib/connector-contract.mts](outputs/mori-phone/lib/connector-contract.mts) | TypeScript 业务或构建模块：connector-contract；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-contract.mts | 5362 |
| [outputs/mori-phone/lib/connector-errors.mts](outputs/mori-phone/lib/connector-errors.mts) | TypeScript 业务或构建模块：connector-errors；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-errors.mts | 2717 |
| [outputs/mori-phone/lib/connector-preview.d.ts](outputs/mori-phone/lib/connector-preview.d.ts) | TypeScript 业务或构建模块：connector-preview.d；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connector-preview.d.ts | 433 |
| [outputs/mori-phone/lib/connectors.ts](outputs/mori-phone/lib/connectors.ts) | TypeScript 业务或构建模块：connectors；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/connectors.ts | 416 |
| [outputs/mori-phone/lib/continuity.ts](outputs/mori-phone/lib/continuity.ts) | 长期记忆与摘要游标控制；路径：outputs/mori-phone/lib/continuity.ts | 2997 |
| [outputs/mori-phone/lib/local-backup.ts](outputs/mori-phone/lib/local-backup.ts) | 完整 ZIP 备份、恢复与附件暂存回滚；路径：outputs/mori-phone/lib/local-backup.ts | 4824 |
| [outputs/mori-phone/lib/local-phone.ts](outputs/mori-phone/lib/local-phone.ts) | IndexedDB 状态、附件持久化、版本冲突和设备 Key 加密；路径：outputs/mori-phone/lib/local-phone.ts | 12435 |
| [outputs/mori-phone/lib/lyrics.ts](outputs/mori-phone/lib/lyrics.ts) | LRC 歌词解析和播放时间定位；路径：outputs/mori-phone/lib/lyrics.ts | 1165 |
| [outputs/mori-phone/lib/phone-model.ts](outputs/mori-phone/lib/phone-model.ts) | 状态与角色的数据结构、默认值及输入约束；路径：outputs/mori-phone/lib/phone-model.ts | 12197 |
| [outputs/mori-phone/lib/provider-adapter.ts](outputs/mori-phone/lib/provider-adapter.ts) | 服务商请求与响应协议适配；路径：outputs/mori-phone/lib/provider-adapter.ts | 9250 |
| [outputs/mori-phone/lib/providers.ts](outputs/mori-phone/lib/providers.ts) | 服务商端点和能力预设；路径：outputs/mori-phone/lib/providers.ts | 5930 |
| [outputs/mori-phone/lib/reasoning.ts](outputs/mori-phone/lib/reasoning.ts) | 思考强度与模型能力转换；路径：outputs/mori-phone/lib/reasoning.ts | 5898 |
| [outputs/mori-phone/lib/roleplay.ts](outputs/mori-phone/lib/roleplay.ts) | 角色扮演回复与选项解析；路径：outputs/mori-phone/lib/roleplay.ts | 3171 |
| [outputs/mori-phone/lib/server-phone.ts](outputs/mori-phone/lib/server-phone.ts) | TypeScript 业务或构建模块：server-phone；位于 outputs/mori-phone/lib；路径：outputs/mori-phone/lib/server-phone.ts | 2736 |
| [outputs/mori-phone/next.config.ts](outputs/mori-phone/next.config.ts) | TypeScript 业务或构建模块：next.config；位于 outputs/mori-phone；路径：outputs/mori-phone/next.config.ts | 133 |
| [outputs/mori-phone/package-lock.json](outputs/mori-phone/package-lock.json) | 可重复安装依赖的版本锁定清单：outputs/mori-phone；路径：outputs/mori-phone/package-lock.json | 399888 |
| [outputs/mori-phone/package.json](outputs/mori-phone/package.json) | 依赖与运行命令配置：outputs/mori-phone；路径：outputs/mori-phone/package.json | 1699 |
| [outputs/mori-phone/postcss.config.mjs](outputs/mori-phone/postcss.config.mjs) | 工程支持文件：outputs/mori-phone/postcss.config.mjs | 94 |
| [outputs/mori-phone/public/button-sprite.png](outputs/mori-phone/public/button-sprite.png) | 桌面应用绘制图标拼图；路径：outputs/mori-phone/public/button-sprite.png | 1313405 |
| [outputs/mori-phone/public/cloud-pet.png](outputs/mori-phone/public/cloud-pet.png) | 桌宠云朵备用绘图；路径：outputs/mori-phone/public/cloud-pet.png | 1248793 |
| [outputs/mori-phone/public/dock-sprite.png](outputs/mori-phone/public/dock-sprite.png) | 底部导航绘制图标拼图；路径：outputs/mori-phone/public/dock-sprite.png | 1571700 |
| [outputs/mori-phone/public/favicon.svg](outputs/mori-phone/public/favicon.svg) | 工程支持文件：outputs/mori-phone/public/favicon.svg | 302 |
| [outputs/mori-phone/public/fonts/source-serif-4-latin-400.woff2](outputs/mori-phone/public/fonts/source-serif-4-latin-400.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-400.woff2；路径：outputs/mori-phone/public/fonts/source-serif-4-latin-400.woff2 | 20088 |
| [outputs/mori-phone/public/fonts/source-serif-4-latin-600.woff2](outputs/mori-phone/public/fonts/source-serif-4-latin-600.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-600.woff2；路径：outputs/mori-phone/public/fonts/source-serif-4-latin-600.woff2 | 21532 |
| [outputs/mori-phone/public/fonts/source-serif-4-latin-700.woff2](outputs/mori-phone/public/fonts/source-serif-4-latin-700.woff2) | 随包 Source Serif 4 字体资源：source-serif-4-latin-700.woff2；路径：outputs/mori-phone/public/fonts/source-serif-4-latin-700.woff2 | 21716 |
| [outputs/mori-phone/public/icon-192.png](outputs/mori-phone/public/icon-192.png) | 界面预览或绘图资源：icon-192.png；目录 outputs/mori-phone/public；路径：outputs/mori-phone/public/icon-192.png | 5393 |
| [outputs/mori-phone/public/icon-512.png](outputs/mori-phone/public/icon-512.png) | 界面预览或绘图资源：icon-512.png；目录 outputs/mori-phone/public；路径：outputs/mori-phone/public/icon-512.png | 18315 |
| [outputs/mori-phone/public/manifest.webmanifest](outputs/mori-phone/public/manifest.webmanifest) | 工程支持文件：outputs/mori-phone/public/manifest.webmanifest | 359 |
| [outputs/mori-phone/public/music-listen.png](outputs/mori-phone/public/music-listen.png) | 一起听笑脸云朵耳机插画；路径：outputs/mori-phone/public/music-listen.png | 1200508 |
| [outputs/mori-phone/public/wallpaper.png](outputs/mori-phone/public/wallpaper.png) | 天空小屋桌面壁纸；路径：outputs/mori-phone/public/wallpaper.png | 1822518 |
| [outputs/mori-phone/scripts/build-verified.sh](outputs/mori-phone/scripts/build-verified.sh) | 工程支持文件：outputs/mori-phone/scripts/build-verified.sh | 661 |
| [outputs/mori-phone/scripts/connector-preview/connector-preview-session.mjs](outputs/mori-phone/scripts/connector-preview/connector-preview-session.mjs) | 工程支持文件：outputs/mori-phone/scripts/connector-preview/connector-preview-session.mjs | 6842 |
| [outputs/mori-phone/scripts/connector-preview/host-binding.mjs](outputs/mori-phone/scripts/connector-preview/host-binding.mjs) | 工程支持文件：outputs/mori-phone/scripts/connector-preview/host-binding.mjs | 7793 |
| [outputs/mori-phone/scripts/connector-preview/protocol.mjs](outputs/mori-phone/scripts/connector-preview/protocol.mjs) | 工程支持文件：outputs/mori-phone/scripts/connector-preview/protocol.mjs | 1781 |
| [outputs/mori-phone/scripts/execution-profile.mjs](outputs/mori-phone/scripts/execution-profile.mjs) | 工程支持文件：outputs/mori-phone/scripts/execution-profile.mjs | 624 |
| [outputs/mori-phone/scripts/install-ci.mjs](outputs/mori-phone/scripts/install-ci.mjs) | 工程支持文件：outputs/mori-phone/scripts/install-ci.mjs | 1685 |
| [outputs/mori-phone/scripts/install-ci.sh](outputs/mori-phone/scripts/install-ci.sh) | 工程支持文件：outputs/mori-phone/scripts/install-ci.sh | 6783 |
| [outputs/mori-phone/scripts/install-pnpm.sh](outputs/mori-phone/scripts/install-pnpm.sh) | 工程支持文件：outputs/mori-phone/scripts/install-pnpm.sh | 9015 |
| [outputs/mori-phone/scripts/npm-install.mjs](outputs/mori-phone/scripts/npm-install.mjs) | 工程支持文件：outputs/mori-phone/scripts/npm-install.mjs | 7025 |
| [outputs/mori-phone/scripts/pnpm-install.mjs](outputs/mori-phone/scripts/pnpm-install.mjs) | 工程支持文件：outputs/mori-phone/scripts/pnpm-install.mjs | 10633 |
| [outputs/mori-phone/scripts/run-framework.mjs](outputs/mori-phone/scripts/run-framework.mjs) | 工程支持文件：outputs/mori-phone/scripts/run-framework.mjs | 993 |
| [outputs/mori-phone/scripts/sites-env.mjs](outputs/mori-phone/scripts/sites-env.mjs) | 工程支持文件：outputs/mori-phone/scripts/sites-env.mjs | 906 |
| [outputs/mori-phone/scripts/sites-env.sh](outputs/mori-phone/scripts/sites-env.sh) | 工程支持文件：outputs/mori-phone/scripts/sites-env.sh | 1530 |
| [outputs/mori-phone/scripts/verify-core.mjs](outputs/mori-phone/scripts/verify-core.mjs) | 26 项模型状态、角色导入和提示词核心检查；路径：outputs/mori-phone/scripts/verify-core.mjs | 12561 |
| [outputs/mori-phone/scripts/verify-providers.mjs](outputs/mori-phone/scripts/verify-providers.mjs) | 17 项服务商参数及协议检查；路径：outputs/mori-phone/scripts/verify-providers.mjs | 10337 |
| [outputs/mori-phone/scripts/verify-review.mjs](outputs/mori-phone/scripts/verify-review.mjs) | 7 项审查缺陷修复回归检查；路径：outputs/mori-phone/scripts/verify-review.mjs | 4486 |
| [outputs/mori-phone/scripts/verify-voice.mjs](outputs/mori-phone/scripts/verify-voice.mjs) | 6 项语音与原生桥接检查；路径：outputs/mori-phone/scripts/verify-voice.mjs | 4501 |
| [outputs/mori-phone/tsconfig.json](outputs/mori-phone/tsconfig.json) | 配置或机器可读验证记录：outputs/mori-phone/tsconfig.json | 800 |
| [outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.LICENSE.md](outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.LICENSE.md) | 第三方资源许可与归属声明：outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.LICENSE.md | 1063 |
| [outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.css](outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.css) | 工程支持文件：outputs/mori-phone/vendor/shadcn-tailwind-4.13.0.css | 16041 |
| [outputs/mori-phone/vite.config.ts](outputs/mori-phone/vite.config.ts) | TypeScript 业务或构建模块：vite.config；位于 outputs/mori-phone；路径：outputs/mori-phone/vite.config.ts | 3115 |
| [outputs/一起听预览.png](outputs/一起听预览.png) | 界面预览或绘图资源：一起听预览.png；目录 outputs；路径：outputs/一起听预览.png | 113740 |
| [outputs/云朵小手机.apk](outputs/云朵小手机.apk) | 历史版本安装包，保留交付记录：云朵小手机.apk；路径：outputs/云朵小手机.apk | 9357498 |
| [outputs/云朵小手机.apk.idsig](outputs/云朵小手机.apk.idsig) | APK 的附属增量签名文件：云朵小手机.apk.idsig；路径：outputs/云朵小手机.apk.idsig | 79859 |
| [outputs/云朵小手机源码.zip](outputs/云朵小手机源码.zip) | 源码归档：云朵小手机源码.zip；可直接下载解压，当前推荐带 0.0.1 的归档；路径：outputs/云朵小手机源码.zip | 7568148 |
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
| [outputs/云笺听雨0.0.1自动检查.json](outputs/云笺听雨0.0.1自动检查.json) | 配置或机器可读验证记录：outputs/云笺听雨0.0.1自动检查.json | 4432 |
| [outputs/云笺听雨0.0.1资源校验清单.json](outputs/云笺听雨0.0.1资源校验清单.json) | 配置或机器可读验证记录：outputs/云笺听雨0.0.1资源校验清单.json | 4601 |
| [outputs/云笺听雨深度代码审查.md](outputs/云笺听雨深度代码审查.md) | 项目说明、调研或验证文档：云笺听雨深度代码审查.md；路径：outputs/云笺听雨深度代码审查.md | 13094 |
| [outputs/云笺听雨签名与完整性报告.md](outputs/云笺听雨签名与完整性报告.md) | 项目说明、调研或验证文档：云笺听雨签名与完整性报告.md；路径：outputs/云笺听雨签名与完整性报告.md | 1199 |
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
| [scripts/verify-delivery.py](scripts/verify-delivery.py) | 验证全仓库文件覆盖、独立说明、SHA-256、APK CRC 和随包资源字节；路径：scripts/verify-delivery.py | 1730 |
| [work/check-browser-release.py](work/check-browser-release.py) | 依次执行四组本版浏览器回归并保存报告；路径：work/check-browser-release.py | 764 |
| [work/check-release.py](work/check-release.py) | 依次执行四个核心测试、TypeScript 与差异空白检查；路径：work/check-release.py | 1114 |
| [work/package-release-sources.py](work/package-release-sources.py) | 生成发布源码压缩包并检查文件范围；路径：work/package-release-sources.py | 3225 |
| [work/qa/README.md](work/qa/README.md) | 使用或构建指南，适用目录：work/qa；路径：work/qa/README.md | 1036 |
| [work/qa/android-diagnose.mjs](work/qa/android-diagnose.mjs) | 历史专项浏览器检查或开发工具：android-diagnose；使用时核对对应版本、路径和端口；路径：work/qa/android-diagnose.mjs | 467 |
| [work/qa/android.mjs](work/qa/android.mjs) | 历史专项浏览器检查或开发工具：android；使用时核对对应版本、路径和端口；路径：work/qa/android.mjs | 4410 |
| [work/qa/check.mjs](work/qa/check.mjs) | 历史专项浏览器检查或开发工具：check；使用时核对对应版本、路径和端口；路径：work/qa/check.mjs | 9950 |
| [work/qa/companion.mjs](work/qa/companion.mjs) | 历史专项浏览器检查或开发工具：companion；使用时核对对应版本、路径和端口；路径：work/qa/companion.mjs | 4883 |
| [work/qa/continuity.mjs](work/qa/continuity.mjs) | 长期记忆与摘要游标控制；路径：work/qa/continuity.mjs | 3603 |
| [work/qa/contrast-home.mjs](work/qa/contrast-home.mjs) | 历史专项浏览器检查或开发工具：contrast-home；使用时核对对应版本、路径和端口；路径：work/qa/contrast-home.mjs | 3335 |
| [work/qa/current-previews.mjs](work/qa/current-previews.mjs) | 历史专项浏览器检查或开发工具：current-previews；使用时核对对应版本、路径和端口；路径：work/qa/current-previews.mjs | 1622 |
| [work/qa/focus.mjs](work/qa/focus.mjs) | 历史专项浏览器检查或开发工具：focus；使用时核对对应版本、路径和端口；路径：work/qa/focus.mjs | 1600 |
| [work/qa/group-v2.mjs](work/qa/group-v2.mjs) | 历史专项浏览器检查或开发工具：group-v2；使用时核对对应版本、路径和端口；路径：work/qa/group-v2.mjs | 1223 |
| [work/qa/legacy-live.mjs](work/qa/legacy-live.mjs) | 历史专项浏览器检查或开发工具：legacy-live；使用时核对对应版本、路径和端口；路径：work/qa/legacy-live.mjs | 1804 |
| [work/qa/local-providers.mjs](work/qa/local-providers.mjs) | 历史专项浏览器检查或开发工具：local-providers；使用时核对对应版本、路径和端口；路径：work/qa/local-providers.mjs | 18592 |
| [work/qa/local-recovery.mjs](work/qa/local-recovery.mjs) | 历史专项浏览器检查或开发工具：local-recovery；使用时核对对应版本、路径和端口；路径：work/qa/local-recovery.mjs | 4140 |
| [work/qa/modules.mjs](work/qa/modules.mjs) | 历史专项浏览器检查或开发工具：modules；使用时核对对应版本、路径和端口；路径：work/qa/modules.mjs | 3296 |
| [work/qa/night-theme.mjs](work/qa/night-theme.mjs) | 历史专项浏览器检查或开发工具：night-theme；使用时核对对应版本、路径和端口；路径：work/qa/night-theme.mjs | 3394 |
| [work/qa/optimization.mjs](work/qa/optimization.mjs) | 历史专项浏览器检查或开发工具：optimization；使用时核对对应版本、路径和端口；路径：work/qa/optimization.mjs | 8472 |
| [work/qa/package-lock.json](work/qa/package-lock.json) | 可重复安装依赖的版本锁定清单：work/qa；路径：work/qa/package-lock.json | 1069 |
| [work/qa/package.json](work/qa/package.json) | 依赖与运行命令配置：work/qa；路径：work/qa/package.json | 56 |
| [work/qa/preview.mjs](work/qa/preview.mjs) | 历史专项浏览器检查或开发工具：preview；使用时核对对应版本、路径和端口；路径：work/qa/preview.mjs | 2794 |
| [work/qa/probe-local.mjs](work/qa/probe-local.mjs) | 历史专项浏览器检查或开发工具：probe-local；使用时核对对应版本、路径和端口；路径：work/qa/probe-local.mjs | 1559 |
| [work/qa/repair-csp.mjs](work/qa/repair-csp.mjs) | 实际原生 CSP 下 APK 页面和桥接功能验证；路径：work/qa/repair-csp.mjs | 5002 |
| [work/qa/repair-library.ts](work/qa/repair-library.ts) | 浏览器回归使用的真实业务模块与组件测试入口；路径：work/qa/repair-library.ts | 1356 |
| [work/qa/repair-review.mjs](work/qa/repair-review.mjs) | 13 类存储、网络和朗读浏览器回归；路径：work/qa/repair-review.mjs | 10004 |
| [work/qa/repair-summary.mjs](work/qa/repair-summary.mjs) | 5 类摘要隔离与群聊删除浏览器回归；路径：work/qa/repair-summary.mjs | 6122 |
| [work/qa/repair-theme.mjs](work/qa/repair-theme.mjs) | 主题文字对比度、字体与响应式宽度验证；路径：work/qa/repair-theme.mjs | 3250 |
| [work/qa/review-native.mjs](work/qa/review-native.mjs) | 历史专项浏览器检查或开发工具：review-native；使用时核对对应版本、路径和端口；路径：work/qa/review-native.mjs | 1681 |
| [work/qa/review-restore.mjs](work/qa/review-restore.mjs) | 历史专项浏览器检查或开发工具：review-restore；使用时核对对应版本、路径和端口；路径：work/qa/review-restore.mjs | 1421 |
| [work/qa/update-csp.py](work/qa/update-csp.py) | 历史测试维护脚本：update-csp；记录当时测试代码的调整；路径：work/qa/update-csp.py | 671 |
| [work/qa/update-repair-tests.py](work/qa/update-repair-tests.py) | 历史测试维护脚本：update-repair-tests；记录当时测试代码的调整；路径：work/qa/update-repair-tests.py | 2256 |
| [work/qa/update-theme.py](work/qa/update-theme.py) | 历史测试维护脚本：update-theme；记录当时测试代码的调整；路径：work/qa/update-theme.py | 294 |
| [work/qa/visual-v2.mjs](work/qa/visual-v2.mjs) | 历史专项浏览器检查或开发工具：visual-v2；使用时核对对应版本、路径和端口；路径：work/qa/visual-v2.mjs | 1170 |
| [work/review-core.mjs](work/review-core.mjs) | 工程支持文件：work/review-core.mjs | 2493 |
| [work/verify-release-apk.py](work/verify-release-apk.py) | 0.0.1 签名、CRC、资源集合和字节一致性检查；路径：work/verify-release-apk.py | 4535 |
| [work/verify-renamed-apk.py](work/verify-renamed-apk.py) | 历史更名版本的签名与资源验证；路径：work/verify-renamed-apk.py | 4291 |
| [work/write-release-report.py](work/write-release-report.py) | 汇总发布检查结果与安装信息；路径：work/write-release-report.py | 5889 |
| [FILES.md](FILES.md) | 全仓库逐文件用途索引（本文件） | — |
| [FILE_MANIFEST.json](FILE_MANIFEST.json) | 文件大小、SHA-256 及用途的机器可读清单；索引与清单自身不纳入哈希 | — |
