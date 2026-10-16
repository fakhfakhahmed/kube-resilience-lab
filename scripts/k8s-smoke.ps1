$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'k8s-smoke.mjs')
if ($LASTEXITCODE -ne 0) { throw "Kubernetes smoke test failed with exit code $LASTEXITCODE. See artifacts/." }
