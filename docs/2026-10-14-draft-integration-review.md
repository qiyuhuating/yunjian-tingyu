# 云笺听雨：草稿逐项审核与整合报告

交付复核日期：2026-10-14。结论：完成本地整合和原证书签名打包；兼容的源码已整合，未向 GitHub 推送、合并 PR 或发布 Release。本次 APK 的实际覆盖安装仍未验收。

## 1. 范围、固定点与证据

仓库为 `qiyuhuating/yunjian-tingyu`。初审固定 main `e77b88580cd5b394e42cda1f3c925eeb3c53e78d` 与 RC3 `aa15e29774a0746a62910d199af3c9213bea7182`；10 月 14 日继续时重新读取远端，main 已变为 `32bd064ef9b1f54fdcc3665cfc41af4ab3a397af`。最终采用当前主线及 PR #33 `69a14f439fc08974ca53a23d2c2eafe1b17657bb`，选择性整合 #28→#29→#30 的兼容能力，并移植 #6/#8 的 UI。

共核对 32 个分支（主线加 31 个开发分支）、8 个仍开放的 PR；包括 Draft 和非 Draft 未合并 PR。初始 RC3 455 个文件均核验 Git blob SHA；续做通过已认证 Git 获取固定提交，并重新比较全部 31 个分支。不能只靠 ahead/behind 判断功能是否已合并：部分旧分支的相同功能通过另一条祖先链进入主线，需核对实际实现。

`evidence/current-branch-audit.json` 是最终分支关系与文件清单，`evidence/latest-prs.json` 是开放 PR 的固定需求。早期审阅使用的本地快照 `baseline-main`/`reviewed-rc3` 是镜像提交，不冒充远端 SHA。最终真实父提交和本地整合提交记在 `build-result.json`。

## 2. 仍开放的 8 份草稿逐项结论

| 草稿 | 功能完整性、可用性 | 潜在缺陷与运行边界 | 对构建、运行的影响 | 结论与整合方式 |
|---|---|---|---|---|
| #5 前端审查与导出 | 原稿提供审查文档、导出工具及手动工作流，交付目的完整；旧审查结论对应旧版本 | 原稿固定旧基线，旧报告不能作为本次验收 | 导出应覆盖当前动态导入、字体、许可和预览 | **采纳思路，采用主线更新版工具** `scripts/export-frontend.py`，按 TS 依赖导出本轮 UI 和生产预览；不复制旧报告作为新证据，不新增远端导出任务 |
| #6 视觉精修 | 圆角、阴影、触控反馈与主题变量可独立使用 | 原稿只在 Next layout 引入，APK 独立入口不会加载；可能与主线参考主题重叠 | 必须维护两个入口和 CSS 覆盖顺序 | **整合** polish 放在 comfort 后、settings/reference-sky 前，保留主线最后覆盖；三主题、四宽度与减少动态效果通过 |
| #8 启动器插画 | 14 SVG 补齐应用入口，原首页与 Dock 插画复用 | 模板拼接路径无法被 #33 的资源裁剪器发现 | 未修正会在 APK 中漏图；不影响设置控制 SVG | **整合并修正** 为完整静态 URL 映射；真实裁剪目录解码全部 14 图，保留原素材和控制图标 |
| #10 Android 连接可靠性 | 隔离探针、错误分类、超时/取消等目标已被较新主线覆盖 | 原稿官方域名 DNS 全放行会放宽私网边界；独立重复解析器把只有 DONE 的空回复误判成功；旧设置会覆盖新凭据隔离 | 整体覆盖会倒退连接安全和设置行为 | **暂缓原实现，保留主线等价能力**。主线探测 45 秒、模型目录 20 秒，区别于旧稿 65/25 秒；保存后由用户主动读取模型，不自动请求 |
| #28 原子媒体与来源哈希 | Blob、消息、Outbox 同事务及原文哈希设计可用 | 原 RC3 保存失败后真实“重试保存”漏传 Blob；后续主线修复了 pendingAssets/紧急备份，却未补回命令媒体同事务；主线 strict schema 也缺 sourceDigest，不能读取已存 RC3 记忆 | 可能留下 completed 图片消息却没有原件，或升级后整份状态读取失败 | **选择性整合** 命令媒体 prepareUpload+commit(stagedAssets)、提交前成员/授权检查、可选 sourceDigest；保留当前主线更完整的 Blob 重试/备份与完整原文记忆，不覆盖回旧摘录实现 |
| #29 请求次数上限 | 持久化聊天 48、媒体 6、Agent 12 次，包含人工重试，重启不会清零 | 原检查晚于 beginTurn 状态修改，满额会先把 needs_review 改 queued；这不是 token/金额总预算，自动记忆/摘要不在计数内 | 无需改原生桥或数据库版本；满额必须在外部 POST 和状态修改前拒绝 | **整合并修复** beginTurn 提前守卫；queued/needs_review/in_flight 的 48/49 次状态全等、0 POST、0 成功提交；第 47→48 次合法重试仍完成 |
| #30 同次产物升级验收 | 同次工作流产物、源 SHA、APK SHA、证书、包名/版本和纸条内容绑定合理 | 上游 run 38123738494 的 Verify/Package 成功，upgrade 在旧版启动时遇系统无响应，尚未安装新包；不能算升级通过，也不能据此判新包有缺陷 | 原稿 code11 低于 #33 历史候选 code13；版本和校验需同步 | **采纳验收框架，升级结论暂缓**。候选写为 0.0.3.2/code14，同步打包元数据及升级参数；保留同次下载和原签名，不引用 rc2 或 #33 旧 APK 的成功作本包证据 |
| #33 单默认角色及资源精简 | freshState 只保留云汐、问候/纸条/记忆/世界书，已有角色和群不删；运行资源按 Vite 图暂存，PNG→WebP 原始 RGBA 相同 | 原稿漏改三项正式浏览器 QA 的默认多角色依赖；原资源浏览器测试服务全 Vite 目录，未证明裁剪目录可用 | 包更小且避免历史 bundle/测试素材入包；PDF、3D、字体、许可和 Via 必须保留 | **整合并补验收** 明确构造旧多角色测试样本，视觉页使用云汐，服务实际 build/assets/web 复验；保留像素无损原生 WebP 和音乐 WebP |

