import { randomBytes } from 'node:crypto';
import { createTargetServer } from '../src/target.mjs';
import { createControllerServer } from '../src/server.mjs';
import { integerSetting, requiredToken } from '../src/config.mjs';

let labToken;
try {
  // An explicitly supplied override must satisfy the same policy as deployed
  // controllers. Validate before creating either listening service.
  labToken = requiredToken({ LAB_TOKEN: process.env.LAB_TOKEN ?? randomBytes(24).toString('hex') }, 'LAB_TOKEN');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const targetToken = randomBytes(32).toString('hex');
const port = integerSetting(process.env.PORT, 8080, 'PORT');
const targetPort = integerSetting(process.env.TARGET_PORT, 8081, 'TARGET_PORT');
const host = '127.0.0.1';
const target = createTargetServer({ token: targetToken, enableFaults: true });
const { server, engine } = createControllerServer({ labToken, targetToken, targetUrl: `http://${host}:${targetPort}`, environment: 'local' });

async function listen(server, port) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
}

let stopping = false;
async function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  await engine.shutdown();
  await Promise.all([server, target].map((service) => new Promise((resolve) => service.close(resolve))));
  process.exitCode = code;
}

try {
  await listen(target, targetPort);
  await listen(server, port);
  engine.startSampling();
  console.log(`\nKube Resilience Lab: http://${host}:${port}`);
  console.log('Mode: local. Kubernetes routing and pod restarts require the Kind deployment.');
  console.log(`Lab control key: ${labToken}`);
  console.log('Paste the key into the experiment panel. It is not stored by the browser.\n');
} catch (error) {
  console.error(`Cannot start the local lab (${error.code ?? 'configuration error'}). Check that ports ${port} and ${targetPort} are available.`);
  await shutdown(1);
}

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void shutdown());
