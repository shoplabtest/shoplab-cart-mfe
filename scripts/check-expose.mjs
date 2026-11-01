// Fails the build when an exposed module did not get a chunk. A remote can build "successfully" and still ship an
// unresolved `__federation_expose_*` placeholder, which breaks at runtime in the host. Usage: node scripts/check-expose.mjs Page [Other ...]
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const names = process.argv.slice(2);
const dir = 'dist/assets';
const entry = `${dir}/remoteEntry.js`;
if (!existsSync(entry)) { console.error('check-expose: dist/assets/remoteEntry.js is missing'); process.exit(1); }
const files = readdirSync(dir);
const missing = names.filter((n) => !files.some((f) => f.startsWith(`__federation_expose_${n}-`)));
if (missing.length) { console.error(`check-expose: no chunk for exposed module(s): ${missing.join(', ')}`); process.exit(1); }
if (/\$\{__federation_expose_/.test(readFileSync(entry, 'utf8'))) { console.error('check-expose: remoteEntry.js has an unresolved expose placeholder'); process.exit(1); }
console.log(`check-expose: ok (${names.join(', ')})`);
