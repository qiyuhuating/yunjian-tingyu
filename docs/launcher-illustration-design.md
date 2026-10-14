# 应用入口插画补齐（不修改已有图标）

范围：**只修改「全部应用」页面的应用入口插画**。首页原有应用图与底部 Dock 已是手绘插画，继续复用原文件；设置界面、聊天工具栏、表单、按钮、状态栏中的 Lucide SVG 图标一律保留。

## 设计原则
- 使用现有按钮的圆角渐变底座，绘画内容透明背景、居中且保留安全边距，不新增一层方形背景。
- 手绘感的浅蓝、浅紫、奶油粉和金色星星，模拟原按钮精致可爱的软阴影、亮色描边与饱满体积感。
- **不改** `button-sprite.webp`、`dock-sprite.webp`、`via-browser.webp`、`music-listen.webp`，不改图标裁剪参数、字号或全局字体。
- 图像为独立静态 SVG，原生清晰缩放；全部放在 `public/app-illustrations/` 下，供启动器使用。不在设置页替换已有图标。

## 插画映射
- 现有插画直接复用：chat、forum、browser、diary、moments、gallery、shop、all、home、calendar、memories、settings
- 此次新增入口绘画：music、work、weibo、live、face、wallet、pet、tasks、focus、weather、notes、lore、characters、favorites
- 入口图标大小和位置继续由 `app-icon` 与 `button-art` 的现有规则控制。 SVG 文件 viewBox 均为 128 × 128，设计稿中心对齐。

## 验收
1. 首页四个入口、Dock 四个入口、原有八张应用插画对比修改前，应完全一致。
2. 「全部应用」的新增十四个入口显示插画，尺寸、间距、描边与原作品协调，不裁切、不遮挡应用名。
3. 设置页及聊天工具栏仍使用之前的 Lucide SVG；浅色、夜间和玫瑰主题下图标均可辨认。
4. 检验 320px/360px/430px/桌面宽度下四列应用布局、触控和焦点状态。
5. 构建及浏览器回归结果需在合并前确认；本变更未声明已经跑过浏览器或 Android 回归。
