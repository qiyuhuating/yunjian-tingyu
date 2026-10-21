本轮在已选择合入的 UI 打磨上精简前端交付包，并删除源码中已确认不可达的图形配置。没有修改插画像素、共享精灵图、字体或业务提示词。

删除依据：

- `ButtonArt` 在浏览器名称上直接返回独立的 Via 插画，因此其私有 `SpriteArt` 的旧 browser 裁切坐标不可达。
- 首页仅渲染四个主应用；Launcher 在调用 ButtonArt 前排除 all，且全仓没有其他 ButtonArt 调用。因此移除 all 裁切坐标及 Launcher 列表中的不可达 all 分支；“全部应用”的 Lucide 导航图标继续保留。
- `home-indicator` 只有一个 DOM 节点；全仓两个样式规则中后一个始终设为 `display:none`，没有媒体查询或状态将它恢复。删除该节点及两个规则。
- 合并 reference-sky.css 中 glass、应用标签、宠物消息、助手气泡、用户气泡的五组重复覆盖，保留最终生效值及选择器优先级。

保留依据：精灵图仍被多个应用共用，不能为了删除一个裁切配置而删除整图；小云静态插画是 WebGL 不可用及非活动状态的回退；连续助手消息的隐藏头像用于对齐；动态岛和手机边框在不同屏幕条件下可见。aria-hidden 仅表示装饰图不重复朗读，不表示图形不显示。

`scripts/export-frontend.py` 通过 TypeScript 的传递导入收集独立前端源码，涵盖动态导入，再加入 CSS、public、vendor 和运行配置。交付包不含优化提示词、参考截图、历史说明、QA、数据库、云端路由及部署文件。保留应用运行所需的聊天提示词代码、依赖锁文件和资源许可。包内脚本改为独立 Vite 开发、构建及预览；原仓库的后端和部署功能未删除。

验证：303 项核心／协议检查、严格 TypeScript、52 项现有 UI／故障恢复浏览器检查；新增检查覆盖 sky/night/rose、320×640、390×844、844×390、1440×1000 下的首页、聊天、设置和全部应用，共 48 个状态，核对清理前后计算样式、布局、单个图标槽位只渲染一个图形、实际可见插画解码及页面异常。独立包解压后复用锁定依赖，类型检查及生产构建通过；没有声称重新 npm ci 或完成真机／真实付费接口／签名 APK 验收。包内清单和 ZIP CRC 均逐项校验。具体结果见 frontend-cleanup-validation.json。

复现图形检查：先构建 `work/feature-build`，设置已有 Chromium 的 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`，运行 `node work/qa/visual-cleanup.mjs`。设置 `VISUAL_BASELINE_DIR` 为清理前的独立生产构建目录可比较同一状态的计算样式及图标数量，并生成前后截图。参考图片中可见的背景模糊合成需在图像加载及绘制稳定后采样。
