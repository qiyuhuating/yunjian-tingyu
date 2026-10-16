"""Verify real build staging excludes injected QA and old bundles, retaining dynamic assets."""
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
import json
import os
import shutil
import tempfile

repo=Path(__file__).resolve().parents[1]
project=repo/'outputs/android'
spec=spec_from_file_location('stage_assets',project/'stage-assets.py');module=module_from_spec(spec);spec.loader.exec_module(module)
build=Path(os.environ.get('FEATURE_BUILD_DIR',repo/'work/apk-trim-web')).resolve()
checks=[]
with tempfile.TemporaryDirectory(prefix='apk-assets-') as tmp:
    root=Path(tmp)
    source=root/'web';shutil.copytree(build,source)
    junk=['qa.js','assets/old-bundle.js','fixtures/model.json','screenshots/home.png','node_modules/test.txt','assets/index.js.map']
    for name in junk:
        file=source/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text('test fixture')
    report=module.stage_assets(project,source,repo/'outputs/mori-phone/public',root/'assets')
    staged={row['path'] for row in report['files']}
    assert all('assets/web/'+name not in staged for name in junk)
    assert '.vite/manifest.json' in report['ignoredWebBuildFiles']
    checks.append('Injected QA, old bundle, fixtures, screenshot, node_modules, sourcemap and Vite manifest excluded')
    assert any('pdf.worker' in name for name in staged)
    assert any('pdf-reading-' in name for name in staged)
    assert any('three.module-' in name for name in staged)
    assert 'assets/web/music-listen.webp' in staged
    assert 'assets/fonts/SourceSerif4Variable-Roman.ttf' in staged
    assert 'assets/licenses/Source-Serif-OFL.txt' in staged
    assert 'assets/native/browser-agent-dom.js' in staged
    assert (root/'assets/native/browser-agent-dom.js').read_bytes()==(project/'runtime/browser-agent-dom.js').read_bytes()
    checks.append('PDF worker, lazy PDF/3D modules, music art, native font and licenses preserved')
    assert all('assets/web/'+name not in staged for name in ['favicon.svg','icon-192.png','icon-512.png','manifest.webmanifest'])
    checks.append('Unreferenced PWA manifest and icons excluded from native APK; public sources retained')
    public=root/'public';shutil.copytree(repo/'outputs/mori-phone/public',public)
    (public/'qa.js').write_text('test')
    try:module.stage_assets(project,source,public,root/'rejected-public')
    except ValueError as error:assert 'development file' in str(error)
    else:raise AssertionError('Public QA file must reject build')
    checks.append('Public runtime directory rejects an injected QA file')
    (source/'.vite/manifest.json').unlink()
    try:module.stage_assets(project,source,repo/'outputs/mori-phone/public',root/'rejected-stale')
    except ValueError as error:assert 'Fresh Android Web build' in str(error)
    else:raise AssertionError('Stale build without dependency manifest must fail')
    checks.append('Historical web directory without fresh Vite graph is rejected')
print(json.dumps({'passed':len(checks),'checks':checks}))
