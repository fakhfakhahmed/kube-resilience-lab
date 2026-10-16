import test from 'node:test';
import assert from 'node:assert/strict';
import { LabController } from '../src/controller.mjs';
import { flush, inertSchedule } from './helpers.mjs';

const options = {
  targetUrl: 'http://fixed-demo-target:8081',
  targetControlUrl: 'http://fixed-demo-control:8081',
  targetToken: 'private-target-token',
  schedule: inertSchedule,
  unschedule() {},
};
const response = (status = 200) => new Response(JSON.stringify({ ok: status === 200, instance: 'demo-a' }), { status });

test('controller validates duration, scenario, environment and single experiment lock', async () => {
  const engine = new LabController({ ...options, fetchImpl: async () => response() });
  for (const durationSeconds of [0, 4, 31, 60, 5.5, '10', null]) {
    assert.throws(() => engine.startExperiment({ scenario: 'errors', durationSeconds }), /integer from 5 to 30/);
  }
  assert.throws(() => engine.startExperiment({ scenario: 'arbitrary', durationSeconds: 5 }), /supported/);
  assert.throws(() => engine.startExperiment({ scenario: 'liveness', durationSeconds: 5 }), /requires Kubernetes/);
  engine.startExperiment({ scenario: 'errors', durationSeconds: 5 });
  assert.throws(() => engine.startExperiment({ scenario: 'errors', durationSeconds: 5 }), (error) => error.status === 409);
  await engine.stopExperiment();
  assert.equal(engine.state().experiment.status, 'cancelled');
  assert.equal(engine.state().history.length, 1);
  assert.throws(() => engine.report('unknown'), (error) => error.status === 404);
});

test('reports retain phase evidence and require two consecutive good observations for recovery', async () => {
  let clock = Date.now();
  let workStatus = 200;
  const calls = [];
  const engine = new LabController({ ...options, now: () => clock, fetchImpl: async (url) => {
    calls.push(url);
    return response(url.endsWith('/work') ? workStatus : 200);
  } });
  const { id } = engine.startExperiment({ scenario: 'errors', durationSeconds: 5 });
  const experiment = engine.active;
  await engine.sampleOnce();
  await engine.injectFault(experiment);
  workStatus = 503;
  await engine.sampleOnce();
  await engine.beginRecovery(experiment);
  workStatus = 200;
  clock += 1000;
  await engine.sampleOnce();
  assert.equal(engine.state().experiment.recoverySeconds, null);
  clock += 1000;
  await engine.sampleOnce();
  assert.equal(engine.state().experiment.recoverySeconds, 2);
  engine.finish(experiment, 'complete');
  const report = engine.report(id);
  assert.equal(report.baseline.successRate, 100);
  assert.equal(report.impact.successRate, 0);
  assert.equal(report.recovery.successRate, 100);
  assert.deepEqual(report.samples.map((sample) => sample.phase), ['baseline', 'fault', 'recovery', 'recovery']);
  assert.equal(report.schemaVersion, 1);
  assert.ok(report.caveats.some((text) => text.includes('SLA')));
  assert.ok(calls.every((url) => url.startsWith(options.targetUrl) || url.startsWith(options.targetControlUrl)));
  assert.ok(!JSON.stringify(report).includes('private-target-token'));
  assert.ok(!JSON.stringify(report).includes('fixed-demo-control'));
  report.samples.length = 0;
  assert.equal(engine.report(id).samples.length, 4, 'callers must not mutate retained evidence');
});

test('recovery streak resets on a failed observation', async () => {
  let status = 200;
  let clock = Date.now();
  const engine = new LabController({ ...options, now: () => clock, fetchImpl: async (url) => response(url.endsWith('/work') ? status : 200) });
  engine.startExperiment({ scenario: 'errors', durationSeconds: 5 });
  await engine.injectFault(engine.active);
  await engine.beginRecovery(engine.active);
  for (const next of [200, 503, 200]) {
    status = next;
    clock += 1000;
    await engine.sampleOnce();
    assert.equal(engine.state().experiment.recoverySeconds, null);
  }
  clock += 1000;
  await engine.sampleOnce();
  assert.equal(engine.state().experiment.recoverySeconds, 4);
});

