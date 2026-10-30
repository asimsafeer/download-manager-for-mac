# Publishing the browser extension (Chrome Web Store and Edge Add-ons)

Status: **not published.** Today users install the extension with *Load unpacked* (see the README).
This page lists what each store requires and what is already prepared. Items marked *(verified)* come
from the stores' own documentation read on 2026-10-30; *(unverified)* items must be confirmed in the
store dashboards before you rely on them.

## Package

```bash
npm run package:extension
```

Creates `release-extension/Download-Manager-for-Mac-Extension-<version>.zip` with `manifest.json` at the
archive root, without tests or the Firefox-only manifest. The same ZIP works for both stores. The extension
version must equal the app version (a test enforces this).

## Requirements at a glance

| | Chrome Web Store | Microsoft Edge Add-ons |
|---|---|---|
| Developer account | Required; Google account and a **one-time registration fee** *(verified that a fee exists; the docs I could fetch do not state the amount. Third-party guides report US$5. Check the dashboard before paying)* | Partner Center account, **no registration fee** *(verified)*. Microsoft account needed; a GitHub login can create one. Individual or company account; company verification can take days to weeks |
| Package | ZIP, `manifest.json` at root | `.zip`, same layout *(verified)* |
| Store icon | 128x128 PNG inside the ZIP *(verified)*; already in `extension/icons/` | Logo 1:1, recommended 300x300, minimum 128x128 *(verified)*, uploaded separately (needs a 300x300 export) |
| Screenshots | At least 1, up to 5; 1280x800 (preferred) or 640x400 *(verified)* | Optional, up to 6; 640x480 or 1280x800 *(verified)* |
| Promo tiles | Small 440x280 and marquee 1400x560 are optional *(verified)* | Small 440x280 and large 1400x560 are optional *(verified)* |
| Description | Required | Minimum 250 characters, maximum 10,000 *(verified)* |
| Single-purpose statement | Required in the privacy tab *(unverified detail)* | Required: "Single Purpose Description" *(verified)* |
| Permission justification | Required for sensitive permissions *(unverified detail)* | One justification per manifest permission *(verified)* |
| Remote code | Not allowed in Manifest V3 | Declare "No"; MV3 does not allow it *(verified)* |
| Privacy policy URL | Needed when user data is handled *(unverified detail)* | Required if personal information is accessed, transmitted or collected *(verified)* |
| Review time | Not stated in the docs I fetched | Up to seven business days *(verified)*; broad permissions can add review |

## What reviewers will look at in this extension

The manifest asks for `nativeMessaging`, `storage`, `activeTab`, `contextMenus`, `webRequest`, `downloads`,
host access to **all http/https sites**, and content scripts on all pages. Broad host access is the most
likely cause of extra scrutiny or rejection. Draft justifications (edit to match reality before submitting):

| Permission | Draft justification |
|---|---|
| `nativeMessaging` | Sends the link the user chose to the companion desktop app, Download Manager for Mac, installed on the same computer. |
| `webRequest` and host access to `http://*/*`, `https://*/*` | Detects direct media and HLS playlist requests on the page the user is viewing so the app can offer quality choices, and reads the request headers (referrer, user agent, cookies) needed to download that same file. Data stays in memory and goes only to the local app. |
| `downloads` | Pauses a browser download that the extension hands over to the desktop app and resumes it if the hand-over fails. Can be turned off in the popup. |
| `contextMenus` | Adds "Download with Download Manager for Mac" to links and media. |
| `activeTab` | Lets the toolbar popup list downloadable items on the current tab. |
| `storage` | Remembers the "intercept downloads" switch and the last error message. |

Single purpose (draft): *Send downloadable files and videos from the current page to the Download Manager for
Mac desktop app.*

The extension **requires the companion desktop app**. Say so in the first lines of the store description, or
reviewers and users will treat it as broken or misleading.

## Things to prepare (nothing is created yet)

- [ ] Developer accounts (Chrome: fee; Edge: free).
- [ ] A public privacy policy URL. A draft is in [PRIVACY.md](PRIVACY.md); the stable GitHub URL
      `https://github.com/asimsafeer/download-manager-for-mac/blob/main/docs/PRIVACY.md` can be used once reviewed.
- [ ] Screenshots of the extension popup and the in-page download button (1280x800).
- [ ] A 300x300 logo export of the app icon (for Edge) and an optional 440x280 promo tile.
- [ ] A store description with the companion-app disclosure; a support contact (the GitHub issues page works).
- [ ] Review notes for the certification team explaining that testing needs the desktop app installed.

## Native-host IDs and store installs

The desktop app registers the native messaging host for the extension ID it finds installed. A store-installed
extension has a store-assigned ID that differs between Chrome and Edge. Chrome records such installs with a
path relative to `<profile>/Extensions`; discovery now resolves those paths (`desktop/browser-registration.cjs`,
covered by a test), so a store install is picked up automatically after the app has run once and the extension
is installed. Verify this end to end on a fresh browser profile before announcing store availability.

## Firefox

`extension/manifest.firefox.json` exists, but Firefox publication (addons.mozilla.org) is not covered here and
has no end-to-end verification.

## References

- Chrome: <https://developer.chrome.com/docs/webstore/register>, <https://developer.chrome.com/docs/webstore/images>
- Edge: <https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension>,
  <https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/create-dev-account>
