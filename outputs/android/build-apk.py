"""Build on Windows/Linux; release signing always requires the original key."""
import argparse, hashlib, json, os, pathlib, shutil, subprocess, zipfile, xml.etree.ElementTree as ET
from importlib.util import spec_from_file_location, module_from_spec

CERTIFICATE_SHA256 = '7637f3313e8b45650d714347b2b477fd7d3fb4c9d3c69c6a9a2f5c5a16f50a79'
APKTOOL_SHA256 = 'dbf930b076c6b9be08d57c449cacefc3bdd6b71ebd59b3066fc0e1f5b14f9423'
parser = argparse.ArgumentParser()
for name in ('sdk', 'java', 'output', 'apktool'):
    parser.add_argument('--' + name, required=True)
parser.add_argument('--signing')
parser.add_argument('--independent', action='store_true', help='Separate 0.0.2 app, package and certificate')
parser.add_argument('--unsigned', action='store_true', help='Build an aligned, non-installable APK for verification only')
args = parser.parse_args()
if args.unsigned and args.signing:
    parser.error('--unsigned cannot be combined with --signing')
project = pathlib.Path(__file__).resolve().parent
sdk, java = pathlib.Path(args.sdk), pathlib.Path(args.java)
env = os.environ.copy()
env['JAVA_HOME'] = str(java)
env['PATH'] = str(java / 'bin') + os.pathsep + env.get('PATH', '')
suffix = '.exe' if os.name == 'nt' else ''
def jdk(name):
    return java / 'bin' / (name + suffix)
def run(cmd):
    result = subprocess.run([str(x) for x in cmd], env=env, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if result.returncode:
        print(result.stdout + result.stderr)
        raise SystemExit(result.returncode)
    return result.stdout
# Fail before compiling if an update cannot retain its installation identity.
if not args.unsigned:
    if not args.signing:
        raise SystemExit('Original release signing directory is required; no replacement key will be generated.')
    signing = pathlib.Path(args.signing)
    metadata, keystore = signing / 'signing.json', signing / 'cloudlet-release.p12'
    if not metadata.is_file() or not keystore.is_file():
        raise SystemExit('Release signing files are missing; refusing to create a replacement key.')
    info = json.loads(metadata.read_text(encoding='utf-8'))
    env['CLOUDLET_SIGN_PASSWORD'] = info['password']
    certificate = subprocess.run([str(jdk('keytool')), '-exportcert', '-keystore', str(keystore), '-alias', info['alias'], '-storepass:env', 'CLOUDLET_SIGN_PASSWORD'], env=env, capture_output=True, check=True).stdout
    certificate_sha256 = hashlib.sha256(certificate).hexdigest()
    if args.independent:
        if info['alias'] != 'yunjian-v002' or certificate_sha256 == CERTIFICATE_SHA256:
            raise SystemExit('Independent edition requires a distinct yunjian-v002 signing key.')
    elif certificate_sha256 != CERTIFICATE_SHA256:
        raise SystemExit('Release signing certificate does not match the existing application.')
via = project / 'vendor/via-release-cn.apk'
if not via.is_file():
    raise SystemExit('The original bundled Via binary is required.')
apktool = pathlib.Path(args.apktool)
if hashlib.sha256(apktool.read_bytes()).hexdigest() != APKTOOL_SHA256:
    raise SystemExit('Apktool must match the pinned 3.0.3 SHA-256.')
tools = sdk / 'build-tools/35.0.0'
android = sdk / 'platforms/android-35/android.jar'
if not (tools / ('aapt2' + suffix)).is_file() or not android.is_file():
    raise SystemExit('Android platform 35 and Build Tools 35.0.0 are required.')
def tool(name):
    return tools / (name + suffix)
build = project / 'build'
if build.exists():
    shutil.rmtree(build)
for directory in ('generated', 'classes', 'dex'):
    (build / directory).mkdir(parents=True, exist_ok=True)
manifest_path = project / 'AndroidManifest.xml'
if args.independent:
    manifest = ET.parse(manifest_path)
    root = manifest.getroot()
    if root.attrib.get('package') != 'chat.cloudlet.phone':
        raise SystemExit('Unexpected original package identity')
    root.set('package', 'chat.cloudlet.phone.v002')
    root.find('application').set('{http://schemas.android.com/apk/res/android}label', '云笺听雨 ' + root.get('{http://schemas.android.com/apk/res/android}versionName', '0.0.2') + ' 独立版')
    manifest_path = build / 'AndroidManifest-standalone.xml'
    manifest.write(manifest_path, encoding='utf-8', xml_declaration=True)
run([tool('aapt2'), 'compile', '--dir', project / 'res', '-o', build / 'resources.zip'])
run([tool('aapt2'), 'link', '-o', build / 'unsigned.apk', '--manifest', manifest_path, '-I', android, '--java', build / 'generated', '--auto-add-overlay', '-R', build / 'resources.zip', '-A', project / 'assets', '--min-sdk-version', '24', '--target-sdk-version', '35'])
sources = [*project.glob('src/**/*.java'), *build.glob('generated/**/*.java')]
run([jdk('javac'), '-encoding', 'UTF-8', '--release', '8', '-classpath', android, '-d', build / 'classes', *sources])
run([jdk('java'), '-cp', tools / 'lib/d8.jar', 'com.android.tools.r8.D8', '--lib', android, '--min-api', '24', '--output', build / 'dex', *build.glob('classes/**/*.class')])
spec = spec_from_file_location('merge_via', project / 'merge-via.py')
module = module_from_spec(spec)
spec.loader.exec_module(module)
# Apktool attempts to chmod --aapt. Android SDK binaries may be owned by root on CI.
# Use an identical byte-for-byte private copy to avoid touching the installed SDK.
local_aapt = build / ('aapt2' + suffix)
shutil.copy2(tool('aapt2'), local_aapt)
if os.name != 'nt':
    local_aapt.chmod(local_aapt.stat().st_mode | 0o111)
module.merge_via(project, build, via, apktool, jdk('java'), local_aapt, env, manifest_path)
run([tool('zipalign'), '-f', '4', build / 'unsigned.apk', build / 'aligned.apk'])
output = pathlib.Path(args.output).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
if args.unsigned:
    shutil.copyfile(build / 'aligned.apk', output)
else:
    run([jdk('java'), '-jar', tools / 'lib/apksigner.jar', 'sign', '--ks', keystore, '--ks-key-alias', info['alias'], '--ks-pass', 'env:CLOUDLET_SIGN_PASSWORD', '--key-pass', 'env:CLOUDLET_SIGN_PASSWORD', '--out', output, build / 'aligned.apk'])
    run([jdk('java'), '-jar', tools / 'lib/apksigner.jar', 'verify', '--verbose', output])
run([tool('zipalign'), '-c', '4', output])
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist()))
    assert archive.read('classes2.dex') == (build / 'dex/classes.dex').read_bytes()
    for file in (project / 'assets').rglob('*'):
        if file.is_file():
            assert archive.read(file.relative_to(project).as_posix()) == file.read_bytes()
print(json.dumps({'apk':str(output), 'bytes':output.stat().st_size, 'sha256':hashlib.sha256(output.read_bytes()).hexdigest(), 'signature':'unsigned; not installable' if args.unsigned else ('independent certificate verified' if args.independent else 'original certificate verified'), 'package':'chat.cloudlet.phone.v002' if args.independent else 'chat.cloudlet.phone', 'alignment':'verified', 'crc':'verified', 'bundledAssets':'exact', 'nativeDex':'exact'}, ensure_ascii=False))
