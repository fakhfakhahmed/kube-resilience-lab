# Kube Resilience Lab

**Break a demo service. Observe the impact. Keep the evidence.**

[Français](README.fr.md) · [Architecture](docs/architecture.md) · [Experiment guide](docs/experiment-guide.md) · [Ahmed's portfolio](https://ahmed-fakhfakh-portfolio.vercel.app/)

An interactive DevOps project that demonstrates how HTTP behavior, service-level objectives, and Kubernetes health probes fit together. Inject a bounded fault into a dedicated checkout service, watch the real measurements, then download a report comparing **baseline → fault → recovery**.

Built and maintained by **Ahmed Fakhfakh**. English and French dashboard. No paid cloud account or AI API key required.

![Live local dashboard showing measured requests and a latency experiment](docs/dashboard.png)

[View the measured Kubernetes verification results](docs/verification.md): all four scenarios passed, including Service endpoint withdrawal and a kubelet-driven container restart.

## What makes this useful

- **Evidence, not simulated charts.** The controller samples an actual HTTP target. Reports retain the measurements and sample counts used in each phase.
- **Two ways to fail.** Slow successful requests can meet an availability target while failing the good-request objective. The dashboard makes that distinction visible.
- **Kubernetes without application cluster privileges.** Readiness and liveness experiments use the demo service's own health endpoints. The app needs no Kubernetes API credentials.
- **A bounded lab.** Fixed target, authenticated controls, one active run, maximum fault lifetime, independent target expiry, and manual stop.
- **Reproducible delivery.** Unit/integration tests, Docker, Kustomize, isolated Kind setup, and a GitHub Actions Kubernetes smoke test.

## Try it locally

Requires **Node.js 22 or later**. There are no runtime npm dependencies.

```bash
git clone https://github.com/fakhfakhahmed/kube-resilience-lab.git
cd kube-resilience-lab
npm run dev
```

Open **http://127.0.0.1:8080**. Paste the temporary **lab control key** printed in the terminal into the dashboard, choose an experiment, and run it. The launcher starts both services and generates fresh control keys. Stop with `Ctrl+C`.

The dashboard is live, not a screenshot. It starts with an empty observation window and fills as requests are sampled. You can switch between English and French at any time.

### What works in each mode?

| Behavior | Local / Docker Compose | Kubernetes |
|---|---|---|
| Real HTTP sampling, latency and error experiments | Yes | Yes |
| JSON reports, live chart, rolling SLO indicators | Yes | Yes |
| Readiness endpoint failure | Yes | Yes |
| Readiness changes Service routing | No Kubernetes Service exists | Yes |
| Kubelet restarts an unhealthy target | Not available | Liveness experiment |

Local mode is useful for exploring the app. Use Kubernetes to demonstrate routing and process recovery.

## Run it on Kubernetes

Install Node.js 22+, Docker, [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/) and kubectl. Start Docker, then:

```bash
bash scripts/kind-up.sh
```

On Windows PowerShell:

```powershell
.\scripts\kind-up.ps1
```

The scripts create a cluster named `kube-resilience-lab`, build and load the local image, generate authentication secrets, and deploy the dedicated namespace. They use the explicit `kind-kube-resilience-lab` context. Follow the printed port-forward command and control-key instructions.

Existing clusters, including a separate minikube cluster, are outside this setup. The scripts do not delete a cluster automatically.

### Prove recovery

With the lab deployed, run the smoke test from PowerShell, Bash or another terminal:

```bash
node scripts/k8s-smoke.mjs
```

The script checks actual HTTP behavior, readiness transitions, and the target's Pod restart count. It writes diagnostic evidence under `artifacts/`; CI uploads its evidence as a workflow artifact. See the workflow result for the commit you are reviewing instead of treating the presence of a workflow file as proof of a passing run.

### Optional monitoring

Prometheus and Grafana configuration is under [`deploy/monitoring`](deploy/monitoring). Follow its README to deploy and port-forward the dashboards. These components are optional; the app's own measurements and reports work without them.

## Docker Compose

Set **different random values** for `LAB_TOKEN` and `TARGET_TOKEN` in your shell or in a local `.env` file, then:

```bash
docker compose up --build
```

Generate each value with `node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"`. Do not commit `.env`. Only the controller is published, bound to `127.0.0.1:8080`; the target stays on the Compose network.

## Experiments

| Scenario | Deliberate fault | Expected observation |
|---|---|---|
| Latency | Work responses gain 650 ms | p95 rises; good requests fall |
| HTTP errors | Alternating work requests fail | Availability falls |
| Readiness | Readiness probe fails | Kubernetes stops normal Service routing to the only target |
| Liveness | Liveness probe fails | Kubernetes restarts the target process |

Each run collects a baseline, injects the selected fault, observes recovery, and retains a downloadable JSON report. Stop requests cancel the run and request a target reset; inspect the events for reset acknowledgement. The target also clears faults when their deadline expires, independently of the controller.

## Quality checks

```bash
npm test
npm run check
kubectl kustomize deploy/base
```

The tests exercise HTTP authorization, input validation, bounded fault behavior, experiment lifecycle, cancellation, metrics and report calculations. The CI pipeline additionally builds the image and runs the Kubernetes smoke test in an isolated cluster.

## Security and limitations

- **Use this as a local/dedicated lab.** It is not a production chaos engineering service.
- The control key is needed for mutations. Read endpoints are not a multiuser security boundary; do not expose this lab publicly without an access layer.
- Workloads run as a non-root user, drop Linux capabilities, use read-only root filesystems, and disable service-account token mounting.
- NetworkPolicy enforcement depends on the CNI. Default Kind networking should not be presented as proof that policy enforcement was tested.
- Measurements are low-volume samples, not a benchmark. The rolling budget is educational and does not establish a production SLA.
- One controller and one target replica are supported. State is in memory; restarting the controller clears its history. Download reports you want to retain.
- This version does not include a custom operator, multi-cluster automation, GitOps synchronization, or AI incident analysis.

## Repository map

```text
public/                EN/FR dashboard and live visualizations
src/                   controller, target and metric calculations
test/                  Node.js unit and HTTP integration tests
deploy/base/           Kubernetes workloads, Services and policies
deploy/kind/           isolated local cluster configuration
deploy/monitoring/     optional Prometheus and Grafana
scripts/               local launcher, cluster setup and smoke test
.github/workflows/     build and Kubernetes verification
docs/                  architecture, experiment guide and evidence
```

## Roadmap

Potential next iterations: persistent experiment history, multiple target replicas with explicit fault selection, OpenTelemetry traces, deployment-version comparisons, and an Argo CD overlay. These are future work, not current capabilities.

MIT licensed. See [LICENSE](LICENSE).
