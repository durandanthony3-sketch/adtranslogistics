'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname);
const output = path.resolve(root, 'public');
if (output !== path.join(root, 'public') || !output.startsWith(root + path.sep)) throw Error('Unsafe output path');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw Error('Public output must not be a symlink');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
const folders = new Set(['assets', 'data', 'downloads', 'en', 'guides', 'icons', 'telechargements', '.well-known']);
const extensions = new Set(['.html', '.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico', '.pdf', '.woff', '.woff2', '.txt', '.xml']);
const excluded = new Set(['vercel.json', 'package.json', 'package-lock.json']);
let count = 0;
function copyDirectory(source, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || excluded.has(entry.name)) continue;
    const src = path.join(source, entry.name), dest = path.join(destination, entry.name);
    if (entry.isSymbolicLink()) throw Error('Symlink excluded from public build');
    if (entry.isDirectory()) copyDirectory(src, dest);
    else if (entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase())) { fs.copyFileSync(src, dest); count++; }
  }
}
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() && folders.has(entry.name)) copyDirectory(path.join(root, entry.name), path.join(output, entry.name));
  else if (entry.isFile() && !entry.name.startsWith('.') && !excluded.has(entry.name) && extensions.has(path.extname(entry.name).toLowerCase())) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name)); count++;
  }
}
for (const privatePath of ['api', 'lib', 'private', 'tools', '.env', 'build-public.cjs']) {
  if (fs.existsSync(path.join(output, privatePath))) throw Error('Private build file exposed: ' + privatePath);
}
console.log('Public build: ' + count + ' files; server modules excluded.');
