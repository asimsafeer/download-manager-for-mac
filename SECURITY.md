# Security policy

## Reporting a vulnerability

Please report security problems **privately** using GitHub's private vulnerability reporting:

**<https://github.com/asimsafeer/download-manager-for-mac/security/advisories/new>**
(Security tab > **Report a vulnerability**).

Do not open a public issue, and do not post exploit details, signed media URLs, cookies,
authorization headers, native messaging payloads, browser profile files, or the contents of the
`.download-manager-for-mac` folder anywhere public.

If the private reporting page is unavailable to you, open a public issue that says only that you need
a private security contact (no details), and a way to reach you privately will be arranged.

Please include: the app version (About), your macOS version and chip (Intel or Apple Silicon), what you
did, what you expected, what happened, and the impact you think it has. Remove secrets from logs first.

This is a small, volunteer-maintained project. Reports are handled on a best-effort basis with no
guaranteed response time. You will be credited in the fix unless you prefer not to be.

## What is in scope

- The desktop app, its local bridge and the browser extension in this repository.
- The native messaging bridge must remain authenticated and loopback-only (`127.0.0.1`).
- No DRM bypass, credential harvesting, or page-controlled filesystem paths are accepted features.

Vulnerabilities in bundled components (FFmpeg, yt-dlp, Electron, `googlevideo`) are best reported to
those projects as well; see [THIRD-PARTY.md](THIRD-PARTY.md) for what is bundled.

## Supported versions

Only the latest release is maintained. There is no automatic updater yet, so please update manually.
Builds are not notarized (see [docs/NOTARIZATION.md](docs/NOTARIZATION.md)); verify downloads against the
`SHA256SUMS-*.txt` attached to each release.
