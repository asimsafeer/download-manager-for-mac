// Preload for scripts/capture-screenshots.cjs: replaces the app's backend with static SAMPLE data so the
// real renderer can be photographed without touching any real downloads or settings.
const { contextBridge } = require('electron');

const MB = 1024 * 1024, GB = 1024 * MB, now = Date.now(), minutes = n => new Date(now - n * 60000).toISOString();
const segments = (total, done, status) => Array.from({ length: 8 }, (_, i) => {
  const size = Math.floor(total / 8), start = i * size, end = i === 7 ? total - 1 : start + size - 1;
  const part = Math.min(1, Math.max(0, (done - start) / (end - start + 1)));
  return { start, end, downloaded: Math.floor((end - start + 1) * part), total: end - start + 1, status: part >= 1 ? 'complete' : status };
});
const item = (id, filename, category, status, total, done, extra = {}) => ({
  id, url: `https://example.com/files/${filename}`, filename, category, status, total, downloaded: done, speed: 0, kind: 'http',
  resumable: true, directory: '/Users/you/Downloads', path: `/Users/you/Downloads/${filename}`, createdAt: minutes(extra.age ?? 30),
  connectionsProgress: total && status !== 'queued' ? segments(total, done, status) : [], ...extra
});

const downloads = [
  item('1', 'ubuntu-24.04.2-desktop-amd64.iso', 'Archives', 'downloading', 5.9 * GB, 3.7 * GB, { speed: 18.4 * MB, age: 12 }),
  item('2', 'Big_Buck_Bunny_1080p.mp4', 'Video', 'downloading', 276 * MB, 113 * MB, { speed: 9.2 * MB, age: 4 }),
  item('3', 'node-v22.11.0.pkg', 'Programs', 'complete', 85 * MB, 85 * MB, { age: 95 }),
  item('4', 'annual-report-2025.pdf', 'Documents', 'complete', 4.2 * MB, 4.2 * MB, { age: 140 }),
  item('5', 'lofi-study-mix.mp3', 'Audio', 'paused', 58 * MB, 42 * MB, { age: 60 }),
  item('6', 'photos-backup.zip', 'Archives', 'queued', 1.4 * GB, 0, { age: 3 }),
  item('7', 'conference-keynote.mp4', 'Video', 'scheduled', 812 * MB, 0, { age: 20, scheduledAt: new Date(now + 9 * 3600000).toISOString() }),
  item('8', 'dataset-v3.tar.gz', 'Archives', 'error', 640 * MB, 96 * MB, { age: 200, error: 'The server refused the request (HTTP 403).' })
];
const settings = { defaultDirectory: '/Users/you/Downloads', maxConcurrent: 3, connections: 8, speedLimitKbps: 0, categoryDirectories: {},
  notifyOnComplete: true, revealOnComplete: false, confirmBrowserDownloads: true };
const integration = { port: 51234, connectedBrowsers: [{ browser: 'Chrome', connected: true }, { browser: 'Edge', connected: true }], connectionError: '',
  extensionPath: '/Applications/Download Manager for Mac.app/Contents/Resources/browser/extension',
  integrationPath: '/Applications/Download Manager for Mac.app/Contents/Resources/browser/integration', packaged: true, executable: '' };
const snapshot = () => ({ downloads, settings, integration });

// contextBridge copies own properties only, so every method the real preload exposes is listed explicitly.
const api = {};
for (const name of ['snapshot', 'add', 'review', 'action', 'settings', 'chooseDirectory', 'clipboard', 'integration', 'browserSetup', 'registerBrowser', 'openProgress', 'closeProgress', 'resizeProgress']) api[name] = async () => ({});
api.snapshot = async () => snapshot();
api.integration = async () => integration;
api.clipboard = async () => 'https://example.com/files/sample-archive.zip';
api.subscribe = () => () => {};
api.onCommand = () => () => {};
contextBridge.exposeInMainWorld('downloader', Object.freeze(api));
