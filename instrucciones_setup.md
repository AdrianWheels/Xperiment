# Instrucciones de Setup para Proyectos Experimentales

Este documento detalla cómo organizar el espacio de trabajo. Cada proyecto tendrá su propia carpeta en la raíz para mantener las dependencias y configuraciones aisladas.

## Estructura de Directorios Propuesta

Para mantener el orden, usaremos nombres de carpeta en `snake_case` (minúsculas con guiones bajos) derivados de los títulos de los proyectos.

```text
/ (Raíz del Workspace)
├── simulacion_particulas/
├── coliseo_arena/
├── dibujador_generativo/
├── ecosistema_evolutivo/
├── arena_llm/
├── game_of_life_donut/      <-- Nuevo
├── pipeline_2d_3d/
├── caja_escape_digital/
├── visualizador_git/        <-- Nuevo
├── sintetizador_voz_emoji/  <-- Nuevo
├── tetris_fisica/
├── asistente_clippy/
├── solver_laberintos/
├── extractor_memes/
├── bodymap_doloroso/
├── juego_anuncios/
├── zodiac_battle/
├── detector_rickrolls/      <-- Nuevo
├── infografia_ucm/
└── arte_huella_digital/     <-- Nuevo
```

## Opción A: Script de Automatización (Recomendado)

Puedes copiar y pegar el siguiente script de PowerShell en tu terminal para crear **todas** las carpetas de una vez y añadir un archivo `README.md` básico en cada una.

```powershell
# Definir la lista de carpetas
$carpetas = @(
    "simulacion_particulas",
    "coliseo_arena",
    "dibujador_generativo",
    "ecosistema_evolutivo",
    "arena_llm",
    "game_of_life_donut",
    "pipeline_2d_3d",
    "caja_escape_digital",
    "visualizador_git",
    "sintetizador_voz_emoji",
    "tetris_fisica",
    "asistente_clippy",
    "solver_laberintos",
    "extractor_memes",
    "bodymap_doloroso",
    "juego_anuncios",
    "zodiac_battle",
    "detector_rickrolls",
    "infografia_ucm",
    "arte_huella_digital"
)

# Crear carpetas y READMEs
foreach ($carpeta in $carpetas) {
    if (-not (Test-Path -Path $carpeta)) {
        New-Item -ItemType Directory -Path $carpeta | Out-Null
        Write-Host "Created: $carpeta" -ForegroundColor Green
        
        $readmeContent = "# $carpeta`n`nEspacio reservado para implementación."
        Set-Content -Path "$carpeta/README.md" -Value $readmeContent
    } else {
        Write-Host "Skipped: $carpeta (ya existe)" -ForegroundColor Yellow
    }
}
```

## Opción B: Creación Manual e Inicialización

Si prefieres ir uno a uno o usar diferentes tecnologías (Vite, Next.js, Vanilla), sigue estos pasos generales:

### 1. Proyectos "Vanilla" (HTML/JS/CSS puro)
Para proyectos de alto rendimiento gráfico (partículas, game of life, cellular automata) a veces es mejor evitar frameworks pesados.
```bash
mkdir nombre_proyecto
cd nombre_proyecto
npm init -y
touch index.html style.css main.js
```

### 2. Proyectos con React / Three.js
Para visualizaciones complejas o interfaces ricas (Dashboard, Escape Room, Visualizador Git).
```bash
npm create vite@latest nombre_proyecto -- --template react
```

### 3. Proyectos de Backend / Scripts (Scrapers, LLM)
Para herramientas que requieren node puro (Extractor memes, Arena LLM - backend).
```bash
mkdir nombre_proyecto
cd nombre_proyecto
npm init -y
npm install typescript listr2 puppeteer dotenv
npx tsc --init
```
