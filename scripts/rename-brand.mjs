#!/usr/bin/env node
// Repeatable brand rename. Dry-run by default; pass --apply to write files.
//   node scripts/rename-brand.mjs --display "Download Manager for Mac"          (preview)
//   node scripts/rename-brand.mjs --display "Download Manager for Mac" --apply
// Every new form is derived from --display. Only the current "Mac IDM" forms are replaced, so the
// upstream credits (LICENSE, README acknowledgements), the bare word "IDM" (Tonec's product) and the
// internal awesome-* DOM events are never touched.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = name => { const i = argv.indexOf(`--${name}`); return i === -1 ? undefined : argv[i + 1]; };
const apply = argv.includes('--apply');
const display = flag('display');
if (!display) { console.error('usage: rename-brand.mjs --display "New Name" [--apply]'); process.exit(2); }

const words = display.split(/\s+/);
const forms = {
  display,                                                                   // Mac IDM
  hyphenCased: words.join('-'),                                              // Mac-IDM (artifact names)
  slug: words.join('-').toLowerCase(),                                       // mac-idm
  pascal: words.map(w => w[0].toUpperCase() + w.slice(1)).join(''),          // MacIDM (User-Agent)
  compact: words.join('').toLowerCase()                                      // macidm (ids)
};

// Order matters: longest/most specific first. `from` forms are the current identifiers.
const rules = [
  ['aasimdev/mac-idm', `aasimdev/${forms.slug}`],
  ['com.aasimdev.macidm', `com.aasimdev.${forms.compact}`],
  ['macidm@aasimdev.github.io', `${forms.compact}@aasimdev.github.io`],
  ['.mac-idm', `.${forms.slug}`],
  ['Mac-IDM', forms.hyphenCased],
  ['Mac IDM', forms.display],
  ['mac-idm', forms.slug],
  ['MacIDM', forms.pascal],
  ['macidm', forms.compact]
];
// Wording fixes for names ending in "Mac" ("... to Download Manager for Mac for macOS.").
const polish = words.at(-1) === 'Mac' ? [[`${forms.display} for macOS`, forms.display]] : [];

const skipFile = file => file === 'LICENSE' || file.startsWith('vendor/') || file.startsWith('node_modules/') ||
  file === 'scripts/rename-brand.mjs' || /\.(png|icns|ico|jpg|gif|zip|dmg)$/.test(file);

function rewrite(text) {
  let out = text;
  for (const [from, to] of [...rules, ...polish]) out = out.split(from).join(to);
  return out;
}

const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean).filter(f => !skipFile(f));
let changedFiles = 0, changedLines = 0;
for (const file of files) {
  const buffer = readFileSync(path.join(root, file));
  if (buffer.includes(0)) continue;
  const before = buffer.toString('utf8'), after = rewrite(before);
  if (before === after) continue;
  changedFiles++;
  const a = before.split('\n'), b = after.split('\n');
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) {
    changedLines++;
    if (!apply) console.log(`${file}:${i + 1}\n  - ${a[i].trim().slice(0, 200)}\n  + ${b[i].trim().slice(0, 200)}`);
  }
  if (apply) writeFileSync(path.join(root, file), after);
}
console.log(`\n${apply ? 'Rewrote' : 'Would rewrite'} ${changedLines} line(s) in ${changedFiles} file(s).`);
console.log('Forms:', JSON.stringify(forms));
if (!apply) console.log('Dry run only. Re-run with --apply to write the changes.');
