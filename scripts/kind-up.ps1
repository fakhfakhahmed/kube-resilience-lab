[CmdletBinding()]
param([switch]$Monitoring)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$labRoot = Split-Path -Parent $PSScriptRoot
Push-Location $labRoot
try {
    foreach ($requiredCommand in @('docker', 'kind', 'kubectl', 'node')) {
        if (-not (Get-Command $requiredCommand -ErrorAction SilentlyContinue)) { throw "Missing $requiredCommand. See README prerequisites." }
    }
    function Invoke-LabNative {
        param([string]$Command, [string[]]$Arguments)
        & $Command @Arguments
        if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE." }
    }
    function New-LabToken {
        $bytes = New-Object byte[] 32
        $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
        return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
    }
    function Save-LabSecret {
        param([string]$Name, [hashtable]$Values)
        $manifest = @{ apiVersion='v1'; kind='Secret'; metadata=@{ name=$Name; namespace='kube-resilience-lab' }; type='Opaque'; stringData=$Values }
        $manifest | ConvertTo-Json -Depth 5 -Compress | & kubectl @script:labKubectlArguments apply -f -
        if ($LASTEXITCODE -ne 0) { throw 'Could not create lab Secret.' }
    }
    & docker info *> $null
    if ($LASTEXITCODE -ne 0) { throw 'Start your Docker engine, then run this script again.' }
    New-Item -ItemType Directory -Force -Path '.lab' | Out-Null
    $labKubeconfig = Join-Path $labRoot '.lab/kubeconfig'
    $script:labKubectlArguments = @('--kubeconfig', $labKubeconfig, '--context', 'kind-kube-resilience-lab')
    $clusters = & kind get clusters
    if ($LASTEXITCODE -ne 0) { throw 'Could not list Kind clusters.' }
    if ($clusters -notcontains 'kube-resilience-lab') {
        Invoke-LabNative kind @('create','cluster','--name','kube-resilience-lab','--config','deploy/kind/config.yaml','--kubeconfig',$labKubeconfig,'--wait','120s')
    } else {
        $labConfigText = & kind get kubeconfig --name kube-resilience-lab
        if ($LASTEXITCODE -ne 0) { throw 'Could not read lab kubeconfig.' }
        [IO.File]::WriteAllLines($labKubeconfig, [string[]]$labConfigText, (New-Object Text.UTF8Encoding $false))
    }
    # No operation changes the user's default context or existing minikube.
    Invoke-LabNative docker @('build','--tag','kube-resilience-lab:local','.')
    Invoke-LabNative kind @('load','docker-image','kube-resilience-lab:local','--name','kube-resilience-lab')
    Invoke-LabNative kubectl ($script:labKubectlArguments + @('apply','-f','deploy/base/namespace.yaml'))
    $labControlKey = if ($env:LAB_TOKEN) { $env:LAB_TOKEN } else { New-LabToken }
    $labTargetKey = if ($env:TARGET_TOKEN) { $env:TARGET_TOKEN } else { New-LabToken }
    Save-LabSecret 'lab-tokens' @{ LAB_TOKEN=$labControlKey; TARGET_TOKEN=$labTargetKey }
    if ($Monitoring) {
        $existingAdmin = & kubectl @script:labKubectlArguments -n kube-resilience-lab get secret grafana-admin --ignore-not-found -o jsonpath='{.data.password}'
        if ($LASTEXITCODE -ne 0) { throw 'Could not check Grafana Secret.' }
        if ($existingAdmin) { $labGrafanaPassword = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($existingAdmin)) }
        else { $labGrafanaPassword = New-LabToken; Save-LabSecret 'grafana-admin' @{ password=$labGrafanaPassword } }
        $labManifestPath = 'deploy/monitoring'
    } else { $labManifestPath = 'deploy/base' }
    Invoke-LabNative kubectl ($script:labKubectlArguments + @('apply','-k',$labManifestPath))
    Invoke-LabNative kubectl ($script:labKubectlArguments + @('-n','kube-resilience-lab','rollout','restart','deployment/lab-controller','deployment/checkout-api'))
    foreach ($deployment in @('checkout-api', 'lab-controller')) {
        Invoke-LabNative kubectl ($script:labKubectlArguments + @('-n','kube-resilience-lab','rollout','status',"deployment/$deployment",'--timeout=120s'))
    }
    if ($Monitoring) {
        foreach ($deployment in @('prometheus', 'grafana')) {
            # Cold pulls may queue behind the larger Grafana image.
            Invoke-LabNative kubectl ($script:labKubectlArguments + @('-n','kube-resilience-lab','rollout','status',"deployment/$deployment",'--timeout=600s'))
        }
    }
    if ($env:CI -ne 'true') {
        Write-Host "`nControl key (paste into the lab UI): $labControlKey"
        if ($Monitoring) { Write-Host "Grafana login: admin / $labGrafanaPassword" }
    }
    Write-Host "`nOpen the lab with:"
    Write-Host 'kubectl --kubeconfig .lab/kubeconfig --context kind-kube-resilience-lab -n kube-resilience-lab port-forward --address 127.0.0.1 svc/lab-controller 8080:8080'
    if ($Monitoring) {
        Write-Host 'kubectl --kubeconfig .lab/kubeconfig --context kind-kube-resilience-lab -n kube-resilience-lab port-forward --address 127.0.0.1 svc/grafana 3000:3000'
    }
} finally { Pop-Location }
