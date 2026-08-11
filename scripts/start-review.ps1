# Levanta backend local + app movil web (navegador) para revision rapida.
$clubesRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$backend = Join-Path $clubesRoot "UDL\UDL-Backend\ClubSocios.Api"
$mobile = Split-Path -Parent $PSScriptRoot
$web = Join-Path $clubesRoot "UDL\UDL-Frontend"
$dockerCompose = Join-Path $clubesRoot "UDL\UDL-Backend\docker-compose.dev.yml"

Write-Host "=== UDL - Revision local ===" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5055  (Swagger: /swagger)"
Write-Host "Mobile:   http://localhost:5003"
Write-Host "Web:      http://localhost:5002  (referencia)"
Write-Host ""

if (Test-Path $dockerCompose) {
    Write-Host "Levantando PostgreSQL..." -ForegroundColor Gray
    docker compose -f $dockerCompose up -d postgres 2>$null
}

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$backend'; `$env:ASPNETCORE_ENVIRONMENT='Development'; Write-Host 'Backend UDL :5055' -ForegroundColor Green; dotnet run --launch-profile http"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$mobile'; Write-Host 'UDL Mobile :5003' -ForegroundColor Green; npm run dev"
)

if (Test-Path $web) {
  Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd '$web'; Write-Host 'UDL Web :5002' -ForegroundColor Green; npm run dev"
  )
}

Write-Host "Ventanas abiertas. En ~20s abre http://localhost:5003" -ForegroundColor Yellow
Write-Host "Android + Railway: .\scripts\start-android.ps1 -OpenStudio" -ForegroundColor Yellow
