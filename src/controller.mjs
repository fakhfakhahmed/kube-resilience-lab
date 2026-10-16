import { randomUUID } from 'node:crypto';
import { HttpError } from './http.mjs';
import { POLICY, boundedPush, budgetRemaining, isGood, summarize } from './statistics.mjs';
import { SCENARIOS } from './target.mjs';

const ACTIVE_STATUSES = new Set(['baseline', 'fault', 'recovery']);
const iso = (timestamp) => new Date(timestamp).toISOString();
const clone = (value) => structuredClone(value);

export class LabController {
  constructor({
    targetUrl, targetControlUrl = targetUrl, targetToken, environment = 'local',
    sampleIntervalMs = 1000, requestTimeoutMs = 2000, controlTimeoutMs = 2500,
    baselineMs = 3000, recoveryMs = 5000, now = Date.now, fetchImpl = fetch,
    schedule = setTimeout, unschedule = clearTimeout,
  }) {
    this.targetUrl = targetUrl;
    this.targetControlUrl = targetControlUrl;
    this.targetToken = targetToken;
    this.environment = environment;
    this.sampleIntervalMs = sampleIntervalMs;
    this.requestTimeoutMs = requestTimeoutMs;
    this.controlTimeoutMs = controlTimeoutMs;
    this.baselineMs = baselineMs;
    this.recoveryMs = recoveryMs;
    this.now = now;
    this.fetch = fetchImpl;
    this.schedule = schedule;
    this.unschedule = unschedule;
    this.started = now();
    this.samples = [];
    this.events = [];
    this.reports = new Map();
    this.current = null;
    this.active = null;
    this.target = { name: 'checkout-api', instance: null, reachable: false };
    this.counters = { samples: 0, failures: 0, good: 0, complete: 0, cancelled: 0, failed: 0 };
    this.controlQueue = Promise.resolve();
    this.cleaningUp = false;
    this.closed = false;
    this.abort = new AbortController();
    this.event('info', 'Waiting for the first real HTTP observation.');
  }

  event(type, message, experiment = this.active) {
    const event = { at: iso(this.now()), type, message };
    boundedPush(this.events, event, 50);
    if (experiment) boundedPush(experiment.events, event, 50);
  }

  startSampling() {
    if (this.interval || this.closed) return;
    void this.sampleOnce();
    this.interval = setInterval(() => void this.sampleOnce(), this.sampleIntervalMs);
    this.interval.unref?.();
  }

  async sampleOnce() {
    if (this.closed) return null;
    if (this.pendingSample) return this.pendingSample;
    this.pendingSample = this.collectSample().finally(() => { this.pendingSample = null; });
    return this.pendingSample;
  }

  async collectSample() {
    const started = performance.now();
    const experiment = this.active;
    const phase = experiment?.status ?? null;
    let status = 0;
    let instance = null;
    let reachable = false;
    try {
      const response = await this.fetch(`${this.targetUrl}/work`, {
        // Existing keep-alive flows can outlive a Kubernetes readiness change.
        // Each observation deliberately exercises a fresh Service connection.
        headers: { connection: 'close' },
        signal: AbortSignal.any([this.abort.signal, AbortSignal.timeout(this.requestTimeoutMs)]),
        redirect: 'error',
      });
      reachable = true;
      status = response.status;
      try {
        const body = await response.json();
        if (typeof body.instance === 'string') instance = body.instance.slice(0, 128);
      } catch { /* HTTP observations remain valid even without a JSON instance field. */ }
    } catch { /* A connection failure is a real failed observation, represented by status 0. */ }
    if (this.closed) return null;
    const sample = {
      at: iso(this.now()),
      latencyMs: Math.round((performance.now() - started) * 100) / 100,
      status,
      ok: status >= 200 && status < 300,
      instance,
    };
    const previousReachability = this.target.reachable;
    const previousInstance = this.target.instance;
    this.target.reachable = reachable;
    if (instance) this.target.instance = instance;
    boundedPush(this.samples, sample, 180);
    this.counters.samples++;
    if (!sample.ok) this.counters.failures++;
    if (isGood(sample)) this.counters.good++;
    if (this.counters.samples === 1 || previousReachability !== reachable) {
      this.event(reachable ? 'info' : 'warning', reachable ? 'The target answered an HTTP request.' : 'The target could not be reached.');
    }
    if (instance && previousInstance && instance !== previousInstance) {
      this.event('info', 'Observed a different target instance; inspect Kubernetes events to determine the cause.');
    }
    // Attribute a request to the phase in which it started. A request that straddles
    // a phase boundary must not be relabelled as evidence for the following phase.
    if (experiment && this.active === experiment && ACTIVE_STATUSES.has(phase)) {
      boundedPush(experiment.observations, { ...sample, phase }, 600);
      if (phase === 'recovery' && experiment.status === 'recovery' && experiment.recoverySeconds === null) {
        experiment.goodStreak = isGood(sample) ? experiment.goodStreak + 1 : 0;
        if (experiment.goodStreak >= 2) {
          experiment.recoverySeconds = Math.round((this.now() - experiment.faultEndedAt) / 10) / 100;
          this.event('recovery', 'Recovery observed: two consecutive requests met the latency and success objective.', experiment);
        }
      }
    }
    return sample;
  }

