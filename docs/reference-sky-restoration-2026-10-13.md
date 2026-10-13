# 晴空蓝配色恢复

恢复依据：用户提供的首页、林晚晴聊天页截图，以及历史提交 `35d56a8377576a586413b8fcd2769d43f9a30919` 的主题样式。当前 main 和 rc3 的 globals/refinement 仍含原配色；没有证据表明 PR #6 的 polish.css 已合入，它目前仍是独立未合并 PR。本次只恢复视觉主题，不回退整个项目或撤销后续功能修复。

## 实现

- `reference-sky.css` 在网页和 Android 两个入口最后加载，以 `.theme-sky` 限定范围：蓝天壁纸、乳白卡片、灰蓝文字、白色图标文字底片；移除首页应用区额外的雾白渐变。
- 聊天页恢复 `#f2f6f8` 底色、`#fdfefd` 对方气泡和 `#e4edf3` 自己气泡，保留原触控面积、输入区及消息行为。截图是压缩/截图后的像素，部分 RGB 与源码有 1 个色阶差异，以历史源码为准。
- 首次升级将旧状态的主题切换为 sky，并持久化 `appearanceRevision: 1`。仅修改这两个字段；保留聊天、草稿、角色、记忆、配置和自定义壁纸原图。之后主动选择暗夜或玫瑰主题不会被重置。
- 使用既有 IndexedDB 状态/线程原子事务与版本校验；并发冲突时不覆盖另一窗口的数据，存储失败仍走原有恢复流程。
- 修复 320×640 及横屏时首页 Dock 被原布局挤出视口的问题；常规竖屏保留原首页布局。

## 验证

本地 Android 网页生产构建、改动涉及模块的严格 TypeScript 检查通过。浏览器检查使用 Chromium 134，本地临时依赖与仓库锁定依赖不同，不能代替 GitHub CI。

`work/qa/reference-sky.mjs` 对真实 IndexedDB、当前构建后的 UI 执行五组检查：旧状态无损恢复、升级标记幂等及附件原字节保留；390×844 首页配色；聊天双方气泡颜色；320×640 / 844×390 / 1440×1000 入口可见；主动切换其他主题后的冷启动持久化。测试不连接真实模型，不调用收费 API。

CI 已加入该回归，使用仓库锁定依赖并继续执行既有验收。复现：

```sh
node outputs/mori-phone/node_modules/vite/bin/vite.js build --config outputs/mori-phone/android-web/vite.config.ts --outDir ../../../work/feature-build
node work/qa/reference-sky.mjs
```

测试截图和结果输出在 `work/reference-sky-evidence/`，可用 `REFERENCE_SKY_OUTPUT` 改路径。无中文字体的本地环境可设置 `REFERENCE_SKY_FONT_DIR` 为仅用于截图的 `@fontsource/noto-serif-sc` 包目录；产品依旧使用设备原有中文字体，不增加字体包。

本提交不替换历史签名 APK。已安装的 APK 需要重新构建并覆盖安装后才会显示此次恢复；源码、浏览器验收与 Android 真机升级验收分别判断。
