本轮基于 main `4c1d3acff28a40cd8e520be4cee0085d2d6a9faf`，修复附件恢复、备份往返、记忆语境及模型输出预算。源码在独立目录修改，未改既有 APK、签名或随包静态资源。

1. 附件事务失败时保留待保存 Blob。重复重试将文件与消息、状态同事务提交，只有成功才释放对应缓存。紧急备份同时捕获状态和待保存文件快照，避免重试只剩引用、备份找不到附件。
2. 新备份采用 v3 清单及最多 8 MiB 的 UTF-8 状态分段，每段验证大小和 SHA-256。导出逐字段序列化，避免对全部聊天再次整体 JSON.stringify。导出与导入统一最多 65,534 个 ZIP 条目。继续保留单附件 200 MiB、附件总量 512 MiB、解压总量 540 MiB、ZIP 550 MiB、清单 20 MiB 的保护。
3. 新代码继续读取旧 v2 ZIP 和旧 JSON。**旧 APK 不能读取新导出的 v3 ZIP；恢复新备份前须先升级应用。** 备份格式 v3 与既有 IndexedDB v3 不同，本轮没有升级数据库版本。旧 JSON 仍受 20 MiB 限制且不含附件原件。
4. 自动记忆保存完整来源原文；召回旧自动记忆时也读取完整来源，保留否定、条件、转述和剧情声明。放不进召回预算时跳过完整自动记忆，不截断语境。重复来源编号、删除/失败来源不参与自动召回；一条更正可更新多条旧记忆；用户编辑锁定的记录按编辑内容召回。
5. 服务商仅披露输出上限时也保留该元数据。已知上限传入实际请求，约束 OpenAI、Anthropic、Gemini 和兼容协议的输出参数，同时用于上下文预留。若上限放不下当前思考及最小正文预算，在服务商 POST 前明确拒绝。未知上限保留原设定，不假造限制。

修改前保留真实 UI 故障证据。修复后独立代理重新执行生产界面的故障恢复测试，并复审源码；复审发现的重复来源编号和同源多项更正回归已加入失败测试再修复。机器可读结果见 [验证记录](reliability-validation-2026-10-13.json)。

本地验证：

- `python work/check-release.py`：284 项核心检查，严格 TypeScript 与 diff 空白检查通过。其中备份 `--limits` 实际验证 65,534 条目往返、65,535 条目无法完成导出。
- `verify-media.mjs` 11 项、`verify-p0.mjs` 8 项，核心及协议共 303 项。
- Android 网页界面 Vite 生产构建通过。
- 浏览器共 108 项：features 17、connection-ui 23、roleplay 10、card-library 14、p0-reliability 10、storage 19、p0-storage-scale 5、reference-sky 5、save-recovery 5。新故障测试使用真实 Chromium IndexedDB：首次失败、紧急备份、第二次失败、第三次成功、刷新核对附件原字节，未出现未捕获页面异常。
- 原交付文件清单及历史 APK/随包资源完整性通过。新增回归接入本地检查与验证工作流，本轮没有触发或查询远端 Actions。

从仓库根目录执行以下命令。依赖按 README 安装；已有 Chromium 可设置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。

```sh
python3 scripts/verify-delivery.py
python3 work/check-release.py
node outputs/mori-phone/scripts/verify-media.mjs
node outputs/mori-phone/scripts/verify-p0.mjs
node outputs/mori-phone/node_modules/vite/bin/vite.js build --config outputs/mori-phone/android-web/vite.config.ts --outDir ../../../work/feature-build
node work/qa/storage.mjs
node work/qa/save-recovery.mjs
node work/qa/features.mjs
node work/qa/connection-ui.mjs
node work/qa/roleplay.mjs
node work/qa/card-library.mjs
node work/qa/p0-reliability.mjs
node work/qa/p0-storage-scale.mjs
node work/qa/reference-sky.mjs
```

验证边界：没有真实 Key、付费 API、物理 Android 设备或签名发布。恢复仍须整体解析和验证状态；未做 540/550 MiB 上限的真机内存压力测试。全量状态校验与整会话写回的长期性能、持久化费用预算、可选加密备份、发布版本治理仍需单独设计。当前安装的 APK 不会因源码修改自动获得修复。
