# Script para descargar assets de Wikimedia Commons
# Uso: ./download_assets.ps1

$baseUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/"
$assetsPath = "C:\Proyectos\CURSO RN\AG - Test\infografia_ucm\assets"

# Asegurar que existe la carpeta
if (-not (Test-Path $assetsPath)) {
    New-Item -ItemType Directory -Path $assetsPath | Out-Null
}

$files = @{
    "hero_shield.svg" = "Captain_America_Shield_04.svg"
    "hero_thunder.png" = "Mjollnir_icon.png"
    "hero_nick.svg" = "Marvel's_Agents_of_S.H.I.E.L.D..svg"
    "hero_spider.svg" = "Spider-Man_symbol.svg"
    "hero_tech.svg" = "Iron_Man_Arc_Reactor.svg" 
}

# Nota: Iron_Man_Arc_Reactor.svg y Spider-Man_symbol.svg son intentos adivinados.
# Si fallan, se mantendrán los placeholders.

foreach ($key in $files.Keys) {
    $wikiName = $files[$key]
    $url = "$baseUrl$wikiName"
    $outputPath = Join-Path $assetsPath $key
    
    Write-Host "Intentando descargar $wikiName ..." -NoNewline
    
    try {
        # UserAgent es necesario a veces para Wikimedia
        Invoke-WebRequest -Uri $url -OutFile $outputPath -UserAgent "PowerShell/Bot" -ErrorAction Stop
        Write-Host " [OK]" -ForegroundColor Green
    }
    catch {
        Write-Host " [FALLÓ]" -ForegroundColor Red
        Write-Host "  No se encontró '$wikiName' o error de red."
    }
}

Write-Host "`nDescarga completada."
