#!/usr/bin/env bash
# Fails if the packaged ffmpeg / yt-dlp binaries do not match the architecture of the built app.
# Usage: scripts/verify-bundle-arch.sh <x64|arm64> [release-dir]
set -euo pipefail

arch="${1:?usage: verify-bundle-arch.sh <x64|arm64> [release-dir]}"
release="${2:-release}"

case "$arch" in
  x64)   want="x86_64" ;;
  arm64) want="arm64" ;;
  *) echo "unknown arch: $arch" >&2; exit 2 ;;
esac

# electron-builder puts the unpacked app in release/mac (x64) or release/mac-arm64 (arm64)
if [ "$arch" = "arm64" ]; then app_dir="$release/mac-arm64"; else app_dir="$release/mac"; fi
resources=$(find "$app_dir" -type d -name Resources -path '*.app/Contents/Resources' | head -n1)
[ -n "$resources" ] || { echo "No .app bundle found under $app_dir" >&2; exit 1; }

status=0
check() {
  local file="$1" required="$2"
  if [ ! -f "$file" ]; then echo "MISSING $file"; status=1; return; fi
  local archs; archs=$(lipo -archs "$file" 2>/dev/null || true)
  if [ "$required" = exact ]; then
    [ "$archs" = "$want" ] && echo "OK      $file ($archs)" || { echo "BAD     $file has [$archs], want [$want]"; status=1; }
  else
    case " $archs " in *" $want "*) echo "OK      $file ($archs)" ;; *) echo "BAD     $file has [$archs], want [$want]"; status=1 ;; esac
  fi
}

ffmpeg=$(find "$resources/app.asar.unpacked" -type f -name ffmpeg | head -n1)
check "${ffmpeg:-$resources/app.asar.unpacked/node_modules/ffmpeg-static/ffmpeg}" exact
check "$resources/tools/yt-dlp_macos" contains   # universal2: must contain the target slice
exit $status
