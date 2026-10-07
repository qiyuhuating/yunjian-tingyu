"""Package the isolated-core update, preserving historical 0.0.1 archives."""
from pathlib import Path
import os, subprocess, zipfile, json, hashlib

root=Path(__file__).resolve().parents[1]
os.chdir(root)
report=json.loads((root/'outputs/云笺听雨系统隔离资源校验清单.json').read_text(encoding='utf-8'))
assert report['version']=='0.0.1' and report['versionCode']==5
files=sorted(set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0'))-{''})
for directory,name in [('mori-phone','云笺听雨0.0.1系统隔离版源码.zip'),('android','云笺听雨0.0.1系统隔离版Android源码.zip')]:
    base=root/'outputs'/directory
    with zipfile.ZipFile(root/'outputs'/name,'w',compression=zipfile.ZIP_DEFLATED,strict_timestamps=False) as z:
        for name in files:
            p=root/name
            if p.is_file() and p.is_relative_to(base):
                relative=p.relative_to(base)
                assert not any(part in {'node_modules','.git'} for part in relative.parts)
                assert directory!='android' or 'build' not in relative.parts
                assert p.suffix not in {'.p12','.jks','.keystore'} and p.name!='signing.json'
                z.write(p,relative.as_posix())
    with zipfile.ZipFile(z.filename) as archive:
        assert archive.testzip() is None
apk=root/'outputs/云笺听雨-0.0.1-系统隔离版.apk'
assert hashlib.sha256(apk.read_bytes()).hexdigest()==report['apkSha256']
(root/'outputs/云笺听雨-0.0.1-系统隔离版.apk.sha256').write_text(report['apkSha256']+'  '+apk.name+'\n',encoding='utf-8')
(root/'outputs/APK安装说明.md').write_text(f'''# 云笺听雨 0.0.1 · 自然群聊与内置 Via 版

安装《云笺听雨-0.0.1-系统隔离版.apk》。无需登录；界面、Source Serif 4、插画、3D 桌宠、Via 7.3.3 和功能代码随包提供。聊天、附件、角色卡、群记忆和 Key 保存在本机。AI、模型列表、天气、云端朗读和实时通话仍需网络与对应服务商 Key。

版本名仍为 0.0.1，内部版本号 5，包名 chat.cloudlet.phone。沿用原签名，可覆盖上一版。先在设置中导出完整 ZIP 备份，然后直接安装；不要卸载旧版或清除应用数据，避免删除聊天和 Key。

最低 Android 7，需 Android System WebView 120+；建议 Android 10 以上。Source Serif 4 的 TTF、WOFF2 与许可随包提供；汉字使用系统中文衬线回退。新群聊从聊天列表右上角建立，选择至少两位角色；已有群聊会自动采用短消息方式，单人剧情设置保留。

本轮新增：每角色独立的可编辑记忆、逐字证据与更正历史，自然接话、引用与排队，多语言和任务质量预设，PDF/Office/ZIP/文本读取、未知格式明确提示及代码保存。记忆提取依赖接入模型，会额外调用；不能保证永不遗忘，未解析二进制和音视频不能假装理解。默认采用模型最长上下文，保留手动预算；系统提示词在设置中可明确编辑与保存；角色资料与已保存的核心隔离。角色卡、世界书、记忆和运行配置不写入 system / instructions 字段；支持成年人自主、同意的性相关讨论与正当创作以及政治、社会争议讨论，未成年角色互动保持非性化。

内置浏览器入口直接进入包内 Via，不跳转独立浏览器；网页与小手机桥接分开，可一键回家。Via 的网页书签、历史和下载数据库保存在应用私有目录，但不在小手机 ZIP 备份范围。首次使用 Via 会显示其原有条款页面。

此前界面与群聊变化：一层聊天标题、更舒适的触控、图片预览、横屏输入栏、真人式群聊、@、轮换、群成员管理、群摘要发言者与群记忆隔离。通话按钮进入真实 Realtime 界面；文字朗读仍单独提供。日历提醒仅在应用打开时生效。

文件导入/导出通过系统选择器。单个附件上限 200 MB、完整 ZIP 附件总量上限 512 MB，实际可用空间取决于设备。备份不含 Key，迁移到其他设备需要重新填写；导出失败保留临时文件供重试。

安装包 {apk.stat().st_size/1048576:.2f} MiB。103 项核心检查、严格类型检查、6 组浏览器回归通过；签名 v2/v3、同证书、对齐、CRC、{len(report['resources'])} 个资源摘要和源资产逐字节核对通过。Android 15 / WebView 124 模拟器已完成实际安装、Via 浏览与返回、本地日记重启持久化与独立 Via 共存验证；未进行真机、真实 Key、麦克风或实际通话验收。

APK SHA-256：`{report['apkSha256']}`

完整源码归档：《云笺听雨0.0.1系统隔离版源码.zip》《云笺听雨0.0.1系统隔离版Android源码.zip》。全部测试和逐文件说明见私密 GitHub 仓库；原签名备份仍留在机主本地，未放入源码或仓库。
''',encoding='utf-8')
print(json.dumps({'archivesCRC':'passed','versionCode':5,'apkSha256':report['apkSha256']}))
