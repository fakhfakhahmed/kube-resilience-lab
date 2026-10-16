import { timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(response, status, value, headers = {}) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  response.end(body);
}

export function tokenMatches(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string' || !expected.length) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function requireLabAuth(request, token) {
  const origin = request.headers.origin;
  if (origin !== undefined) {
    let parsed;
    try { parsed = new URL(origin); } catch { throw new HttpError(403, 'Untrusted request origin.'); }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.host !== request.headers.host) {
      throw new HttpError(403, 'Untrusted request origin.');
    }
  }
  if (!tokenMatches(request.headers['x-lab-token'], token)) {
    throw new HttpError(401, 'A valid lab control key is required.');
  }
}

export function requireTargetAuth(request, token) {
  const header = request.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ') || !tokenMatches(header.slice(7), token)) {
    throw new HttpError(401, 'A valid target control key is required.');
  }
}

export async function readJson(request, maxBytes = 4096) {
  const contentType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new HttpError(415, 'Use application/json.');
  const declaredLength = Number(request.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new HttpError(413, 'Request body exceeds 4 KB.');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Request body exceeds 4 KB.');
    chunks.push(chunk);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('object required');
    return body;
  } catch {
    throw new HttpError(400, 'Provide a valid JSON object.');
  }
}

export function configureServer(server) {
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 3000;
  server.maxHeadersCount = 50;
  return server;
}

export function handleError(response, error) {
  if (!response.headersSent && !response.destroyed) {
    json(response, error instanceof HttpError ? error.status : 500,
      { error: error instanceof HttpError ? error.message : 'The request could not be completed.' });
  }
}
