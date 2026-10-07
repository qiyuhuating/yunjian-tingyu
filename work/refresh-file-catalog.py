from pathlib import Path
import subprocess, json, hashlib, re, zipfile

root = Path(__file__).resolve().parents[1]
old = {r['path']:r['description'] for r in json.loads((root/'FILE_MANIFEST.json').read_text(encoding='utf-8'))}
new = {
 '.gitattributes':'禁止换行自动转换，确保 Windows 和 Linux 检出后资源及校验值保持一致',
 'docs/0.0.1.md':'0.0.1 发布说明、升级要求、安装包哈希、签名证书及验收范围',
 '.github/workflows/verify.yml':'GitHub Actions 自动执行文件完整性、核心检查和五组浏览器回归',
 'scripts/verify-delivery.py':'验证全仓库文件覆盖、独立说明、SHA-256、APK CRC 和随包资源字节',
}
new.update({
 'docs/UI群聊调优计划.md':'本轮计划、UI UX Pro Max 参考与群聊验收标准',
 'docs/UI与群聊审视报告.md':'UI 发现与修复、功能真实性边界、群聊规则与完整验收证据',
 'outputs/mori-phone/app/comfort.css':'聊天导航、群头像、短消息、触控、图片对话框和横屏布局样式',
 'outputs/mori-phone/lib/group-chat.ts':'群成员轮换、@指定、角色身份和短消息格式校验',
 'outputs/mori-phone/scripts/verify-group.mjs':'20 项群聊回归，包含稳定缓存前缀、作用域与摘要发言者',
 'work/qa/ui-group.mjs':'25 类群聊与真实界面流程的浏览器回归，覆盖 24 个应用入口',
 'work/qa/repair-theme.mjs':'当前浅暗主题、字体、十处对比度与响应式检查；保留旧截图文件',
 'work/check-release.py':'运行 87 项核心回归、严格 TypeScript 和空白检查',
 'work/check-browser-release.py':'运行五组当前浏览器回归并收集结构化结果',
 'work/verify-ui-apk.py':'当前群聊版的签名、同证书、对齐、CRC 和源资源一致性检查',
 'work/package-ui-sources.py':'打包当前完整前端及原生源码、CRC 检查与安装说明，保留历史归档',
 'work/refresh-file-catalog.py':'更新逐文件说明与 SHA-256，扫描源码和归档内的签名凭据或密钥',
 'outputs/云笺听雨-0.0.1-群聊优化.apk':'当前可覆盖安装的独立签名 APK，0.0.1 / versionCode 4',
 'outputs/云笺听雨-0.0.1-群聊优化.apk.idsig':'构建工具生成的增量安装签名元数据，普通安装只需 APK',
 'outputs/云笺听雨-0.0.1-群聊优化.apk.sha256':'当前签名 APK 的完整 SHA-256 摘要',
 'outputs/云笺听雨0.0.1群聊优化源码.zip':'当前完整前端源码归档，含群聊、样式、角色卡、API 和核心测试',
 'outputs/云笺听雨0.0.1群聊优化Android源码.zip':'当前原生壳、清单、系统桥接、构建脚本与全部随包资源归档',
 'outputs/云笺听雨UI群聊自动检查.json':'72 项核心、类型与空白检查的本轮结构化结果',
 'outputs/云笺听雨UI群聊浏览器回归.json':'五组浏览器回归结果，包含新增 21 类界面流程',
 'outputs/云笺听雨UI群聊资源校验清单.json':'versionCode 4 的 APK、签名证书和 24 个资源大小/摘要',
 'outputs/云笺听雨UI群聊签名与完整性报告.md':'本轮 APK 签名、完整性与资源核对结论及设备验证边界',
 'outputs/UI群聊-浅色.png':'当前浅色群聊消息、附件与输入区的浏览器验收截图',
 'outputs/UI群聊-暗夜.png':'当前暗夜群聊的短消息、成员头像和输入区验收截图',
 'outputs/UI暗夜-首页.png':'当前暗夜首页、留白、插画和卡片层次验收截图',
 'outputs/UI暗夜-私聊.png':'当前暗夜单人聊天与主要触控操作验收截图',
 'outputs/UI暗夜-设置.png':'当前暗夜服务商设置和可读性验收截图',
 'outputs/android/assets/web/assets/index-BwpkiV8B.js':'当前 APK 随包业务脚本，包含群聊调度、预览与系统返回',
 'outputs/android/assets/web/assets/index-ni2Vbena.css':'当前 APK 随包样式，含群聊、触控与横屏布局',
})
new.update({
 'docs/核心提示词隔离说明.md':'用户明确保存的系统核心、角色资料隔离、模型最大窗口、迁移与验证证据',
 'outputs/mori-phone/lib/system-prompt.ts':'保持原始核心常量与独立事实摘要规则，不插入角色或个人资料',
 'outputs/mori-phone/lib/context-window.ts':'服务商模型上限字段解析、按地址隔离元数据、官方回退及输入预算',
 'outputs/mori-phone/app/system-prompt-editor.tsx':'核心提示词编辑、明确保存、载入原始版本与撤销草稿的真实入口',
 'outputs/mori-phone/scripts/verify-context.mjs':'11 项最大上下文和系统编辑回归，含600条大请求与旧备份迁移',
 'work/verify-core-apk.py':'系统隔离版 APK 的 v2/v3 同证书、对齐、CRC 和源资产逐字节核对',
 'work/package-core-sources.py':'生成系统隔离版前端与原生完整源码归档、摘要及安装说明',
 'outputs/云笺听雨-0.0.1-系统隔离版.apk':'当前签名独立 APK，含核心编辑和模型最长上下文，0.0.1 / versionCode 5',
 'outputs/云笺听雨-0.0.1-系统隔离版.apk.idsig':'当前系统隔离 APK 的增量安装签名元数据，普通安装无需使用',
 'outputs/云笺听雨-0.0.1-系统隔离版.apk.sha256':'当前系统隔离签名 APK 的 SHA-256 校验摘要',
 'outputs/云笺听雨0.0.1系统隔离版源码.zip':'当前完整前端源码归档，包含核心编辑、模型预算及所有核心测试',
 'outputs/云笺听雨0.0.1系统隔离版Android源码.zip':'当前完整原生壳与随包资源归档，包含版本5清单和系统桥接',
 'outputs/云笺听雨系统隔离自动检查.json':'87项核心、严格类型、空白检查的当前结构化通过结果',
 'outputs/云笺听雨系统隔离浏览器回归.json':'当前五组浏览器回归，含25类群聊/系统编辑/语音/导航流程',
 'outputs/云笺听雨系统隔离资源校验清单.json':'版本5安装包与371个资源的大小和SHA-256及证书校验结果',
 'outputs/云笺听雨系统隔离签名与完整性报告.md':'版本5的APK签名、源资源一致性、通过检查及真实设备验收边界',
 'outputs/UI系统隔离-浅色.png':'当前浅色群聊、短消息与文件预览功能的验收截图',
 'outputs/UI系统隔离-暗夜.png':'当前暗夜群聊、输入操作与消息层次的验收截图',
})
new.update({
 'docs/自然群聊与内置Via说明.md':'自然群聊、Via二进制来源/合包、参考首页回退、系统栏和实际原生验收',
 'outputs/android/vendor/via-release-cn.apk':'机主提供的Via7.3.3原始二进制，固定SHA-256，原件未修改',
 'outputs/android/merge-via.py':'保留Via资源ID，合并清单/资产/双DEX，迁移共享authority并校验DEX顺序',
 'outputs/android/src/chat/cloudlet/phone/BrowserIntegration.java':'内置Via字体、独立返回位置、状态栏/系统导航隐藏与生命周期接入',
 'work/verify-native-via.py':'真实模拟器的12项安装、Via浏览/隔离/返回、原四栏和本地持久化检查',
 'outputs/云笺听雨Android内置Via验证.json':'本轮APK实际Android15/WebView124与旧内核模拟器通过结果',
 'outputs/Android验证-首页.png':'恢复参考首页和四个插画导航、隐藏系统三键栏的实际模拟器截图',
 'outputs/Android验证-Via.png':'内置Via实际网页、桥接隔离和隐藏顶部系统状态栏的模拟器截图',
})
new.update({
 'docs/群聊与角色记忆调研.md':'Telegram、Hermes、kuihua 与 PDF.js 的一手来源、实施计划和能力边界',
 'outputs/mori-phone/lib/character-memory.ts':'每位角色独立的自动记忆任务、原话证据校验、时间防回退与编辑保护',
 'outputs/mori-phone/lib/group-cadence.ts':'自然打字与分泡的等待范围、快速模式和 AbortSignal 清理',
 'outputs/mori-phone/lib/companion-capabilities.ts':'中文与语言切换、角色偏好和编程数学美术教学的质量预设',
 'outputs/mori-phone/lib/pdf-reading.ts':'随包 PDF.js worker 读取 PDF 文字，提示页数、截断、扫描件及加密失败',
 'outputs/mori-phone/lib/attachment-text.ts':'文本编码、Office共享字符串、ZIP限额、未知格式与读取状态',
 'outputs/mori-phone/app/memory-drawer.tsx':'本地记忆编辑、锁定保护、来源证据、修改历史和按角色筛选',
 'outputs/mori-phone/app/message-text.tsx':'代码文字安全展示和完整文件下载，不执行模型代码',
 'outputs/mori-phone/vite-assets.d.ts':'PDF worker URL 资源的严格 TypeScript 声明',
 'outputs/mori-phone/scripts/verify-companion.mjs':'16 项独立角色记忆、权限、时间、防漂移、群聊取消与技术内容回归',
 'outputs/mori-phone/public/licenses/PDFjs-LICENSE.txt':'随包 PDF.js 的 Apache 2.0 许可证',
 'work/qa/repair-companion.mjs':'16 类文档解析、真实界面记忆编辑、长代码下载、接话排队与取消回归',
 'work/qa/make-pdf-fixtures.py':'用 ReportLab 4.4.9 重建可重复的明文及加密 PDF 测试资料',
 'work/qa/fixtures/reading.pdf':'自行生成的一页明文 PDF，验证实际文字读取与 Android 文件选择器',
 'work/qa/fixtures/encrypted.pdf':'自行生成的密码保护 PDF，验证解析失败结算而非悬挂',
 'work/qa/fixtures/unknown.bin':'五字节未知格式资料，验证任何扩展名的本地附件保存及诚实状态',
 'outputs/UI角色记忆与文件.png':'角色群聊、真实读取状态与新能力的浏览器验收截图',
 'outputs/Android验证-文件读取.png':'Android 15 实际系统文件选择器、离线PDF解析与未知二进制消息截图',
 'work/check-release.py':'运行103项核心回归、严格TypeScript和空白检查',
 'work/check-browser-release.py':'运行六组当前浏览器回归并收集结构化结果',
 '.github/workflows/verify.yml':'GitHub Actions执行完整性、103项核心检查和六组浏览器回归',
})
for name in list(new):
 if ('群聊优化' in name or 'UI群聊' in name or name in {'work/verify-ui-apk.py','work/package-ui-sources.py'}):
  new[name]='上一版群聊优化交付；'+new[name].replace('当前','当时').replace('本轮','该轮')
