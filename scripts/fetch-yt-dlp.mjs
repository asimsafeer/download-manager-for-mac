// Downloads the official yt-dlp macOS one-directory build (yt-dlp_macos.zip) into vendor/yt-dlp/ and
// verifies its SHA-256 against the SHA2-256SUMS file published with the same release.
// The one-directory build is used instead of the one-file binary because the one-file build unpacks
// ~130 MB into a fresh temp folder on every launch, which makes macOS re-check every file each time
// (2+ minutes per start on some Macs); the one-directory build is checked once, then starts quickly.
// Usage: node scripts/fetch-yt-dlp.mjs [version] [--force]
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const force = args.includes('--force');
const version = args.find(arg => !arg.startsWith('--')) || process.env.YT_DLP_VERSION || '2026.08.19';
const asset = 'yt-dlp_macos.zip';
const base = `https://github.com/yt-dlp/yt-dlp/releases/download/${version}`;
const vendor = fileURLToPath(new URL('../vendor/', import.meta.url));
const target = path.join(vendor, 'yt-dlp');
const marker = path.join(vendor, '.yt-dlp-version');

async function fetchBuffer(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const installed = await readFile(marker, 'utf8').catch(() => '');
const present = await readFile(path.join(target, 'yt-dlp_macos')).then(() => true, () => false);
if (!force && present && installed.trim() === version) {
  console.log(`yt-dlp ${version} already present in ${target} (use --force to download again)`);
  process.exit(0);
}

const sums = (await fetchBuffer(`${base}/SHA2-256SUMS`)).toString('utf8');
const expected = sums.split(/\r?\n/).map(line => line.trim().split(/\s+/)).find(([, name]) => name === asset)?.[0];
if (!expected) throw new Error(`No checksum for ${asset} in SHA2-256SUMS of release ${version}`);

const zip = await fetchBuffer(`${base}/${asset}`);
const actual = createHash('sha256').update(zip).digest('hex');
if (actual !== expected) throw new Error(`Checksum mismatch for ${asset}: expected ${expected}, got ${actual}`);

// ditto keeps permissions and symlinks intact, which a plain unzip may not.
const zipPath = path.join(tmpdir(), `yt-dlp-${version}-${process.pid}.zip`);
await writeFile(zipPath, zip);
try {
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  execFileSync('ditto', ['-x', '-k', zipPath, target]);
} finally {
  await rm(zipPath, { force: true });
}
await chmod(path.join(target, 'yt-dlp_macos'), 0o755);
await writeFile(marker, `${version}\n`);
console.log(`yt-dlp ${version} ${asset} verified (${actual}) -> ${target}`);
