"""Exercise the exact signed APKs through Android UI; never uninstall or clear data."""
import argparse, hashlib, json, os, re, subprocess, time
from pathlib import Path
from xml.etree import ElementTree as ET

PACKAGE = "chat.cloudlet.phone.v002"
ACTIVITY = PACKAGE + "/chat.cloudlet.phone.MainActivity"
NOTE = "CLOUDLET-UPGRADE-NOTE-20261010"
DRAFT = "CLOUDLET-UPGRADE-DRAFT-20261010"

def run(*args, timeout=40):
    r = subprocess.run(args, capture_output=True, timeout=timeout)
    if r.returncode:
        raise RuntimeError("Command failed: " + " ".join(args[:5]) + "\n" + r.stdout.decode(errors="replace") + r.stderr.decode(errors="replace"))
    return r.stdout.decode(errors="replace")

def adb(*args, timeout=40):
    return run("adb", *args, timeout=timeout)

class HierarchyNotReady(Exception):
    pass

def hierarchy():
    path = "/data/local/tmp/cloudlet-smoke.xml"
    adb("shell", "rm", "-f", path)
    output = adb("shell", "uiautomator", "dump", "--compressed", path, timeout=30)
    if "dumped to:" not in output:
        raise HierarchyNotReady(output)
    raw = adb("shell", "cat", path)
    root = ET.fromstring(raw[raw.index("<?xml"):])
    return raw, root

def label(node):
    return node.get("text", "") + " " + node.get("content-desc", "")

