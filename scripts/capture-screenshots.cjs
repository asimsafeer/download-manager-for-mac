// Takes the README screenshots of the real renderer with SAMPLE data (see screenshot-preload.cjs).
// It uses a throwaway profile and never reads or writes your real downloads or settings.
//   env -u ELECTRON_RUN_AS_NODE npx electron scripts/capture-screenshots.cjs
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'docs', 'screenshots');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'dmfm-shots-')));
app.whenReady().then(async () => {
  fs.mkdirSync(out, { recursive: true });
  const window = new BrowserWindow({ width: 1100, height: 700, x: 40, y: 40, show: true, backgroundColor: '#f0f0f0',
    webPreferences: { preload: path.join(__dirname, 'screenshot-preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  await window.loadFile(path.join(root, 'renderer', 'index.html'));
  await wait(1500);
  const run = code => window.webContents.executeJavaScript(code);
  const shot = async name => {
    const image = await window.webContents.capturePage();
    const size = image.getSize();
    const scaled = size.width > 1500 ? image.resize({ width: 1500, quality: 'best' }) : image;
    fs.writeFileSync(path.join(out, `${name}.png`), scaled.toPNG());
    console.log(`wrote docs/screenshots/${name}.png (${scaled.getSize().width}x${scaled.getSize().height})`);
  };
  // dismiss any first-run introduction so the main list is visible
  await run("document.querySelectorAll('dialog[open] [data-close]').forEach(b => b.click())");
  await wait(300);
  await shot('main-window');
  await run("document.querySelector('#new-download').click()");
  await wait(600);
  await shot('add-download');
  await run("document.querySelectorAll('dialog[open] [data-close]').forEach(b => b.click())");
  await wait(300);
  await run("document.querySelector('#integration-button').click()");
  await wait(600);
  await shot('browser-integration');
  app.quit();
}).catch(error => { console.error(error); app.exit(1); });
