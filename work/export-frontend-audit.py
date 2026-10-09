#!/usr/bin/env python3
"""Export versioned front-end source ZIPs without modifying application code."""
from __future__ import annotations
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "outputs" / "mori-phone"
OUT = ROOT / "work" / "frontend-export"
OUT.mkdir(parents=True, exist_ok=True)
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
tracked = subprocess.check_output(
    ["git", "ls-files", "-z", "--", "outputs/mori-phone"], cwd=ROOT
).decode().split("\0")
files = [ROOT / p for p in tracked if p and (ROOT / p).is_file()]
ignored = {"node_modules", "dist", ".next", ".wrangler", ".git"}
common = {"android-web", "app", "lib", "public", "build", "scripts", "vendor"}
configs = {
    "package.json", "package-lock.json", "tsconfig.json", "vite.config.ts",
    "next.config.ts", "postcss.config.mjs", "eslint.config.mjs",
    "components.json", "vite-assets.d.ts", "cloudflare-env.d.ts", "README.md",
    ".gitignore", ".npmrc"
}

def include(relative: Path, frontend_only: bool) -> bool:
    if any(x in ignored for x in relative.parts):
        return False
    if not frontend_only:
        return True
    if relative.parts[0] not in common and relative.as_posix() not in configs:
        return False
    if relative.parts[:2] == ("app", "api"):
        return False
    if relative.as_posix() == "app/chatgpt-auth.ts":
        return False
    return True

def package(name: str, frontend_only: bool) -> dict:
    archive = OUT / name
    included = [p for p in files if include(p.relative_to(SOURCE), frontend_only)]
    entries = []
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, strict_timestamps=False) as z:
        z.writestr("FRONTEND-README.txt",
            "Cloudlet yunjian 0.0.2 front-end source extracted from GitHub commit " + commit + "\n" +
            ("UI/Android-web source, shared lib, assets and tooling. Next web API routes omitted.\n"
             if frontend_only else "Full mori-phone source needed for Next server plus Android-web.\n") +
            "Start from android-web/main.tsx and android-web/vite.config.ts.\n" +
            "Font files are preserved byte-for-byte. No dependencies, secrets, or generated build output included.\n")
        for p in included:
            relative = p.relative_to(SOURCE).as_posix()
            raw = p.read_bytes()
            entries.append({"path": relative, "size": len(raw), "sha256": hashlib.sha256(raw).hexdigest()})
            z.writestr(relative, raw)
    with zipfile.ZipFile(archive) as z:
        assert z.testzip() is None
    return {
        "name": archive.name,
        "size": archive.stat().st_size,
        "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "fileCount": len(entries),
        "files": entries,
    }

records = [
    package("yunjian-0.0.2-frontend-only.zip", True),
    package("yunjian-0.0.2-mori-phone-complete.zip", False),
]
manifest = {"sourceCommit": commit, "note": "Source extraction only; does not claim Android device validation.", "archives": records}
(OUT / "frontend-export-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
(OUT / "SHA256SUMS").write_text(
    "".join(f"{record['sha256']}  {record['name']}\n" for record in records), encoding="utf-8"
)
print(json.dumps({"sourceCommit": commit, "archives": [{k: v for k, v in record.items() if k != "files"} for record in records]}, ensure_ascii=False))
