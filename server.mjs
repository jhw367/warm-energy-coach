import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(here, 'public');
const host = process.env.HOST || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '4173', 10);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon']
]);

const securityHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

function send(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { ...securityHeaders, 'Content-Type': type });
  response.end(body);
}

function resolvePublicPath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0]);
  const requested = pathname === '/' ? '/index.html' : pathname;
  const absolute = path.resolve(publicRoot, `.${requested}`);
  const relative = path.relative(publicRoot, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return absolute;
}

const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    response.setHeader('Allow', 'GET, HEAD');
    send(response, 405, 'Method Not Allowed');
    return;
  }

  const filePath = resolvePublicPath(request.url || '/');
  if (!filePath) {
    send(response, 400, 'Bad Request');
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error('Not a file');
    const body = request.method === 'HEAD' ? '' : await readFile(filePath);
    const type = contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
    send(response, 200, body, type);
  } catch {
    send(response, 404, 'Not Found');
  }
});

server.listen(port, host, () => {
  console.log(`WARM Energy Coach listening on http://${host}:${port}`);
});

function close() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', close);
process.on('SIGTERM', close);
