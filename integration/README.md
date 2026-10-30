# Browser integration

Start Download Manager for Mac once, install its unpacked extension in Chrome, Edge, Brave, or Opera (Developer mode → Load unpacked), and reload existing video tabs. The app finds the extension in your browser profiles and registers its own native messaging host automatically. Each browser is registered independently, and Chrome and Opera share Chrome's manifest folder without replacing one another. There is no extension-ID or Connect step. For development use `extension/`; the packaged app shows its extension folder in Browser Integration.

Click **Download this video**, choose a quality/format, then **Start Download** in Download File Info. A separate progress window shows speed, transferred bytes, time remaining, and connection progress. Supported HLS can produce MP4; MP3 is offered when a separate audio track is identified. Qualities come from real manifest metadata.

## How the connection works

- The browser starts `integration/native-host.sh`, which runs `native-host.cjs` with the app's bundled runtime (`ELECTRON_RUN_AS_NODE`). The launcher is rewritten on every app start so it always points at the current app location.
- The native host forwards bounded JSON to an authenticated, loopback-only endpoint, reading its port and token from `~/.download-manager-for-mac/bridge.json`. It starts the app if it is closed.
- Registration writes one manifest per browser, `com.asimsafeer.downloadmanagerformac.json`, in that browser's `NativeMessagingHosts` folder under `~/Library/Application Support/`:

  | Browser | Folder |
  |---|---|
  | Chrome and Opera | `Google/Chrome/NativeMessagingHosts` |
  | Edge | `Microsoft Edge/NativeMessagingHosts` |
  | Brave | `BraveSoftware/Brave-Browser/NativeMessagingHosts` |
  | Firefox | `Mozilla/NativeMessagingHosts` |

  Only this product's manifest is touched. A changed manifest is first saved next to it as a timestamped `.bak` file.
- Firefox's manifest variant (`extension/manifest.firefox.json`) and the manual script remain development features without equivalent end-to-end verification.

## Manual registration

If automatic detection does not find your browser, register it by hand using the extension ID shown on the browser's extensions page:

```bash
bash integration/register-native-host.sh --browser Chrome --extension-id YOUR_EXTENSION_ID
```

`--browser` accepts `Chrome`, `Edge`, `Brave`, `Opera` or `Firefox`. In the packaged app the script lives in `Contents/Resources/browser/integration/`.

## Privacy and limits

Captured cookies, authorization, user agent and referrer stay in extension memory. Only context observed for the selected URL and tab is passed to the desktop. Credentials are excluded from history and stripped on cross-origin redirects. Page JavaScript has no exposed handoff endpoint.

Supported: HTTP(S), resumable byte ranges, unencrypted HLS VOD, TS/fMP4 segments, separate audio/video assembly, MP4 remuxing and MP3 extraction. Unsupported: DASH, live/encrypted HLS, byte-range HLS, arbitrary POST downloads, proxy inheritance and proprietary players. Blob URLs themselves cannot be downloaded; their observed network playlists may be supported.

Browser interception is enabled on a fresh install and can be disabled from the extension popup. Native acceptance is required before cancelling a browser transfer; failure leaves the browser transfer intact. Store distribution and signing are not supplied.

API references: [Chrome native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging), [webRequest](https://developer.chrome.com/docs/extensions/reference/api/webRequest), [FFmpeg stream selection](https://ffmpeg.org/ffmpeg.html#Stream-selection).
