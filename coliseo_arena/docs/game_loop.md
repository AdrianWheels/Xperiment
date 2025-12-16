# Loop del Juego (Game Loop)

Este documento describe el ciclo principal de ejecución del Coliseo de Arena.

## Estructura Principal

El juego utiliza un bucle de animación estándar mediante `requestAnimationFrame` gestionado por la clase `GameLoop`.

### Fases del Loop

1.  **Cálculo de Delta Time (dt)**: Se calcula el tiempo transcurrido desde el último frame para métricas (FPS), aunque la simulación lógica actualmente corre por frames fijos modificados por `simulationSpeed`.
2.  **Actualización de UI**: Se actualizan los contadores de FPS y número de entidades en pantalla.
3.  **Update (Lógica)**: Se ejecuta la función de actualización principal.
4.  **Render (Dibujado)**: Se dibuja el estado actual en el canvas.

## Lógica de Actualización (`update()`)

La función `update()` en `main.js` orquesta la lógica del juego en el siguiente orden:

1.  **Entidades (Gladiadores)**:
    - Se itera sobre la lista de entidades.
    - Se eliminan las entidades muertas.
    - Se llama a `entity.update()` para cada gladiador vivo.
        - **Envejecimiento**: Aumenta la edad de la entidad.
        - **Lógica de Clase**: Se aplican comportamientos específicos (ej. escudo del Tank, gravedad del Orb).
        - **Movimiento**: Se actualiza la posición (x, y) y se gestionan rebotes con paredes.
        - **Colisiones**: Se comprueba cercanía con otras entidades para iniciar combate o repulsión.
        - **Experiencia**: Se gana XP pasiva y se comprueba subida de nivel.

2.  **Textos Flotantes**:
    - Se actualizan posiciones y vida de los textos de daño/efectos.
    - Se eliminan los textos que han expirado.

3.  **Arena (Grid)**:
    - Se llama a `updateSand()`.
    - Simula la física de los píxeles de la arena (caída, desplazamiento lateral) para efectos visuales (sangre, elementos).

4.  **Control de Combate**:
    - Se verifica si el combate ha terminado (0 o 1 superviviente) para reiniciar la ronda automáticamente.

## Renderizado

El renderizado utiliza un sistema de doble buffer (Offscreen Canvas) para la arena y dibujado directo para entidades.

1.  **Arena (Grid)**:
    - Se convierte el array de la grid a una imagen de píxeles (ImageData).
    - Se dibuja en el canvas principal escalado.
2.  **Entidades**:
    - Cada entidad se dibuja a sí misma (Sprite o Círculo + Barra de Vida).
3.  **Textos Flotantes**:
    - Se dibujan los números de daño y efectos sobre la capa de juego.
4.  **Overlay**:
    - Se dibuja información superpuesta si es necesario.
