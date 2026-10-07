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
 'outputs/mori-phone/scripts/verify-group.mjs':'16 项群聊回归，包含稳定缓存前缀、作用域与摘要发言者',
 'work/qa/ui-group.mjs':'21 类群聊与真实界面流程的浏览器回归，覆盖 24 个应用入口',
 'work/qa/repair-theme.mjs':'当前浅暗主题、字体、十处对比度与响应式检查；保留旧截图文件',
 'work/check-release.py':'运行 72 项核心回归、严格 TypeScript 和空白检查',
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
