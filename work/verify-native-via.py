"""Exercise a signed APK on a disposable emulator, using its real native UI."""
from pathlib import Path
import tempfile,shutil,datetime, argparse, hashlib, http.server, json, re, subprocess, threading, time
import xml.etree.ElementTree as ET

parser=argparse.ArgumentParser()
parser.add_argument('--adb', required=True)
parser.add_argument('--serial', default='emulator-5556')
parser.add_argument('--legacy-serial')
parser.add_argument('--upgrade-from')
parser.add_argument('--attachments',action='store_true')
args=parser.parse_args()
assert args.serial.startswith('emulator-'), 'This test changes disposable emulator data only.'
root=Path(__file__).resolve().parents[1]
artifact=root/'outputs/云笺听雨-0.0.1-系统隔离版.apk'
fixture_dir=tempfile.TemporaryDirectory(prefix='cloudlet-native-')
apk=Path(fixture_dir.name)/artifact.name;shutil.copy2(artifact,apk)
checks=[];dump_warnings=[];command_log=[];started=datetime.datetime.now(datetime.timezone.utc).isoformat()
def adb(*command):
    result=subprocess.run([args.adb,'-s',args.serial,*command],capture_output=True,timeout=45)
    command_log.append({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'command':list(command),'exitCode':result.returncode,'stdoutBytes':len(result.stdout),'stderr':result.stderr.decode(errors='replace')[:1000]})
    assert result.returncode==0,(result.stdout+result.stderr).decode(errors='replace')
    return result.stdout
def shell(*command): return adb('shell',*command).decode('utf-8',errors='replace')
def nodes():
    for attempt in range(3):
        shell('rm','-f','/sdcard/cloudlet-verify.xml')
        try:
            dumped=subprocess.run([args.adb,'-s',args.serial,'shell','uiautomator','dump','/sdcard/cloudlet-verify.xml'],capture_output=True,timeout=45)
            # Some emulator UiAutomation versions exit 1 after successfully writing.
            # Read only a newly created, valid tree; the prior dump was removed above.
            tree=ET.fromstring(shell('cat','/sdcard/cloudlet-verify.xml'))
            if dumped.returncode:dump_warnings.append({'exitCode':dumped.returncode,'output':(dumped.stdout+dumped.stderr).decode(errors='replace')[:1000]})
            return list(tree.iter('node'))
        except subprocess.TimeoutExpired:
            dump_warnings.append({'timeoutSeconds':45,'attempt':attempt+1})
            # End only a stuck test instrumentation process on the disposable emulator.
            shell('pkill','-f','[c]om.android.commands.uiautomator')
            if attempt==2:raise
            time.sleep(.5)
        except (AssertionError,ET.ParseError):
            if attempt==2:raise
            time.sleep(.5)
def find(label, timeout=20, class_name=None):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        for node in nodes():
            if label in {node.get('text'),node.get('content-desc')} and (not class_name or node.get('class')==class_name):return node
        time.sleep(.5)
    raise AssertionError('Missing native UI: '+label)
