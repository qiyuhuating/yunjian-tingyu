"""Package the current UI update, preserving historical 0.0.1 archives."""
from pathlib import Path
import os, subprocess, zipfile, json, hashlib

root=Path(__file__).resolve().parents[1]
os.chdir(root)
report=json.loads((root/'outputs/云笺听雨UI群聊资源校验清单.json').read_text(encoding='utf-8'))
assert report['version']=='0.0.1' and report['versionCode']==4
files=sorted(set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=root).decode().split('\0'))-{''})
for directory,name in [('mori-phone','云笺听雨0.0.1群聊优化源码.zip'),('android','云笺听雨0.0.1群聊优化Android源码.zip')]:
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
apk=root/'outputs/云笺听雨-0.0.1-群聊优化.apk'
assert hashlib.sha256(apk.read_bytes()).hexdigest()==report['apkSha256']
(root/'outputs/云笺听雨-0.0.1-群聊优化.apk.sha256').write_text(report['apkSha256']+'  '+apk.name+'\n',encoding='utf-8')
(root/'outputs/APK安装说明.md').write_text(f'''# 云笺听雨 0.0.1 · 群聊与界面优化版

安装《云笺听雨-0.0.1-群聊优化.apk》。无需登录；界面、Source Serif 4、插画、3D 桌宠和功能代码随包提供。聊天、附件、角色卡、群记忆和 Key 保存在本机。AI、模型列表、天气、云端朗读和实时通话仍需网络与对应服务商 Key。

版本名仍为 0.0.1，内部版本号 4，包名 chat.cloudlet.phone。沿用原签名，可覆盖上一版。先在设置中导出完整 ZIP 备份，然后直接安装；不要卸载旧版或清除应用数据，避免删除聊天和 Key。

最低 Android 7，建议 Android 10 以上并更新 Android System WebView。Source Serif 4 的 TTF、WOFF2 与许可随包提供；汉字使用系统中文衬线回退。新群聊从聊天列表右上角建立，选择至少两位角色；已有群聊会自动采用短消息方式，单人剧情设置保留。

本轮主要变化：一层聊天标题、更舒适的触控、图片预览、横屏输入栏、真人式群聊、@、轮换、群成员管理、群摘要发言者与群记忆隔离。通话按钮进入真实 Realtime 界面；文字朗读仍单独提供。日历提醒仅在应用打开时生效。

文件导入/导出通过系统选择器。单个附件上限 200 MB、完整 ZIP 附件总量上限 512 MB，实际可用空间取决于设备。备份不含 Key，迁移到其他设备需要重新填写；导出失败保留临时文件供重试。

安装包 {apk.stat().st_size/1048576:.2f} MiB。72 项核心检查、严格类型检查、5 组浏览器回归通过；签名 v2/v3、同证书、对齐、CRC、24 个资源摘要和源资产逐字节核对通过。没有进行真机安装、真实 Key、麦克风或实际通话验收。

APK SHA-256：`{report['apkSha256']}`

完整源码归档：《云笺听雨0.0.1群聊优化源码.zip》《云笺听雨0.0.1群聊优化Android源码.zip》。全部测试和逐文件说明见私密 GitHub 仓库；原签名备份仍留在机主本地，未放入源码或仓库。
''',encoding='utf-8')
print(json.dumps({'archivesCRC':'passed','versionCode':4,'apkSha256':report['apkSha256']}))
