# Optional Prometheus and Grafana

The monitoring overlay includes the application base, Prometheus, Grafana, a
preconfigured Prometheus datasource, and the **Kube Resilience Lab - measured
resilience** dashboard. No Helm installation, cloud account, or Kubernetes API
credentials are required by either monitoring pod.

From the repository root, run either:

```bash
bash scripts/kind-up.sh --monitoring
```

```powershell
./scripts/kind-up.ps1 -Monitoring
```

The setup script generates the Grafana administrator password and prints it
locally. It preserves the existing password Secret when run again. In another
terminal:

```bash
kubectl --kubeconfig .lab/kubeconfig --context kind-kube-resilience-lab -n kube-resilience-lab port-forward --address 127.0.0.1 svc/grafana 3000:3000
```

Open <http://127.0.0.1:3000>, sign in with `admin` and the generated password, then
open **Dashboards → Kube Resilience Lab**. Start experiments in the application
at port 8080 to see real observations appear. Prometheus scrapes every five
seconds. For a local Prometheus UI, forward `svc/prometheus 9090:9090` using the
same explicit kubeconfig/context and loopback address.

## What is measured

| Panel | Metric / meaning |
|---|---|
| Good requests | `lab_window_good_ratio`: HTTP success and latency ≤300ms |
| Availability | `lab_window_success_ratio`: HTTP success |
| p95 latency | `lab_window_p95_seconds`, displayed in milliseconds |
| Error budget | `lab_error_budget_remaining_ratio`, for the 99% good-request objective |
| Window requests | `lab_window_requests`, at most 180 observations |
| Request / failure rate | `rate(lab_samples_total[1m])`, `rate(lab_sample_failures_total[1m])` |
| Intentional faults | `checkout_fault_active{scenario=...}` |

The window gauges represent a short teaching experiment, not a production SLA.
They can change as old samples leave the window. The target is scraped through
`checkout-control`, so it remains observable while intentionally unready.
Container restart proof comes from Kubernetes pod status in the smoke report;
this dashboard does not manufacture a restart count.

## Scope and limitations

- Both services are ClusterIP only; the example exposes them on loopback via
  port-forward. No ingress or public NodePort is installed.
- Grafana anonymous access and signup are disabled. Kubernetes Secrets are not
  encryption at rest by themselves; this is a disposable local lab.
- Storage uses bounded `emptyDir` volumes. Metrics and Grafana state disappear
  when their pods are replaced. Prometheus retains at most six hours / 256 MB.
- Pods run without root, privilege escalation, extra capabilities, writable root
  filesystems, or mounted service-account tokens.
- The target's namespace-scoped NetworkPolicy allows the controller and
  Prometheus. Kind's default CNI does **not** enforce it. A policy-capable CNI is
  required before claiming enforcement; this project does not install one.
- The optional overlay is rendered in CI. The main Kubernetes smoke tests cover
  the application and real probe behavior; they do not certify Grafana uptime.

## Version sources

Versions were checked against the upstream publishers on 16 October 2026:

- [Prometheus download / 3.15.0](https://prometheus.io/download/)
- [Grafana 13.2.4 release](https://github.com/grafana/grafana/releases/tag/v13.2.4)
- [Grafana official Docker image guidance](https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/)
- [Kind v0.33.0 and its pinned node images](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0)

Images use explicit release tags; the Kind node additionally has an upstream
digest pin. Review upstream security releases when maintaining this lab.
