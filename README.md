# 云笺听雨 · 0.0.1

为自己留一处能聊天、听歌、写日记的小天地。个人使用的 Android 陪伴应用；无需登录，界面与资源随 APK 打包，聊天、附件、角色卡和设置保存在设备本地。调用 AI 服务时仍需要网络和你自己的 API Key。

## 下载与安装

[下载 0.0.1 APK](outputs/云笺听雨-0.0.1.apk) · [安装说明](outputs/APK安装说明.md) · [签名与完整性报告](outputs/云笺听雨0.0.1签名与完整性报告.md)

包名 `chat.cloudlet.phone`，Android 7+，版本号 0.0.1 / versionCode 3。沿用原签名，覆盖安装前先备份；不要卸载旧版。旧 APK 和旧报告保留作历史交付，不作为当前版本下载入口。

## 源码与测试

- `outputs/mori-phone/`：完整界面、模型适配、角色卡、长期记忆、本地存储与可选网页服务源码。
- `outputs/android/`：Android 原生桥接、系统文件选择与导出、TTS、清单、构建脚本和随包资源。
- `work/qa/`：完整浏览器测试与历史调试脚本；本版验收入口为四个 `repair-*.mjs`。
- `outputs/code-review-validation/`：修复前问题复现，不是现版通过标准。
- [逐文件介绍](FILES.md)：每个交付文件的用途及校验值。
- [修复与验证报告](outputs/云笺听雨0.0.1修复与验证报告.md)：已完成检查及尚未覆盖的验证。

## 复现检查

需要 Node 22.13+、Python 3、Git。以下命令从仓库根目录执行：

```sh
npm ci --prefix outputs/mori-phone
npm ci --prefix work/qa
npx --prefix work/qa playwright install chromium
python work/check-release.py
node outputs/mori-phone/node_modules/vite/bin/vite.js preview --config outputs/mori-phone/android-web/vite.config.ts --host 127.0.0.1 --port 5175 --strictPort
```

在另一个终端执行 `python work/check-browser-release.py`。四组当前浏览器检查可使用 Playwright 安装的 Chromium；已有浏览器可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。历史 QA 脚本保留了当时的路径、端口和页面结构，只作开发记录，需按对应版本调整后运行。

重新生成前端资源：`node outputs/mori-phone/node_modules/vite/bin/vite.js build --config outputs/mori-phone/android-web/vite.config.ts`。Android 构建按 [原生构建说明](outputs/android/README.md) 执行；Windows 请在 ASCII 路径下构建。APK 完整性验证脚本保留了原构建环境路径，迁移时需替换 SDK、JDK、未签名 APK 和证书记录路径。仓库不含私有签名备份，签名文件仍由机主在本机保管。

当前证据包括 56 项核心检查、TypeScript 检查和 4 组浏览器回归。浏览器桥接使用测试模型响应；未完成真机安装、真实模型、真实通话和系统回收进程的设备验收。不能将这些检查解释为绝对无缺陷。

## 文件范围与隐私

仓库应保持 private。包含源码、APK、源码归档、测试、报告、截图、字体许可和其他已交付文件。排除了签名私钥与密码、真实 API Key、个人聊天备份、依赖安装目录和临时编译缓存。网页托管配置仅为原网页工程元数据，APK 不依赖托管页面或登录。
