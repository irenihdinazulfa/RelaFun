"""Menerbitkan RelaFun ke GitHub Pages (cabang gh-pages).

Pemakaian (dari folder proyek):  python scripts/deploy_pages.py
Hasil: https://<username>.github.io/<repo>/  — misalnya https://irenihdinazulfa.github.io/RelaFun/
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_static import ROOT, build  # noqa: E402


def git(*args: str, cwd: Path) -> str:
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()


def main() -> None:
    remote = git("remote", "get-url", "origin", cwd=ROOT)
    name = git("config", "user.name", cwd=ROOT)
    email = git("config", "user.email", cwd=ROOT)
    tmp = Path(tempfile.mkdtemp(prefix="relafun_pages_"))
    try:
        site = build(tmp / "site")
        git("init", "-q", "-b", "gh-pages", cwd=site)
        git("config", "user.name", name, cwd=site)
        git("config", "user.email", email, cwd=site)
        git("add", "-A", cwd=site)
        git("commit", "-q", "-m", "Terbitkan RelaFun ke GitHub Pages", cwd=site)
        git("remote", "add", "origin", remote, cwd=site)
        print("Mengunggah ke cabang gh-pages …")
        git("push", "-q", "-f", "origin", "gh-pages", cwd=site)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    owner_repo = remote.rstrip("/").removesuffix(".git").split("github.com/")[-1]
    owner, repo = owner_repo.split("/")
    print(f"Selesai. Link aplikasi: https://{owner.lower()}.github.io/{repo}/")


if __name__ == "__main__":
    main()
