import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { controllerConfig } from './config.mjs';
import { LabController } from './controller.mjs';
import { configureServer, handleError, HttpError, json, readJson, requireLabAuth } from './http.mjs';

const DEFAULT_PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2',
};

export function createControllerServer({ labToken, publicDir = DEFAULT_PUBLIC, ...options }) {
  if (!labToken) throw new Error('Lab control key is required.');
  const engine = new LabController(options);
  const root = resolve(publicDir);
  const server = configureServer(createServer(async (request, response) => {
    response.setHeader('x-content-type-options', 'nosniff');
    response.setHeader('referrer-policy', 'no-referrer');
    response.setHeader('x-frame-options', 'DENY');
    response.setHeader('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      let pathname;
      try { pathname = decodeURIComponent(new URL(request.url, 'http://lab.local').pathname); }
      catch { throw new HttpError(400, 'Invalid request path.'); }
      if (request.method === 'GET' && pathname === '/api/state') return json(response, 200, engine.state());
      if (request.method === 'GET' && pathname.startsWith('/api/reports/')) {
        const id = pathname.slice('/api/reports/'.length);
        if (!/^[0-9a-f-]{36}$/.test(id)) throw new HttpError(404, 'Report not found.');
        return json(response, 200, engine.report(id), { 'content-disposition': `attachment; filename="kube-resilience-${id}.json"` });
      }
      if (request.method === 'POST' && ['/api/experiments', '/api/experiments/stop'].includes(pathname)) {
        requireLabAuth(request, labToken);
        const body = await readJson(request);
        const experiment = pathname.endsWith('/stop') ? await engine.stopExperiment() : engine.startExperiment(body);
        return json(response, pathname.endsWith('/stop') ? 200 : 201, { experiment });
      }
      if (request.method === 'GET' && ['/health/live', '/health/ready'].includes(pathname)) {
        // Target failure is the point of this lab; it must not remove the UI or
        // stop/reset controls from the controller Service.
        return json(response, engine.closed ? 503 : 200, { ok: !engine.closed });
      }
      if (request.method === 'GET' && pathname === '/metrics') {
        response.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8', 'cache-control': 'no-store' });
        return response.end(engine.metrics());
      }
      if (pathname.startsWith('/api/') || !['GET', 'HEAD'].includes(request.method)) throw new HttpError(404, 'Endpoint not found.');
      if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').some((part) => part.startsWith('.'))) throw new HttpError(404, 'File not found.');
      const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(`${root}${sep}`)) throw new HttpError(404, 'File not found.');
      if (!MIME_TYPES[extname(file)]) throw new HttpError(404, 'File not found.');
      let content;
      try { content = await readFile(file); } catch { throw new HttpError(404, 'File not found.'); }
      response.writeHead(200, { 'content-type': MIME_TYPES[extname(file)], 'content-length': content.length, 'cache-control': 'no-cache' });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) { handleError(response, error); }
  }));
  return { server, engine };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = controllerConfig();
    const { server, engine } = createControllerServer(config);
    server.on('error', (error) => { console.error(`Controller failed to listen (${error.code ?? 'server error'}).`); process.exitCode = 1; });
    server.listen(config.port, config.host, () => {
      engine.startSampling();
      console.log(`Kube Resilience Lab listening on http://${config.host}:${config.port} (${config.environment}).`);
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
      await engine.shutdown();
      server.close(() => process.exit(0));
    });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
