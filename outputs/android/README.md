# 云笺听雨独立Android壳与资源

该版本直接加载assets/web/index.html，HTTPS应用资产源为appassets.androidplatform.net。没有网站登录或远程首页，界面包位于assets/web，Android原生代码在src。

## 构建

需完整JDK与Android SDK平台35、Build Tools35。使用ASCII目录构建，规避Windows aapt2对中文路径的问题。

前端源码在云笺听雨0.0.1系统隔离版源码.zip的android-web目录。解压整个网页工程，npm ci后运行：

node node_modules/vite/bin/vite.js build --config android-web/vite.config.ts

产物生成到相邻android/assets/web。然后执行：

python build-apk.py --sdk <SDK目录> --java <完整JDK目录> --signing <签名目录> --output <输出.apk> --apktool <apktool_3.0.3.jar>

正式构建必须提供既有私有签名；缺失或证书不匹配时立即拒绝构建。后续更新应复用Android签名备份中的cloudlet-release.p12和signing.json，不能换签名。versionCode需在AndroidManifest.xml增加。

APK使用WebView承载全部本地资源；原生HTTPS桥接跨域调用，流式返回字节，支持中止和错误状态。上传使用Storage Access Framework；Blob导出分块写到临时文件，再由系统选定位置保存。设备朗读接Android TTS，麦克风与相机按需要授权，应用不请求管理全部文件权限。浏览器入口与书签调用 APK 内置的 Via Shell；一起听选择的外部音乐软件仍按用户选择打开。Via 网页与具有 JavaScript 桥接的本地主界面分开。

SDK来自Google官方下载并与官方仓库的SHA-1一致；字体来自Adobe官方仓库，许可证保留在assets/licenses。运行时界面资产包含全部CSS、JS、3D、插画与woff2，联网不会从站点更新；未来界面更新需重新生成APK。

## 0.0.1 生命周期修复

常见配置变化保留 WebView。导出文件在系统保存窗口打开前写入 AtomicFile 日志，可在重建后恢复；保存失败保留原临时文件并提供重试。系统回收进程后的文件导入会明确提示重新选择，不会移动或删除来源文件。原生朗读结束带独立 ID，WebView 使用 CSP 禁止 frame 与活动对象。版本 0.0.1，versionCode 7。没有真机或真实 Key 时，不把浏览器桥接模拟视为设备验收。


本轮系统返回优先交由界面处理：关闭图片预览/通话面板、返回聊天列表或首页；首页退出前仍等待 NativeFlush 保存完成。签名和资源核对见 `work/verify-ui-apk.py`（本机 SDK/JDK 路径需按环境调整）。

## 内置 Via

`vendor/via-release-cn.apk` 是机主提供的 Via 7.3.3 二进制，不是开源 SDK。构建使用 Apktool 3.0.3，来自 https://github.com/iBotPeaches/Apktool/releases/tag/v3.0.3 ，JAR SHA-256 为 dbf930b076c6b9be08d57c449cacefc3bdd6b71ebd59b3066fc0e1f5b14f9423。`merge-via.py` 固定核对原包摘要，保留资源 ID，改应用入口、组件权限与文件共享标识；Via DEX 只做等长 authority 替换与必要摘要更新。原包始终原样保留。

应用要求 Android System WebView 120+；旧内核显示明确更新提示。Android 15 实测覆盖安全区域、同应用 Via 页面、链接/返回、桥接隔离、本地日记重启和独立 Via 共存。运行 `python work/verify-native-via.py --adb <adb路径> --serial emulator-5556 --legacy-serial emulator-5554` 可在两个可丢弃模拟器复现。测试不会操作物理手机。Via 自己的网页书签、历史与下载记录留在应用私有目录；小手机的 ZIP 备份不包含 Via 的独立数据库。
