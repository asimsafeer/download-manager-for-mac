# Notarization (not set up yet)

Releases are currently **ad-hoc signed and not notarized**, so macOS shows a warning on first launch
(see the README's *First launch* section). Notarization removes that warning for most users. This page
records what it would take. Nothing here is configured, and it costs money, so decide first.

## What it needs

| Requirement | Detail |
|---|---|
| Apple Developer Program membership | **US$99 per year** (apple.com/programs shows "$99 annual membership"). Required for a *Developer ID Application* certificate. Individuals can enrol. |
| Developer ID Application certificate | Created in the Apple Developer account, exported as a `.p12` for CI. |
| Hardened runtime + secure timestamp | The app and every nested executable must be signed with `--options runtime --timestamp`. |
| Every nested binary signed | Apple requires all executables, frameworks and dylibs inside the bundle to be signed (innermost first). |
| Submission | `notarytool` uploads a ZIP; Apple scans it and returns a verdict; the ticket is then stapled to the app. |

Apple does not publish a per-submission fee for notarization; the cost is the membership. Confirm current
pricing on Apple's site before paying.

## How electron-builder would be configured

electron-builder (version 26 here) runs notarization itself when these environment variables are set
(one of three alternatives, as documented in its own schema):

1. `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` (App Store Connect API key, best for CI), or
2. `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, or
3. `APPLE_KEYCHAIN` and `APPLE_KEYCHAIN_PROFILE`.

The certificate is supplied with `CSC_LINK` (base64 or path to the `.p12`) and `CSC_KEY_PASSWORD`.
In `package.json` > `build.mac` the following would change:

- remove `"identity": "-"` and `"gatekeeperAssess": false`;
- set `"hardenedRuntime": true`;
- add `entitlements` and `entitlementsInherit` files in `build/` (Electron needs at least
  `com.apple.security.cs.allow-jit` and `com.apple.security.cs.allow-unsigned-executable-memory`);
- set `"notarize": true`;
- store the secrets as GitHub Actions secrets and pass them to the `build` job in
  `.github/workflows/release.yml`.

## Known obstacle: the bundled yt-dlp

Today `build.mac.signIgnore` skips `Contents/Resources/tools/yt-dlp/` because `codesign` refuses the
non-standard `_internal/Python.framework/Python` layout ("bundle format is ambiguous") and yt-dlp's files
keep their official ad-hoc signatures. **That is not enough for notarization**: all of those 100+ native
files would have to be re-signed with the Developer ID, hardened runtime and a timestamp, and the
`Python.framework` problem solved (for example with a custom signing hook). This has not been attempted
or tested. Budget real time for it, and re-run `npm run verify:arch` and a YouTube smoke test afterwards.
Whether a notarized build also shortens the first-run file checks is unknown and would need measuring.

## Checklist if you decide to do it

1. Enrol in the Apple Developer Program and create a Developer ID Application certificate.
2. Create an App Store Connect API key (or an app-specific password) and add all secrets to the repository.
3. Add entitlements files, switch `build.mac` as above, solve the yt-dlp signing, and test on both
   architectures with `spctl --assess --type execute -vv` and by opening a downloaded DMG on a clean Mac.
4. Update the README, the release notes and `docs/RELEASING.md` to drop the "not notarized" wording.
