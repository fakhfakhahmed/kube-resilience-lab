import { once } from 'node:events';

export async function serve(server, context) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

export const post = (url, body, headers = {}) => fetch(url, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body),
});

export const inertSchedule = () => ({ unref() {} });
export const flush = () => new Promise((resolve) => setImmediate(resolve));

export async function waitFor(predicate, timeoutMs = 8000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('Condition not reached within the test timeout.');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}