names = sorted(set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0'))-{'','FILES.md','FILE_MANIFEST.json'})
rows=[]
for name in names:
    p=root/name
    assert not any(x in p.parts for x in ['node_modules','apk-signing','.git'])
    assert p.name not in ['signing.json','Android签名备份.zip'] and p.suffix not in ['.p12','.jks','.keystore']
    contents=[(name,p.read_bytes())]
    if p.suffix in ['.zip','.apk']:
        with zipfile.ZipFile(p) as z:
            assert all(not n.endswith(('.p12','.jks','.keystore','signing.json','.dev.vars')) for n in z.namelist())
            contents.extend((name+'!'+n,z.read(n)) for n in z.namelist() if not n.endswith('/'))
    for label,data in contents:
        assert not re.search(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-[A-Za-z0-9_-]{32,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)',data), 'Possible secret: '+label
    description=new.get(name,old.get(name,'交付支持文件'))
    if name.startswith('outputs/android/assets/web/assets/index-'):
        description='当前 APK 的完整业务脚本，含群聊、预览及系统返回' if p.suffix=='.js' else '当前 APK 的随包界面样式，含主题、触控及响应式' if p.suffix=='.css' else description
    if name.startswith('outputs/android/assets/web/assets/pdf-reading-'):description='当前 APK 按需加载的 PDF 读取组件和 PDF.js 主库'
    if name.startswith('outputs/android/assets/web/assets/pdf.worker.'):description='当前 APK 随包的 PDF.js 解析 worker，离线加载且不依赖 CDN'
    if name.startswith('outputs/android/assets/web/assets/three.module-'):description='当前 APK 按需加载的 Three.js 运行库，为云朵桌宠提供真实三维渲染'
    if name=='outputs/android/assets/web/licenses/PDFjs-LICENSE.txt':description='APK 内保留的 PDF.js Apache 2.0 许可副本'
    if name not in description: description+='；路径：'+name
    rows.append({'path':name,'description':description,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
assert len({r['description'] for r in rows})==len(rows)
catalog='# 逐文件介绍\n\n每个交付文件单独列出用途。完整哈希见 `FILE_MANIFEST.json`；旧版本和历史测试有明确标注。签名私钥、密码及真实个人数据不在仓库。\n\n| 文件 | 用途 | 字节 |\n| --- | --- | ---: |\n'
for r in rows:
    catalog+=f"| [{r['path']}]({r['path'].replace(' ','%20')}) | {r['description']} | {r['bytes']} |\n"
catalog+='| [FILES.md](FILES.md) | 全仓库逐文件用途索引（本文件） | — |\n| [FILE_MANIFEST.json](FILE_MANIFEST.json) | 文件大小、SHA-256 及用途的机器可读清单；索引与清单自身不纳入哈希 | — |\n'
(root/'FILES.md').write_text(catalog,encoding='utf-8')
(root/'FILE_MANIFEST.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'files':len(rows)+2,'bytes':sum(r['bytes'] for r in rows),'uniqueDescriptions':True,'secretScan':'passed'}))
