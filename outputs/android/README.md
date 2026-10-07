# 云笺听雨独立Android壳与资源

该版本直接加载assets/web/index.html，HTTPS应用资产源为appassets.androidplatform.net。没有网站登录或远程首页，界面包位于assets/web，Android原生代码在src。

## 构建

需完整JDK与Android SDK平台35、Build Tools35。使用ASCII目录构建，规避Windows aapt2对中文路径的问题。

前端源码在云笺听雨0.0.1群聊优化源码.zip的android-web目录。解压整个网页工程，npm ci后运行：

node node_modules/vite/bin/vite.js build --config android-web/vite.config.ts

产物生成到相邻android/assets/web。然后执行：

python build-apk.py --sdk <SDK目录> --java <完整JDK目录> --signing <签名目录> --output <输出.apk>

首次自动生成私有签名。后续更新应复用Android签名备份中的cloudlet-release.p12和signing.json，不能换签名。versionCode需在AndroidManifest.xml增加。

APK使用WebView承载全部本地资源；原生HTTPS桥接跨域调用，流式返回字节，支持中止和错误状态。上传使用Storage Access Framework；Blob导出分块写到临时文件，再由系统选定位置保存。设备朗读接Android TTS，麦克风与相机按需要授权，应用不请求管理全部文件权限。外部网页和音乐链接交给外部应用；不将这些页面加载到具有JavaScript桥接的本地主界面。

SDK来自Google官方下载并与官方仓库的SHA-1一致；字体来自Adobe官方仓库，许可证保留在assets/licenses。运行时界面资产包含全部CSS、JS、3D、插画与woff2，联网不会从站点更新；未来界面更新需重新生成APK。

## 0.0.1 生命周期修复

常见配置变化保留 WebView。导出文件在系统保存窗口打开前写入 AtomicFile 日志，可在重建后恢复；保存失败保留原临时文件并提供重试。系统回收进程后的文件导入会明确提示重新选择，不会移动或删除来源文件。原生朗读结束带独立 ID，WebView 使用 CSP 禁止 frame 与活动对象。版本 0.0.1，versionCode 4。没有真机或真实 Key 时，不把浏览器桥接模拟视为设备验收。


本轮系统返回优先交由界面处理：关闭图片预览/通话面板、返回聊天列表或首页；首页退出前仍等待 NativeFlush 保存完成。签名和资源核对见 `work/verify-ui-apk.py`（本机 SDK/JDK 路径需按环境调整）。
