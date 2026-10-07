import pathlib,zipfile,json,hashlib
root=pathlib.Path('outputs/android');out=pathlib.Path('outputs/云笺听雨0.0.1Android源码.zip')
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for file in root.rglob('*'):
  if file.is_file() and 'build' not in file.relative_to(root).parts:z.write(file,file.relative_to(root).as_posix())
for archive in [out,pathlib.Path('outputs/云笺听雨0.0.1源码.zip')]:
 with zipfile.ZipFile(archive) as z:assert z.testzip() is None;assert not any(name.endswith(('.p12','signing.json','.dev.vars')) for name in z.namelist())
p=pathlib.Path('outputs/云笺听雨0.0.1资源校验清单.json');report=json.loads(p.read_text(encoding='utf-8'))
assert report['version']=='0.0.1' and report['versionCode']==3
pathlib.Path('outputs/云笺听雨-0.0.1.apk.sha256').write_text(report['apkSha256']+'  云笺听雨-0.0.1.apk\n',encoding='utf-8')
pathlib.Path('outputs/APK安装说明.md').write_text(f'''# 云笺听雨 0.0.1 安装说明

安装《云笺听雨-0.0.1.apk》。无需登录，界面、Source Serif 4 字体、插画、3D桌宠与功能代码均随包提供。聊天、附件、角色、记忆和 Key 保存在应用本机；AI、实时模型列表、天气、云端朗读和实时通话需要网络及对应服务商 Key。

版本名 0.0.1，Android 内部版本号 3，包名 chat.cloudlet.phone。沿用原签名，可覆盖此前 1.0.1 安装包；请先导出完整 ZIP 备份，覆盖安装时保留应用数据。不要先卸载旧版，卸载或清除应用数据会删除记录和 Key。

最低 Android 7，建议 Android 10 以上且 Android System WebView 已更新。Source Serif 4 的 TTF、WOFF2 和许可随包提供，汉字使用系统中文衬线回退。

文件导入、导出使用 Android 系统选择器。导出失败保留临时原件，可重新选择位置。旋转等常见配置变化保持当前界面；系统回收进程后的文件导入会提示重新选择，不会移动或删除原文件。设备朗读需要安装中文音色；云端 TTS 和实时语音需要对应权限与 Key。

网页版迁移：先导出完整 ZIP，在安装版设置中读取并恢复；Key 不进入备份，需要重新填写。单个附件 200 MB，完整 ZIP 附件总量 512 MB；实际容量取决于设备空间。

安装包约 {pathlib.Path('outputs/云笺听雨-0.0.1.apk').stat().st_size/1048576:.2f} MiB。签名 v2/v3、证书一致性、zipalign、ZIP CRC、24 个资源的 SHA-256 与源资产逐字节核对通过。56 项核心/接口检查通过，浏览器的网络、存储、摘要、朗读、导出与主题回归通过。

当前没有连接真实 Android 设备，也没有真实服务商 Key。尚未验证真机旋转/进程回收、麦克风、真实通话与真实 TTS 音质。有限测试不能证明绝对无缺陷。

APK SHA-256：`{report['apkSha256']}`

源码随《云笺听雨0.0.1源码.zip》《云笺听雨0.0.1Android源码.zip》提供。原《Android签名备份.zip》仍适用于以后更新，包含私钥和凭据，请勿作为源码分享。
''',encoding='utf-8')
print(json.dumps({'sourceArchivesCRC':'passed','privateSigningFilesExcluded':True,'apkSha256':report['apkSha256']},ensure_ascii=False))
