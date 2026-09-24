param([string]$Fixture = '')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Runtime.InteropServices;
public static class HeroCapture {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();

}
'@
[HeroCapture]::SetProcessDPIAware() | Out-Null
$inputData = [Console]::In.ReadToEnd() | ConvertFrom-Json
$r = $inputData.region
$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
$rect = New-Object System.Drawing.Rectangle([int]$r.x,[int]$r.y,[int]$r.width,[int]$r.height)
if (-not $Fixture -and -not $bounds.Contains($rect)) { throw 'Region outside desktop' }
$bitmap = if ($Fixture) { New-Object System.Drawing.Bitmap($Fixture) } else { New-Object System.Drawing.Bitmap([int]$r.width,[int]$r.height) }
try {
  if (-not $Fixture) {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try { $graphics.CopyFromScreen($rect.Location, [System.Drawing.Point]::Empty, $rect.Size) } finally { $graphics.Dispose() }
  }
  $stream = New-Object System.IO.MemoryStream
  try {
    $bitmap.Save($stream,[System.Drawing.Imaging.ImageFormat]::Png)
    @{ preview=('data:image/png;base64,'+[Convert]::ToBase64String($stream.ToArray())) } | ConvertTo-Json -Compress -Depth 4
  } finally { $stream.Dispose() }
} finally { $bitmap.Dispose() }
