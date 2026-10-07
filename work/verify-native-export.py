from pathlib import Path
import argparse,subprocess,os,json,shutil,hashlib,datetime
p=argparse.ArgumentParser();p.add_argument('--adb',required=True);p.add_argument('--serial',default='emulator-5556');p.add_argument('--sdk',required=True);p.add_argument('--java',required=True);p.add_argument('--signing',required=True);a=p.parse_args();assert a.serial.startswith('emulator-')
root=Path(__file__).resolve().parents[1];stage=Path('D:/xiaofeng/dev-cache/cloudlet-apk/audit-instrumentation');stage.mkdir(exist_ok=True);tools=next(Path(a.sdk).rglob('aapt2.exe')).parent;android=next(Path(a.sdk).rglob('android.jar'));java=Path(a.java);env=os.environ.copy();info=json.loads((Path(a.signing)/'signing.json').read_text());env['CLOUDLET_SIGN_PASSWORD']=info['password'];env['JAVA_HOME']=str(java)
commands=[]
def run(args):
 r=subprocess.run(list(map(str,args)),capture_output=True,env=env,timeout=180);commands.append({'command':[str(v) for v in args],'exitCode':r.returncode});assert r.returncode==0,(r.stdout+r.stderr).decode(errors='replace');return r.stdout
(stage/'AndroidManifest.xml').write_text('<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="chat.cloudlet.audit"><uses-sdk android:minSdkVersion="24" android:targetSdkVersion="35"/><instrumentation android:name="chat.cloudlet.audit.QueueAudit" android:targetPackage="chat.cloudlet.phone"/><application android:label="Cloudlet disposable QA"/></manifest>')
for name in ['classes','dex']:(stage/name).mkdir(exist_ok=True)
source=stage/'QueueAudit.java';source.write_bytes((root/'work/qa/native/QueueAudit.java').read_bytes().removeprefix(b'\xef\xbb\xbf'))
base=Path('D:/xiaofeng/dev-cache/cloudlet-apk/audit001-final3/build/java-base/classes');assert base.exists()
run([java/'bin/javac.exe','-encoding','UTF-8','-source','8','-target','8','-bootclasspath',base,'-classpath',android,'-d',stage/'classes',source]);run([java/'bin/java.exe','-cp',tools/'lib/d8.jar','com.android.tools.r8.D8','--lib',android,'--min-api','24','--output',stage/'dex',*stage.glob('classes/**/*.class')]);run([tools/'aapt2.exe','link','-o',stage/'unsigned.apk','--manifest',stage/'AndroidManifest.xml','-I',android])
import zipfile
with zipfile.ZipFile(stage/'unsigned.apk','a') as z:z.write(stage/'dex/classes.dex','classes.dex')
run([tools/'zipalign.exe','-f','4',stage/'unsigned.apk',stage/'aligned.apk']);run([java/'bin/java.exe','-jar',tools/'lib/apksigner.jar','sign','--ks',Path(a.signing)/'cloudlet-release.p12','--ks-key-alias',info['alias'],'--ks-pass','env:CLOUDLET_SIGN_PASSWORD','--key-pass','env:CLOUDLET_SIGN_PASSWORD','--out',stage/'test.apk',stage/'aligned.apk'])
run([a.adb,'-s',a.serial,'install','-r',stage/'test.apk']);run([a.adb,'-s',a.serial,'shell','am','force-stop','chat.cloudlet.phone']);text=run([a.adb,'-s',a.serial,'shell','am','instrument','-w','chat.cloudlet.audit/.QueueAudit']).decode(errors='replace');assert 'INSTRUMENTATION_RESULT: result=passed' in text,text
report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'apkSha256':hashlib.sha256((root/'outputs/云笺听雨-0.0.1-系统隔离版.apk').read_bytes()).hexdigest(),'serial':a.serial,'result':text,'commands':commands,'testApkIncludedInProduct':False};(root/'outputs/云笺听雨原生导出队列验证.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report,ensure_ascii=False))
run([a.adb,'-s',a.serial,'uninstall','chat.cloudlet.audit'])
