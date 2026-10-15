# 死代码清理记录 · 2026-10-15

基线：`7e70642bb14f416f34b6e736854a3d3a45d29a5e`。范围为当前整合源码，保留已验收的v6页面和运行行为；本轮没有重签APK，也没有查询或触发远端Actions。

## 删除及依据

| 项目 | 删除依据 |
|---|---|
| `lib/connectors.ts`、`lib/connector-errors.mts` | 从网页page/layout/API路由、Android独立入口及构建入口建立TS依赖图，两个文件不可达；全仓检索无导入、require、动态加载或调用方。已删除模块及其中3个辅助函数 |
| `connector-contract.mts` 的 `createConnectors` | 唯一调用方是已删除的connectors.ts，随之成为孤立函数；保留worker/环境声明实际使用的ConnectorBinding/Context/Result类型 |
| `connector-context.ts` 的 `getConnectorBinding` | 唯一读取方是已删除模块；保留sites-worker实际调用的runWithConnectorBinding及请求上下文包装 |
| `chatgpt-auth.ts` 的 `chatGPTSignOutPath` | 全仓无调用；保留网页登录所需getChatGPTUser/requireChatGPTUser、登录跳转及保留路径检查，包括对signout路径的保护 |
| `phone-model.ts` 的 `timeLabel` | 全仓只有定义，没有调用；现有日期、聊天时间显示各有实际实现，未改其逻辑 |
| 72条旧CSS声明 | 同一文件、同一根级选择器和同一属性被后续无条件声明覆盖。保留最终生效值；没有跨媒体查询或跨文件盲目合并。另1条可能涉及现代CSS支持的回退保留 |
| 9类不可达CSS选择器 | social-post、pet-emoji、call-overlay、hangup、record-player、record-disc、record-arm、pet-thumb、pet-talk-row在真实UI、构建脚本和动态类名前缀中均没有生成方。移除24处选择器分支；混合:is列表保留仍被使用的分支 |

共删除2个模块文件及7个无调用函数（其中3个位于删除的模块），涉及11个产品源文件，源内容净减少11,087字节。随后同步严格文件清单；历史APK、原图、字体及许可没有改动。

## 避免误删

“没有其他文件引用某个export”不等于死代码：RootLayout是框架自动入口，Drizzle schema通过配置加载，ImagePreview和多种类型/函数在本文件内部使用，均保留。动态`note-color-${i%3}`等主题/图标/角色类也保留；扫描器最初的动态前缀漏报经过源码核对修正，没有删除纸条颜色。原生Java桥接、网页后端、数据库迁移、Sites构建基础设施和测试工具不因未出现在Android bundle就删除。

## 本轮验证

- 严格TypeScript通过，Android Web Vite生产构建通过，完整网页Vinext/Cloudflare生产构建通过。
- 291项核心检查通过，包含连接、协议、回合、记忆、角色卡、备份和Agent；空白检查通过。首次检查仅因修改行CRLF/EOF失败，修正新增行后完整重跑通过，原日志保留。
- 12页×3主题×4尺寸，共144状态、495项UI检查通过，0页面异常、0缺失资源。
- 音乐真实文件选择、歌词导入跳转/刷新留存、专注及日记选择6项交互检查通过。
- 清理前后48组页面的计算样式、几何、图标数量与可见插画解码结果逐项完全一致。
- 更新后的依赖图没有不可达生产TS模块；样式扫描没有剩余已确认缺失类选择器。仅有单文件内部使用的导出和自动框架入口保留。

CSS生产体积由约154.81kB降至151.77kB，gzip约31.76kB降至31.03kB。JS中原本已被tree-shaking排除的辅助代码，源码清理后不应宣称带来了同等体积收益。旧的大块警告仍保留。

严格PNG像素对比没有全等：同一未修改基线重复绘制也出现少量像素差异（控制组chat99像素、settings42像素），说明字节/像素零差异不是稳定标准。保留pixel-comparison、pixel-equivalence和pixel-repaint-control的原始结果，不伪装为通过；最终以无条件覆盖证据、计算样式/几何完全一致和真实交互回归判断没有页面退化。没有修改像素阈值来隐藏差异。

证据在交付目录`outputs/dead-code-cleanup-20261015/`：audit-before/after.json、selectors-before/after.json、css-removals.json、core-final.log、web-build.log、ui/result.json和equivalence/results.json。本次使用本地锁定依赖、Chromium与合成数据，没有真实Key、付费API或物理设备验收。
