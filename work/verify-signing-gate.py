"""Exercise the real release signing preflight without creating product output."""
from pathlib import Path
import argparse,subprocess,tempfile,secrets,json,os,datetime
p=argparse.ArgumentParser();p.add_argument('--sdk',required=True);p.add_argument('--java',required=True);a=p.parse_args();root=Path(__file__).resolve().parents[1];java=Path(a.java);checks=[]
with tempfile.TemporaryDirectory(prefix='cloudlet-signing-gate-') as temporary:
 folder=Path(temporary);signing=folder/'signing';output=folder/'product.apk';signing.mkdir()
 args=['python','-X','utf8',str(root/'outputs/android/build-apk.py'),'--sdk',a.sdk,'--java',a.java,'--signing',str(signing),'--output',str(output)]
 r=subprocess.run(args,capture_output=True,text=True,encoding='utf-8');assert r.returncode!=0 and 'Release signing files are missing' in r.stdout+r.stderr;assert not list(signing.iterdir()) and not output.exists();checks.append('Missing signing files fail before generating a replacement key or APK')
 password=secrets.token_urlsafe(32);(signing/'signing.json').write_text(json.dumps({'alias':'temporary','password':password}));env=os.environ.copy();env['CLOUDLET_QA_PASSWORD']=password
 subprocess.run([str(java/'bin/keytool.exe'),'-genkeypair','-keystore',str(signing/'cloudlet-release.p12'),'-storetype','PKCS12','-alias','temporary','-keyalg','RSA','-keysize','2048','-validity','1','-dname','CN=Disposable QA','-storepass:env','CLOUDLET_QA_PASSWORD'],env=env,capture_output=True,check=True)
 r=subprocess.run(args,capture_output=True,text=True,encoding='utf-8');assert r.returncode!=0 and 'certificate does not match' in r.stdout+r.stderr;assert not output.exists();checks.append('A different valid private key is rejected by the existing certificate gate')
report={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'passed':checks,'temporaryKeysDeleted':True};(root/'outputs/云笺听雨构建签名门禁验证.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(report))
