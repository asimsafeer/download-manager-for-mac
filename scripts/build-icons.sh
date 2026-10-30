#!/bin/bash
# Regenerates every raster icon from the SVG sources in assets/. Needs rsvg-convert (brew install librsvg)
# and iconutil (macOS). Usage: bash scripts/build-icons.sh
set -euo pipefail
cd "$(dirname "$0")/.."

command -v rsvg-convert >/dev/null || { echo "rsvg-convert not found (brew install librsvg)" >&2; exit 1; }
command -v iconutil >/dev/null || { echo "iconutil not found (macOS only)" >&2; exit 1; }

render() { rsvg-convert -w "$2" -h "$2" "$1" -o "$3"; }

# App icon: 1024 master PNG plus the .icns (all slices from 16 to 1024 incl. @2x)
render assets/app-icon.svg 1024 assets/app-icon.png
set=$(mktemp -d)/icon.iconset
mkdir -p "$set"
for size in 16 32 128 256 512; do
  render assets/app-icon.svg "$size" "$set/icon_${size}x${size}.png"
  render assets/app-icon.svg "$((size * 2))" "$set/icon_${size}x${size}@2x.png"
done
iconutil -c icns "$set" -o build/icon.icns
rm -rf "$(dirname "$set")"

# Menu-bar tray template (black on transparent): 18 px and 36 px @2x. The "Template" suffix makes macOS recolour it.
render assets/tray-template.svg 18 assets/trayTemplate.png
render assets/tray-template.svg 36 assets/trayTemplate@2x.png

# Browser extension icons
for size in 16 32 48 128; do
  render assets/extension-icon.svg "$size" "extension/icons/icon${size}.png"
done
echo "Icons regenerated."
