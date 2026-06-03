# Copia el código Vue compartido desde UDL-Frontend sin tocar el proyecto web.
$webSrc = "C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Frontend\src"
$mobileSrc = "C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\src"

$preserve = @(
  "platform",
  "services\api.js",
  "stores\auth.js",
  "router\index.js",
  "main.js",
  "assets\mobile.css",
  "composables\useAppStorage.js"
)

Write-Host "Sincronizando vistas, componentes y servicios (excepto capa móvil)..."
robocopy $webSrc "$mobileSrc\views" views /MIR /NFL /NDL /NJH /NJS
robocopy $webSrc "$mobileSrc\components" components /MIR /NFL /NDL /NJH /NJS
robocopy $webSrc "$mobileSrc\services" services /MIR /XF api.js /NFL /NDL /NJH /NJS
robocopy $webSrc "$mobileSrc\layouts" layouts /MIR /NFL /NDL /NJH /NJS
robocopy $webSrc "$mobileSrc\composables" composables /MIR /XF useAppStorage.js /NFL /NDL /NJH /NJS

Write-Host "Listo. Archivos preservados:"
$preserve | ForEach-Object { Write-Host "  - src/$_" }
