export function requiredToken(env, name) {
  const token = env[name];
  if (typeof token !== 'string' || token.trim().length < 16) {
    throw new Error(`${name} must contain at least 16 characters. See the local launcher or deployment guide.`);
  }
  return token;
}

export function integerSetting(value, fallback, name, minimum = 1, maximum = 65535) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum || number > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}.`);
  }
  return number;
}

export function targetUrl(value, name) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${name} must be a valid HTTP(S) URL.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be an HTTP(S) URL without credentials, a query, or a fragment.`);
  }
  return url.origin;
}

export function controllerConfig(env = process.env) {
  const environment = env.ENVIRONMENT ?? 'local';
  if (!['local', 'kubernetes'].includes(environment)) throw new Error('ENVIRONMENT must be local or kubernetes.');
  const target = targetUrl(env.TARGET_URL ?? 'http://127.0.0.1:8081', 'TARGET_URL');
  return {
    host: env.HOST ?? '127.0.0.1',
    port: integerSetting(env.PORT, 8080, 'PORT'),
    labToken: requiredToken(env, 'LAB_TOKEN'),
    targetToken: requiredToken(env, 'TARGET_TOKEN'),
    targetUrl: target,
    targetControlUrl: targetUrl(env.TARGET_CONTROL_URL ?? target, 'TARGET_CONTROL_URL'),
    environment,
    sampleIntervalMs: integerSetting(env.SAMPLE_INTERVAL_MS, 1000, 'SAMPLE_INTERVAL_MS', 100, 10000),
  };
}

export function targetConfig(env = process.env) {
  return {
    host: env.HOST ?? '127.0.0.1',
    port: integerSetting(env.TARGET_PORT, 8081, 'TARGET_PORT'),
    token: requiredToken(env, 'TARGET_TOKEN'),
    enableFaults: env.ENABLE_FAULTS === 'true',
    instance: env.HOSTNAME ?? 'checkout-local',
  };
}
