"""Fetch a CI render job's media assets before Remotion renders it.

Reads ci-jobs/<job>/manifest.json — a list of {"url", "dest"} pairs — and
downloads each one into remotion-composer/public/<dest>, so relative
staticFile() paths in that job's props.json resolve exactly as they do for a
local render, without those (often large, always local-only) source files
ever being committed to the repo.

Usage: python3 scripts/ci_fetch_job_assets.py ci-jobs/<job_name>
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = REPO_ROOT / "remotion-composer" / "public"


def fetch(job_dir: Path) -> None:
    manifest_path = job_dir / "manifest.json"
    if not manifest_path.is_file():
        print(f"No manifest.json in {job_dir} — nothing to fetch.")
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assets = manifest.get("assets", [])
    if not assets:
        print("manifest.json has no assets listed.")
        return

    for entry in assets:
        url = entry["url"]
        dest_rel = entry["dest"]
        dest_path = (PUBLIC_DIR / dest_rel).resolve()

        # Guard against a manifest entry escaping the public/ directory.
        if PUBLIC_DIR.resolve() not in dest_path.parents and dest_path != PUBLIC_DIR.resolve():
            raise ValueError(f"Refusing to write outside public/: {dest_rel}")

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        print(f"Fetching {url} -> {dest_path.relative_to(REPO_ROOT)}")
        urllib.request.urlretrieve(url, dest_path)
        size_mb = dest_path.stat().st_size / (1024 * 1024)
        print(f"  done ({size_mb:.1f} MB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 scripts/ci_fetch_job_assets.py ci-jobs/<job_name>")
        sys.exit(1)
    fetch(Path(sys.argv[1]))
