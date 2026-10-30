# Contributing

Issues and pull requests are welcome. This is an early macOS preview.

## Development

Use macOS, Node.js 22 or newer and npm. Fork the repository, clone your fork and create a
branch for one focused change.

```bash
npm ci
npm test
npm start
```

YouTube extraction needs `vendor/yt-dlp_macos`; run `npm run fetch:ytdlp` once to download
and verify it. Run `npm run dist:x64` or `npm run dist:arm64` to build a local DMG on a Mac
of that architecture. Neither command publishes anything. See [docs/RELEASING.md](docs/RELEASING.md).

## Pull requests

Keep changes focused, include tests where behaviour changes, and make sure `npm test` passes.
