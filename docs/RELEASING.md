# Releasing

1. Run `npm ci` and `npm test` on both an Intel and an Apple Silicon Mac, or let
   `.github/workflows/test.yml` do it on `macos-15-intel` and `macos-latest`.
2. Bump `version` in `package.json` and push a tag: `git tag v0.1.2 && git push --tags`.
   `.github/workflows/release.yml` builds `x64` and `arm64` on matching runners, runs
   `npm run verify:arch` on each, and publishes a GitHub Release with checksums.
3. FFmpeg (via `ffmpeg-static`) is GPL-3.0-or-later. Every release body must link to the
   corresponding source for the exact bundled build (see `THIRD-PARTY.md`); the release
   workflow's notes already do this. If you change the `ffmpeg-static` version, update the links.
4. Bump the yt-dlp version in `scripts/fetch-yt-dlp.mjs` deliberately; the script verifies the
   checksum published with that release. The app bundles yt-dlp's one-directory build (not the
   one-file binary), and `core/youtube.mjs` warms it up at app start: macOS checks each native
   file once on first run, which measured 181 s cold vs 8 s warm on a busy Intel Mac.
5. Manual smoke test on a clean Mac of each architecture: install from the DMG, launch,
   download an HTTP file and an HLS stream, set up the browser extension, send a download
   from the browser, and run a YouTube extraction.
6. Builds are ad-hoc signed and not notarized. Notarization needs a paid Apple Developer ID.