PR 状态以 10 月 14 日抓取为准：#5/#30 仍 Draft，#28/#29 已非 Draft；审核范围不依赖这个标签。

## 3. 全部 31 个开发分支逐项登记

下表的“保留”表示实际实现已在最终源码，未把旧分支再次完整合并。已入主线的分支用当前整合版的相关回归验证；并不声称每个历史分支都单独安装运行。真实服务商和物理设备均不在本次验收内。

| 分支 | 完整性与可用性 | 缺陷/边界及构建运行影响 | 处理结论 |
|---|---|---|---|
| `audit/github-signing-materials-20261009`<br>`223e829a3d43`，ahead 1/behind 188 | 签名位置诊断脚本用途明确 | 仅诊断 ZIP 文件名，不能替代证书校验；额外手动 CI 非本次必需 | 暂缓；本次直接验证原证书，避免新增远端诊断 |
| `codex/per-character-ai-routing-20261008`<br>`0e9fec6cad49`，ahead 0/behind 196 | 独立角色连接已入主线并通过连接/群聊回归 | 依赖按角色/地址隔离凭据；实际服务商未测 | 保留；不重复合并 |
| `codex/persistent-card-library-20261009`<br>`dde1e1597436`，ahead 0/behind 189 | 卡库保存、复制、复用、头像和草稿完整；14项浏览器回归通过 | 卡模板与聊天实例须隔离，已有容量限制 | 保留；不重复合并 |
| `codex/roleplay-worldbook-memory-20261009`<br>`f92404727e90`，ahead 0/behind 193 | 角色扮演、世界书和记忆已入主线 | 原文语境由更新后的记忆实现保证，不能退回摘录 | 保留，使用新完整原文实现 |
| `codex/ui-audit-lossless-images-20261008`<br>`f93d3bb7d804`，ahead 0/behind 215 | 原图、上传、壁纸与响应式基础已入主线 | 历史视觉证据不能替代本轮；原字节附件仍保留 | 保留，并运行当前媒体/布局回归 |
| `design/polish-audited-20261009`<br>`c50536e0ceb6`，ahead 2/behind 188 | 可独立使用的CSS精修层 | 旧稿缺Android入口；与reference-sky需有序覆盖 | 整合，补两个入口并保留主线最终覆盖 |
| `feat/custom-native-protocols-20261010`<br>`3242a8b87361`，ahead 18/behind 49 | 自定义/原生协议能力已经另一祖先链入主线 | ahead提交不等于缺功能；旧全量覆盖会退回新输出预算约束 | 保留当前协议实现，不再整枝合并 |
| `feat/illustrated-app-launcher-20261009`<br>`fda9fc93b5e0`，ahead 2/behind 181 | 14图可用，启动器入口完整 | 动态模板与裁剪冲突，已改静态路径；无需新原生代码 | 整合并验证真正APK资源 |
| `fix/android-api-connection-reliability-20261009`<br>`59d0c9795e35`，ahead 3/behind 179 | 目标已有较新等价实现 | DNS边界放宽及空SSE成功误判；旧设置会倒退 | 暂缓旧实现，保留主线修复 |
| `fix/android-home-top-blank-20261009`<br>`cb59983db766`，ahead 0/behind 180 | 首页顶部空白修复已入主线 | 小屏/横屏底栏本轮reference-sky回归通过 | 保留；不重复合并 |
| `fix/api-settings-redesign-20261009`<br>`c178192796ac`，ahead 0/behind 178 | 分类、搜索、Key隔离、取消已入主线 | 23项连接UI回归通过；付费服务商未验 | 保留；不重复合并 |
| `fix/apk-trim-one-default-20261014`<br>`69a14f439fc0`，ahead 1/behind 0 | 单默认角色和资源暂存功能可用 | 旧QA角色假设、全目录资源验收不足；均修正 | 整合#33，保留已有用户数据 |
| `fix/atomic-restore-assets-20261010`<br>`bc3b64c2cc3d`，ahead 23/behind 50 | 备份恢复同事务已入主线 | 保留主线更完整v3分段和紧急Blob备份；不覆盖回旧版本 | 保留当前实现，不再整枝合并 |
| `fix/home-ai-protocols-xiaoyun-20261009`<br>`47175d838520`，ahead 2/behind 181 | 首页、协议与桌宠目标由后续主线覆盖 | 旧分支结构落后，会覆盖新连接/媒体代码 | 保留新等价能力，暂缓旧整枝 |
| `fix/p0-stable-chat-20261010`<br>`d46868d7635e`，ahead 0/behind 161 | 稳定聊天修复已入主线 | 保守恢复和未知POST不得自动重发；本轮10项浏览器通过 | 保留，另叠加硬上限 |
| `fix/reference-sky-ui-20261013`<br>`7a2cb3685771`，ahead 0/behind 3 | 已合并的晴空蓝恢复与主题保护 | 必须保留最后CSS覆盖；7项视觉/布局回归通过 | 保留，不让旧精修层覆盖参考主题 |
| `fix/reliability-ui-cleanup-20261014`<br>`10a2916db3ab`，ahead 0/behind 1 | 已合并保存、备份、完整记忆、输出预算和前端清理 | v3新备份旧APK不能读取；大容量真机内存未测 | 采纳当前主线实现，补RC3兼容字段 |
| `fix/v003-media-memory-hardening-20261011`<br>`e13e06d65729`，ahead 7/behind 4 | 原子交付和来源哈希设计可用 | 旧保存重试缺口；新主线缺命令交付/hash兼容 | 选择性整合#28，保留新完整原文语义 |
| `hardening/v003-bounded-request-recovery-20261011`<br>`0c351c9a50b8`，ahead 14/behind 4 | 48/6/12次数限制可用 | 聊天守卫位置过晚，已修；不是金额总预算 | 整合#29并补满额无修改回归 |
| `refactor/causal-execution-evidence-20261010`<br>`e2f85c01026b`，ahead 0/behind 48 | 因果消息和执行证据已入主线 | 队列不能混入后来用户消息；当前回合/群聊测试通过 | 保留；不重复合并 |
| `refactor/core-runtime-20261010`<br>`8db56ba0527d`，ahead 0/behind 135 | 协议流、取消和上下文运行时已入主线 | 真实VPN/服务商未测；20项运行时回归通过 | 保留；不重复合并 |
| `refactor/durable-agent-core-20261010`<br>`14bcd85fd001`，ahead 0/behind 80 | 持久回合/Agent工作区已入主线 | 崩溃未知POST仍需人工确认；次数上限另行整合 | 保留，并叠加#29 |
| `refactor/fenced-agent-state-20261010`<br>`1fc3319ef2b3`，ahead 0/behind 72 | 代次隔离和过期结果拒绝已入主线 | 不允许旧结果覆盖新任务，Agent/receipt测试通过 | 保留；不重复合并 |
| `refactor/recovery-memory-agent-integrity-20261010`<br>`bafd15e5d958`，ahead 0/behind 21 | 恢复、来源证据、Agent一致性已入主线 | 完整记忆语境和新digest需共同保留，不能互相替换 | 保留，并补#28/#29兼容能力 |
| `refactor/turn-execution-20261010`<br>`2f5b621d95a2`，ahead 0/behind 119 | 回合执行与队列已入主线 | 满额前守卫已补；26项回合回归通过 | 保留，局部补丁整合 |
| `release/agent-core-v003-candidate-20261010`<br>`2286321e8b07`，ahead 0/behind 17 | 早期候选构建能力已入主线 | rc2历史APK/模拟器成功不代表当前包 | 保留源码能力，暂缓复用旧验收结论 |
| `release/agent-core-v003-rc3-20261011`<br>`aa15e29774a0`，ahead 26/behind 4 | 包含#28→#29→#30有序链 | 旧源码未含10/14主线；不宜整体覆盖；原升级任务失败 | 选择性整合能力，当前升级结论暂缓 |
| `release/standalone-v0.0.2`<br>`6c15556b3414`，ahead 0/behind 183 | 独立包身份和原签名基线完整 | 签名必须延续；不能改成新证书或混同旧非独立版 | 保留package与证书，版本递增14 |
| `release/standalone-v003-cutout-fix`<br>`eda4dde087bc`，ahead 0/behind 179 | 历史裁切与独立包能力已入主线 | 不替换原图/旧APK；资源裁剪由#33更新 | 保留已有修复 |
| `review/ui-ux-frontend-export-20261009`<br>`d02eaf8354ad`，ahead 6/behind 190 | 审查/导出交付目标完整 | 旧报告与旧导出基线过时 | 采纳思路，使用当前依赖驱动导出器 |
| `test/android-upgrade-acceptance-20261010`<br>`182bef8c0438`，ahead 0/behind 5 | 旧版覆盖升级测试基础已入主线 | 固定rc2 SHA/code默认仅适用于旧包；新包必须显式参数 | 保留历史任务，#30绑定本次产物，当前升级暂缓 |

