const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const BROWSERS = {
  Chrome: { manifestKey: 'Chrome', macData: 'Google/Chrome' },
  Edge: { manifestKey: 'Edge', macData: 'Microsoft Edge' },
  Brave: { manifestKey: 'Brave', macData: 'BraveSoftware/Brave-Browser' },
  Opera: { manifestKey: 'Opera', macData: 'com.operasoftware.Opera', rootProfile: true },
  Firefox: { manifestKey: 'Firefox', firefox: true }
};

const MANIFEST_DIRS = {
  Chrome: path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'),
  Edge: path.join(os.homedir(), 'Library', 'Application Support', 'Microsoft Edge', 'NativeMessagingHosts'),
  Brave: path.join(os.homedir(), 'Library', 'Application Support', 'BraveSoftware', 'Brave-Browser', 'NativeMessagingHosts'),
  Opera: path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts'),
  Firefox: path.join(os.homedir(), 'Library', 'Application Support', 'Mozilla', 'NativeMessagingHosts')
};

function browserSpec(browser) {
  const spec = BROWSERS[browser];
  if (!spec) throw new Error('Choose Chrome, Edge, Brave, Opera, or Firefox.');
  return spec;
}

function computeExtensionId(folderPath) {
  const hash = crypto.createHash('sha256').update(folderPath, 'utf8').digest('hex').slice(0, 32);
  let id = '';
  for (let i = 0; i < hash.length; i++) {
    id += String.fromCharCode('a'.charCodeAt(0) + parseInt(hash[i], 16));
  }
  return id;
}

async function registerBrowser({ browser, extensionId }, { dataDirectory, integrationRoot }) {
  const spec = browserSpec(browser);
  if (typeof extensionId !== 'string' || !(spec.firefox ? /^[A-Za-z0-9@._{}-]{1,128}$/ : /^[a-p]{32}$/).test(extensionId)) throw new Error("Copy the extension ID from your browser's extensions page.");
  const host = 'com.asimsafeer.downloadmanagerformac';
  const nativeHostPath = path.join(integrationRoot, 'integration', 'native-host.sh');
  const manifest = { name: host, description: 'Download Manager for Mac browser bridge', path: nativeHostPath, type: 'stdio' };
  if (spec.firefox) manifest.allowed_extensions = [extensionId];
  else manifest.allowed_origins = [`chrome-extension://${extensionId}/`];

  await fs.access(nativeHostPath);

  const manifestDir = MANIFEST_DIRS[spec.manifestKey];
  const manifestPath = path.join(manifestDir, `${host}.json`);
  await fs.mkdir(manifestDir, { recursive: true });
  let previous;
  try { previous = await fs.readFile(manifestPath, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  if (previous && !spec.firefox) {
    try {
      const old = JSON.parse(previous);
      manifest.allowed_origins = [...new Set([...(old.allowed_origins || []), ...manifest.allowed_origins])].filter(value => /^chrome-extension:\/\/[a-p]{32}\/$/.test(value));
    } catch {}
  }
  const content = JSON.stringify(manifest, null, 2);
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
  if (previous && previous !== content) await fs.writeFile(`${manifestPath}.${stamp}.bak`, previous);
  if (previous !== content) await fs.writeFile(manifestPath, content, 'utf8');

  let extensionPath = path.join(integrationRoot, 'extension');
  if (spec.firefox) {
    const folder = path.join(dataDirectory, 'NativeMessaging');
    await fs.mkdir(folder, { recursive: true });
    extensionPath = path.join(folder, 'firefox-extension');
    await fs.cp(path.join(integrationRoot, 'extension'), extensionPath, { recursive: true });
    await fs.copyFile(path.join(extensionPath, 'manifest.firefox.json'), path.join(extensionPath, 'manifest.json'));
  }
  return { ok: true, manifestPath, extensionPath };
}

async function connectInstalledBrowsers({ dataDirectory, integrationRoot, appSupport = path.join(os.homedir(), 'Library', 'Application Support') }, { register = registerBrowser } = {}) {
  const results = [];
  const expected = await fs.realpath(path.join(integrationRoot, 'extension')).catch(() => path.join(integrationRoot, 'extension'));

  for (const [browser, spec] of Object.entries(BROWSERS).filter(([, value]) => !value.firefox)) {
    const root = path.join(appSupport, spec.macData);

    // Also register the ID Chromium computes for this unpacked extension folder
    const ids = new Set([computeExtensionId(expected)]);

    let profiles;
    try { profiles = await fs.readdir(root, { withFileTypes: true }); } catch { profiles = []; }
    if (spec.rootProfile && profiles.length) profiles = [{ name: '.', isDirectory: () => true }, ...profiles];

    for (const profile of profiles.filter(p => p.isDirectory() && (p.name === '.' || /^(Default|Profile \d+)$/.test(p.name)))) {
      for (const file of ['Preferences', 'Secure Preferences']) {
        try {
          const settings = JSON.parse(await fs.readFile(path.join(root, profile.name, file), 'utf8')).extensions?.settings || {};
          const extensionsDirectory = path.join(root, profile.name, 'Extensions');
          for (const [id, entry] of Object.entries(settings)) {
            if (!/^[a-p]{32}$/.test(id) || !entry.path) continue;
            // "Load unpacked" extensions have an absolute path; store-installed ones are relative to <profile>/Extensions.
            const location = path.isAbsolute(entry.path) ? entry.path : path.join(extensionsDirectory, entry.path);
            if (!path.isAbsolute(entry.path) && path.relative(extensionsDirectory, location).startsWith('..')) continue;
            try {
              const installed = await fs.realpath(location).catch(() => null);
              let ownExtension = installed?.toLowerCase() === expected.toLowerCase();
              if (installed && !ownExtension) {
                const manifest = JSON.parse(await fs.readFile(path.join(installed, 'manifest.json'), 'utf8'));
                const background = await fs.readFile(path.join(installed, 'background.js'), 'utf8');
                ownExtension = manifest.name === 'Download Manager for Mac Integration' && manifest.background?.service_worker === 'background.js' && background.includes("const HOST = 'com.asimsafeer.downloadmanagerformac'");
              }
              if (ownExtension) ids.add(id);
            } catch {}
          }
        } catch {}
      }
    }

    if (ids.size) {
      for (const extensionId of ids) await register({ browser, extensionId }, { dataDirectory, integrationRoot });
      results.push({ browser, connected: true });
    }
  }
  return results;
}

async function prepareNativeHost(integrationRoot, executable) {
  const folder = path.join(integrationRoot, 'integration');
  const target = path.join(folder, 'native-host.sh');
  const script = `#!/bin/bash\nexport ELECTRON_RUN_AS_NODE=1\nexec "${executable}" "$(dirname "$0")/native-host.cjs"\n`;
  await fs.writeFile(target, script, { mode: 0o755 });
  await fs.writeFile(path.join(folder, 'runtime-path.txt'), executable, 'utf8');
}

module.exports = { BROWSERS, browserSpec, registerBrowser, connectInstalledBrowsers, prepareNativeHost, computeExtensionId };
