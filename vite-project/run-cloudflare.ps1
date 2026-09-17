$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$artifactDir = Join-Path $root 'artifacts'
$log = Join-Path $artifactDir 'cloudflared.log'
New-Item -ItemType Directory -Force -Path $artifactDir | Out-Null
if (Test-Path $log) { Remove-Item $log -Force }

# cloudflared writes important startup information to stderr.
# Merge both streams here, show them in this window, and persist the exact same text.
& cloudflared tunnel --url http://127.0.0.1:3001 2>&1 |
    ForEach-Object {
        $line = $_.ToString()
        $line
        Add-Content -LiteralPath $log -Value $line -Encoding UTF8
    }
