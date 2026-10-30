#!/bin/bash
# Download Manager for Mac – macOS native messaging host launcher.
export ELECTRON_RUN_AS_NODE=1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RUNTIME="$(cat "$SCRIPT_DIR/runtime-path.txt" 2>/dev/null)"
if [ -z "$RUNTIME" ] || [ ! -x "$RUNTIME" ]; then
  echo "Download Manager for Mac runtime not found." >&2
  exit 1
fi
exec "$RUNTIME" "$SCRIPT_DIR/native-host.cjs"
