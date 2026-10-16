#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
MONITORING=false
if [[ "${1:-}" == "--monitoring" ]]; then MONITORING=true; shift; fi
if (( $# )); then echo 'Usage: bash scripts/kind-up.sh [--monitoring]' >&2; exit 2; fi
for command in docker kind kubectl node; do
  command -v "$command" >/dev/null || { echo "Missing $command. See README prerequisites." >&2; exit 1; }
done
docker info >/dev/null 2>&1 || { echo 'Start your Docker engine, then run this script again.' >&2; exit 1; }
umask 077
mkdir -p .lab
KUBECONFIG_FILE="$ROOT/.lab/kubeconfig"
CONTEXT=kind-kube-resilience-lab
CLUSTER=kube-resilience-lab
K=(kubectl --kubeconfig "$KUBECONFIG_FILE" --context "$CONTEXT")
if ! kind get clusters | grep -Fxq "$CLUSTER"; then
  kind create cluster --name "$CLUSTER" --config deploy/kind/config.yaml --kubeconfig "$KUBECONFIG_FILE" --wait 120s
else
  kind get kubeconfig --name "$CLUSTER" > "$KUBECONFIG_FILE"
fi
# Never switch or merge into the user's default kubeconfig/minikube context.
docker build --tag kube-resilience-lab:local .
kind load docker-image kube-resilience-lab:local --name "$CLUSTER"
"${K[@]}" apply -f deploy/base/namespace.yaml
export LAB_TOKEN="${LAB_TOKEN:-$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')}"
export TARGET_TOKEN="${TARGET_TOKEN:-$(node -e 'console.log(require("node:crypto").randomBytes(32).toString("hex"))')}"
# Send credentials via stdin, never CLI arguments or a committed manifest.
node --input-type=module -e '
  console.log(JSON.stringify({apiVersion:"v1",kind:"Secret",metadata:{name:"lab-tokens",namespace:"kube-resilience-lab"},type:"Opaque",stringData:{LAB_TOKEN:process.env.LAB_TOKEN,TARGET_TOKEN:process.env.TARGET_TOKEN}}));
' | "${K[@]}" apply -f -
if "$MONITORING"; then
  export GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-$(node -e 'console.log(require("node:crypto").randomBytes(24).toString("hex"))')}"
  # Preserve the admin secret on subsequent runs; Grafana stores its initial
  # password in its database. Use the Secret to retrieve the existing value.
  if ! "${K[@]}" -n kube-resilience-lab get secret grafana-admin >/dev/null 2>&1; then
    node --input-type=module -e 'console.log(JSON.stringify({apiVersion:"v1",kind:"Secret",metadata:{name:"grafana-admin",namespace:"kube-resilience-lab"},type:"Opaque",stringData:{password:process.env.GRAFANA_PASSWORD}}))' | "${K[@]}" apply -f -
  else
    GRAFANA_PASSWORD="$("${K[@]}" -n kube-resilience-lab get secret grafana-admin -o jsonpath='{.data.password}' | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>process.stdout.write(Buffer.from(s,"base64").toString()))')"
  fi
  "${K[@]}" apply -k deploy/monitoring
else
  "${K[@]}" apply -k deploy/base
fi
# Refresh image and env even when reusing this named lab cluster.
"${K[@]}" -n kube-resilience-lab rollout restart deployment/lab-controller deployment/checkout-api
"${K[@]}" -n kube-resilience-lab rollout status deployment/checkout-api --timeout=120s
"${K[@]}" -n kube-resilience-lab rollout status deployment/lab-controller --timeout=120s
if "$MONITORING"; then
  # A cold Docker Desktop image pull can queue behind the larger Grafana image.
  "${K[@]}" -n kube-resilience-lab rollout status deployment/prometheus --timeout=600s
  "${K[@]}" -n kube-resilience-lab rollout status deployment/grafana --timeout=600s
fi
if [[ "${CI:-}" != true ]]; then
  printf '\nControl key (paste into the lab UI): %s\n' "$LAB_TOKEN"
  if "$MONITORING"; then printf 'Grafana login: admin / %s\n' "$GRAFANA_PASSWORD"; fi
fi
printf '\nOpen the lab with:\n  kubectl --kubeconfig .lab/kubeconfig --context %s -n kube-resilience-lab port-forward --address 127.0.0.1 svc/lab-controller 8080:8080\n' "$CONTEXT"
if "$MONITORING"; then
  printf 'Open Grafana with:\n  kubectl --kubeconfig .lab/kubeconfig --context %s -n kube-resilience-lab port-forward --address 127.0.0.1 svc/grafana 3000:3000\n' "$CONTEXT"
fi
