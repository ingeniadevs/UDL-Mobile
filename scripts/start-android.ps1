# Build Android contra Railway + abrir Android Studio (sin backend local).
# Perfil Docker: .\scripts\start-android-local.ps1
# Uso: .\scripts\start-android.ps1
#      .\scripts\start-android.ps1 -OpenStudio

param(
    [switch]$OpenStudio
)

$ErrorActionPreference = "Stop"
$mobileRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "=== UDL Mobile - Android + Railway ===" -ForegroundColor Cyan
Write-Host "API: https://udl-backend-production.up.railway.app/api" -ForegroundColor Gray
Write-Host ""

Set-Location $mobileRoot

if ($OpenStudio) {
    npm run cap:android:railway
} else {
    npm run cap:sync:railway
}

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Listo. Abrí Android Studio en:" -ForegroundColor Green
Write-Host "  $mobileRoot\android" -ForegroundColor White
Write-Host ""
Write-Host "  Sync Gradle -> Run en emulador o dispositivo" -ForegroundColor Gray
Write-Host "  Login con usuario existente en la base de Railway" -ForegroundColor Gray
Write-Host ""