0.0.2 文档中的原四份草稿也逐项核对：①录音、多模态、壁纸、IndexedDB v3 与 WebP，②角色独立 AI 路由，③角色卡/世界书/来源记忆与独立卡库，④去重、预算、版本回执与备份头像保护，均已在主线。依次使用本轮 features/media/storage、connections/group、roleplay/card-library/memory、backup/storage/receipt 回归；不重复导入旧稿。历史手工 `group-v2/modules/repair-companion/repair-summary` 仍有固定旧角色和环境路径假设，暂缓维护，不属于正式构建门槛。

## 4. 缺陷复现、修复与取舍依据

1. **媒体保存重试**：原 RC3 注入一次 assets 事务中止后，真实“重试保存”出现 completed/图片消息/0 Blob；供应商仅调用一次。最终使用主线 pendingAssets 队列，按执行快照收集 Blob，成功后按对象身份移除，队列归零再清除无引用项；命令媒体改 prepareUpload 同事务。重复失败、紧急备份、第三次成功、刷新原字节一致的 UI 回归通过。尚未持久化的 Blob 仍不能承诺在进程被杀后恢复。
2. **聊天满额重试**：原稿 0 POST 却有 1 次状态提交。将 guard 前移到 beginTurn 修改前；48/49 次的三种恢复状态保持全等且 0 成功提交，47→48 次正常发送。媒体与 Agent 原先已有前置位置，保留。
3. **记忆兼容**：新主线 strict schema 对 RC3 sourceDigest 报 unrecognized_keys，整个本地状态读取会失败。恢复可选字段并生成全文 SHA256；保留主线完整原文、拒绝重复 ID、否定/条件/剧情语境、长原文放不下就跳过、用户锁定修订。新增哈希外文本变更、旧无哈希数据与锁定兼容回归；28 项记忆检查通过。
4. **默认角色与 QA**：单角色默认值是新需求，不为过时测试恢复 15 默认角色。连接测试显式造第二角色；主题迁移测试保留旧 char-1/纸条/草稿/壁纸样本，当前视觉页使用云汐；visual-cleanup 使用云汐。另修正保存恢复测试的竞态：错误条在 saving 阶段也会隐藏，因此等数据库实际成功再 reload，不把条消失当落盘成功。
5. **裁剪资源与插画**：完整路径 Record 映射让静态引用扫描发现全部 14 图。对真正 `build/assets/web` 跑 apk-assets 与 draft-ui，5+14 项通过、无资源失败和页面异常；PDF/3D动态模块、worker、原生字体、许可保留，PWA无引用文件与旧 bundle 不入包。启动器溢出检测限定可见 launcher 的 scroll-panel 且要求宽度非零，避免测到隐藏聊天容器假通过。字体检查证明 CSS 声明与原生 TTF 保留，不冒充浏览器实际字体光栅核验。
6. **版本与签名**：使用原独立版证书；新版本 code14 高于旧正式版8及 #33 历史候选13。仅构建暂存 manifest 覆盖 0.0.3.2/14，原源码历史模板仍为0.0.2/8；#30 工作流的版本和断言同步。JDK25.0.2 无可用 --release8，改用本机完整 JBR25.0.4 后相同命令通过；aapt2 在中文输出路径失败，改用 ASCII 物理暂存目录。

