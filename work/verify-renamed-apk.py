from pathlib import Path
import zipfile,hashlib,json,subprocess,re,collections,copy
apk=Path('outputs/云笺听雨.apk');stage=Path('D:/xiaofeng/dev-cache/cloudlet-apk/project/build/unsigned.apk')
java='D:/bin/java.exe';tools='D:/xiaofeng/dev-cache/cloudlet-apk/sdk/tools'
r=subprocess.run([java,'-jar',tools+'/lib/apksigner.jar','verify','--verbose','--print-certs',str(apk)],capture_output=True,text=True,encoding='utf-8',errors='replace',check=True)
assert 'v2): true' in r.stdout and 'v3): true' in r.stdout
fingerprint=re.search(r'certificate SHA-256 digest: ([a-f0-9]+)',r.stdout)[1];assert fingerprint==Path('work/apk-signing/previous-certificate-sha256.txt').read_text(encoding='ascii')
subprocess.run([tools+'/zipalign.exe','-c','4',str(apk)],check=True,capture_output=True)
resources=[]
with zipfile.ZipFile(apk) as signed,zipfile.ZipFile(stage) as unsigned:
 assert signed.testzip() is None;counts=collections.Counter(signed.namelist());assert all(v==1 for v in counts.values())
 for name in unsigned.namelist():
  info=copy.copy(unsigned.getinfo(name))
  with stage.open('rb') as f:
   f.seek(info.header_offset);header=f.read(30);rawName=f.read(int.from_bytes(header[26:28],'little')).decode('utf-8');info.filename=info.orig_filename=rawName
  expected=hashlib.sha256(unsigned.read(info)).hexdigest();actual=hashlib.sha256(signed.read(name)).hexdigest();assert actual==expected,name
  resources.append({'path':name,'bytes':len(signed.read(name)),'sha256':actual})
 for file in Path('outputs/android/assets').rglob('*'):
  if file.is_file():assert signed.read('assets/'+file.relative_to('outputs/android/assets').as_posix())==file.read_bytes(),str(file)
 assert set(unsigned.namelist()).issubset(signed.namelist())
 assert set(signed.namelist())-set(unsigned.namelist()) <= {'META-INF/CLOUDLET.RSA','META-INF/CLOUDLET.SF','META-INF/MANIFEST.MF'}
r=subprocess.run([tools+'/aapt2.exe','dump','badging',str(apk)],capture_output=True,text=True,encoding='utf-8',errors='replace',check=True)
assert "application-label:'云笺听雨'" in r.stdout and "versionCode='2'" in r.stdout
report={'name':'云笺听雨','package':'chat.cloudlet.phone','version':'1.0.1','versionCode':2,'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'signerCertificateSha256':fingerprint,'sameSignerAsPrevious':True,'signatureV2':True,'signatureV3':True,'zipAlignment':True,'crc':True,'matchesUnsignedBuild':True,'matchesBundledAssets':True,'resources':resources}
Path('outputs/云笺听雨资源校验清单.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
Path('outputs/云笺听雨签名与完整性报告.md').write_text(f'''# 云笺听雨 · 签名与资源完整性验证

四字名称：云笺听雨。「云」承接云朵桌宠，「笺」呼应纸条、日记与聊天，「听雨」点出一起听和安静陪伴。

- Android安装名称与应用内品牌已更新，版本1.0.1（versionCode 2）。
- 包名保持chat.cloudlet.phone，签名与原安装包相同，可覆盖更新，保留原应用数据。
- 发布签名：RSA 3072，Android APK v2/v3验证通过。
- ZIP所有条目CRC通过，无重复文件；4字节对齐通过。
- {len(resources)}个包内文件逐项SHA-256与本轮未签名构建一致。
- 所有随包界面、字体、插画、3D脚本等资产与源资产逐字节一致。
- 无需登录的启动、记录恢复、API流式适配、朗读及导出桥接检查通过，未做安卓真机安装或真实Key测试。

APK SHA-256：`{report['apkSha256']}`

签名证书 SHA-256：`{fingerprint}`

每个文件的摘要与大小见《云笺听雨资源校验清单.json》。签名私钥另存于《Android签名备份.zip》，未放入APK或源码包，后续更新复用该签名。
''',encoding='utf-8')
p=Path('outputs/APK安装说明.md');s=p.read_text(encoding='utf-8').replace('云朵小手机','云笺听雨').replace('版本1.0.0','版本1.0.1').replace('2111d0e0d30d7375f880f00e9279fa4d165aa3f634d74db58a6dba53ae5961bb',report['apkSha256']);p.write_text(s,encoding='utf-8')
print(json.dumps({'name':report['name'],'filesVerified':len(resources),'signature':'v2/v3 passed','sameSigner':True,'assetsMatch':True,'crc':'passed','alignment':'passed'},ensure_ascii=False))
