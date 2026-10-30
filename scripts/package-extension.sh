#!/bin/bash
# Builds the browser-extension ZIP for Chrome Web Store / Edge Add-ons submission.
# manifest.json sits at the archive root; tests and the Firefox-only manifest are left out.
# Usage: bash scripts/package-extension.sh   (or: npm run package:extension)
set -euo pipefail
cd "$(dirname "$0")/.."

version=$(node -p "require('./extension/manifest.json').version")
out="release-extension"
zip_path="$out/Download-Manager-for-Mac-Extension-$version.zip"
mkdir -p "$out"
rm -f "$zip_path"

(cd extension && zip -q -r -X "../$zip_path" . -x '*.test.cjs' -x 'manifest.firefox.json' -x '*.DS_Store')

unzip -Z1 "$zip_path" | grep -qx 'manifest.json' || { echo "manifest.json is not at the archive root" >&2; exit 1; }
if unzip -Z1 "$zip_path" | grep -E '\.test\.cjs$|manifest\.firefox\.json$' >/dev/null; then echo "test or Firefox files leaked into the ZIP" >&2; exit 1; fi

echo "Created $zip_path ($(unzip -Z1 "$zip_path" | grep -vc '/$') files, $(du -h "$zip_path" | cut -f1))"
shasum -a 256 "$zip_path"
