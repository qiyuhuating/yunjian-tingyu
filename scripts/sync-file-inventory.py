"""Regenerate strict source checksums and FILES.md without changing historical binary assets."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[1]
manifest_path = root / "FILE_MANIFEST.json"
index_path = root / "FILES.md"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
by_path = {record["path"]: record for record in manifest}
descriptions = {
    "outputs/android/runtime/browser-agent-dom.js": "Via网页只读快照与固定DOM操作，不向外部网页注入原生桥接",
    "outputs/android/src/chat/cloudlet/phone/BrowserAgent.java": "会话隔离的Via控制、原生操作确认、系统下载与真实状态回执",
    "outputs/mori-phone/app/browser-agent-panel.tsx": "聊天中的浏览器Agent任务入口、取消和操作记录",
    "outputs/mori-phone/lib/browser-agent.ts": "有界浏览器任务循环、参数校验、原生回执和取消保护",
    "work/qa/browser-agent.mjs": "真实DOM填表点击、过期控件拒绝、请求上限及下载回执回归",
    "work/qa/android-browser-agent.mjs": "仅可丢弃调试模拟器的真实Via读取点击填表下载及桥接隔离验收",
    "work/qa/android-speech.py": "直接编译运行Java语音分段器的长度、原文和Unicode边界回归",
    "docs/dead-code-cleanup-2026-10-15.md": "死模块、孤立函数和无效样式的删除依据及前后布局一致性验证",
    "outputs/mori-phone/app/craftsmanship.css": "v6页面材质与布局精修，保留消息操作和焦点并适配三主题的渐变对比",
    "work/qa/v6-ui.mjs": "144个生产页面状态的布局、三主题、真实搜索焦点、渐变对比和减少动态效果回归",
    "work/qa/v6-ui-interactions.mjs": "真实音乐文件选择、歌词跳转持久化及专注与日记选择交互回归",
    "docs/v6-ui-validation-2026-10-15.md": "用户v6源码包的视觉效果判断、三处退化修复和本地合并验收范围",
    "docs/2026-10-14-draft-integration-review.md": "全部开放草稿与开发分支逐项审核、兼容整合取舍、本次回归和签名候选边界",
    "docs/README-AI-experience.md": "本次AI调用思路、关键取舍、实际问题解决及可复用经验",
    "docs/yunjian-build-workflow.md": "适用于本项目的独立APK标准构建流程、工具链、签名和升级验收使用方法",
    "docs/launcher-illustration-design.md": "14个启动器插画的设计归属和原素材保留方式",
    "outputs/mori-phone/app/polish.css": "同时接入网页和Android入口并服从reference-sky最终覆盖的视觉精修层",
    "work/qa/draft-ui.mjs": "生产或实际裁剪目录的14图解码、可见容器溢出、主题和减少动态效果回归",
    "work/qa/media-save-retry.mjs": "真实媒体生成事务中止后实际重试按钮与刷新原件持久化回归",
    "outputs/mori-phone/public/app-illustrations/characters.svg": "启动器手绘插画：characters；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/face.svg": "启动器手绘插画：face；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/favorites.svg": "启动器手绘插画：favorites；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/focus.svg": "启动器手绘插画：focus；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/live.svg": "启动器手绘插画：live；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/lore.svg": "启动器手绘插画：lore；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/music.svg": "启动器手绘插画：music；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/notes.svg": "启动器手绘插画：notes；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/pet.svg": "启动器手绘插画：pet；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/tasks.svg": "启动器手绘插画：tasks；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/wallet.svg": "启动器手绘插画：wallet；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/weather.svg": "启动器手绘插画：weather；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/weibo.svg": "启动器手绘插画：weibo；复用原素材体系并使用完整静态URL",
    "outputs/mori-phone/public/app-illustrations/work.svg": "启动器手绘插画：work；复用原素材体系并使用完整静态URL",
    "outputs/android/stage-assets.py": "按新鲜 Vite 资源图暂存 Android 页面与动态模块，排除未引用和测试文件",
    "outputs/android/res/drawable/cloud_pet.webp": "原生启动器宠物图的像素无损 WebP 版本",
    "outputs/mori-phone/scripts/test-characters.mjs": "仅测试用的临时角色夹具，不进入应用默认数据",
    "work/verify-apk-assets.py": "验证 APK 资源白名单、动态模块与测试文件排除",
    "work/qa/apk-assets.mjs": "生产构建首页、音乐、启动器图片和延迟模块浏览器检查",
    "docs/apk-trim-2026-10-14.md": "默认角色与 APK 资源精简、升级保留和本地验收证据",
    "scripts/export-frontend.py": "按真实前端导入关系生成不含优化提示词和历史材料的独立 UI 包",
    "work/qa/visual-cleanup.mjs": "三种主题四种尺寸的图标单一渲染、插画加载和清理前后样式回归",
    "docs/frontend-cleanup-2026-10-13.md": "前端包精简、不可达图形删除依据和验证边界",
    "docs/frontend-cleanup-validation.json": "前端清理的本地编译、图形和包完整性验收结果",
    "docs/ui-selective-merge-2026-10-13.md": "选择合入 UI 打磨、主题与交互保护及本地验证边界",
    "docs/ui-selective-merge-results.json": "本次 UI 合并的主题、布局、交互和附件恢复浏览器验证结果",
    "outputs/mori-phone/scripts/verify-backup.mjs": "分段备份往返、旧格式兼容、文件数量与损坏输入边界回归",
    "work/qa/save-recovery.mjs": "真实界面的附件保存失败、紧急备份、重复重试与冷重载回归",
    "work/qa/save-recovery-entry.ts": "附件恢复回归使用的本地存储与备份读取入口",
    "docs/reliability-fixes-2026-10-13.md": "附件恢复、备份往返、记忆语境和模型输出上限的修复与验收边界",
    "docs/reliability-validation-2026-10-13.json": "本轮本地核心、协议与真实浏览器故障恢复测试结果及验证边界",
    ".github/workflows/android-upgrade-acceptance.yml": "原签名 0.0.2 至 0.0.3 候选的 Android 模拟器覆盖安装与离线冷启动验收",
    "work/qa/android-upgrade-smoke.py": "仅合成数据的 Android UI 升级、纸条与草稿保留及 force-stop 回归",
    "outputs/android/src/chat/cloudlet/phone/SpeechChunker.java": "设备朗读的超长文本按句分段，避开系统输入长度上限",
    "docs/apk-review-hardening-2026-10-15.md": "0.0.3 APK 代码评审修复清单、有意保留项、行为变化与验证边界",
    "docs/0.0.3-rc2-android-emulator-acceptance.md": "固定 APK 身份的 Android 模拟器验收方法、证据与物理设备边界",
    ".github/workflows/build-agent-v003-candidate.yml": "0.0.3 独立包完整回归、复用既有签名并校验升级一致性的候选构建；不自动发布",
    "docs/0.0.3-agent-candidate-acceptance.md": "聊天与Agent完整祖先链、证据等级和可升级签名候选的验收边界",
    "docs/2026-10-10-draft-integration-review.md": "今日草稿质量审查、修复归属、回归证据与真机待验收范围",
    "outputs/mori-phone/lib/durable-turn-queue.ts": "IndexedDB 同事务的聊天待执行队列，排队意图与崩溃后的保守安全续接；路径：outputs/mori-phone/lib/durable-turn-queue.ts",
    "outputs/mori-phone/lib/turn-causality.ts": "按消息 ID 固定因果边界与同一回合角色发言证据；路径：outputs/mori-phone/lib/turn-causality.ts",
    "outputs/mori-phone/lib/media-outbox.ts": "持久化媒体任务、代次隔离、人工续接与交付结果回执；路径：outputs/mori-phone/lib/media-outbox.ts",
    "outputs/mori-phone/lib/asset-references.ts": "资产引用统计与跨领域文件引用追踪",
    "outputs/mori-phone/lib/local-thread-store.ts": "线程独立持久化模块、增量写入、删除与事务隔离",
    "outputs/mori-phone/lib/turn-receipts.ts": "持久化回合发送回执、角色游标、显式重试与不确定计费保护",
    "outputs/mori-phone/lib/agent-workspace.ts": "隔离的版本化文本工作区、乐观并发与权限校验",
    "outputs/mori-phone/lib/agent-orchestrator.ts": "有界的多角色文件审阅、交接、角色独立模型和执行记录",
    "outputs/mori-phone/scripts/verify-receipts.mjs": "崩溃恢复、重复请求保护、持久化发言人游标回归",
    "outputs/mori-phone/scripts/verify-agents.mjs": "文件工作区、工具权限、多角色交接和记忆来源回归",
    "docs/可靠回合与Agent工作区-2026-10-10.md": "回合持久化、Agent 工具边界和真实验收范围",
    "scripts/sync-file-inventory.py": "自动维护 FILES.md 与 SHA256 严格源文件清单",
    ".github/workflows/sync-inventory.yml": "架构开发分支自动同步严格文件清单的安全工作流",
}
tracked = set(filter(None, subprocess.check_output(["git","ls-files","-z"],cwd=root).decode().split("\0")))
tracked -= {"FILE_MANIFEST.json", "FILES.md"}
index = index_path.read_text(encoding="utf-8")
lines = index.splitlines()
for path in sorted(tracked):
    item = by_path.get(path)
    if item is None:
        if path not in descriptions:
            raise RuntimeError("New file has no approved description: " + path)
        item = {"path": path, "description": descriptions[path] + "；路径：" + path}
        by_path[path] = item
    raw = (root / path).read_bytes()
    item["bytes"] = len(raw)
    item["sha256"] = hashlib.sha256(raw).hexdigest()
    prefix = "| [" + path + "](" + path + ") | "
    pos = next((i for i, line in enumerate(lines) if line.startswith(prefix)), None)
    new_line = prefix + item["description"] + " | " + str(item["bytes"]) + " |"
    if pos is None:
        lines.append(new_line)
    else:
        # Retain the established prose description when the row already exists.
        before = lines[pos].rsplit(" | ",1)[0]
        lines[pos] = before + " | " + str(item["bytes"]) + " |"
for path in set(by_path) - tracked:
    del by_path[path]
    prefix = "| [" + path + "](" + path + ") | "
    lines = [line for line in lines if not line.startswith(prefix)]
rows = [by_path[p] for p in sorted(by_path)]
if len({r["description"] for r in rows}) != len(rows):
    raise RuntimeError("Duplicate descriptions")
manifest_path.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="\n")
index_path.write_text("\n".join(lines)+"\n",encoding="utf-8",newline="\n")
print(json.dumps({"files":len(rows),"updated":True}))
