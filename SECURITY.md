# Security scope

Kube Resilience Lab is designed for a local or isolated learning environment.

The application injects bounded faults into its configured demonstration target. It does not accept arbitrary target URLs from visitors, run shell commands from requests, or use Kubernetes API credentials. Mutation endpoints require the lab control key; target mutation endpoints require a separate target key.

## Deployment boundaries

- Keep the controller behind loopback port-forward access or an appropriate authenticated access layer.
- Read endpoints expose lab measurements and reports. The built-in control key is not a replacement for multiuser authorization.
- Use different random controller and target tokens, and do not commit local environment files or `.lab/kubeconfig`.
- Kubernetes Secrets need cluster-level protections; their base64 representation is not encryption.
- NetworkPolicy needs an enforcing CNI. The default Kind setup does not prove network-policy enforcement.
- Keep the Node.js base image and optional monitoring images current with upstream security releases.

If you find a vulnerability, contact the maintainer through the contact details on [Ahmed Fakhfakh's portfolio](https://ahmed-fakhfakh-portfolio.vercel.app/). Do not include working secrets in a public issue.