## 5. 本轮验证和打包结果

最终核心检查 291 项、媒体协议 11 项、P0 协议 8 项，共 **310 项**通过；严格 TypeScript 与空白检查通过。十二组浏览器回归通过：features17、connection-ui23、roleplay10、card-library14、p0-reliability10、storage19、p0-storage-scale5、reference-sky7、save-recovery5、visual-cleanup48个页面状态、draft-ui14、media-save-retry真实故障恢复。另有资源暂存静态5项、实际裁剪目录浏览器5+14项通过。不同测试可能覆盖同一功能，不把页面状态与检查项混加为一个总分。

最初批次的 core 空白检查及 reference-sky/save-recovery 有失败；原始日志保留，修正后对应重跑日志均通过。最终摘要明确引用重跑，不把失败记录改写为成功。依赖来自 package-lock 一致的本地缓存；实际版本 Node24.16.0、TypeScript5.9.3、Vite8.0.13。Vite 大于500kB的分块警告仍存在，非编译错误，未为此做无关重构。测试使用 Chromium 和合成数据，没有真实 Key 或付费 API 请求。

| 产物属性 | 结果 |
|---|---|
| APK | `yunjian-tingyu-0.0.3.2-integrated.apk` |
| 大小 | 10,568,124 字节 |
| SHA256 | `22d2225aa3f3dba11efa0fded5f0c5988bf28a52a315017711ff50b44abb4b6d` |
| 包名/版本 | `chat.cloudlet.phone.v002` / `0.0.3.2` / code 14 |
| 证书SHA256 | `6a597e2d26f69840694fb027d7a1c7a2a9df4376095e22a63994be9c9c09c8b1`，与0.0.2独立版一致 |
| 签名和结构 | v2/v3、zipalign、CRC、DEX逐字、33个Web运行文件逐字匹配通过 |
| 资源 | 14新增SVG、音乐WebP、PDF/3D/worker、原生字体和许可证保留 |

