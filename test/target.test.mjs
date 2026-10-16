import test from 'node:test';
import assert from 'node:assert/strict';
import { createTargetServer } from '../src/target.mjs';
import { post, serve } from './helpers.mjs';

const TOKEN = 'target-test-control-token';
const auth = { authorization: `Bearer ${TOKEN}` };

test('target control requires authentication and explicit fault enablement', async (context) => {
  const base = await serve(createTargetServer({ token: TOKEN }), context);
  assert.equal((await post(`${base}/internal/fault`, { scenario: 'errors', durationSeconds: 5 })).status, 401);
  assert.equal((await post(`${base}/internal/fault`, { scenario: 'errors', durationSeconds: 5 }, { authorization: 'Bearer wrong' })).status, 401);
  assert.equal((await post(`${base}/internal/fault`, { scenario: 'errors', durationSeconds: 5 }, auth)).status, 403);
  assert.equal((await fetch(`${base}/work`)).status, 200);
  assert.equal((await post(`${base}/internal/reset`, {}, auth)).status, 200);
});

test('target independently expires faults, bounds TTL and rejects overlapping injections', async (context) => {
  let clock = Date.now();
  const base = await serve(createTargetServer({ token: TOKEN, enableFaults: true, now: () => clock }), context);
  for (const value of [0, -1, 61, 1.1, '10', null]) {
    assert.equal((await post(`${base}/internal/fault`, { scenario: 'errors', durationSeconds: value }, auth)).status, 400);
  }
  assert.equal((await post(`${base}/internal/fault`, { scenario: 'delete-pods', durationSeconds: 5 }, auth)).status, 400);
  const accepted = await post(`${base}/internal/fault`, { scenario: 'liveness', durationSeconds: 60 }, auth);
  assert.equal(accepted.status, 200);
  assert.equal((await fetch(`${base}/health/live`)).status, 503);
  assert.equal((await fetch(`${base}/work`)).status, 503);
  assert.equal((await post(`${base}/internal/fault`, { scenario: 'errors', durationSeconds: 5 }, auth)).status, 409);
  clock += 60000;
  assert.equal((await fetch(`${base}/health/live`)).status, 200);
  assert.equal((await fetch(`${base}/work`)).status, 200);
  assert.match(await (await fetch(`${base}/metrics`)).text(), /checkout_fault_active\{scenario="liveness"\} 0/);
});

test('readiness affects only ready probe; reset restores it', async (context) => {
  const base = await serve(createTargetServer({ token: TOKEN, enableFaults: true, instance: 'checkout-test' }), context);
  await post(`${base}/internal/fault`, { scenario: 'readiness', durationSeconds: 10 }, auth);
  assert.equal((await fetch(`${base}/health/ready`)).status, 503);
  assert.equal((await fetch(`${base}/health/live`)).status, 200);
  assert.deepEqual(await (await fetch(`${base}/work`)).json(), { ok: true, instance: 'checkout-test' });
  await post(`${base}/internal/reset`, {}, auth);
  assert.equal((await fetch(`${base}/health/ready`)).status, 200);
});

test('errors are deterministic alternating failures, with real metric counts', async (context) => {
  const base = await serve(createTargetServer({ token: TOKEN, enableFaults: true }), context);
  await post(`${base}/internal/fault`, { scenario: 'errors', durationSeconds: 5 }, auth);
  const statuses = [];
  for (let number = 0; number < 4; number++) statuses.push((await fetch(`${base}/work`)).status);
  assert.deepEqual(statuses, [503, 200, 503, 200]);
  const metrics = await (await fetch(`${base}/metrics`)).text();
  assert.match(metrics, /checkout_requests_total 4\n/);
  assert.match(metrics, /checkout_failures_total 2\n/);
  assert.match(metrics, /checkout_faults_total 1\n/);
});

test('latency scenario delays actual HTTP work by approximately 650 ms', async (context) => {
  const base = await serve(createTargetServer({ token: TOKEN, enableFaults: true }), context);
  await post(`${base}/internal/fault`, { scenario: 'latency', durationSeconds: 5 }, auth);
  const start = performance.now();
  assert.equal((await fetch(`${base}/work`)).status, 200);
  assert.ok(performance.now() - start >= 600, 'a real delay must occur');
});

test('target rejects oversized, malformed and non-object JSON bodies', async (context) => {
  const base = await serve(createTargetServer({ token: TOKEN, enableFaults: true }), context);
  assert.equal((await post(`${base}/internal/fault`, { padding: 'x'.repeat(5000) }, auth)).status, 413);
  assert.equal((await post(`${base}/internal/fault`, [], auth)).status, 400);
  assert.equal((await fetch(`${base}/internal/fault`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await fetch(`${base}/internal/fault`, { method: 'POST', headers: auth, body: '{}' })).status, 415);
});
