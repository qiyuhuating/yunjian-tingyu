"""Merge the user-provided Via binary while preserving its DEX and resource IDs."""
from pathlib import Path
import hashlib, shutil, struct, subprocess, zipfile, zlib, xml.etree.ElementTree as ET

VIA_SHA256 = 'c64c71458df03ef98bac3acdecafcab6bf9fd930a53fca5d72b284383ed03985'
ANDROID = 'http://schemas.android.com/apk/res/android'
ET.register_namespace('android', ANDROID)

def merge_via(project, build, via, apktool, java, aapt, env, manifest_path=None, assets_path=None):
    assert hashlib.sha256(via.read_bytes()).hexdigest() == VIA_SHA256, 'Unexpected Via binary'
    decoded = build / 'via'
    subprocess.run([str(java), '-jar', str(apktool), 'd', '-s', '-f', str(via), '-o', str(decoded)], env=env, check=True)
    attribute = lambda name: '{' + ANDROID + '}' + name
    original = ET.parse(decoded / 'AndroidManifest.xml')
    manifest = original.getroot()
    own = ET.parse(manifest_path or project / 'AndroidManifest.xml').getroot()
    provider_authority = 'mark.via.phonev02' if own.get('package') == 'chat.cloudlet.phone.v002' else 'mark.via.phoneapi'
    manifest.set('package', own.get('package'))
    app = manifest.find('application')
    own_app = own.find('application')
    for name in ['label', 'icon', 'roundIcon', 'allowBackup', 'enableOnBackInvokedCallback']:
        app.set(attribute(name), own_app.get(attribute(name)))
    app.attrib.pop(attribute('dataExtractionRules'), None)
    app.attrib.pop(attribute('fullBackupContent'), None)
    # Imported browser pages run in Via's WebView, without the privileged app bridge.
    for component in app:
        authority = component.get(attribute('authorities'))
        if authority:
            component.set(attribute('authorities'), provider_authority if authority == 'mark.via.provider' else authority.replace('mark.via', own.get('package')))
        if component.tag == 'activity':
            component.set(attribute('exported'), 'false')
            for child in list(component):
                if child.tag in {'intent-filter', 'meta-data'}:
                    component.remove(child)
            if component.get(attribute('name')) == 'mark.via.Shell':
                component.set(attribute('launchMode'), 'standard')
        if component.tag == 'receiver' and 'widget' in component.get(attribute('name'), ''):
            app.remove(component)
        if component.get(attribute('name')) == 'mark.via.service.CustomTabsConnectionService':
            component.set(attribute('exported'), 'false')
    launcher = own_app.find('activity')
    launcher.set(attribute('name'), 'chat.cloudlet.phone.MainActivity')
    launcher.set(attribute('theme'), '@style/CloudletTheme')
    app.append(launcher)
    # Third-party telemetry is disabled; browsing data stays in the application sandbox.
    for key in ['firebase_analytics_collection_enabled', 'firebase_crashlytics_collection_enabled', 'google_analytics_adid_collection_enabled']:
        ET.SubElement(app, 'meta-data', {attribute('name'): key, attribute('value'): 'false'})
    for permission in list(manifest.findall('uses-permission')):
        if permission.get(attribute('name')) in {'android.permission.QUERY_ALL_PACKAGES', 'com.google.android.gms.permission.AD_ID', 'com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE'}:
            manifest.remove(permission)
    original.write(decoded / 'AndroidManifest.xml', encoding='utf-8', xml_declaration=True)
    # Apktool's metadata controls version and min/target SDK at link time.
    import re
    metadata = (decoded / 'apktool.yml').read_text(encoding='utf-8')
    for name, value in [('minSdkVersion', '24'), ('targetSdkVersion', '35'), ('versionCode', own.get(attribute('versionCode'))), ('versionName', own.get(attribute('versionName')))]:
        metadata = re.sub(r'(?m)^(  ' + name + r':).*$', lambda m: m[1] + ' ' + value, metadata)
    (decoded / 'apktool.yml').write_text(metadata, encoding='utf-8')
    for file in (project / 'res').rglob('*'):
        if not file.is_file():
            continue
        target = decoded / 'res' / file.relative_to(project / 'res')
        if target.exists() and file.suffix == '.xml' and file.parent.name.startswith('values'):
            tree = ET.parse(target)
            existing = {(node.tag, node.get('name')) for node in tree.getroot()}
            for node in ET.parse(file).getroot():
                assert (node.tag, node.get('name')) not in existing, 'Resource name collision'
                tree.getroot().append(node)
            tree.write(target, encoding='utf-8', xml_declaration=True)
        else:
            assert not target.exists(), 'Resource path collision'
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, target)
    shutil.copytree(assets_path or project / 'assets', decoded / 'assets', dirs_exist_ok=True)
    # Via embeds its FileProvider authority as a literal. Keep the string width and
    # every DEX offset unchanged, and update only that authority plus DEX checksums.
    dex_path = decoded / 'classes.dex'
    dex = bytearray(dex_path.read_bytes())
    before, after = b'mark.via.provider\0', provider_authority.encode('ascii') + b'\0'
    assert len(before) == len(after) and dex.count(before) == 1
    # A DEX string table is sorted. Verify the replacement stays between neighbors.
    count, offset = struct.unpack_from('<II', dex, 56)
    strings = []
    for i in range(count):
        position = struct.unpack_from('<I', dex, offset + 4*i)[0]
        while dex[position] & 128: position += 1
        position += 1
        strings.append(bytes(dex[position:dex.index(0, position)]))
    index = strings.index(before[:-1])
    assert strings[index-1] < after[:-1] < strings[index+1]
    dex[:] = dex.replace(before, after)
    dex[12:32] = hashlib.sha1(dex[32:]).digest()
    struct.pack_into('<I', dex, 8, zlib.adler32(dex[12:]) & 0xffffffff)
    dex_path.write_bytes(dex)
    merged = build / 'via-unsigned.apk'
    subprocess.run([str(java), '-jar', str(apktool), 'b', str(decoded), '--aapt', str(aapt), '-o', str(merged)], env=env, check=True)
    with zipfile.ZipFile(merged, 'a', compression=zipfile.ZIP_DEFLATED) as archive:
        archive.write(build / 'dex/classes.dex', 'classes2.dex')
    with zipfile.ZipFile(merged) as result, zipfile.ZipFile(via) as source:
        assert result.read('classes.dex') == dex_path.read_bytes()
        assert len(result.read('classes.dex')) == len(source.read('classes.dex'))
        assert result.testzip() is None
    shutil.copy2(merged, build / 'unsigned.apk')
