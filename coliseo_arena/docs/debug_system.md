# Sistema de debug de Coliseo Arena

Esta guía resume lo que ya ofrece el modo debug para visualizar el estado de la arena y de cada gladiador. Todo lo descrito existe en el código actual, por lo que se puede usar de referencia para entender la superposición visual y los logs disponibles.

## Cómo activar el modo debug

- En el cliente: presiona la tecla **D** para alternar `DebugMode.enabled`, lo que habilita las capas de dibujo extra durante el render.
- En el bus de eventos: llama a `EventBus.setDebugMode(true)` para registrar en consola las suscripciones/emisiones y almacenar el historial de los últimos 100 eventos.

## Referencias de tamaño

- El lienzo usa **CELL_SIZE = 12 px** por unidad de mundo.
- El escenario mide **300 × 200 unidades** (≈ 3600 × 2400 px) según `STAGE_W` y `STAGE_H`.
- El radio base de cada gladiador es **10 unidades** (≈ 120 px de diámetro). Es la escala que heredan las flechas y círculos de debug.

## Qué se dibuja sobre la arena

Cuando `DebugMode.enabled` está activo, el `GameLoop` pinta referencias espaciales adicionales:

- **Líneas de perímetro**: un rectángulo rojo delimita el ring jugable a **2 celdas del borde** (margen de 24 px) y uno azul claro marca la zona de paredes a **10 celdas** (120 px) del borde. Con el tamaño actual se traduce en un ring interior de **296 × 196 unidades** y una caja de paredes de **280 × 180 unidades**.
- **Reglas/guías de prototipado** (añadibles en `drawArenaDebug`): usa la misma cuadrícula del lienzo para colocar "líneas de regla" cada cierto número de casillas y leer distancias sin salirte del sistema de unidades.
  - 1 casilla = **12 px**. Un tramado de guías cada 5 casillas marca pasos de **60 px**, y cada 10 casillas marca **120 px** (≈ el margen de pared).
  - Para visualizar una regla horizontal/vertical, itera desde `CELL_SIZE * n` hasta el ancho/alto del canvas (`STAGE_W/STAGE_H * CELL_SIZE`) dibujando líneas finas con `ctx.setLineDash([2, 10])` y etiquetas en píxeles o casillas (`i / CELL_SIZE`).
  - Si quieres medir elementos concretos (por ejemplo el diámetro efectivo de 20 unidades de un golpe meleé), pinta una barra de `20 * CELL_SIZE = 240 px` junto al gladiador para validar que encaja con el radio dibujado.

## Qué se dibuja sobre cada gladiador

El método `drawEntityDebug` añade los siguientes indicadores, pensados para responder a preguntas habituales de diseño y balance.

### Dirección y movimiento
- **Intención vs. movimiento real**:
  - Flecha verde (**INT**) muestra hacia dónde quiere moverse el gladiador (`intentVec`).
  - Flecha amarilla (**VEL**) muestra hacia dónde se está moviendo realmente (`vx/vy`).
- Ambas flechas se escalan por `CELL_SIZE` (12 px) y la de velocidad se dibuja al doble de longitud respecto a su vector base.
- **Previsualización de trayectoria** (**TRAJ**): flecha naranja que proyecta el recorrido actual, marcando en disco el primer rebote calculado contra muros o límites. Una flecha rosa segmentada (**BOUNCE**) indica la dirección estimada tras el rebote.
- El avance se simula en pasos de **1.2 unidades** hasta que detecta pared/límite o alcanza entre **24 y 180 unidades** según la velocidad. La línea de rebote usa un máximo de **50 unidades** (o 70 % de la trayectoria previa, lo que sea menor).
- **Huida** (solo cuando `fleeing` es verdadero):
  - Flecha magenta (**FLEE**) apunta al ángulo de escape.
  - Flecha cian segmentada (**ESC**) muestra la normal de pared usada para separarse de obstáculos, y un punto/flecha rosa claro marca el destino previsto (`escapePreview`).
- Las flechas de huida se multiplican por el radio del gladiador: la de salida se extiende **6× el radio** y la normal de pared **12×**, ambas reescaladas a píxeles.

### Rangos de ataque y de recibir daño
- **Anillo de golpe cuerpo a cuerpo**: se dibuja con radio **1.5× el radio del gladiador** (15 unidades, ≈ 180 px). El color cambia a verde cuando el enemigo más cercano está a menos de **30 unidades** (`hitRange = 2×radio = 20` + tolerancia de 10); si hay cooldown activo la opacidad baja al 30 %.
- **Rangos de ataque a distancia**: los módulos que definen `module.debugRange` pintan círculos mínimos/máximos en cian. Los valores configurados se muestran **a 0.1× de su tamaño real** porque el radio se multiplica por `CELL_SIZE/10`; por ejemplo, el arquero declara 60–160 unidades pero se visualizan como círculos de 6–16 unidades.

### Enfriamientos
- El texto `CD:<valor>` aparece junto al gladiador cuando alguno de sus temporizadores está activo (la fuente es de 64 px a escala de canvas):
  - `cooldown` (básico) – gris.
  - `rangedCD` – verde (ataques a distancia).
  - `lanceCD` – amarillo (cargas de lanza).
  - `summonCD` – verde claro (invocaciones/torretas).
  - `fleeTimer` – magenta (ventana de escape).

### Estado y efectos
- **Estado actual**: etiquetas grandes a la derecha del gladiador, como `FLEE`, `TURRET`, `SHIELD`, `CHARGE` o `DECOY`, se activan según flags de comportamiento (`fleeing`, `pyramidTurret`, `invulnerable`, `lanceCharging`, `decoyActive`).
- **Envenenado**: cuando `poisonStacks > 0`, aparece el texto `PSN:<pila>` en verde azulado.

### Extensiones específicas de módulos
- Cualquier módulo de gladiador puede añadir dibujo personalizado implementando `module.debugDraw(entity, ctx, { CELL_SIZE })`, que se ejecuta al final de `drawEntityDebug`. Ejemplos:
  - `archer`: pinta los círculos de **huida 50**, **mínimo 60** y **máximo 160** unidades; también muestra "RANGE OK" si está en ventana de tiro. Todos se escalan a **10 %** del rango real por el factor `CELL_SIZE/10`.
  - `pyramid`: pinta un círculo de torreta de **60 unidades** (también al 10 % del tamaño real visualizado).

## Historial y trazas de eventos

El `EventBus` mantiene un registro circular de los últimos 100 eventos emitidos. Con `setDebugMode(true)`:
- Se muestran en consola las altas y bajas de listeners.
- Cada emisión se imprime con su `eventName` y `data`.
- El historial puede consultarse con `EventBus.getHistory()` o filtrarse por nombre para depurar comportamientos específicos.