  snapshotExperiment(experiment) {
    if (!experiment) return null;
    const phaseSummary = (phase) => {
      const observations = experiment.observations.filter((sample) => sample.phase === phase);
      return observations.length ? summarize(observations) : null;
    };
    return {
      id: experiment.id,
      scenario: experiment.scenario,
      status: experiment.status,
      durationSeconds: experiment.durationSeconds,
      startedAt: experiment.startedAt,
      phaseEndsAt: experiment.phaseEndsAt,
      finishedAt: experiment.finishedAt,
      baseline: phaseSummary('baseline'),
      impact: phaseSummary('fault'),
      recovery: phaseSummary('recovery'),
      recoverySeconds: experiment.recoverySeconds,
      events: clone(experiment.events),
    };
  }

  state() {
    return {
      now: iso(this.now()),
      environment: this.environment,
      target: { ...this.target },
      policy: { ...POLICY },
      summary: {
        ...summarize(this.samples),
        budgetRemaining: budgetRemaining(this.samples),
        uptimeSeconds: Math.max(0, Math.floor((this.now() - this.started) / 1000)),
      },
      samples: clone(this.samples),
      experiment: this.snapshotExperiment(this.current),
      history: [...this.reports.values()].reverse().map(({ id, scenario, status, startedAt, finishedAt, recoverySeconds }) =>
        ({ id, scenario, status, startedAt, finishedAt, recoverySeconds })),
      events: clone(this.events),
    };
  }

  startExperiment({ scenario, durationSeconds } = {}) {
    if (this.closed) throw new HttpError(503, 'The controller is shutting down.');
    if (this.active || this.cleaningUp) throw new HttpError(409, 'An experiment or its cleanup is already in progress.');
    if (!SCENARIOS.includes(scenario)) throw new HttpError(400, 'Choose a supported fault scenario.');
    if (scenario === 'liveness' && this.environment !== 'kubernetes') {
      throw new HttpError(400, 'The liveness experiment requires Kubernetes to restart the demo pod.');
    }
    if (!Number.isInteger(durationSeconds) || durationSeconds < 5 || durationSeconds > 30) {
      throw new HttpError(400, 'Experiment duration must be an integer from 5 to 30 seconds.');
    }
    const experiment = {
      id: randomUUID(), scenario, durationSeconds,
      status: 'baseline', startedAt: iso(this.now()),
      phaseEndsAt: iso(this.now() + this.baselineMs), finishedAt: null,
      recoverySeconds: null, faultEndedAt: null, goodStreak: 0,
      observations: [], events: [], timer: null,
    };
    this.active = this.current = experiment;
    this.event('baseline', 'Baseline phase started. Requests are measured against the configured demo target.', experiment);
    this.setTimer(experiment, () => this.injectFault(experiment), this.baselineMs);
    return this.snapshotExperiment(experiment);
  }

