#!/usr/bin/env node
// Writes build/ffmpeg-build-info.txt from the ffmpeg binary that will actually be bundled, so the
// shipped license material describes the real binary for this architecture (version, builder and
// configure flags as reported by `ffmpeg -version`). Run before electron-builder (see npm scripts).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ffmpeg = require('ffmpeg-static');
const pkg = JSON.parse(readFileSync(path.join(path.dirname(require.resolve('ffmpeg-static/package.json')), 'package.json'), 'utf8'));
const report = execFileSync(ffmpeg, ['-version'], { encoding: 'utf8' }).trim();
const archs = execFileSync('lipo', ['-archs', ffmpeg], { encoding: 'utf8' }).trim();

const text = `Bundled FFmpeg binary: build information
=========================================
Generated at build time from the binary shipped in this app. Do not edit.

Supplied by:     ffmpeg-static ${pkg.version} (binary release ${pkg['ffmpeg-static']?.['binary-release-tag'] ?? 'unknown'})
Package source:  https://github.com/eugeneware/ffmpeg-static
Binary release:  https://github.com/eugeneware/ffmpeg-static/releases/tag/${pkg['ffmpeg-static']?.['binary-release-tag'] ?? ''}
Architecture(s): ${archs}

Output of "ffmpeg -version" for this exact binary:

${report}

Licensing: when the configuration above contains --enable-gpl, the binary is licensed under the GPL
(version 3 or later with --enable-version3). The GPL-3.0 text is in ffmpeg-static-LICENSE.txt and
FFmpeg's own licensing note is in ffmpeg-licensing-note.txt. FFmpeg and each library named in the
configuration are separate projects. FFmpeg source: https://ffmpeg.org/download.html
`;

mkdirSync(path.join(root, 'build'), { recursive: true });
writeFileSync(path.join(root, 'build', 'ffmpeg-build-info.txt'), text);
console.log(`Wrote build/ffmpeg-build-info.txt (${archs})`);
