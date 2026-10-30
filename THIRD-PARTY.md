# Third-party media component

This application uses ffmpeg-static 5.3.0 (GPL-3.0-or-later) to supply FFmpeg binary release b6.1.1. FFmpeg remains a separate executable invoked for local media assembly/conversion.

Package source, license and binary provenance: https://github.com/eugeneware/ffmpeg-static

Binary release and associated source/build information: https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1

FFmpeg source and licensing: https://ffmpeg.org/download.html and https://ffmpeg.org/legal.html

Bundled Electron and dependency license files retain their upstream notices. The
installer includes FFmpeg's GPL text and build provenance under `resources/licenses`.
Corresponding source/build material for this exact binary and its linked libraries
must be prepared before a public binary release; upstream links here alone are not
a completed redistribution audit. See docs/RELEASING.md.

# YouTube SABR transport

The browser-capture download path uses `googlevideo` 5.0.1, an MIT-licensed library for YouTube's UMP/SABR transport. Download Manager for Mac supplies its own browser-session capture, format selection, desktop handoff, file writing, muxing, and user interface.

Source and license: https://github.com/LuanRT/GoogleVideo

# YouTube extraction

The macOS builds bundle the official one-directory `yt-dlp_macos.zip` build (universal2, in
`resources/tools/yt-dlp/`) from the yt-dlp release pinned in `scripts/fetch-yt-dlp.mjs` (2026.08.19).
The script verifies its SHA-256 against the release's `SHA2-256SUMS` before packaging. Source: https://github.com/yt-dlp/yt-dlp . The core
is public domain (Unlicense); the executable includes additional components under their own
licenses. Full upstream notices are in `vendor/LICENSE.txt` and `vendor/THIRD_PARTY_LICENSES.txt`,
copied to the packaged `resources/tools` folder (the full dependency notices also ship inside
`resources/tools/yt-dlp/_internal/`).
This is an independent extractor, not recovered IDM implementation code.