def bounds(node):
    m = re.fullmatch(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
    if not m: return None
    a,b,c,d = map(int, m.groups())
    return ((a+c)//2, (b+d)//2) if c>a and d>b else None

def wait_ui(predicate, timeout=75):
    end = time.monotonic() + timeout
    last = ""
    while time.monotonic() < end:
        try:
            raw, root = hierarchy()
            last = raw
            # Android's first-use immersive hint belongs to the OS, not the app.
            if any(n.get("resource-id") == "android:id/immersive_cling_title" for n in root.iter("node")):
                ok = next((n for n in root.iter("node") if n.get("resource-id") == "android:id/ok" and bounds(n)), None)
                if ok is not None:
                    x,y = bounds(ok)
                    adb("shell", "input", "tap", str(x), str(y))
                    print("INFO Dismissed Android first-use fullscreen hint", flush=True)
                    continue
            for n in root.iter("node"):
                if predicate(n) and bounds(n): return n
            if "先更新一下浏览器内核" in raw:
                raise RuntimeError("System image WebView is too old for the actual APK")
        except (ET.ParseError, subprocess.TimeoutExpired, ValueError, HierarchyNotReady) as e:
            last = str(e)
        time.sleep(1)
    raise RuntimeError("UI assertion timed out; last hierarchy: " + last[:12000])

def tap(predicate):
    n = wait_ui(predicate)
    x,y = bounds(n)
    adb("shell", "input", "tap", str(x), str(y))

def has(text):
    return lambda n: text in label(n)

def launch():
    out = adb("shell", "am", "start", "-W", "-n", ACTIVITY)
    if "Error:" in out or "Status: ok" not in out: raise RuntimeError(out)
    wait_ui(has("小纸条"))

def open_notes():
    tap(has("小纸条"))
    wait_ui(has("贴上小纸条"))

def type_text(text):
    tap(lambda n: n.get("class") == "android.widget.EditText")
    adb("shell", "input", "text", text)

def verify_saved_note():
    # The notes card may be outside the visible WebView accessibility window.
    # Scroll the real UI instead of accepting the home card's count as proof.
    observations = []
    for attempt in range(6):
        raw, root = hierarchy()
        nodes = list(root.iter("node"))
        matches = [n for n in nodes if NOTE in label(n) and n.get("class") != "android.widget.EditText"]
        if matches:
            print("PASS actual saved note text is present in notes UI after", attempt, "scroll(s)", flush=True)
            # Return composer to the top so the next draft input is reachable.
            for _ in range(attempt):
                adb("shell", "input", "swipe", "550", "550", "550", "1490", "350")
            return
        observations.extend(label(n)[:120] for n in nodes if "CLOUDLET" in label(n) or "纸条" in label(n))
        if attempt < 5:
            adb("shell", "input", "swipe", "550", "1510", "550", "610", "420")
            time.sleep(1)
    raise RuntimeError("Saved note is not accessible after scrolling all visible notes; labels: " + repr(observations[-25:]))


def snapshot(name, output):
    r = subprocess.run(["adb", "exec-out", "screencap", "-p"], capture_output=True, check=True, timeout=30)
    (output / (name + ".png")).write_bytes(r.stdout)
    raw, _ = hierarchy()
    (output / (name + ".xml")).write_text(raw)

def version(expected):
    data = adb("shell", "dumpsys", "package", PACKAGE)
    m = re.search(r"versionCode=(\d+)", data)
    if not m or int(m[1]) != expected: raise RuntimeError("Unexpected installed versionCode: " + str(m))
    return int(m[1])

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--old-apk", type=Path, required=True)
    p.add_argument("--new-apk", type=Path, required=True)
    p.add_argument("--expected-sha256", default="295ef6e51a7f953d80e38af827f944c9645a18d07ac9e97fb8e11267c13916e4")
    p.add_argument("--expected-code", type=int, default=10)
    p.add_argument("--output", type=Path, required=True)
    a = p.parse_args()
    a.output.mkdir(parents=True, exist_ok=True)
    report = {"scope": "Android emulator UI and synthetic data only; not physical device, API/VPN, queue or media acceptance",
              "workflowCommit": os.getenv("GITHUB_SHA"), "checks": [], "status": "running"}
    def check(name):
        report["checks"].append(name); print("PASS " + name, flush=True)
    try:
        adb("wait-for-device")
        report["androidAPI"] = adb("shell", "getprop", "ro.build.version.sdk").strip()
        report["androidRelease"] = adb("shell", "getprop", "ro.build.version.release").strip()
        report["model"] = adb("shell", "getprop", "ro.product.model").strip()
        report["webView"] = adb("shell", "dumpsys", "webviewupdate")
        report["oldApkSHA256"] = hashlib.sha256(a.old_apk.read_bytes()).hexdigest()
        report["newApkSHA256"] = hashlib.sha256(a.new_apk.read_bytes()).hexdigest()
        assert re.fullmatch(r"[0-9a-f]{64}",a.expected_sha256) and report["newApkSHA256"] == a.expected_sha256, "New APK differs from expected candidate SHA-256"
        installed = adb("shell", "pm", "list", "packages", PACKAGE).splitlines()
        assert "package:" + PACKAGE not in installed, "Requires fresh disposable emulator; do not clear an existing installation"
        adb("shell", "wm", "size", "1080x1920")
        adb("shell", "wm", "density", "320")
        adb("shell", "svc", "wifi", "disable")
        adb("shell", "svc", "data", "disable")
        assert "Success" in adb("install", "--no-streaming", str(a.old_apk), timeout=120)
        assert version(8) == 8
        check("Original signed 0.0.2 installed, versionCode 8")
        launch()
        open_notes()
        type_text(NOTE)
        tap(has("贴上小纸条"))
        # UI may navigate back to the home card after saving. That card only
        # reports a count; never mistake it for proof that the note text exists.
        saved_or_home = wait_ui(lambda n: (NOTE in label(n) and n.get("class") != "android.widget.EditText") or
                              (n.get("class") == "android.widget.Button" and "小纸条" in label(n) and "2 张心意" in label(n)))
        if NOTE not in label(saved_or_home):
            print("OBSERVED: v0.0.2 returned home after note submission; reopening to verify actual stored note", flush=True)
            report.setdefault("observations", []).append("v0.0.2 note submission navigated to home; checked reopened note contents")
            open_notes()
        # Reopened note content itself must be present; a changed count is not sufficient.
        verify_saved_note()
        check("Synthetic note committed by original application UI")
        type_text(DRAFT)
        time.sleep(2)
        snapshot("before-upgrade", a.output)
        adb("shell", "am", "force-stop", PACKAGE)
        launch()
        open_notes()
        wait_ui(lambda n: DRAFT in label(n) and n.get("class") == "android.widget.EditText")
        verify_saved_note()
        check("Old application cold-start retained saved note and editor draft")
        adb("shell", "am", "force-stop", PACKAGE)
        result = adb("install", "--no-streaming", "-r", str(a.new_apk), timeout=120)
        (a.output / "upgrade-install.txt").write_text(result)
        assert "Success" in result and version(a.expected_code) == a.expected_code
        check(f"Exact delivered 0.0.3 upgraded in place, versionCode {a.expected_code}, no uninstall or data clear")
        launch()
        open_notes()
        verify_saved_note()
        wait_ui(lambda n: DRAFT in label(n) and n.get("class") == "android.widget.EditText")
        snapshot("after-upgrade", a.output)
        check("Offline new WebView UI retained old note and unsent draft")
        adb("shell", "am", "force-stop", PACKAGE)
        launch()
        open_notes()
        verify_saved_note()
        wait_ui(lambda n: DRAFT in label(n) and n.get("class") == "android.widget.EditText")
        snapshot("after-cold-start", a.output)
        check("Force-stop and offline cold-start retained upgraded application data")
        report["status"] = "passed"
    except Exception as e:
        report["status"] = "failed"
        report["error"] = str(e)
        try: snapshot("failure", a.output)
        except Exception: pass
        raise
    finally:
        (a.output / "android-upgrade-check.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)

if __name__ == "__main__":
    main()
