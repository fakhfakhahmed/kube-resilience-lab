/** Sample-window statistics, not an uptime guarantee or certified SLA. */
export const POLICY = Object.freeze({
  latencyThresholdMs: 300,
  availabilityTarget: 99,
  maxFaultSeconds: 60,
  requiresToken: true,
});

export const isGood = (sample) => sample.ok && sample.latencyMs <= POLICY.latencyThresholdMs;
const round = (value) => Math.round(value * 100) / 100;

export function summarize(samples) {
  if (!samples.length) return { requests: 0, successRate: null, p95Ms: null, goodRate: null };
  const durations = samples.map((sample) => sample.latencyMs).sort((a, b) => a - b);
  return {
    requests: samples.length,
    successRate: round(100 * samples.filter((sample) => sample.ok).length / samples.length),
    p95Ms: round(durations[Math.ceil(durations.length * 0.95) - 1]),
    goodRate: round(100 * samples.filter(isGood).length / samples.length),
  };
}

export function budgetRemaining(samples) {
  if (!samples.length) return null;
  const badFraction = samples.filter((sample) => !isGood(sample)).length / samples.length;
  const budgetFraction = (100 - POLICY.availabilityTarget) / 100;
  return round(Math.max(0, Math.min(100, 100 * (1 - badFraction / budgetFraction))));
}

export function boundedPush(list, item, maximum) {
  list.push(item);
  if (list.length > maximum) list.splice(0, list.length - maximum);
}
