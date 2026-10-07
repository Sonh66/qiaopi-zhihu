const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = ['index.html', 'design.css', 'app.js', 'motion.js'];
const folders = ['assets', 'vendor'];

for (const filename of [...files, ...folders]) {
  if (!fs.existsSync(path.join(root, filename))) throw new Error(`Required website resource is missing: ${filename}`);
}
fs.mkdirSync(output, { recursive: true });
for (const filename of files) fs.copyFileSync(path.join(root, filename), path.join(output, filename));
for (const folder of folders) fs.cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Static website ready in dist/');
