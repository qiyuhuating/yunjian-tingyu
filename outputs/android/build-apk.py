import argparse,pathlib,subprocess,os,zipfile,secrets,json,hashlib
parser=argparse.ArgumentParser();parser.add_argument('--sdk',required=True);parser.add_argument('--java',required=True);parser.add_argument('--signing',required=True);parser.add_argument('--output',required=True);args=parser.parse_args()
project=pathlib.Path(__file__).resolve().parent;sdk=pathlib.Path(args.sdk);java=pathlib.Path(args.java);build=project/'build';build.mkdir(exist_ok=True);signing=pathlib.Path(args.signing);signing.mkdir(parents=True,exist_ok=True)
tools=next(sdk.rglob('aapt2.exe')).parent;android=next(sdk.rglob('android.jar'));env=os.environ.copy();env['JAVA_HOME']=str(java);env['PATH']=str(java/'bin')+os.pathsep+env.get('PATH','')
def run(cmd):
 result=subprocess.run([str(x) for x in cmd],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,encoding='utf-8',errors='replace')
 if result.returncode:print(result.stdout);raise SystemExit(result.returncode)
base=build/'java-base'
if not (base/'classes/java/lang/Object.class').exists():run([java/'bin/jmod.exe','extract','--dir',base,java/'jmods/java.base.jmod'])
run([tools/'aapt2.exe','compile','--dir',project/'res','-o',build/'resources.zip'])
(build/'generated').mkdir(exist_ok=True);(build/'classes').mkdir(exist_ok=True);(build/'dex').mkdir(exist_ok=True)
run([tools/'aapt2.exe','link','-o',build/'unsigned.apk','--manifest',project/'AndroidManifest.xml','-I',android,'--java',build/'generated','--auto-add-overlay','-R',build/'resources.zip','-A',project/'assets','--min-sdk-version','24','--target-sdk-version','35'])
sources=[*project.glob('src/**/*.java'),*build.glob('generated/**/*.java')]
run([java/'bin/javac.exe','-encoding','UTF-8','-source','8','-target','8','-bootclasspath',base/'classes','-classpath',android,'-d',build/'classes',*sources])
run([java/'bin/java.exe','-cp',tools/'lib/d8.jar','com.android.tools.r8.D8','--lib',android,'--min-api','24','--output',build/'dex',*build.glob('classes/**/*.class')])
with zipfile.ZipFile(build/'unsigned.apk','a',compression=zipfile.ZIP_DEFLATED) as archive:
 for dex in (build/'dex').glob('*.dex'):archive.write(dex,dex.name)
run([tools/'zipalign.exe','-f','4',build/'unsigned.apk',build/'aligned.apk'])
metadata=signing/'signing.json';keystore=signing/'cloudlet-release.p12'
if not metadata.exists():metadata.write_text(json.dumps({'alias':'cloudlet','password':secrets.token_urlsafe(32)}),encoding='utf-8')
info=json.loads(metadata.read_text(encoding='utf-8'));env['CLOUDLET_SIGN_PASSWORD']=info['password']
if not keystore.exists():run([java/'bin/keytool.exe','-genkeypair','-keystore',keystore,'-storetype','PKCS12','-alias',info['alias'],'-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Cloudlet Personal Android,OU=Personal,O=Cloudlet,C=CN','-storepass:env','CLOUDLET_SIGN_PASSWORD','-keypass:env','CLOUDLET_SIGN_PASSWORD'])
output=pathlib.Path(args.output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
run([java/'bin/java.exe','-jar',tools/'lib/apksigner.jar','sign','--ks',keystore,'--ks-key-alias',info['alias'],'--ks-pass','env:CLOUDLET_SIGN_PASSWORD','--key-pass','env:CLOUDLET_SIGN_PASSWORD','--out',output,build/'aligned.apk'])
run([java/'bin/java.exe','-jar',tools/'lib/apksigner.jar','verify','--verbose',output]);run([tools/'zipalign.exe','-c','4',output])
print(json.dumps({'apk':str(output),'bytes':output.stat().st_size,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'signature':'verified','alignment':'verified'},ensure_ascii=False))
