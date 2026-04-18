import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const [rootArg = '.', portArg = '4173'] = process.argv.slice(2);
const rootDir = path.resolve(rootArg);
const port = Number.parseInt(portArg, 10);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

const server = http.createServer(async (req, res) => {
  try {
    const requestPath = req.url === '/' ? '/popup.html' : req.url ?? '/popup.html';
    const decodedPath = decodeURIComponent(requestPath.split('?')[0] ?? '/popup.html');
    const relativePath = decodedPath.replace(/^\/+/, '');
    const filePath = path.resolve(rootDir, relativePath);

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    const stat = await fs.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const data = await fs.readFile(finalPath);
    const extension = path.extname(finalPath);
    const contentType = contentTypes.get(extension) ?? 'application/octet-stream';

    res.writeHead(200, {
      'content-type': contentType,
      'cache-control': 'no-store',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Static server listening on http://127.0.0.1:${port}`);
});