Android Web 的 Vite 生产构建与原生 APK 编译已通过；可选 Cloudflare/Vinext 服务端部署未验证。实际覆盖安装、离线冷启动、真机内存、VPN/真实供应商尚未验证。#33 文档中的旧候选模拟器成功仅适用于其自己的 SHA；[RC3 上游失败运行](https://github.com/qiyuhuating/yunjian-tingyu/actions/runs/38123738494)也不能替代本次验证。签名一致和版本递增证明具备覆盖安装身份条件，不等于已证明数据迁移与运行成功。v3新备份不能导入旧APK，恢复前应升级；旧v2 ZIP和旧JSON继续兼容，旧JSON不含附件原件。

## 6. 两轴独立审核记录

以下保留 code-review 两轴独立判断及原稿计数，不合并成一个严重度排行。修复闭环以上述本轮验证为准。

### Standards 初审

# Standards 审核

基准已解析：`baseline-main` → `cd8a377678ad`，`reviewed-rc3` → `0f5fbf123253`；固定命令 `git diff baseline-main...reviewed-rc3`，22 个文件、357 行新增、92 行删除，非空。提交列表仅本地快照 `0f5fbf1 Integrate ordered draft chain 28-29-30 at upstream aa15e29774a0`；远端来源为 main `e77b88580cd5` 与 RC3 `aa15e29774a0`，本地 ID 不代表远端历史。

#28：`chat.tsx:55–56` 将生成 Blob 与消息、媒体回执共同提交，`character-memory.ts:30` 与 `continuity.ts:8–24` 对新自动记忆核验全文摘要，符合文档的事务及来源要求。#29：聊天/媒体/Agent 次数上限均在请求前检查持久状态，仍要求人工恢复未知 POST。#30：构建使用同次运行 APK、SHA、证书和 versionCode，升级脚本检查实际纸条内容。三者未发现新增硬性规范违反或值得单列的代码味道；可保留，运行验收由主任务完成。旧 #8 仅修改启动器插画并复用原素材，未发现明显规范问题，可独立整合后验证。

