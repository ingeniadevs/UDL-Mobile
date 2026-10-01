# Smoke multi-tenant del flujo de la app (sin emulador) contra la API Docker local.
# Reproduce lo que hace la app: Origin capacitor://localhost, login comunitario,
# POST /auth/select-club, header X-Tenant-Id y aislamiento entre clubes.
# Requisito: docker compose up + .\scripts\seed-tenants.ps1 en UDL-Backend.
# Uso: .\scripts\smoke-api-local.ps1 [-ApiBase http://localhost:5055/api]

param(
    [string]$ApiBase = "http://localhost:5055/api",
    [string]$Password = "demo123"
)

$ErrorActionPreference = "Stop"
$origin = "capacitor://localhost"
$failures = 0

function Check([string]$name, [bool]$ok, [string]$detail = "") {
    if ($ok) {
        Write-Host "  OK   $name" -ForegroundColor Green
    } else {
        Write-Host "  FAIL $name $detail" -ForegroundColor Red
        $script:failures++
    }
}

function Invoke-Api([string]$method, [string]$path, $body = $null, [hashtable]$headers = @{}) {
    $h = @{ Origin = $origin } + $headers
    $params = @{ Uri = "$ApiBase$path"; Method = $method; Headers = $h; UseBasicParsing = $true }
    if ($null -ne $body) {
        $params.ContentType = "application/json"
        $params.Body = ($body | ConvertTo-Json -Compress)
    }
    try {
        $r = Invoke-WebRequest @params
        return [pscustomobject]@{ Status = [int]$r.StatusCode; Headers = $r.Headers; Json = ($r.Content | ConvertFrom-Json) }
    } catch {
        $resp = $_.Exception.Response
        if (-not $resp) { throw }
        return [pscustomobject]@{ Status = [int]$resp.StatusCode; Headers = @{}; Json = $null }
    }
}

function Get-JwtClaim([string]$token, [string]$claim) {
    $payload = $token.Split('.')[1].Replace('-', '+').Replace('_', '/')
    switch ($payload.Length % 4) { 2 { $payload += '==' } 3 { $payload += '=' } }
    $json = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
    return $json.$claim
}

Write-Host ""
Write-Host "=== Smoke multi-tenant mobile -> $ApiBase ===" -ForegroundColor Cyan

$clubs = Invoke-Api GET "/clubs"
Check "GET /clubs responde 200" ($clubs.Status -eq 200)
Check "CORS permite $origin" ($clubs.Headers['Access-Control-Allow-Origin'] -eq $origin)

$productsByClub = @{}

foreach ($slug in @("udl", "demo", "norte")) {
    Write-Host ""
    Write-Host "[$slug] socio@$slug.local" -ForegroundColor Cyan

    $login = Invoke-Api POST "/auth/login" @{ identificador = "socio@$slug.local"; password = $Password }
    Check "login comunitario 200" ($login.Status -eq 200) "(status $($login.Status))"
    if ($login.Status -ne 200) { continue }

    $clubIds = @($login.Json.clubs | ForEach-Object { $_.id })
    Check "membresía incluye '$slug'" ($clubIds -contains $slug) "(clubs: $($clubIds -join ','))"

    $select = Invoke-Api POST "/auth/select-club" @{ clubId = $slug } @{ Authorization = "Bearer $($login.Json.token)" }
    Check "select-club 200" ($select.Status -eq 200) "(status $($select.Status))"
    if ($select.Status -ne 200) { continue }

    $token = $select.Json.token
    $claim = Get-JwtClaim $token "club_id"
    Check "JWT club_id = $slug" ($claim -eq $slug) "(club_id: $claim)"

    $auth = @{ Authorization = "Bearer $token"; 'X-Tenant-Id' = $slug }
    $verify = Invoke-Api GET "/auth/verify" $null $auth
    Check "GET /auth/verify con X-Tenant-Id 200" ($verify.Status -eq 200) "(status $($verify.Status))"

    $other = if ($slug -eq "norte") { "demo" } else { "norte" }
    $mismatch = Invoke-Api GET "/auth/verify" $null @{ Authorization = "Bearer $token"; 'X-Tenant-Id' = $other }
    Check "X-Tenant-Id '$other' con JWT de '$slug' -> 403" ($mismatch.Status -eq 403) "(status $($mismatch.Status))"

    $foreign = Invoke-Api POST "/auth/select-club" @{ clubId = $other } @{ Authorization = "Bearer $token" }
    Check "select-club a '$other' sin membresía rechazado" ($foreign.Status -ge 400) "(status $($foreign.Status))"

    $products = Invoke-Api GET "/productos" $null $auth
    Check "GET /productos 200" ($products.Status -eq 200) "(status $($products.Status))"
    $productsByClub[$slug] = @($products.Json | ForEach-Object { $_.id })
    Check "el club tiene productos seed" ($productsByClub[$slug].Count -gt 0) "(0 productos)"
}

Write-Host ""
Write-Host "[aislamiento]" -ForegroundColor Cyan
$slugs = @($productsByClub.Keys)
for ($i = 0; $i -lt $slugs.Count; $i++) {
    for ($k = $i + 1; $k -lt $slugs.Count; $k++) {
        $a = $slugs[$i]; $b = $slugs[$k]
        $shared = @($productsByClub[$a] | Where-Object { $productsByClub[$b] -contains $_ })
        Check "productos de '$a' y '$b' no se mezclan" ($shared.Count -eq 0) "($($shared.Count) en común)"
    }
}

Write-Host ""
if ($failures -gt 0) {
    Write-Host "$failures chequeo(s) fallaron" -ForegroundColor Red
    exit 1
}
Write-Host "Todo OK" -ForegroundColor Green
