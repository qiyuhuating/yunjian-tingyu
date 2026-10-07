"""Verify the immutable delivery inventory before running tests that write reports."""
from pathlib import Path
import hashlib, json, zipfile, subprocess

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'FILE_MANIFEST.json').read_text(encoding='utf-8'))
listed = {r['path'] for r in manifest} | {'FILES.md', 'FILE_MANIFEST.json'}
tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')) - {''}
assert tracked == listed, {'missing': sorted(listed-tracked), 'unexpected': sorted(tracked-listed)}
assert len({r['description'] for r in manifest}) == len(manifest)
for row in manifest:
    p = root / row['path']
    assert p.stat().st_size == row['bytes'], row['path']
    assert hashlib.sha256(p.read_bytes()).hexdigest() == row['sha256'], row['path']
    assert p.suffix not in {'.p12', '.jks', '.keystore'} and p.name not in {'signing.json', 'Android签名备份.zip'}
apk = root / 'outputs/云笺听雨-0.0.1-群聊优化.apk'
expected = json.loads((root / 'outputs/云笺听雨UI群聊资源校验清单.json').read_text(encoding='utf-8'))
assert hashlib.sha256(apk.read_bytes()).hexdigest() == expected['apkSha256']
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(set(z.namelist()))
    assets = {p.relative_to(root / 'outputs/android').as_posix(): p for p in (root / 'outputs/android/assets').rglob('*') if p.is_file()}
    assert {n for n in z.namelist() if n.startswith('assets/')} == set(assets)
    for name, file in assets.items():
        assert z.read(name) == file.read_bytes(), name
print(json.dumps({'files':len(listed), 'uniqueDescriptions':True, 'hashes':'passed', 'apkCRC':'passed', 'bundledAssets':len(assets)}))
