import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { LabController } from '../src/controller.mjs';
import { createControllerServer } from '../src/server.mjs';
import { createTargetServer } from '../src/target.mjs';
import { inertSchedule, post, serve, waitFor } from './helpers.mjs';

const LAB_TOKEN = 'lab-test-control-token';
const TARGET_TOKEN = 'target-test-control-token';
const auth = { 'x-lab-token': LAB_TOKEN };

async function setup(context, extra = {}) {
  const targetUrl = await serve(createTargetServer({ token: TARGET_TOKEN, enableFaults: true }), context);
  const { server, engine } = createControllerServer({
    labToken: LAB_TOKEN, targetToken: TARGET_TOKEN, targetUrl, schedule: inertSchedule, unschedule() {}, ...extra,
  });
  const base = await serve(server, context);
  context.after(() => engine.shutdown());
  return { base, engine, targetUrl };
}

test('API enforces write auth and same-host Origin while keeping state and health read-only', async (context) => {
  const { base, targetUrl } = await setup(context);
  const body = { scenario: 'errors', durationSeconds: 5 };
  assert.equal((await fetch(`${base}/api/state`)).status, 200);
  assert.equal((await post(`${base}/api/experiments`, body)).status, 401);
  assert.equal((await post(`${base}/api/experiments`, body, { 'x-lab-token': 'wrong' })).status, 401);
  assert.equal((await post(`${base}/api/experiments`, body, { ...auth, origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(`${base}/api/experiments`, body, { ...auth, origin: 'null' })).status, 403);
  const accepted = await post(`${base}/api/experiments`, body, { ...auth, origin: base });
  assert.equal(accepted.status, 201);
  assert.equal((await post(`${base}/api/experiments`, body, auth)).status, 409);
  await post(`${targetUrl}/internal/fault`, { scenario: 'liveness', durationSeconds: 5 }, { authorization: `Bearer ${TARGET_TOKEN}` });
  assert.equal((await fetch(`${base}/health/ready`)).status, 200, 'controller must remain ready during target failure');
  assert.equal((await post(`${base}/api/experiments/stop`, {}, auth)).status, 200);
  assert.equal((await fetch(`${targetUrl}/work`)).status, 200);
});

test('HTTP input limits, report errors and static file confinement', async (context) => {
  const publicDir = await mkdtemp(join(tmpdir(), 'kube-resilience-test-'));
  context.after(() => rm(publicDir, { recursive: true, force: true }));
  await writeFile(join(publicDir, 'index.html'), '<!doctype html><title>Lab</title>');
  const { base } = await setup(context, { publicDir });
  assert.equal((await post(`${base}/api/experiments`, { padding: 'x'.repeat(5000) }, auth)).status, 413);
  assert.equal((await post(`${base}/api/experiments`, { scenario: 'errors', durationSeconds: 31 }, auth)).status, 400);
  assert.equal((await post(`${base}/api/experiments`, { scenario: 'liveness', durationSeconds: 5 }, auth)).status, 400);
  assert.equal((await fetch(`${base}/api/reports/unknown`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e%2fsrc/server.mjs`)).status, 404);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  assert.equal((await fetch(`${base}/%5c..%5c.env`)).status, 404);
  assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.match(await page.text(), /<title>Lab<\/title>/);
});

test('each HTTP sample opens a fresh connection so readiness routing changes can be observed', async (context) => {
  let connections = 0;
  const headers = [];
  const target = createServer((request, response) => {
    headers.push(request.headers.connection);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ ok: true, instance: 'fresh-connection-test' }));
  });
  target.on('connection', () => connections++);
  const targetUrl = await serve(target, context);
  const engine = new LabController({ targetUrl, targetToken: TARGET_TOKEN });
  await engine.sampleOnce();
  await engine.sampleOnce();
  assert.deepEqual(headers, ['close', 'close']);
  assert.equal(connections, 2);
  assert.equal(engine.state().summary.successRate, 100);
  await engine.shutdown();
});

test('real HTTP experiment completes with measured failures, recovery and downloadable evidence', { timeout: 15000 }, async (context) => {
  const { base, engine } = await setup(context, {
    schedule: setTimeout, unschedule: clearTimeout, sampleIntervalMs: 40, baselineMs: 160, recoveryMs: 240,
  });
  engine.startSampling();
  const start = await post(`${base}/api/experiments`, { scenario: 'errors', durationSeconds: 5 }, auth);
  assert.equal(start.status, 201);
  const { experiment } = await start.json();
  await waitFor(() => engine.state().experiment.status === 'complete', 10000);
  const download = await fetch(`${base}/api/reports/${experiment.id}`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /attachment/);
  const report = await download.json();
  assert.equal(report.status, 'complete');
  assert.ok(report.baseline.requests > 0);
  assert.equal(report.baseline.successRate, 100);
  assert.ok(report.impact.requests > 20);
  assert.ok(report.impact.successRate > 35 && report.impact.successRate < 65);
  assert.equal(report.recovery.successRate, 100);
  assert.ok(report.recoverySeconds !== null);
  assert.ok(report.samples.some((sample) => sample.status === 503 && sample.phase === 'fault'));
  assert.ok(!JSON.stringify(report).includes(LAB_TOKEN));
  assert.ok(!JSON.stringify(report).includes(TARGET_TOKEN));
  const metrics = await (await fetch(`${base}/metrics`)).text();
  assert.match(metrics, /lab_experiments_total\{status="complete"\} 1/);
  assert.match(metrics, /lab_experiment_active 0/);
  assert.equal(engine.state().history.length, 1);
});
