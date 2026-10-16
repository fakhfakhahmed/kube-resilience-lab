# Upstream version provenance

Checked on 16 October 2026. GitHub Actions are pinned to complete commit SHAs;
release comments make Dependabot upgrades reviewable. No workflow grants write
permissions or runs `pull_request_target`.

| Component | Selected version | Primary source |
|---|---|---|
| Node official image | `node:24-alpine` | [Supported official tags](https://hub.docker.com/_/node) |
| Kind | `v0.33.0` | [Release](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0) |
| Kind Kubernetes node | `v1.37.0`, digest pinned in config | [Kind release image list](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0) |
| checkout | `v7.0.1` | [Release commit](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1) |
| setup-node | `v7.1.0` | [Release commit](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1) |
| upload-artifact | `v7.0.2` | [Release commit](https://github.com/actions/upload-artifact/commit/cf430e030ddbb5b0abf93d22962f4752f3646cd9) |
| Prometheus | `v3.15.0` | [Official downloads](https://prometheus.io/download/) |
| Grafana OSS | `13.2.4` | [Release](https://github.com/grafana/grafana/releases/tag/v13.2.4) |

The CI installer verifies Kind and kubectl binaries against checksums fetched
from their HTTPS upstream release hosts. These checksums detect download
corruption; they do not add an independent trust source. The application image
uses the Node 24 security-update tag, while monitoring images use explicit
release tags. For a longer-lived deployment, review upstream advisories and
resolve all images to independently verified registry digests.
