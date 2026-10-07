from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parents[1])
import zipfile,hashlib,json,subprocess,re,collections,copy
apk=Path('outputs/云笺听雨-0.0.1-系统隔离版.apk');stage=Path('D:/xiaofeng/dev-cache/cloudlet-apk/audit001-final3/build/unsigned.apk')
java='D:/bin/java.exe';tools='D:/xiaofeng/dev-cache/cloudlet-apk/sdk/tools'
r=subprocess.run([java,'-jar',tools+'/lib/apksigner.jar','verify','--verbose','--print-certs',str(apk)],capture_output=True,text=True,encoding='utf-8',errors='replace',check=True)
assert 'v2): true' in r.stdout and 'v3): true' in r.stdout
fingerprint=re.search(r'certificate SHA-256 digest: ([a-f0-9]+)',r.stdout)[1];assert fingerprint=='7637f3313e8b45650d714347b2b477fd7d3fb4c9d3c69c6a9a2f5c5a16f50a79'
subprocess.run([tools+'/zipalign.exe','-c','4',str(apk)],check=True,capture_output=True)
assert Path('outputs/android/src/chat/cloudlet/phone/MainActivity.java').read_bytes()==Path('D:/xiaofeng/dev-cache/cloudlet-apk/audit001-final3/src/chat/cloudlet/phone/MainActivity.java').read_bytes()
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
 expectedAssets={'assets/'+file.relative_to('outputs/android/assets').as_posix() for file in Path('outputs/android/assets').rglob('*') if file.is_file()}
 with zipfile.ZipFile('outputs/android/vendor/via-release-cn.apk') as via:
  expectedAssets |= {name for name in via.namelist() if name.startswith('assets/')}
  original=via.read('classes.dex')
  merged=signed.read('classes.dex')
  expectedDex=bytearray(original.replace(b'mark.via.provider\0',b'mark.via.phoneapi\0'))
  import struct,zlib
  expectedDex[12:32]=hashlib.sha1(expectedDex[32:]).digest()
  struct.pack_into('<I',expectedDex,8,zlib.adler32(expectedDex[12:])&0xffffffff)
  assert merged==expectedDex
  for name in via.namelist():
   if name.startswith('assets/'):assert signed.read(name)==via.read(name)
 assert {name for name in signed.namelist() if name.startswith('assets/')}==expectedAssets
 assert set(unsigned.namelist()).issubset(signed.namelist())
 assert set(signed.namelist())-set(unsigned.namelist()) <= {'META-INF/CLOUDLET.RSA','META-INF/CLOUDLET.SF','META-INF/MANIFEST.MF'}
r=subprocess.run([tools+'/aapt2.exe','dump','badging',str(apk)],capture_output=True,text=True,encoding='utf-8',errors='replace',check=True)
assert "versionName='0.0.1'" in r.stdout
assert "application-label:'云笺听雨'" in r.stdout and "versionCode='6'" in r.stdout
report={'name':'云笺听雨','package':'chat.cloudlet.phone','version':'0.0.1','versionCode':6,'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'signerCertificateSha256':fingerprint,'sameSignerAsPrevious':True,'signatureV2':True,'signatureV3':True,'zipAlignment':True,'crc':True,'matchesUnsignedBuild':True,'matchesBundledAssets':True,'resources':resources}
Path('outputs/云笺听雨系统隔离资源校验清单.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
Path('outputs/云笺听雨系统隔离签名与完整性报告.md').write_text(f'''# 云笺听雨 · 签名与资源完整性验证

四字名称：云笺听雨。「云」承接云朵桌宠，「笺」呼应纸条、日记与聊天，「听雨」点出一起听和安静陪伴。

- Android安装名称与应用内品牌已更新，版本0.0.1（versionCode 6）。
- 包名保持chat.cloudlet.phone，签名与原安装包相同，可覆盖更新，保留原应用数据。
- 发布签名：RSA 3072，Android APK v2/v3验证通过。
- ZIP所有条目CRC通过，无重复文件；4字节对齐通过。
- {len(resources)}个包内文件逐项SHA-256与本轮未签名构建一致。
- 所有随包界面、字体、插画、3D脚本等资产与源资产逐字节一致。
- 103 组具名核心检查、严格类型检查与 7 组浏览器回归通过；覆盖群聊、浅暗主题、本地保存、流式适配、朗读及导出桥接，另在 Android 15 / WebView 124 模拟器完成实际安装、Via 浏览与返回、本地日记持久化验证；未做真机或真实 Key 测试。

APK SHA-256：`{report['apkSha256']}`

签名证书 SHA-256：`{fingerprint}`

每个文件的摘要与大小见《云笺听雨系统隔离资源校验清单.json》。签名私钥另存于《Android签名备份.zip》，未放入APK或源码包，后续更新复用该签名。
''',encoding='utf-8')
print(json.dumps({'name':report['name'],'filesVerified':len(resources),'signature':'v2/v3 passed','sameSigner':True,'assetsMatch':True,'crc':'passed','alignment':'passed'},ensure_ascii=False))