test('Stop serializes reset after an in-flight injection and prevents new experiments during cleanup', async () => {
  let release;
  const injection = new Promise((resolve) => { release = resolve; });
  const calls = [];
  const engine = new LabController({ ...options, fetchImpl: async (url) => {
    calls.push(url);
    if (url.endsWith('/internal/fault')) await injection;
    return response();
  } });
  engine.startExperiment({ scenario: 'errors', durationSeconds: 5 });
  const injecting = engine.injectFault(engine.active);
  await flush();
  const stopping = engine.stopExperiment();
  assert.throws(() => engine.startExperiment({ scenario: 'errors', durationSeconds: 5 }), (error) => error.status === 409);
  assert.equal(calls.length, 1);
  release();
  await Promise.all([injecting, stopping]);
  assert.deepEqual(calls.map((url) => new URL(url).pathname), ['/internal/fault', '/internal/reset']);
  assert.equal(engine.state().experiment.status, 'cancelled');
  assert.equal(engine.state().history.length, 1);
});

test('unacknowledged injection creates a failed report and attempts bounded cleanup', async () => {
  const calls = [];
  const engine = new LabController({ ...options, fetchImpl: async (url) => {
    calls.push(url);
    throw new Error('connection lost');
  } });
  const { id } = engine.startExperiment({ scenario: 'latency', durationSeconds: 5 });
  await engine.injectFault(engine.active);
  assert.equal(engine.report(id).status, 'failed');
  assert.equal(engine.report(id).impact, null);
  assert.equal(calls.length, 2);
  assert.equal(engine.state().history.length, 1);
});

test('unreachable samples and rolling windows never invent an instance or success', async () => {
  const engine = new LabController({ ...options, fetchImpl: async () => { throw new Error('network failure'); } });
  assert.equal(engine.state().summary.successRate, null);
  for (let index = 0; index < 181; index++) await engine.sampleOnce();
  const state = engine.state();
  assert.equal(state.samples.length, 180);
  assert.equal(state.samples[0].status, 0);
  assert.equal(state.target.reachable, false);
  assert.equal(state.target.instance, null);
  assert.equal(state.summary.successRate, 0);
  assert.equal(state.summary.budgetRemaining, 0);
  assert.match(engine.metrics(), /lab_samples_total 181/);
  assert.match(engine.metrics(), /lab_sample_failures_total 181/);
});

test('reports and event history are bounded, and state does not leak control credentials', async () => {
  const engine = new LabController({ ...options, fetchImpl: async () => response() });
  let oldest;
  for (let index = 0; index < 22; index++) {
    const started = engine.startExperiment({ scenario: 'errors', durationSeconds: 5 });
    oldest ??= started.id;
    await engine.stopExperiment();
  }
  assert.equal(engine.state().history.length, 20);
  assert.equal(engine.state().events.length, 50);
  assert.throws(() => engine.report(oldest), (error) => error.status === 404);
  assert.ok(!JSON.stringify(engine.state()).includes('private-target-token'));
  assert.ok(!JSON.stringify(engine.state()).includes('fixed-demo-control'));
});

test('sampling does not overlap slow requests', async () => {
  let release;
  let calls = 0;
  const wait = new Promise((resolve) => { release = resolve; });
  const engine = new LabController({ ...options, fetchImpl: async () => { calls++; await wait; return response(); } });
  const pending = [engine.sampleOnce(), engine.sampleOnce(), engine.sampleOnce()];
  release();
  await Promise.all(pending);
  assert.equal(calls, 1);
  assert.equal(engine.state().samples.length, 1);
});
