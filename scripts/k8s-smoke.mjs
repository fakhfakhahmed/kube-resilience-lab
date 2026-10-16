import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const context = process.env.KUBE_CONTEXT || 'kind-kube-resilience-lab';
assert.equal(context, 'kind-kube-resilience-lab', 'Smoke tests only run in the dedicated lab context');
const kubeconfig = path.join(root, '.lab', 'kubeconfig');
const args = ['--kubeconfig', kubeconfig, '--context', context, '-n', 'kube-resilience-lab'];
await mkdir('artifacts', {recursive:true});
const secretResult = spawnSync('kubectl', [...args, 'get', 'secret', 'lab-tokens', '-o', 'json'], {encoding:'utf8', timeout:10000});
assert.equal(secretResult.status,0, 'Cannot retrieve lab token. Run the Kind setup script first.');
const controlToken = Buffer.from(JSON.parse(secretResult.stdout).data.LAB_TOKEN, 'base64').toString('utf8');
assert.ok(controlToken.length >= 16, 'Lab secret must contain a valid control token');
const origin = 'http://127.0.0.1:18080';
const forwardLog = createWriteStream('artifacts/port-forward.log');
const forward = spawn('kubectl', [...args, 'port-forward', '--address', '127.0.0.1', 'svc/lab-controller', '18080:8080'], {stdio:['ignore','pipe','pipe'], windowsHide:true});
let forwardReady = false, forwardError = null, forwardClosed = false;
forward.stdout.on('data',chunk=>{ if(chunk.toString().includes('Forwarding from 127.0.0.1:18080')) forwardReady=true; });
forward.stdout.pipe(forwardLog, {end:false});
forward.stderr.pipe(forwardLog, {end:false});
forward.on('error',error=>{forwardError=error;});
forward.on('exit',()=>{forwardClosed=true;});
forward.on('close',()=>forwardLog.end());
const cleanup = () => { if(!forwardClosed) forward.kill(); };
process.once('exit',cleanup);
process.once('SIGINT',()=>process.exit(130));
process.once('SIGTERM',()=>process.exit(143));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const kubectl = (...args) => {
  const result = spawnSync('kubectl', ['--kubeconfig', kubeconfig, '--context', context, '-n', 'kube-resilience-lab', ...args], {encoding:'utf8', timeout:10000});
  if (result.status !== 0) throw new Error(result.stderr || 'kubectl observation failed');
  return JSON.parse(result.stdout);
};
const pod = () => {
  const pods = kubectl('get', 'pods', '-l', 'app.kubernetes.io/name=checkout-api', '-o', 'json').items;
  assert.equal(pods.length, 1, 'Exactly one target pod is expected');
  return {name:pods[0].metadata.name, uid:pods[0].metadata.uid,
    restarts:pods[0].status.containerStatuses?.[0]?.restartCount ?? 0};
};
const api = async (path, options={}) => {
  const response = await fetch(origin+path, {signal:AbortSignal.timeout(5000), ...options});
  const body = await response.json();
  assert.ok(response.ok, `${path}: ${response.status} ${JSON.stringify(body)}`);
  return body;
};
const post = (path, body) => api(path, {method:'POST', headers:{'Content-Type':'application/json','x-lab-token':controlToken},body:JSON.stringify(body)});
let connected = false;
for (let i=0; i<60; i++) {
  try {
    // A failed port-forward must not accidentally test an unrelated listener.
    if(forwardError) throw forwardError;
    if(forwardClosed) throw new Error('kubectl port-forward exited');
    if(!forwardReady) { await pause(100); continue; }
    const response = await fetch(origin+'/health/live', {signal:AbortSignal.timeout(1000)});
    if(response.ok) { connected=true; break; }
  } catch {}
  await pause(500);
}
assert.ok(connected, 'Controller port-forward did not become healthy');
assert.equal((await api('/api/state')).environment, 'kubernetes');
const unauthorized=await fetch(origin+'/api/experiments',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"scenario":"errors","durationSeconds":10}'});
assert.ok([401,403].includes(unauthorized.status), 'Writes require the control token');
const crossOrigin=await fetch(origin+'/api/experiments',{method:'POST',headers:{'Content-Type':'application/json','x-lab-token':controlToken,Origin:'https://untrusted.example'},body:'{"scenario":"errors","durationSeconds":10}'});
assert.equal(crossOrigin.status,403,'Cross-origin writes must be rejected');
const evidence = {schemaVersion:1, startedAt:new Date().toISOString(), context:'kind-kube-resilience-lab', scenarios:[]};
try {
  for (const scenario of ['latency','errors','readiness','liveness']) {
    const before = pod();
    const {experiment} = await post('/api/experiments',{scenario,durationSeconds:15});
    let report, readinessRemoved=false, restarted=false;
    const deadline=Date.now()+60000;
    while(Date.now()<deadline) {
      const state=await api('/api/state');
      assert.equal(state.experiment?.id,experiment.id);
      const current = pod();
      if (current.uid===before.uid && current.restarts>before.restarts) restarted=true;
      if (scenario==='readiness' && state.experiment.status==='fault') {
        const slices=kubectl('get','endpointslices','-l','kubernetes.io/service-name=checkout-api','-o','json');
        readinessRemoved ||= !slices.items.some(slice => slice.endpoints?.some(endpoint => endpoint.conditions?.ready===true));
      }
      if(['complete','failed','cancelled'].includes(state.experiment.status)) {
        report=await api(`/api/reports/${experiment.id}`);
        await writeFile(`artifacts/${scenario}-report.json`,JSON.stringify(report,null,2)+'\n');
        break;
      }
      await pause(750);
    }
    assert.ok(report,`${scenario}: experiment did not finish`);
    assert.equal(report.status,'complete',`${scenario}: experiment completed successfully`);
    assert.ok(report.baseline.requests>0,`${scenario}: baseline contains observations`);
    assert.ok(report.impact.requests>0,`${scenario}: impact contains observations`);
    assert.ok(report.recovery.requests>0,`${scenario}: recovery contains observations`);
    assert.ok(report.recovery.successRate>0,`${scenario}: at least one recovery request succeeded`);
    assert.ok(Number.isFinite(report.recoverySeconds),`${scenario}: two consecutive good recovery requests were observed`);
    if(scenario==='latency') assert.ok(report.impact.p95Ms>300,'Latency fault breaches 300ms objective');
    else assert.ok(report.impact.successRate<100,`${scenario}: failed work requests were observed`);
    if(scenario==='readiness') assert.ok(readinessRemoved,'Kubernetes removed the unready target from eligible work endpoints');
    if(scenario==='liveness') assert.ok(restarted,'Kubelet restarted the target container in the same pod');
    assert.ok(!JSON.stringify(report).includes(controlToken),'Evidence must not contain control key');
    const observation={scenario,reportId:experiment.id,baseline:report.baseline,impact:report.impact,recovery:report.recovery,
      recoverySeconds:report.recoverySeconds,readinessRemoved:scenario==='readiness'?readinessRemoved:null,podBefore:before,podAfter:pod(),containerRestartObserved:restarted};
    evidence.scenarios.push(observation);
    console.log(`PASS ${scenario}: ${report.impact.requests} impact requests; p95=${report.impact.p95Ms}ms; success=${report.impact.successRate}%`);
    await pause(1000);
  }
  evidence.result='passed';
} catch(error) {
  evidence.result='failed';
  evidence.error=error.message;
  // Best-effort reset only the configured demo target, never arbitrary pods.
  await post('/api/experiments/stop',{}).catch(()=>{});
  throw error;
} finally {
  evidence.finishedAt=new Date().toISOString();
  await writeFile('artifacts/kubernetes-smoke.json',JSON.stringify(evidence,null,2)+'\n');
}
cleanup();
