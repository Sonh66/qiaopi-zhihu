const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
const server = http.createServer((request, response) => {
  let filename;
  try {
    const requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    filename = path.resolve(root, `.${requestedPath === '/' ? '/index.html' : requestedPath}`);
  } catch {
    response.writeHead(400).end('Invalid request');
    return;
  }
  const relative = path.relative(root, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative) || relative.startsWith('node_modules') || relative.startsWith('.')) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  fs.stat(filename, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404).end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    const stream = fs.createReadStream(filename);
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  });
});
server.on('error', (error) => { console.error(`Server failed: ${error.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Qiaopi workspace: http://127.0.0.1:${port}`));