def tap(node):
    left,top,right,bottom=map(int,re.findall(r'\d+',node.get('bounds')))
    shell('input','tap',str((left+right)//2),str((top+bottom)//2))
def click(label): tap(find(label))
def capture(name):
    shell('screencap','-p','/sdcard/cloudlet-verify.png')
    adb('pull','/sdcard/cloudlet-verify.png',str(root/'outputs'/name))
def foreground():
    value=shell('dumpsys','activity','activities')
    return next(line.strip() for line in value.splitlines() if 'topResumedActivity=' in line)

def pick_download(name):
    click('发送文件、图片或表情包');time.sleep(1)
    current=nodes()
    if not any(n.get('text')==name for n in current):
        roots=next(n for n in current if n.get('content-desc') in {'Show roots','显示根目录','显示位置'})
        tap(roots);click('Downloads')
    click(name)

class Fixture(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        second=self.path.startswith('/two')
        title='ViaPageTwo' if second else 'ViaPageOne'
        text=f'''<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title>
        <h1>{title}</h1><p id="isolation">CheckingBridge</p><a href="/two">GoToSecondPage</a>
        <script>document.getElementById('isolation').textContent=typeof Android==='undefined'&&typeof NativeHTTP==='undefined'?'BridgeIsolated':'BridgeExposed';</script>'''
        self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(text.encode())
    def log_message(self,*args):pass

server=http.server.ThreadingHTTPServer(('127.0.0.1',18743),Fixture)
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    if args.upgrade_from:
        # Only disposable emulator data is cleared to establish a real old-version fixture.
        assert Path(args.upgrade_from).is_file()
        adb('uninstall','chat.cloudlet.phone')
        adb('install',str(Path(args.upgrade_from).resolve()))
        shell('am','start','-W','-n','chat.cloudlet.phone/.MainActivity');time.sleep(3)
        click('日记');find('把今天收好')
        editor=next(n for n in nodes() if n.get('class')=='android.widget.EditText' and n.get('enabled')=='true')
        tap(editor);shell('input','text','NativeUpgradeDiary');shell('input','keyevent','4');click('把今天收好');find('NativeUpgradeDiary')
        shell('am','force-stop','chat.cloudlet.phone')
    adb('install','-r',str(root/'outputs/android/vendor/via-release-cn.apk'));checks.append('Standalone Via and packaged Via install together without provider conflict')
    adb('install','-r',str(apk));shell('am','force-stop','chat.cloudlet.phone');adb('logcat','-c')
    shell('am','start','-W','-n','chat.cloudlet.phone/.MainActivity')
    time.sleep(3)
    initial=nodes();immersive=next((n for n in initial if n.get('text') in {'Got it','知道了'}),None)
    if immersive is not None:tap(immersive)
    find('浏览器');find('设置');checks.append('Signed APK installs and local home loads')
    if args.upgrade_from:
        click('日记');find('NativeUpgradeDiary');shell('input','keyevent','4');find('浏览器');checks.append('Real prior-version-to-current signed update preserves existing local IndexedDB diary')
    # Native navigation controls must be outside the app dock, not painted over it.
    home_nodes=nodes();web=next(n for n in home_nodes if n.get('class')=='android.webkit.WebView')
    web_bounds=list(map(int,re.findall(r'\d+',web.get('bounds'))))
    for label in ['首页','日历','记忆','设置']:
        dock=next(n for n in home_nodes if label in {n.get('text'),n.get('content-desc')})
        bounds=list(map(int,re.findall(r'\d+',dock.get('bounds'))))
        assert web_bounds[1]<=bounds[1]<bounds[3]<=web_bounds[3],(label,bounds,web_bounds)
    capture('Android验证-首页.png');checks.append('Original four-tab illustrated dock has fully visible bounds')
    click('日记');find('把今天收好')
    editor=next(n for n in nodes() if n.get('class')=='android.widget.EditText' and n.get('enabled')=='true')
    tap(editor);shell('input','text','NativeLocalDiary');shell('input','keyevent','4');click('把今天收好');find('NativeLocalDiary')
    shell('input','keyevent','4');find('浏览器');click('浏览器')
    time.sleep(1)
    current=nodes()
    agree=next((n for n in current if n.get('text') in {'Agree','同意','同意并继续'}),None)
    if agree is not None:tap(agree);time.sleep(2)
    find('回到云笺听雨');assert 'chat.cloudlet.phone/mark.via.Shell' in foreground();checks.append('Home browser enters packaged Via Shell in same application')
    current=nodes()
    address=next(n for n in current if n.get('class')=='android.widget.TextView' and n.get('text') and n.get('content-desc') not in {'回到云笺听雨'} and int(re.findall(r'\d+',n.get('bounds'))[0])>0 and int(re.findall(r'\d+',n.get('bounds'))[1])<650)
    tap(address)
    shell('input','keycombination','113','29')
    shell('input','text','http://10.0.2.2:18743/one');shell('input','keyevent','66')
    find('BridgeIsolated');find('ViaPageOne');checks.append('Via loads actual HTTP document; privileged app bridge is absent')
    capture('Android验证-Via.png')
    header=find('回到云笺听雨');address=find('ViaPageOne',class_name='android.widget.TextView')
    assert int(re.findall(r'\d+',header.get('bounds'))[3])<=int(re.findall(r'\d+',address.get('bounds'))[1])
    checks.append('Return control has reserved space and does not cover address bar')
    click('GoToSecondPage');find('ViaPageTwo');shell('input','keyevent','4');find('ViaPageOne');checks.append('Native Via link navigation and Back history work')
    click('回到云笺听雨');find('浏览器');assert 'chat.cloudlet.phone/.MainActivity' in foreground();checks.append('Return control opens local home without external application')
    shell('am','force-stop','chat.cloudlet.phone');shell('am','start','-W','-n','chat.cloudlet.phone/.MainActivity');find('日记');click('日记');find('NativeLocalDiary');checks.append('Local diary persists across browser use and process restart')
    if args.attachments:
        adb('push',str(root/'work/qa/fixtures/reading.pdf'),'/sdcard/Download/CloudletReading.pdf')
        binary=root/'work/qa/fixtures/unknown.bin'
        adb('push',str(binary),'/sdcard/Download/CloudletUnknown.bin')
        shell('input','keyevent','4');click('聊天')
        friend=next(n for n in nodes() if n.get('class')=='android.widget.Button' and '云汐' in (n.get('text','')+' '+n.get('content-desc','')))
        tap(friend);pick_download('CloudletReading.pdf');find('已读取 PDF 文字 1/1 页',timeout=30)
        checks.append('Actual Android file picker and bundled PDF module worker extract PDF text offline')
        pick_download('CloudletUnknown.bin');find('原文件已保存；此格式暂未解析，模型没有收到文件内容')
        checks.append('Actual Android file picker accepts unknown binary; local message exposes honest reading status')
        capture('Android验证-文件读取.png')
    log=adb('logcat','-d','-s','AndroidRuntime','chromium').decode('utf-8',errors='replace')
    assert 'FATAL EXCEPTION' not in log and 'Uncaught ' not in log,log
    (root/'outputs/Android审计验证-logcat.txt').write_bytes(log.replace('\r\n','\n').replace('\r','').encode('utf-8'))
    checks.append('No native crash or uncaught WebView script error')
    if args.legacy_serial:
        assert args.legacy_serial.startswith('emulator-')
        modern=args.serial;args.serial=args.legacy_serial
        adb('install','-r',str(apk));shell('am','force-stop','chat.cloudlet.phone');adb('logcat','-c');shell('am','start','-W','-n','chat.cloudlet.phone/.MainActivity')
        find('先更新一下浏览器内核');checks.append('WebView 83 displays explicit update requirement instead of blank home')
        click('知道了');time.sleep(.5)
        assert 'FATAL EXCEPTION' not in adb('logcat','-d','-s','AndroidRuntime').decode(errors='replace')
        checks.append('Legacy compatibility dialog closes without null-WebView lifecycle crash')
        args.serial=modern
    report={'apkSha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'device':args.serial,'androidSdk':shell('getprop','ro.build.version.sdk').strip(),'display':shell('wm','size').strip(),'density':shell('wm','density').strip(),'webView':shell('dumpsys','webviewupdate').split('Current WebView package (name, version): ')[1].splitlines()[0],'passed':checks,'realProviderKeyTested':False,'physicalDeviceTested':False}
    report['uiautomatorWarnings']=dump_warnings
    report['startedAt']=started;report['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();report['commands']=command_log
    (root/'outputs/云笺听雨Android内置Via验证.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({k:report[k] for k in ['apkSha256','device','passed','startedAt','finishedAt']},ensure_ascii=False))
finally:
    server.shutdown()
