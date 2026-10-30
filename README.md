# Mac IDM

A download manager for macOS with segmented transfers and one-click browser video
capture. Ships separate, tested builds for **Intel (x64)** and **Apple Silicon (arm64)**.
Each build bundles an ffmpeg and yt-dlp that match your Mac's chip, and CI checks that
on every release.

**Early preview:** private/sign-in-required pages, DRM and live media are unsupported.

## Download

Get the latest build from [Releases](https://github.com/aasimdev/mac-idm/releases):

| Your Mac | File |
|---|---|
| Intel Mac | `Mac-IDM-<version>-macOS-x64.dmg` |
| Apple Silicon (M1 or later) | `Mac-IDM-<version>-macOS-arm64.dmg` |

Not sure which one you have? Apple menu > About This Mac. "Chip: Apple M…" means arm64;
"Processor: Intel …" means x64.

1. Open the DMG and drag **Mac IDM** into **Applications**.
2. Builds are not notarized yet. On first launch, right-click the app and choose
   **Open**, then confirm.

## Features

- Multi-segment parallel HTTP(S) downloads, pause/resume, history, scheduling, speed limits.
- Chrome, Edge, Brave and Opera media detection and quality selection; video and audio
  tracks are combined locally with FFmpeg.
- Download File Info with custom save folder, categories, Download Later, and Start.
- Separate progress and completion windows; duplicate-download prevention.
- Menu bar tray, dock support and a native messaging bridge to the browser extension.

## Browser extension setup (Chrome / Edge / Brave / Opera)

1. Click **Browser Integration** in the Mac IDM toolbar.
2. Click **Copy extension folder path**, then **Open Chrome extensions** (or Edge).
3. Turn on **Developer mode** on the Extensions page.
4. Click **Load unpacked**, press **Cmd+Shift+G**, paste the path and select the folder.
5. The app connects to the extension automatically. Refresh a video page to see the button.

## Development

```bash
npm ci
npm test
npm start

npm run dist:x64     # Intel DMG + ZIP into release/
npm run dist:arm64   # Apple Silicon DMG + ZIP into release/
npm run verify:arch -- x64   # check the packaged ffmpeg / yt-dlp match the arch
```

Build each architecture on a matching Mac (or the matching GitHub runner, as the
release workflow does) so `ffmpeg-static` downloads the right ffmpeg.
`npm run dist*` also downloads and checksum-verifies the official `yt-dlp_macos`.

## Acknowledgements and license

Mac IDM is a fork of [awesome-downloader-mac](https://github.com/abuzargifari/awesome-downloader-mac),
itself ported from [Awesome Downloader for Windows](https://github.com/TheAwesomeDeveloper/Awesome-Downloader-for-Windows).
Thanks to those authors. This project is not affiliated with them, or with Tonec Inc.
or Internet Download Manager.

Code added in this fork is licensed under [Apache-2.0](LICENSE). The portions derived from
awesome-downloader-mac remain under the original MIT License, whose copyright notice is kept
verbatim in [LICENSE-UPSTREAM-MIT](LICENSE-UPSTREAM-MIT) (see also [NOTICE](NOTICE)). Bundled
third-party components keep their own licenses: FFmpeg (GPL-3.0-or-later, via
`ffmpeg-static`), yt-dlp (Unlicense) and `googlevideo` (MIT). See
[THIRD-PARTY.md](THIRD-PARTY.md).
