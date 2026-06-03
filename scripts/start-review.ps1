# Levanta backend local + app movil para revision en el navegador.
$backend = "C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Backend\ClubSocios.Api"
$mobile = "C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile"
$web = "C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Frontend"

Write-Host "=== UDL - Revision local ===" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:5055  (Swagger: /swagger)"
Write-Host "Mobile:   http://localhost:5003"
Write-Host "Web:      http://localhost:5002  (referencia)"
Write-Host ""

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$backend'; `$env:ASPNETCORE_ENVIRONMENT='Development'; Write-Host 'Backend UDL :5055' -ForegroundColor Green; dotnet run --launch-profile http"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$mobile'; Write-Host 'UDL Mobile :5003' -ForegroundColor Green; npm run dev"
)

Start-Process powershell -ArgumentList @(
  "-NoExit", "-Command",
  "cd '$web'; Write-Host 'UDL Web :5002' -ForegroundColor Green; npm run dev"
)

Write-Host "Tres ventanas PowerShell abiertas. En ~20s abre http://localhost:5003" -ForegroundColor Yellow
