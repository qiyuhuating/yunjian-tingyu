"""Export the independent frontend with its transitive sources and runtime assets."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import zipfile

repo = Path(__file__).resolve().parents[1]
app = repo / 'outputs/mori-phone'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--build', type=Path, required=True, help='Fresh android-web Vite build')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
options = json.loads((app / 'tsconfig.json').read_text(encoding='utf-8'))['compilerOptions']
options.update(types=['node'], incremental=False)
options.pop('plugins', None)
config = {'compilerOptions': options, 'files': ['android-web/main.tsx', 'android-web/vite.config.ts', 'vite-assets.d.ts']}
with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', suffix='.json', prefix='ui-export-', dir=app, delete=False) as temp:
    json.dump(config, temp)
    config_path = Path(temp.name)
try:
    listing = subprocess.check_output(['node', str(app / 'node_modules/typescript/bin/tsc'), '--listFilesOnly', '-p', str(config_path)], cwd=app).decode('utf-8')
finally:
    config_path.unlink()
files = {}
for name in listing.splitlines():
    path = Path(name)
    if path.is_relative_to(app) and 'node_modules' not in path.parts:
        files['source/' + path.relative_to(app).as_posix()] = path.read_bytes()
for folder in ['public', 'vendor']:
    for path in (app / folder).rglob('*'):
        if path.is_file():
            files['source/' + path.relative_to(app).as_posix()] = path.read_bytes()
for path in (app / 'app').glob('*.css'):
    files['source/app/' + path.name] = path.read_bytes()
for name in ['android-web/index.html', 'postcss.config.mjs', 'package-lock.json', '.npmrc']:
    files['source/' + name] = (app / name).read_bytes()
package = json.loads((app / 'package.json').read_text(encoding='utf-8'))
package['scripts'] = {
    'dev': 'vite --config android-web/vite.config.ts --host 127.0.0.1',
    'build': 'vite build --config android-web/vite.config.ts --outDir ../dist',
    'preview': 'vite preview --config android-web/vite.config.ts --outDir ../dist --host 127.0.0.1',
    'typecheck': 'tsc --noEmit --noUnusedLocals --noUnusedParameters',
}
files['source/package.json'] = (json.dumps(package, ensure_ascii=False, indent=2) + '\n').encode()
files['source/tsconfig.json'] = (json.dumps(config, indent=2) + '\n').encode()
build = args.build.resolve()
assert (build / 'index.html').is_file(), 'Build first; no preview index found'
for path in build.rglob('*'):
    if path.is_file():
        files['preview/' + path.relative_to(build).as_posix()] = path.read_bytes()
files['README.md'] = '''# 云笺听雨 · 前端 UI

source/ 是独立前端源码和运行资源；preview/ 是生产构建；MANIFEST.json 记录文件摘要。

直接预览：在本目录运行 `python -m http.server 5173 --bind 127.0.0.1 --directory preview`，打开 http://127.0.0.1:5173。

修改界面：进入 source/，使用 Node.js 22.13+ 执行 `npm ci`、`npm run dev`。
检查与构建：`npm run typecheck`、`npm run build`；构建后用 `npm run preview`。

入口为 android-web/main.tsx，页面在 app/，共享业务在 lib/。依赖版本与原锁文件一致。
本包按 TypeScript 导入关系收集源码，保留动态导入、插画、字体、许可和业务提示词逻辑。
已排除 UI 优化提示词、历史材料、测试报告、参考截图、后端路由、数据库、云部署配置及开发缓存。
浏览器可独立预览；原生语音、保存和内置浏览器桥接需原 Android 壳。本包不含 APK 或用户数据。
'''.encode('utf-8')
manifest = {'format': 'yunjian-frontend-clean', 'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo).decode().strip(), 'files': [
    {'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()} for name, data in sorted(files.items())
]}
files['MANIFEST.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode()
args.output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name, data in sorted(files.items()):
        archive.writestr('yunjian-ui/' + name, data)
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert len(archive.namelist()) == len(set(archive.namelist()))
    for item in manifest['files']:
        data = archive.read('yunjian-ui/' + item['path'])
        assert len(data) == item['bytes'] and hashlib.sha256(data).hexdigest() == item['sha256']
print(json.dumps({'files': len(files), 'bytes': args.output.stat().st_size, 'sha256': hashlib.sha256(args.output.read_bytes()).hexdigest()}))