  setTimer(experiment, callback, delayMs) {
    if (experiment.timer) this.unschedule(experiment.timer);
    experiment.timer = this.schedule(() => {
      experiment.timer = null;
      if (this.active !== experiment || this.closed) return;
      void callback().catch(() => {
        if (this.active === experiment) {
          this.event('error', 'The experiment could not finish. Any accepted fault still has its independent target TTL.', experiment);
          this.finish(experiment, 'failed');
        }
      });
    }, delayMs);
    experiment.timer?.unref?.();
  }

  control(path, body = {}) {
    // A cancellation reset waits behind any in-flight injection. This prevents
    // a late fault response from injecting work after the user pressed Stop.
    const operation = this.controlQueue.catch(() => {}).then(async () => {
      const response = await this.fetch(`${this.targetControlUrl}${path}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.targetToken}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.controlTimeoutMs),
        redirect: 'error',
      });
      await response.arrayBuffer();
      if (!response.ok) throw new Error(`Target control failed with HTTP ${response.status}.`);
    });
    this.controlQueue = operation;
    return operation;
  }

  async injectFault(experiment) {
    try {
      await this.control('/internal/fault', { scenario: experiment.scenario, durationSeconds: experiment.durationSeconds });
    } catch {
      if (this.active !== experiment) return;
      this.event('error', 'The target did not acknowledge the fault. Check its control configuration; a timed-out request may still expire by TTL.', experiment);
      // A timeout can happen after the target accepted the injection. Attempt a
      // reset before releasing the single-experiment lock.
      try { await this.control('/internal/reset'); } catch { /* Independent target TTL is the final bound. */ }
      if (this.active === experiment) this.finish(experiment, 'failed');
      return;
    }
    if (this.active !== experiment) return;
    experiment.status = 'fault';
    experiment.phaseEndsAt = iso(this.now() + experiment.durationSeconds * 1000);
    this.event('fault', `Intentional ${experiment.scenario} fault acknowledged; target TTL is ${experiment.durationSeconds} seconds.`, experiment);
    if (experiment.scenario === 'readiness' && this.environment === 'local') {
      this.event('info', 'Local mode observes the ready probe failure only; direct HTTP traffic is not removed by a Kubernetes Service.', experiment);
    }
    this.setTimer(experiment, () => this.beginRecovery(experiment), experiment.durationSeconds * 1000);
  }

  async beginRecovery(experiment) {
    try { await this.control('/internal/reset'); }
    catch {
      if (this.active === experiment) this.event('warning', 'Reset was not acknowledged. The target TTL independently bounds the fault; recovery remains an observation.', experiment);
    }
    if (this.active !== experiment) return;
    experiment.status = 'recovery';
    experiment.faultEndedAt = this.now();
    experiment.phaseEndsAt = iso(this.now() + this.recoveryMs);
    this.event('recovery', 'Recovery observation started. Two consecutive good requests are required to confirm recovery.', experiment);
    this.setTimer(experiment, async () => {
      if (experiment.recoverySeconds === null) this.event('warning', 'Recovery was not confirmed within the observation window.', experiment);
      this.finish(experiment, 'complete');
    }, this.recoveryMs);
  }

  async stopExperiment() {
    const experiment = this.active;
    if (!experiment) throw new HttpError(409, 'There is no active experiment to stop.');
    this.cleaningUp = true;
    this.active = null;
    if (experiment.timer) this.unschedule(experiment.timer);
    experiment.timer = null;
    experiment.status = 'cancelled';
    experiment.phaseEndsAt = null;
    this.event('cancelled', 'Stop requested. Cancelling the experiment and resetting the target.', experiment);
    try {
      await this.control('/internal/reset');
      this.event('info', 'The target acknowledged the reset.', experiment);
    } catch {
      this.event('warning', 'Reset was not acknowledged. The target fault will still expire within its original TTL.', experiment);
    } finally {
      this.finish(experiment, 'cancelled');
      this.cleaningUp = false;
    }
    return this.snapshotExperiment(experiment);
  }

  finish(experiment, status) {
    if (experiment.timer) this.unschedule(experiment.timer);
    experiment.timer = null;
    experiment.status = status;
    experiment.phaseEndsAt = null;
    experiment.finishedAt = iso(this.now());
    if (this.active === experiment) this.active = null;
    this.counters[status]++;
    if (status === 'complete') this.event('complete', 'Experiment complete. Download the report to inspect the actual observations.', experiment);
    const report = this.buildReport(experiment);
    this.reports.set(experiment.id, report);
    if (this.reports.size > 20) this.reports.delete(this.reports.keys().next().value);
  }

  buildReport(experiment) {
    return {
      schemaVersion: 1,
      ...this.snapshotExperiment(experiment),
      policy: { ...POLICY },
      samples: clone(experiment.observations),
      environment: this.environment,
      caveats: [
        'This is a bounded demonstration against a fixed demo target, not a production chaos test or an SLA certification.',
        'Results are real HTTP observations from this controller. Small sample windows are not statistically representative of production traffic.',
        'Good requests return HTTP 2xx within 300 ms. p95 uses the nearest-rank method; failed requests are included in latency statistics.',
        'Status 0 means no HTTP response was received. An HTTP error response still means the target was reachable.',
        'Each HTTP sample requests Connection: close to observe fresh Service routing; established production connections may behave differently during readiness changes.',
        'Each request belongs to the phase in which it started. A complete report means observation ended, not that the system met its objective.',
        'Recovery seconds measures the time from the recovery observation phase to the second consecutive good request; null means not confirmed.',
        'Target faults expire independently within their requested TTL (maximum 60 seconds). A liveness restart may end a fault earlier.',
        this.environment === 'local'
          ? 'Local mode has no Kubernetes probes, Service endpoint removal or automatic pod restart. Readiness changes only the ready endpoint.'
          : 'Readiness routing and liveness restart behavior depend on the deployed Kubernetes probes and Services. Verify cluster events separately.',
        'Reports and metrics are stored in memory and are cleared when the controller restarts.',
      ],
    };
  }

  report(id) {
    if (this.reports.has(id)) return clone(this.reports.get(id));
    if (this.active?.id === id) return this.buildReport(this.active);
    throw new HttpError(404, 'Report not found. Reports are retained in memory for the latest 20 experiments.');
  }

  metrics() {
    const summary = summarize(this.samples);
    const lines = [];
    const metric = (name, type, help, value) => {
      lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`, `${name} ${value}`);
    };
    metric('lab_samples_total', 'counter', 'Actual HTTP sampling attempts since controller start.', this.counters.samples);
    metric('lab_sample_failures_total', 'counter', 'Sampling attempts without HTTP 2xx.', this.counters.failures);
    metric('lab_sample_good_total', 'counter', 'Samples with HTTP 2xx at or below 300 milliseconds.', this.counters.good);
    metric('lab_window_requests', 'gauge', 'Requests retained in the rolling 180 sample window.', this.samples.length);
    if (this.samples.length) {
      metric('lab_window_success_ratio', 'gauge', 'HTTP success ratio in the rolling sample window.', summary.successRate / 100);
      metric('lab_window_good_ratio', 'gauge', 'Good request ratio in the rolling sample window.', summary.goodRate / 100);
      metric('lab_window_p95_seconds', 'gauge', 'Nearest rank p95 request duration in the rolling window.', summary.p95Ms / 1000);
      metric('lab_error_budget_remaining_ratio', 'gauge', 'Remaining 99 percent good request budget in the rolling window.', budgetRemaining(this.samples) / 100);
    }
    metric('lab_experiment_active', 'gauge', 'One when an experiment is currently active.', this.active ? 1 : 0);
    lines.push('# HELP lab_experiments_total Finished experiments by status.', '# TYPE lab_experiments_total counter');
    for (const status of ['complete', 'cancelled', 'failed']) lines.push(`lab_experiments_total{status="${status}"} ${this.counters[status]}`);
    return `${lines.join('\n')}\n`;
  }

  async shutdown() {
    clearInterval(this.interval);
    this.interval = null;
    if (this.active) await this.stopExperiment();
    this.closed = true;
    this.abort.abort();
    if (this.pendingSample) await this.pendingSample;
  }
}
