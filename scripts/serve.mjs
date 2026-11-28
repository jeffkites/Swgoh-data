// Minimal local static preview; deployment remains GitHub Pages.
import {createServer} from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
const {values} = parseArgs({options: {host: {type: 'string', default: '127.0.0.1'},
  port: {type: 'string', default: process.env.PORT ?? '3000'}, strictPort: {type: 'boolean'}}});
const root = process.cwd();
const types = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.md': 'text/plain', '.txt': 'text/plain', '.png': 'image/png'};
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    if (parts.some(p => p.startsWith('.') || p === 'node_modules') || !['GET', 'HEAD'].includes(request.method)) throw Error('Unavailable');
    let file = path.resolve(root, ...parts);
    if (file !== root && !file.startsWith(root + path.sep)) throw Error('Unavailable');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const bytes = await readFile(file);
    response.writeHead(200, {'Content-Type': (types[path.extname(file)] ?? 'application/octet-stream') + '; charset=utf-8',
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store'});
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {response.writeHead(404, {'Content-Type': 'text/plain'}); response.end('Not found');}
}).listen(Number(values.port), values.host, () => console.log('Serving saved dashboard on port', values.port));
