# Privacy policy

> **Draft.** Review and edit this before linking it from a store listing. It describes what the code in this
> repository does as of version 0.1.1; if behaviour changes, update it.

Download Manager for Mac (the desktop app) and "Download Manager for Mac Integration" (the browser extension)
are made by the project owner, asimsafeer. **This project does not operate any server, does not collect your
data, and contains no analytics, telemetry, crash reporting or advertising.** Nothing you do is sent to the
project owner.

## The browser extension

- To offer a download, the extension sees the address of the page you are on and of media requests the page
  makes. For the file you choose, it also reads the request headers needed to download the same file
  (referrer, user agent, and cookies or authorization headers if the site used them).
- This information is kept in the browser's memory (session storage) and is **only passed to the desktop app
  on your own computer** through the browser's native messaging, when you choose a download.
- For streaming video, the extension may fetch the playlist file of a video you are watching (without your
  cookies) to read the available qualities.
- It saves two things on your device: a switch that says whether to take over browser downloads, and the last
  error message.
- It does not load or run code from the internet.

## The desktop app

- It downloads the files you ask for from the addresses you give it, and stores your download history and
  settings on your computer in `~/.download-manager-for-mac` and the app's data folder. Credentials are left out
  of the history.
- Its local connection for the extension listens only on `127.0.0.1` and requires a secret token.
- When you download a YouTube video, the bundled yt-dlp talks to YouTube. Files, URLs and cookies are not shared
  with anyone else.
- Bundled third-party programs (FFmpeg, yt-dlp) run locally. See [THIRD-PARTY.md](../THIRD-PARTY.md).

## Your choices

You can disable download interception in the extension popup, remove the extension from your browser, delete
`~/.download-manager-for-mac`, and uninstall the app at any time.

## Contact

Open an issue at <https://github.com/asimsafeer/download-manager-for-mac/issues>. For security problems see
[SECURITY.md](../SECURITY.md).
