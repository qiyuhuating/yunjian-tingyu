"""Stage only a fresh Vite dependency graph, public runtime files and native assets."""
import hashlib
import json
from pathlib import Path
import re
import shutil

def stage_assets(project, web, public, destination):
    project, web, public, destination = map(lambda p: Path(p).resolve(), (project, web, public, destination))
    manifest_path = web / '.vite/manifest.json'
    if not manifest_path.is_file():
        raise ValueError('Fresh Android Web build with Vite manifest required; rebuild before packaging.')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    selected, visited = {'index.html'}, set()
    def visit(key):
        if key in visited:
            return
        visited.add(key)
        record = manifest[key]
        selected.add(record['file'])
        selected.update(record.get('css', []))
        selected.update(record.get('assets', []))
        for child in record.get('imports', []) + record.get('dynamicImports', []):
            visit(child)
    entries = [key for key, record in manifest.items() if record.get('isEntry')]
    if len(entries) != 1:
        raise ValueError('Expected one independent frontend entry')
    visit(entries[0])
    suspect = re.compile(r'(^|/)(tests?|qa|fixtures?|examples?|screenshots?|node_modules|\.git)(/|[.\-_])|\.map$', re.I)
    public_files = [path for path in public.rglob('*') if path.is_file()]
    if not public.is_dir() or not public_files:
        raise ValueError('Public runtime source directory required')
    referenced_text = '\n'.join((web / name).read_text(encoding='utf-8') for name in selected if Path(name).suffix in {'.html', '.js', '.mjs', '.css'})
    pending = set()
    for path in public_files:
        name = path.relative_to(public).as_posix()
        if suspect.search(name):
            raise ValueError('Test or development file in public runtime directory: ' + name)
        pending.add(name)
    while pending:
        found = {name for name in pending if '/' + name in referenced_text or name.startswith('licenses/')}
        if not found:
            break
        for name in found:
            if Path(name).suffix in {'.webmanifest', '.json', '.css', '.svg'}:
                referenced_text += '\n' + (public / name).read_text(encoding='utf-8')
        selected.update(found)
        pending -= found
    for name in selected & {path.relative_to(public).as_posix() for path in public_files}:
        path = public / name
        built = web / name
        if not built.is_file() or built.read_bytes() != path.read_bytes():
            raise ValueError('Build/public resource mismatch: ' + name)
    destination.mkdir(parents=True, exist_ok=False)
    copied = []
    for name in sorted(selected):
        source = (web / name).resolve()
        if not source.is_relative_to(web) or not source.is_file() or suspect.search(name):
            raise ValueError('Invalid production asset: ' + name)
        target = destination / 'web' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        copied.append({'path': 'assets/web/' + name, 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    for name in ['fonts/SourceSerif4Variable-Roman.ttf', 'licenses/Source-Serif-OFL.txt']:
        source = project / 'assets' / name
        target = destination / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        copied.append({'path': 'assets/' + name, 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    source = project / 'runtime/browser-agent-dom.js'
    target = destination / 'native/browser-agent-dom.js'
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    copied.append({'path': 'assets/native/browser-agent-dom.js', 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    ignored = sorted(path.relative_to(web).as_posix() for path in web.rglob('*') if path.is_file() and path.relative_to(web).as_posix() not in selected)
    return {'files': copied, 'ignoredWebBuildFiles': ignored}
