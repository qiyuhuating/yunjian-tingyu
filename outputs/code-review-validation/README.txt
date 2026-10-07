复现脚本运行说明

应用源码和 APK 未修改。
从工作区根目录运行：node outputs/code-review-validation/review-core.mjs。
两个浏览器脚本需要 Playwright：把脚本放到已有 work/qa 目录运行，或为脚本所在目录提供 Playwright。
独立安装版预览需要先在 http://127.0.0.1:5175 启动；浏览器路径在脚本中固定为当前机器的 Chromium。
review-restore.mjs 使用新浏览器上下文，仅导入合成的无效备份，不操作已登录浏览器或真机数据库。
review-native.mjs 只调用模拟 Android 桥接，域名 fixture.invalid 不会发起真实网络请求。
