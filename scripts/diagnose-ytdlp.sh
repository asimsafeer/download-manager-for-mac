#!/bin/bash
# Times yt-dlp startup: the bundled one-file binary vs the official one-directory build.
# Run from a normal Terminal (not a sandboxed tool). Each slow run can take 2+ minutes.
#   bash scripts/diagnose-ytdlp.sh            # onedir build x3, then one-file with a custom TMPDIR x1
#   bash scripts/diagnose-ytdlp.sh --onefile  # also re-time the bundled one-file binary x1
set -uo pipefail
cd "$(dirname "$0")/.."
VERSION="${YT_DLP_VERSION:-2026.08.19}"
WORK="$HOME/ytdlp-test"
BASE="https://github.com/yt-dlp/yt-dlp/releases/download/$VERSION"

echo "== system"; sw_vers -productVersion; uname -m; sysctl -n machdep.cpu.brand_string; spctl --status; csrutil status | head -1
echo "== one-file binary"; xattr -l vendor/yt-dlp_macos; codesign -dv vendor/yt-dlp_macos 2>&1 | grep -E "Signature|flags"

echo "== network (a slow or failing line here is the clue)"
scutil --proxy | grep -E "Enable" || true
for url in https://github.com https://api.github.com https://ocsp.apple.com https://www.apple.com; do
  curl -s -o /dev/null -m 25 -w "$url dns=%{time_namelookup}s connect=%{time_connect}s total=%{time_total}s http=%{http_code}\n" "$url" || echo "$url FAILED"
done

mkdir -p "$WORK" && cd "$WORK"
# If you already have the zip (copy it to ~/ytdlp-test/yt-dlp_macos.zip) no download happens.
if [ ! -x yt-dlp_macos ]; then
  [ -f yt-dlp_macos.zip ] || curl -fL -o yt-dlp_macos.zip "$BASE/yt-dlp_macos.zip" || exit 1
  curl -fsL -m 60 -o SUMS "$BASE/SHA2-256SUMS" || exit 1
  want=$(grep ' yt-dlp_macos.zip$' SUMS | cut -d' ' -f1); got=$(shasum -a 256 yt-dlp_macos.zip | cut -d' ' -f1)
  [ "$want" = "$got" ] || { echo "CHECKSUM MISMATCH ($got vs $want)" >&2; exit 1; }
  unzip -q yt-dlp_macos.zip
fi

echo "== one-directory build (3 runs)"
for i in 1 2 3; do /usr/bin/time -p ./yt-dlp_macos --version; done

echo "== one-file binary with TMPDIR outside /var/folders (1 run)"
mkdir -p "$HOME/ytdlp-tmp"
TMPDIR="$HOME/ytdlp-tmp" /usr/bin/time -p "$OLDPWD/vendor/yt-dlp_macos" --version

if [ "${1:-}" = "--onefile" ]; then
  echo "== one-file binary, default TMPDIR (1 run)"; /usr/bin/time -p "$OLDPWD/vendor/yt-dlp_macos" --version
fi
echo "== done"
echo "Offline test (strong clue): turn Wi-Fi/Ethernet OFF, then run the next line, then turn it back ON."
echo "  /usr/bin/time -p \"$OLDPWD/vendor/yt-dlp_macos\" --version"
