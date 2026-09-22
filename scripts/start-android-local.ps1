# Build Android contra API Docker local (:5055) + abrir Android Studio.
# Requisito: docker compose up en UDL-Backend (API en host 5055).
# Uso: .\scripts\start-android-local.ps1
#      .\scripts\start-android-local.ps1 -OpenStudio

param(
    [switch]$OpenStudio
)

$ErrorActionPreference = "Stop"
$mobileRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=== UDL Mobile - Android + Docker local ===" -ForegroundColor Cyan
Write-Host "API emulador: http://10.0.2.2:5055/api  (.env.android)" -ForegroundColor Gray
Write-Host "API host:     http://localhost:5055/health" -ForegroundColor Gray
Write-Host ""

try {
    $health = Invoke-WebRequest -Uri "http://localhost:5055/health" -UseBasicParsing -TimeoutSec 3
    if ($health.StatusCode -ge 200 -and $health.StatusCode -lt 300) {
        Write-Host "Docker API OK (health)" -ForegroundColor Green
    }
} catch {
    Write-Host "AVISO: no responde http://localhost:5055/health" -ForegroundColor Yellow
    Write-Host "  Arrancá el stack: cd UDL\UDL-Backend; docker compose up -d" -ForegroundColor Yellow
    Write-Host ""
}

Set-Location $mobileRoot

if ($OpenStudio) {
    npm run cap:android:local
} else {
    npm run cap:sync:local
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Listo. Abrí Android Studio en:" -ForegroundColor Green
Write-Host "  $mobileRoot\android" -ForegroundColor White
Write-Host ""
Write-Host "  Sync Gradle -> Run en emulador" -ForegroundColor Gray
Write-Host "  Login seed: socio@udl.local / demo123 (tras .\scripts\seed-tenants.ps1)" -ForegroundColor Gray
Write-Host ""
