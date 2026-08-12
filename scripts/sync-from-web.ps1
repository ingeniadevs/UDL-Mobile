# Copia el codigo Vue compartido desde UDL-Frontend sin tocar el proyecto web.
# Uso: .\scripts\sync-from-web.ps1
$ErrorActionPreference = 'Stop'

# Script vive en Mobile\UDL-Mobile\scripts → repo mobile = parent de scripts
$mobileRoot = Split-Path $PSScriptRoot -Parent
$webSrc = "c:\dev\Personal\Clubes\UDL\UDL-Frontend\src"
$mobileSrc = Join-Path $mobileRoot "src"

if (-not (Test-Path $webSrc)) {
  throw "No se encontro el frontend web en: $webSrc"
}
if (-not (Test-Path $mobileSrc)) {
  throw "No se encontro src mobile en: $mobileSrc"
}

$preserve = @(
  "platform",
  "services\api.js",
  "stores\auth.js",
  "router\index.js",
  "main.js",
  "assets\mobile.css",
  "composables\useAppStorage.js",
  "composables\useAppBranding.js",
  "composables\useClubBranding.js",
  "composables\useAssetUrl.js",
  "composables\useMercadoPagoReturn.js",
  "composables\useTheme.js",
  "components\brand",
  "components\mobile",
  "utils\assetUrl.js",
  "config",
  "views\auth\LoginView.vue"
)

# Backup de carpetas/archivos solo-mobile que robocopy /MIR borraria
$backupRoot = Join-Path $env:TEMP ("udl-mobile-sync-backup-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backupRoot | Out-Null

function Backup-IfExists([string]$relativePath) {
  $src = Join-Path $mobileSrc $relativePath
  if (-not (Test-Path $src)) { return }
  $dest = Join-Path $backupRoot $relativePath
  $destParent = Split-Path $dest -Parent
  if (-not (Test-Path $destParent)) {
    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
  }
  Copy-Item -Path $src -Destination $dest -Recurse -Force
  Write-Host "  backup: src\$relativePath"
}

Write-Host "Backup de assets solo-mobile..."
Backup-IfExists "components\brand"
Backup-IfExists "components\mobile"
Backup-IfExists "utils\assetUrl.js"
Backup-IfExists "views\auth\LoginView.vue"
Backup-IfExists "composables\useAppBranding.js"
Backup-IfExists "composables\useClubBranding.js"
Backup-IfExists "composables\useAssetUrl.js"
Backup-IfExists "composables\useMercadoPagoReturn.js"
Backup-IfExists "composables\useTheme.js"
Backup-IfExists "config"

Write-Host "Sincronizando vistas, componentes, servicios, layouts, composables y utils..."
robocopy (Join-Path $webSrc "views") (Join-Path $mobileSrc "views") /MIR /XF LoginView.vue /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $webSrc "components") (Join-Path $mobileSrc "components") /MIR /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $webSrc "services") (Join-Path $mobileSrc "services") /MIR /XF api.js /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $webSrc "layouts") (Join-Path $mobileSrc "layouts") /MIR /NFL /NDL /NJH /NJS | Out-Null
robocopy (Join-Path $webSrc "composables") (Join-Path $mobileSrc "composables") /MIR /XF useAppStorage.js /XF useAppBranding.js /XF useClubBranding.js /XF useAssetUrl.js /XF useMercadoPagoReturn.js /XF useTheme.js /NFL /NDL /NJH /NJS | Out-Null

$webUtils = Join-Path $webSrc "utils"
$mobileUtils = Join-Path $mobileSrc "utils"
if (Test-Path $webUtils) {
  if (-not (Test-Path $mobileUtils)) {
    New-Item -ItemType Directory -Path $mobileUtils | Out-Null
  }
  robocopy $webUtils $mobileUtils /E /XF assetUrl.js /NFL /NDL /NJH /NJS | Out-Null
}

Write-Host "Restaurando assets solo-mobile..."
$restoreMap = @(
  @{ Rel = "components\brand"; IsDir = $true },
  @{ Rel = "components\mobile"; IsDir = $true },
  @{ Rel = "utils\assetUrl.js"; IsDir = $false },
  @{ Rel = "views\auth\LoginView.vue"; IsDir = $false },
  @{ Rel = "composables\useAppBranding.js"; IsDir = $false },
  @{ Rel = "composables\useClubBranding.js"; IsDir = $false },
  @{ Rel = "composables\useAssetUrl.js"; IsDir = $false },
  @{ Rel = "composables\useMercadoPagoReturn.js"; IsDir = $false },
  @{ Rel = "composables\useTheme.js"; IsDir = $false },
  @{ Rel = "config"; IsDir = $true }
)
foreach ($item in $restoreMap) {
  $src = Join-Path $backupRoot $item.Rel
  if (-not (Test-Path $src)) { continue }
  $dest = Join-Path $mobileSrc $item.Rel
  $destParent = Split-Path $dest -Parent
  if (-not (Test-Path $destParent)) {
    New-Item -ItemType Directory -Path $destParent -Force | Out-Null
  }
  Copy-Item -Path $src -Destination $dest -Recurse -Force
}

Remove-Item -Path $backupRoot -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Listo. Archivos/carpetas preservados (no sobrescritos por este script):"
$preserve | ForEach-Object { Write-Host "  - src\$_" }
Write-Host ""
Write-Host "IMPORTANTE: reaplicar adaptaciones Capacitor en vistas/layouts y cablear rutas nuevas en router/index.js"
