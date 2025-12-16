# Doble actualización de gladiadores (delta time vs frames fijos)

## Resumen
Actualmente las entidades se actualizan dos veces por frame mediante dos rutas distintas: una basada en `delta` del motor nuevo y otra basada en frames fijos (`simulationSpeed`) heredada. Esto duplica fuerzas, daños, correcciones de penetración y cooldowns, y hace que gladiadores con lógica frame-based (Orb, Star, etc.) se comporten de forma explosiva o dependiente del FPS.

## Cómo ocurre
1. **Ruta por delta (motor nuevo):** el bucle principal llama a `GameEngine.process()` cada frame. Dentro de `_process` de `Entity` se convierte el `delta` a `simulationSpeed` (multiplicado por 60) y se ejecuta el `update` legacy de cada entidad.
2. **Ruta por frames fijos (legacy):** el mismo frame ejecuta el bucle de física con `FIXED_DT_SECONDS` y vuelve a invocar `updateFn` (la función `update` de `main.js`), que a su vez llama `gladiator.update()` con `simulationSpeed` basado en frames.
3. **Efecto combinado:** cada gladiador recibe dos ticks de lógica por frame; como ambos multiplican por `simulationSpeed`, las fuerzas y contadores se escalan aproximadamente al doble (y además quedan ligados al FPS si el `delta` varía).

## Evidencia en código
- El `GameLoop` invoca `GameEngine.process(delta)` y, en el mismo frame, vuelve a llamar a la función `updateFn` dentro del bucle de física fijo.【F:src/core/Loop.js†L63-L84】
- El lifecycle `_process` de `Entity` convierte `delta` a `simulationSpeed` y llama al `update` legacy en cada frame, disparando movimiento, combate y lógica de módulos.【F:src/entities/Entity.js†L104-L126】
- `Gladiator.update` ejecuta la lógica del módulo y después el `super.update`, por lo que cada llamada cuenta como un tick completo de IA y combate.【F:src/gladiators/Gladiator.js†L103-L130】
- Ejemplos de módulos sensibles al doble tick:
  - **Orb:** acumula aceleración gravitatoria y XP en proporción directa a `simulationSpeed`, duplicando atracción y daño por segundo.【F:src/gladiators/orb/index.js†L12-L22】
  - **Star:** carga energía según distancia recorrida en cada `update`, por lo que el burst se dispara con el doble de frecuencia y velocidad resultante.【F:src/gladiators/star/index.js†L15-L30】

## Gladiadores afectados
Cualquier módulo que use `update` con `simulationSpeed` o que acumule estado por tick sufre el doble conteo. Observados en juego: Orb (gravedad/XP), Star (carga/burst), proyectos con spawns o multi-hit (p.ej. pets, bombas), y cualquier habilidad con cooldown decrementado por frame fijo.

## Opciones de arreglo
1. **Elegir una sola ruta de actualización:**
   - Desactivar el llamado legacy en `_process` (p.ej. que `Entity._process` solo despache componentes/estado y que `update` se ejecute únicamente desde `GameLoop` con `FIXED_DT_SECONDS`).
   - O, alternativamente, mantener `_process` y eliminar la llamada a `updateFn` dentro del bucle fijo.
2. **Separar física y lógica:** mover movimiento/combate a `_physics_process` (fixed delta) y reservar `_process` para UI/efectos; así se evita duplicar lógica pesada.
3. **Guardas temporales:** añadir un flag global (ej. `USE_ENGINE_PROCESS_ONLY`) para saltarse una de las rutas mientras se migran los gladiadores al nuevo lifecycle.

## Recomendación
Adoptar la ruta única por `GameEngine` (variable delta -> convertir a fixed internamente) y borrar el doble llamado en el bucle legacy. Luego migrar los gladiadores a `_physics_process` o a sistemas basados en `delta` real, verificando en especial Orb y Star para calibrar sus constantes una vez tengan un solo tick por frame.
