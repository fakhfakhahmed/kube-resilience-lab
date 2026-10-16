import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetRemaining, boundedPush, summarize } from '../src/statistics.mjs';
import { controllerConfig, targetConfig } from '../src/config.mjs';

test('empty windows have no invented success, latency or budget results', () => {
  assert.deepEqual(summarize([]), { requests: 0, successRate: null, p95Ms: null, goodRate: null });
  assert.equal(budgetRemaining([]), null);
});

test('good requests require success AND latency; nearest rank p95 includes failures', () => {
  const samples = Array.from({ length: 20 }, (_, index) => ({ ok: index !== 19, latencyMs: index < 18 ? 10 : 650 }));
  assert.deepEqual(summarize(samples), { requests: 20, successRate: 95, p95Ms: 650, goodRate: 90 });
  assert.equal(budgetRemaining(samples), 0);
  assert.equal(summarize([{ ok: true, latencyMs: 300 }]).goodRate, 100);
  assert.equal(summarize([{ ok: true, latencyMs: 300.01 }]).goodRate, 0);
});

test('99 percent good request budget is calculated from unrounded sample counts', () => {
  const good = { ok: true, latencyMs: 20 };
  const bad = { ok: false, latencyMs: 20 };
  assert.equal(budgetRemaining(Array(200).fill(good)), 100);
  assert.equal(budgetRemaining([...Array(199).fill(good), bad]), 50);
  assert.equal(budgetRemaining([...Array(99).fill(good), bad]), 0);
  assert.equal(budgetRemaining([bad]), 0);
});

test('bounded queues retain the newest items only', () => {
  const items = [];
  for (let number = 0; number < 8; number++) boundedPush(items, number, 3);
  assert.deepEqual(items, [5, 6, 7]);
});

test('configuration rejects weak tokens, unsafe destinations, unsupported environments and port values', () => {
  const valid = { LAB_TOKEN: 'lab-test-token-12345', TARGET_TOKEN: 'target-test-token-12345' };
  assert.equal(controllerConfig(valid).environment, 'local');
  assert.throws(() => controllerConfig({ ...valid, LAB_TOKEN: 'short' }), /LAB_TOKEN/);
  assert.throws(() => controllerConfig({ ...valid, TARGET_URL: 'file:///etc/passwd' }), /HTTP/);
  assert.throws(() => controllerConfig({ ...valid, TARGET_URL: 'http://secret:password@localhost' }), /credentials/);
  assert.throws(() => controllerConfig({ ...valid, ENVIRONMENT: 'production' }), /ENVIRONMENT/);
  assert.throws(() => controllerConfig({ ...valid, PORT: '1.2' }), /PORT/);
  assert.throws(() => controllerConfig({ ...valid, SAMPLE_INTERVAL_MS: '0' }), /SAMPLE_INTERVAL_MS/);
  assert.equal(targetConfig({ TARGET_TOKEN: valid.TARGET_TOKEN }).enableFaults, false);
});