1. **[P1，硬性规范，旧 #10]** `MainActivity.java:130` 新增 `if(trustedProviderHost(url.getHost()))return true`，将所有官方域名 DNS 结果直接放行；当前实现 `MainActivity.java:128–134` 仅放行官方域名的 `198.18/15`。直接覆盖会重新允许回环/其他私网结果，违反 `docs/2026-10-10-draft-integration-review.md` 的“保留官方 Fake-IP 白名单边界”。保留主线窄例外，旧段暂缓。

2. **[P2，构建兼容，旧 #6]** `app/layout.tsx:5` 是草稿对 `polish.css` 的唯一入口；Android 从 `android-web/main.tsx:4–7` 单独加载 CSS，APK 中该视觉层不会生效。依据 `outputs/android/README.md` 的本地 assets 构建路径，整合时应同步引入 Android 入口，再验收触控、主题和窄屏。

3. **[P2，判断项：Duplicated Code，旧 #10]** 新 `connection-probe.ts:39–40` 重写流解析并用 `answer.trim()||'已收到服务商完整响应'` 将只有 `[DONE]` 的空正文判为成功；主线 `connection-client.ts:11` 已拒绝空正文和截断回复。重复探针已产生验收规则分歧，应复用现有 `testConnection`；旧 `settings.tsx` 也不应覆盖主线分类设置与按地址隔离 Key 的实现。

计数：本次 RC3 差异 0 项；未合并旧草稿 3 项（硬性规范 1、构建兼容 1、代码味道判断 1）。最严重项为旧 #10 的 DNS 防护倒退。本报告仅源码审核，未将静态判断视为真机或真实服务商验收。

### Spec 初审

# Spec 审核

范围：`git diff baseline-main...reviewed-rc3`（本地快照 `cd8a377`→`0f5fbf1`，对应已校验远端 `e77b885`→`aa15e297`）；另对照 #5/#6/#8/#10 草稿补丁和 28 个分支清单。需求来自 `pr-specifications.json`。

1. **[P1] #28 媒体失败后的真实保存重试丢失 Blob。** 需求：“在同一 commit/IndexedDB 事务中保存文件、聊天消息、Outbox 回执”。`chat.tsx:55-56` 改为暂存，但 `phone.tsx:42-43` 失败后保留乐观完成状态，`:78` 的“重试保存”不再传暂存文件。真实 Chromium UI 注入一次 assets 事务中止后点击该按钮：数据库从 `in_flight/0 Blob` 变为 `completed/图片消息/0 Blob`，服务商仅调用一次。复现：`node ../repro-spec-media-ui.mjs`，证据 `repro-spec-media-ui-red.json`。须保留待写 Blob 至成功落盘，补真实按钮恢复回归后整合。

2. **[P2] #29 聊天满额重试仍改任务状态。** 需求：“超额不发送 POST、不递增计数，也不改写任务状态”。`turn-receipts.ts:58` 的检查晚于 `turn-execution.ts:49` 调用 `beginTurn`（`turn-receipts.ts:44`）。`needs_review/attempts=48` 手工续接后被持久化成 `queued`，旧错误删除，然后才拒绝请求。复现：`node ../repro-spec-cap.mjs`（0 请求、1 次成功状态提交）。将检查前移到 `beginTurn` 的旧回执修改前。媒体与 Agent 入口已在修改前拒绝。后台记忆/摘要确实无计数（`chat-maintenance.ts:8,11`），PR 已如实披露，不能称全局费用预算。

3. **[P2] #6 Android 样式接入不完整。** 需求：“新增……polish.css，并在 layout.tsx 中……导入”，且要求 Android WebView 回归。原补丁仅改 Next layout；APK 独立入口 `android-web/main.tsx:4-7` 不加载 layout，精修层在 APK 无效。补该入口导入并检查主题/窄屏后整合。

4. **[验收阻断] #30 尚不能称升级通过。** 需求：“必须三项 job 均 success”，且“直接下载本次 workflow……rc3 APK”。工作流 `build-agent-v003-candidate.yml:184-214,234` 正确绑定同次 artifact、源码 SHA、APK SHA 与原证书；远端 run `38123738494` 的 Verify/Package 成功，upgrade job `114424479223` 在旧版启动时遇系统无响应并超时，尚未安装新 APK。可采纳工作流，须保持升级未验收，不能推断新 APK 缺陷或引用 rc2 成功证据。

取舍：#5 可整合导出工具并更新版本标识；#8 可整合但视觉验收需补；#10 的隔离探针、错误分类、Android watchdog、严格 Fake-IP 已由主线覆盖，保留主线，避免移植旧结构。差异须明示：现 probe45秒/目录20秒，原需求65/25秒；保存后改由用户主动读取列表（`connection-settings.tsx:25-35,50`）。#28 原文哈希绑定 ID/role/时间/全文且兼容旧记忆，可采纳；#28→#29→#30 保留祖先顺序，历史已整合内容不重复采纳。

修复复核：本地已补待写 Blob 保留及聊天检查前移。`work/qa/media-save-retry.mjs` 在旧构建复现 RED，在修复构建 GREEN：真实重试按钮后 1 Blob/完成回执，70 字节逐字一致；刷新后仍一致，服务商仅 1 调用、页面错误 0。聊天满额复现现为 0 请求/0 成功状态提交，回执全等。证据 `repro-spec-media-ui-{red,green}.json`。这不覆盖进程被杀后尚未落盘的 Blob、多窗口冲突或真实服务商。

计数：3 项代码缺口、1 项验收阻断；最严重为媒体重试生成持久化缺失文件引用。未发现需额外扩大产品范围的实现。

### Standards 续审

# Standards 增量审核 · 2026-10-14

固定来源：最新 main `32bd064ef9b1f54fdcc3665cfc41af4ab3a397af`、PR #33 `69a14f439fc08974ca53a23d2c2eafe1b17657bb`。读取 `pr33.diff`、`latest-main-rc3.diff` 及对应源码；只读审核，未修改产品代码。标准继续采用用户 AGENTS.md 的最小改动、验证目标与项目对本地数据、离线资源、原签名和未知 POST 不自动重放的约束。

## 确认的问题

1. **[P1，升级数据兼容] 删除已持久化的 `sourceDigest` 会阻断 RC3 数据读取。** 最新 main 的 `outputs/mori-phone/lib/phone-model.ts:28` 从 strict 记忆对象移除了 RC3 #28 新增的可选字段；`local-phone.ts:30` 在读取设备记录时直接调用 `stateSchema.parse`。使用过 RC3 自动记忆的状态/备份包含该字段，升级后会被整体拒绝，不能靠精简默认角色解释。已只读加载 pinned PR33 的 schema 实证：加入合法 64 位十六进制 `sourceDigest` 后，`safeParse` 返回 `unrecognized_keys`，路径 `memories[0]`。应保留可选字段兼容解析；继续采用新主线的完整原文召回与不截断语境策略，不能整体回退新版记忆实现。如进一步恢复摘要验证，更新记忆时应同步更新或明确移除旧摘要，避免沿用旧 hash。

2. **[P1，完整验收流程] 单角色默认值遗漏浏览器测试夹具适配，现有 CI 门槛必然失败。** PR33 只给 `scripts/verify-*` 增加测试角色。`work/qa/reference-sky.mjs:44–46` 从新 `freshState` 创建状态后直接对不存在的 `threads['char-1']` 调用 `push`；其 :74/:85/:116 和 `visual-cleanup.mjs:54` 仍选择不存在的“林晚晴”。`connection-ui.mjs:14` 同样创建单角色状态，:59/:61 读取不存在的 `characters[1].name`。`.github/workflows/verify.yml` 仍运行这些脚本。需为多角色语义测试显式生成第二个独立角色/线程；视觉测试可以选云汐，但必须同时调整线程 ID 并保留原记录恢复断言，不能通过跳过用例或恢复 15 个产品默认角色来消除失败。

3. **[P2，验证缺口] 浏览器资源检查没有运行裁剪后的资源目录。** `work/verify-apk-assets.py` 仅在临时目录运行 staging 并检查文件名；`work/qa/apk-assets.mjs:7` 服务的仍是完整 Vite 输出目录。因此 5 项页面通过不能证明 APK 白名单裁剪后动态资源可加载。最终验收应把 `stage_assets` 生成的 `assets/web` 作为 `FEATURE_BUILD_DIR` 再运行资源流程；这项是证据范围缺口，未证明现有产物丢文件。

## 可保留的取舍

- **资源裁剪可采纳。** `stage-assets.py:15–28` 递归遍历 imports 与 dynamicImports，并保留每个记录的 CSS/assets；PDF worker 是 `?url` 构建资产，PDF/Three 延迟模块沿 Vite 图保留。当前 `ui.tsx:27` 已将十四张启动器图片改为显式路径映射，避免旧模板动态路径不能被字符串扫描捕获的问题。CSS 三份 WOFF2、桌面/宠物/Via 插画均有完整字面引用；原生 TTF 与 OFL 另行明确复制。未发现当前动态图片、字体、PDF 或 3D 文件的确定遗漏。
- **Via 壳可保留。** `merge-via.py:73` 将暂存 assets 合入原 Via 解包目录，不删除 Via 自身 assets/DEX；原二进制摘要、authority 等长替换与 DEX 完整性检查仍在，未见 PR33 新增签名或包身份退化。
- **单默认角色可采纳。** `freshState` 只影响无旧状态的初始化；`initializeLocal` 在已有本地行时先返回，schema 仍接受最多 80 个角色，char-0 身份不变，未加入删角色/群聊的升级逻辑。该修改本身不会删除已有 15 人状态。产品功能可保留，先修复测试夹具。
- **以最新 main 改进为准。** 保留紧急备份携带未保存 Blob、v3 分段备份兼容读取、完整记忆语境、模型输出上限、reference-sky 主题与显式图标映射；单独整合 RC3 的请求次数上限及满额入口原子性。先前 pendingAssets 孤儿清理和隐藏 panel 假阳性已在主任务后续修复，不应重复计为未解决问题。

本次共确认 2 项兼容/流程问题、1 项资源验证缺口。没有新增需要无关重构的代码味道。仅执行了上述 schema 定向只读复现；未重复完整回归，也未将文档中的历史 APK/模拟器数据视为本次整合产物的验收。

### Spec 续审

# Spec 补审 · 2026-10-14

基线：远端 main `32bd064ef9b1`，PR #33 `69a14f439fc0`；需求为 `latest-prs.json`，比对 `pr33.diff`、`latest-main-rc3.diff`。工作树正在整合，因此以下原稿结论以固定 HEAD/差异为准，未修改应用源码。

- **新主线媒体恢复/备份应采纳，不能被旧 RC3 覆盖。** `phone.tsx:31,43-58,71` 已保留失败的 staged Blob，按执行快照筛选、成功后清理，并让失败状态备份携带 pending 文件；`local-backup.ts:19-35,42-65` 增加分段状态、SHA 校验、容量界限与 v2/v3 兼容。这覆盖并加强了 10/11 的保存恢复修复。但 `chat.tsx:55-56` 命令媒体仍先 `p.upload`，不满足 #28“同一……事务中保存文件、聊天消息、Outbox 回执”，且缺保存前角色/授权复验；只补该段原子交付，保留新保存/备份实现。
- **完整原文记忆优先保留，再叠加来源哈希。** 新主线 `character-memory.ts:28-32` 保存完整原文；`continuity.ts:14-23` 重新读取完整来源并避免把自动记忆截断到 5000 字预算。旧 RC3 的摘录存储/末尾截断会退回否定、条件、剧情语境丢失的问题。#28“全文 SHA-256”仍需补回生成、schema 与来源校验；保留主线重复 ID 拒绝及用户锁定记忆语义。schema 的可选 digest 也保证已保存 RC3 哈希数据可继续读取。
- **#29 可兼容整合。** main/#33 原稿没有 48/6/12 次硬上限；选择性补回三类请求前守卫，并在 `beginTurn` 修改旧回执前阻断满额，不能复用旧 RC3 的晚检查。保留恢复确认、持久化代次与新默认单角色。后台记忆/摘要和 token/金额仍不属于此预算。
- **[P2] #33 原稿完整 CI 会被旧 fixture 阻断。** 需求声明“全新安装……只预置云汐”。`reference-sky.mjs:44-46` 却访问 `threads['char-1']`，`connection-ui.mjs:59,61` 使用不存在的 `characters[1]`，`visual-cleanup.mjs:50` 查找林晚晴；均由 `verify.yml:30-32` 执行。应在测试中显式构造第二角色，保留默认单角色断言。未进入当前 CI 的旧手工 group/modules/repair 脚本也依赖已删角色，列为暂缓，避免扩大本次修复。
- **[P2，整合兼容] #33 暂存与 #8 动态插画路径冲突。** `stage-assets.py:41` 只发现完整字面 URL；旧 `LauncherArt` 的 `/app-illustrations/${name}.svg` 会漏掉 14 图。使用显式完整路径映射后，须以真实暂存目录执行图片/模块回归。原 `apk-assets.mjs:7` 服务完整 Vite 目录，只能证明完整构建可用。
- **#30 验收能力应整合，版本值应更新。** #33 历史候选为 code13；旧 RC3 code11 会阻断其覆盖升级。提交版 `android-upgrade-smoke.py:118,147` 仍固定 rc2 SHA/code10，无法验证 #33 文档中的 code13。新 APK 使用更高版本码，同步 manifest、报告及参数化测试，并绑定本轮源码/产物/原签名；历史成功不能代替此次升级验收。

**#33 结论：采纳默认角色精简、资源图暂存、音乐 WebP 与原生图标无损转码；修复 CI fixture 并完成真实暂存/新 APK 验收后交付。** 离线实测新默认为 1 云汐/0 群，问候、纸条、记忆、世界书保留，额外既存角色/群经 schema 读取不删。Sharp 原始 RGBA 核验 PNG/WebP 均 1254×1254、6,290,064 字节完全一致，SHA256 `e63f52586b574cb3aa67461e3645c775f6b93e4f44c4b50aa55a8ceadabc549e`。未发现需暂缓 #33 产品行为的其他证据；文档的旧 APK 字节数与模拟器结论仍属历史产物。


### 最终闭环

Standards 指出的 DNS 边界保留主线窄例外；Android 样式入口已补；sourceDigest 解析兼容已恢复；单角色 QA 已显式造样本。Spec 的原子交付、满额状态不改、完整原文与哈希共存、裁剪图标和版本递增均落实。pendingAssets 孤儿清理在主线已具备且保留。审核过程中发现的隐藏容器宽度假阳性已修复并在真实裁剪目录重新通过。当前代码审核和本地构建门槛无未处理阻断；覆盖升级与真实服务商验收仍开放。
