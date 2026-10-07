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
apk = root / 'outputs/云笺听雨-0.0.1-系统隔离版.apk'
expected = json.loads((root / 'outputs/云笺听雨系统隔离资源校验清单.json').read_text(encoding='utf-8'))
assert hashlib.sha256(apk.read_bytes()).hexdigest() == expected['apkSha256']
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None
    assert len(z.namelist()) == len(set(z.namelist()))
    assets = {p.relative_to(root / 'outputs/android').as_posix(): p for p in (root / 'outputs/android/assets').rglob('*') if p.is_file()}
    with zipfile.ZipFile(root / 'outputs/android/vendor/via-release-cn.apk') as via:
        via_assets={n for n in via.namelist() if n.startswith('assets/')}
        for name in via_assets:assert z.read(name)==via.read(name),name
        original=via.read('classes.dex')
        import struct,zlib
        expected_dex=bytearray(original.replace(b'mark.via.provider\0',b'mark.via.phoneapi\0'))
        expected_dex[12:32]=hashlib.sha1(expected_dex[32:]).digest()
        struct.pack_into('<I',expected_dex,8,zlib.adler32(expected_dex[12:]) & 0xffffffff)
        assert z.read('classes.dex')==expected_dex
    assert {n for n in z.namelist() if n.startswith('assets/')} == set(assets) | via_assets
    for name, file in assets.items():
        assert z.read(name) == file.read_bytes(), name
print(json.dumps({'files':len(listed), 'uniqueDescriptions':True, 'hashes':'passed', 'apkCRC':'passed', 'bundledAssets':len(assets)}))
