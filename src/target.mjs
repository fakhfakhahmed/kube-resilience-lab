import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { targetConfig } from './config.mjs';
import { configureServer, handleError, HttpError, json, readJson, requireTargetAuth } from './http.mjs';

export const SCENARIOS = Object.freeze(['latency', 'errors', 'readiness', 'liveness']);

/** Faults apply only to this demonstration process and expire without a controller. */
export function createTargetServer({ token, enableFaults = false, instance = 'checkout-local', now = Date.now, latencyMs = 650 }) {
  if (!token) throw new Error('Target control key is required.');
  let fault = null;
  let faultRequests = 0;
  const counters = { requests: 0, failures: 0, injected: 0, resets: 0, durationSum: 0 };

  function activeFault() {
    if (fault && fault.expiresAt <= now()) fault = null;
    return fault;
  }

  const server = configureServer(createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://checkout.local').pathname;
      if (request.method === 'GET' && pathname === '/work') {
        const started = performance.now();
        const current = activeFault();
        counters.requests++;
        faultRequests++;
        if (current?.scenario === 'latency') await delay(latencyMs);
        const failed = current?.scenario === 'liveness' || (current?.scenario === 'errors' && faultRequests % 2 === 1);
        if (failed) counters.failures++;
        counters.durationSum += (performance.now() - started) / 1000;
        return json(response, failed ? 503 : 200, { ok: !failed, instance });
      }
      if (request.method === 'GET' && (pathname === '/health/live' || pathname === '/health/ready')) {
        const current = activeFault();
        const unhealthy = current?.scenario === 'liveness' || (pathname.endsWith('/ready') && current?.scenario === 'readiness');
        return json(response, unhealthy ? 503 : 200, { ok: !unhealthy, instance });
      }
      if (request.method === 'GET' && pathname === '/metrics') {
        const scenario = activeFault()?.scenario;
        const text = [
          '# HELP checkout_requests_total Observed demo work requests.',
          '# TYPE checkout_requests_total counter',
          `checkout_requests_total ${counters.requests}`,
          '# HELP checkout_failures_total Demo work requests returning HTTP 503.',
          '# TYPE checkout_failures_total counter',
          `checkout_failures_total ${counters.failures}`,
          '# HELP checkout_request_duration_seconds_sum Total work handler duration.',
          '# TYPE checkout_request_duration_seconds_sum counter',
          `checkout_request_duration_seconds_sum ${counters.durationSum}`,
          '# HELP checkout_faults_total Accepted fault injections.',
          '# TYPE checkout_faults_total counter',
          `checkout_faults_total ${counters.injected}`,
          '# HELP checkout_resets_total Accepted fault resets.',
          '# TYPE checkout_resets_total counter',
          `checkout_resets_total ${counters.resets}`,
          '# HELP checkout_fault_active Whether the named bounded fault is currently active.',
          '# TYPE checkout_fault_active gauge',
          ...SCENARIOS.map((name) => `checkout_fault_active{scenario="${name}"} ${scenario === name ? 1 : 0}`),
          '',
        ].join('\n');
        response.writeHead(200, { 'content-type': 'text/plain; version=0.0.4; charset=utf-8', 'cache-control': 'no-store' });
        return response.end(text);
      }
      if (request.method === 'POST' && ['/internal/fault', '/internal/reset'].includes(pathname)) {
        requireTargetAuth(request, token);
        const body = await readJson(request);
        if (pathname === '/internal/reset') {
          fault = null;
          counters.resets++;
          return json(response, 200, { ok: true, instance });
        }
        if (!enableFaults) throw new HttpError(403, 'Fault injection is disabled for this target.');
        if (!SCENARIOS.includes(body.scenario)) throw new HttpError(400, 'Choose a supported fault scenario.');
        if (!Number.isInteger(body.durationSeconds) || body.durationSeconds < 1 || body.durationSeconds > 60) {
          throw new HttpError(400, 'Fault duration must be an integer from 1 to 60 seconds.');
        }
        if (activeFault()) throw new HttpError(409, 'A target fault is already active.');
        faultRequests = 0;
        fault = { scenario: body.scenario, expiresAt: now() + body.durationSeconds * 1000 };
        counters.injected++;
        return json(response, 200, { ok: true, instance, scenario: fault.scenario, expiresAt: new Date(fault.expiresAt).toISOString() });
      }
      throw new HttpError(404, 'Endpoint not found.');
    } catch (error) {
      handleError(response, error);
    }
  }));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = targetConfig();
    const server = createTargetServer(config);
    server.on('error', (error) => { console.error(`Target failed to listen (${error.code ?? 'server error'}).`); process.exitCode = 1; });
    server.listen(config.port, config.host, () => console.log(`Demo target listening on ${config.host}:${config.port}. Fault injection: ${config.enableFaults ? 'enabled' : 'disabled'}.`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
