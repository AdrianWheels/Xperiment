# Lista de Proyectos Experimentales y Creativos

Esta lista contiene ideas de proyectos ordenadas por dificultad, diseñadas para poner a prueba los límites del navegador, la lógica de programación y la integración de IA.

| Proyecto | Herramienta/Concepto | Descripción Corta | Dificultad | Recursos Recomendados | Lienzo ChatGPT? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Simulación de 1 millón de partículas** | Simulador de partículas | Render masivo utilizando la GPU para ver cuándo explota el navegador. | 🔴 **Alta** | WebGPU, Regl, Three.js (InstancedMesh), Shaders GLSL | Sí |
| **Coliseo de Arena** | Simulador de arena (Cellular Automata) | Armas con físicas raras luchan y evolucionan en un entorno de píxeles (tipo Noita). | 🔴 **Alta** | Canvas API (ImageData), Rust (Wasm) para performance, algoritmos de Cellular Automata | Sí |
| **Dibujador Generativo** | Algoritmos Genéticos | Sistema que recrea una imagen objetivo usando miles de formas geométricas aleatorias que mutan. | 🔴 **Alta** | Canvas API, Algoritmos Genéticos, Hill Climbing | Sí |
| **Ecosistema Evolutivo** | Simulador de Vida Artificial | Criaturas con redes neuronales simples que aprenden a cazar y sobrevivir. Comportamiento emergente. | 🔴 **Alta** | TensorFlow.js (custom layers), Neataptic, P5.js | Sí |
| **Arena LLM** | Orquestación de Agentes | Tres LLMs compiten o cooperan en un micro-juego con objetivos secretos y chat interno. | 🔴 **Alta** | Vercel AI SDK, LangChain, OpenAI API / Anthropic API | Solo demo |
| **Juego de la Vida en Donut 3D** | Renderizado Matemático | Implementación del Game of Life de Conway sobre la superficie de un toroide (donut) en 3D. | 🔴 **Alta** | Three.js, Custom Shaders, Topología matemática | Sí |
| **Pipeline 2D → 3D Infinito** | Workflow Generativo | Automatización que coge texto/imagen y genera un modelo 3D y lo coloca en una escena. | 🟠 **Media-Alta** | Stable Diffusion API, TripoSR / Meshy API, Three.js | Solo demo |
| **Caja Escape Digital** | Puzzle Logic / State Machine | Caja rompecabezas con mecanismos, interruptores y trampas lógicas absurdas. | 🟠 **Media-Alta** | XState (máquinas de estado), CSS 3D Transforms, React Spring | Sí |
| **Visualizador de Git Orgánico** | Data Visualization 3D | Tu historial de commits genera un bosque procedural; ramas son ramas, commits son hojas. | 🟠 **Media-Alta** | GitHub API, Three.js, Procedural generation algos | Sí |
| **Sintetizador Voz a Emoji** | AI en el navegador | Hablas al micrófono y el sistema traduce el sentimiento/contenido a una lluvia de emojis en tiempo real. | 🟠 **Media-Alta** | Web Audio API, Transformers.js (Sentiment Analysis), Canvas | Sí |
| **Tetris con Física Real** | Juego Híbrido | Tetris donde las piezas no encajan en una rejilla, sino que tienen peso, rebotan y caen físicamente. | 🟡 **Media** | Matter.js o Planck.js, Canvas API | Sí |
| **Asistente "Clippy" Rebelde** | Mascota Digital / DOM | Mascota que "intenta ayudar" pero reacciona sarcásticamente a tus clicks y scroll. | 🟡 **Media** | Floating UI, CSS Animations, Web Speech API (para que hable) | Sí |
| **Solver Dinámico de Laberintos** | Pathfinding | Un agente debe resolver un laberinto cuyas paredes cambias tú o el sistema en tiempo real. | 🟡 **Media** | Algoritmos A* (A-Star) o Dijkstra, Grid system | Sí |
| **Extractor de Memes** | Web Scraper | Bot que navega, identifica imágenes que parecen memes y las descarga clasificadas. | 🟡 **Media** | Puppeteer / Playwright, APIs de visión (opcional) | Solo demo |
| **BodyMap Doloroso** | Visualización Interactiva | Modelo 3D o SVG complejo del cuerpo humano para seleccionar zonas de dolor muscular. | 🟡 **Media** | D3.js, SVGs interactivos, React-Three-Fiber | Sí |
| **Juego de Anuncios Falsos** | Minijuego UI | Detectar el botón de "Cerrar" real entre 50 falsos y pop-ups que se mueven. | 🟡 **Media** | HTML Canvas, Framer Motion (para animaciones locas) | Sí |
| **ZodiacBattle** | RPG Lógico | Sistema de batalla "Piedra-Papel-Tijera" complejo basado en cartas astrales. | 🟡 **Media** | Lógica de RPG pura, JSON de datos complejo | No |
| **Detector de 'Rickrolls'** | Browser Extension / Tool | Analiza URLs (incluso acortadas) para predecir si llevan al video de Rick Astley. | 🟡 **Media** | Fetch API, YouTube Data API, Regex avanzados | Sí |
| **Infografía UCM Interactiva** | Gráficos Relacionales | Grafo interactivo conectando personajes y películas de Marvel según sus poderes. | 🟢 **Baja-Media** | Vis.js o React Flow, CSS Grid avanzado | No |
| **Arte de Huella Digital** | Generative Art | Genera un avatar o patrón único basado en los datos de fingerprint del navegador del usuario. | 🟢 **Baja-Media** | FingerprintJS, HTML5 Canvas, HSL Colors | Sí |
