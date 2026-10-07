param([switch]$PrepareOnly, [switch]$Background, [int]$Port = 5173)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$artifactDir = Join-Path $PSScriptRoot 'artifacts'
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null

if ($PrepareOnly) {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js was not found in PATH.'
    }
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw 'npm was not found in PATH.'
    }

    $version = (& node -p 'process.versions.node').Trim().Split('.')
    if ([int]$version[0] -lt 22 -or ([int]$version[0] -eq 22 -and [int]$version[1] -lt 12)) {
        throw 'Node.js 22.12 or newer is required. Node.js 24 LTS is recommended.'
    }

    $hash = (Get-FileHash -LiteralPath 'package-lock.json' -Algorithm SHA256).Hash
    $stamp = Join-Path $PSScriptRoot 'node_modules/.hok-lock-hash'
    $previous = if (Test-Path -LiteralPath $stamp) { (Get-Content -LiteralPath $stamp -Raw).Trim() } else { '' }
    if ($previous -ne $hash -or -not (Test-Path -LiteralPath 'node_modules/.bin/vite.cmd')) {
        Write-Host 'Installing simulator dependencies...'
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed.' }
        Set-Content -LiteralPath $stamp -Value $hash
    }
    exit 0
}

if ($Background) {
    Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -WorkingDirectory $PSScriptRoot -ArgumentList ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -Port {1}' -f $PSCommandPath, $Port)
    exit 0
}

$log = Join-Path $artifactDir 'bp-simulator.log'
try {
    $ErrorActionPreference = 'Continue'
    & npm.cmd run simulator:server -- --port $Port 2>&1 |
        ForEach-Object { $_.ToString() } |
        Tee-Object -FilePath $log
    exit $LASTEXITCODE
} catch {
    $_ | Out-String | Add-Content -LiteralPath $log
    exit 1
}
