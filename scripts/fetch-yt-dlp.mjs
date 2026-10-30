// Downloads the official yt-dlp macOS binary into vendor/ and verifies its SHA-256
// against the SHA2-256SUMS file published with the same release.
// Usage: node scripts/fetch-yt-dlp.mjs [version]
import { createHash } from 'node:crypto';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const version = process.argv[2] || process.env.YT_DLP_VERSION || '2026.08.19';
const asset = 'yt-dlp_macos';
const base = `https://github.com/yt-dlp/yt-dlp/releases/download/${version}`;

async function fetchBuffer(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const sums = (await fetchBuffer(`${base}/SHA2-256SUMS`)).toString('utf8');
const expected = sums.split(/\r?\n/).map(line => line.trim().split(/\s+/)).find(([, name]) => name === asset)?.[0];
if (!expected) throw new Error(`No checksum for ${asset} in SHA2-256SUMS of release ${version}`);

const binary = await fetchBuffer(`${base}/${asset}`);
const actual = createHash('sha256').update(binary).digest('hex');
if (actual !== expected) throw new Error(`Checksum mismatch for ${asset}: expected ${expected}, got ${actual}`);

const target = fileURLToPath(new URL(`../vendor/${asset}`, import.meta.url));
await mkdir(new URL('../vendor/', import.meta.url), { recursive: true });
await writeFile(target, binary);
await chmod(target, 0o755);
console.log(`yt-dlp ${version} ${asset} verified (${actual}) -> ${target}`);
