# Experiment guide

Start with an idle lab that has collected a few samples. Enter the control key printed by the local launcher or the Kind setup script. Choose a scenario and duration, then run one experiment at a time.

| Experiment | Injection | What to look for | What restores service |
|---|---|---|---|
| Latency | Delay on demo work requests | p95 rises; good-request percentage falls even if HTTP succeeds | Target's fault deadline or manual stop |
| HTTP errors | Alternating failures on work requests | Availability and good-request percentage fall | Target's fault deadline or manual stop |
| Readiness | Target readiness endpoint returns a failure | In Kubernetes, normal Service traffic stops reaching the target | Deadline/reset followed by a successful readiness probe |
| Liveness | Target liveness endpoint returns a failure | In Kubernetes, kubelet restarts the target; inspect restart count | New healthy process, or the bounded deadline if probes never restart it |

In local mode there is no kubelet or Service endpoint controller. Readiness therefore demonstrates the health signal, not Kubernetes traffic routing. The UI disables the Kubernetes-only liveness experiment in local mode.

Each run has baseline, fault, and recovery phases. Download the report when it finishes. A short observation window can contain too few samples to support a reliable conclusion; inspect the actual count and individual observations. Intentional fault traffic is included in the displayed error budget.

## A useful interview walkthrough

1. Explain the separation of readiness and liveness before running anything.
2. Start the latency experiment. Explain why HTTP availability can remain high while good requests decline.
3. On Kubernetes, run readiness loss. Explain why the controller remains reachable while the traffic Service loses its endpoint.
4. Run liveness loss and show the observed Pod restart count from the smoke-test evidence.
5. Export the incident report and explain one limitation: low sample volume, process-local history, or single-replica routing.

## Stop and reset

The Stop control requests a reset through the target's dedicated control channel and cancels the active experiment. The target also expires every fault itself. If the target cannot be reached, the UI must show that condition; do not interpret a button click as evidence of recovery.

## What would come next?

Useful extensions include persistent evidence storage, repeatable multi-replica experiments, comparing two deployment revisions, OpenTelemetry traces, and a GitOps overlay. These are roadmap ideas, not features claimed by this version.
