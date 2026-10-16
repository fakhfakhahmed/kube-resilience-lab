# Verification record — 16 October 2026

This is one observed local run, not a performance benchmark or a production availability claim. The full structured results are in [verification-run.json](verification-run.json).

Environment: Windows, Docker Desktop 29.5.3, Kind 0.33.0, Kubernetes 1.37.0. Dedicated cluster and namespace: `kube-resilience-lab`. The existing default kubectl context was preserved.

## Kubernetes smoke results

Each fault lasted 15 seconds, following a three-second baseline and followed by a five-second recovery observation window. Recovery requires two consecutive successful requests within 300 ms, measured from the start of the recovery phase; it is not total outage duration.

| Experiment | Impact samples | Impact HTTP success | Impact p95 | Confirmed recovery |
|---|---:|---:|---:|---:|
| Latency | 15 | 100% | 654.96 ms | 1.95 s |
| HTTP errors | 15 | 46.67% | 4.32 ms | 1.94 s |
| Readiness | 15 | 13.33% | 2.63 ms | 2.11 s |
| Liveness | 15 | 46.67% | 3.43 ms | 1.23 s |

- Readiness: EndpointSlice inspection confirmed no ready target for the normal work Service during the fault. The container did not restart.
- Liveness: the same Pod's container restart count increased from 0 to 1.
- A fast failed request still counts as failed. The low readiness/liveness p95 values do not imply good service quality.
- All scenarios contained real baseline, impact and recovery samples. Each confirmed two consecutive good recovery requests.
- Unauthenticated writes and cross-origin writes were rejected.

## Application and monitoring

- `npm test`: 25 passing Node test entries (including the helper module discovery entry).
- `npm run check`: passed.
- Base and monitoring Kustomize overlays rendered successfully.
- Prometheus readiness and Grafana health endpoints returned HTTP 200; Grafana reported database `ok`.
- Both Prometheus scrape targets were UP; a query for `lab_window_requests` returned 180.
- Grafana datasource and dashboard provisioning completed.
- Browser: live telemetry, experiment start/stop, JSON report download, English/French switch, and 390px mobile layout checked. Mobile navigation links have localized accessible names.

The screenshot in the README is the local Node dashboard. Kubernetes behavior is established by the structured smoke results above. Optional monitoring was checked locally; CI runs the application and Kubernetes smoke suites and renders the monitoring overlay.

Reproduce the Kubernetes assertions with `node scripts/k8s-smoke.mjs`. GitHub Actions publishes a separate evidence artifact for each workflow run.