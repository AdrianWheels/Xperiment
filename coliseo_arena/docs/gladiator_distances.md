# Distancias y velocidades por gladiador

Este documento resume cómo se miden las distancias y velocidades en la arena y recoge los rangos, umbrales y patrones específicos que usa cada gladiador en la implementación actual.

## Unidades y referencias comunes
- Todas las magnitudes de distancia usan **unidades de grid**, no píxeles.
- Tamaño base de la arena: `300 x 200` celdas (`STAGE_W`/`STAGE_H`), diagonal `~360.55`, con **`CELL_SIZE` = 12 px** por celda.
- **Escala humana sugerida:** toma **`1 metro ≈ 20 celdas`** (cada celda ~5 cm). Así la arena equivale a **15 m x 10 m**. No es exacto, pero sirve para razonar los rangos en metros.
- Conversión rápida: `metros = celdas / 20` y `celdas = metros * 20`.

### Rangos unificados en la escala humana
- **Contacto inmediato:** 0–2 m (0–40 celdas). Golpes cuerpo a cuerpo cortos y empujes pequeños.
- **Corto alcance:** 2–4 m (40–80 celdas). Rango típico de armas blancas largas o dashes breves.
- **Medio alcance:** 4–8 m (80–160 celdas). Proyectiles ligeros y zonas de control.
- **Largo alcance:** 8–12 m (160–240 celdas). Proyectiles sostenidos o cargas prolongadas.

### Referencias del escenario
- `SAFE_BOUNDS`: mantiene a los gladiadores a **~12 celdas (~0.6 m)** del borde (margen de pared + 2).
- `WARNING_DISTANCE`: **25 celdas (~1.25 m)** desde el borde activa la evasión de esquinas en movimientos defensivos.

> Si necesitas pensar en “metros”: usa la columna de celdas tal cual (la que usa el motor) y aplica la conversión rápida. Los ejemplos de abajo ya incluyen ambos valores para que compares patrones entre gladiadores.

## Tabla rápida de clases base
| Gladiador | Vida base | Velocidad base | Notas de movimiento por defecto |
| --- | --- | --- | --- |
| Critical | 400 | 1.2 | Estrategia por defecto del motor (agresiva). |
| Speed | 300 | 2.5 | Entra en modo rebote con fricción reducida. |
| Spinner | 500 | 1.5 | Movimiento pasivo en órbita alrededor del centro. |
| Tank | 1100 | 0.25 | Siempre agresivo; se protege con escudos periódicos. |
| Spike | 750 | 0.8 | Refleja daño, movimiento estándar. |
| Ninja | 350 | 1.8 | Probabilidad de esquive, sin ajustes de movimiento. |
| Prism | 450 | 1.0 | Teletransportes cortos aleatorios. |
| Orb | 700 | 0.7 | Atraído a enemigos con aceleración fija. |
| Cube | 1000 | 0.4 | Frenado extra y golpes de área. |
| Star | 450 | 1.3 | Acelera al gastar energía de movimiento. |
| Hex | 600 | 0.9 | Cambia entre agresivo/defensivo según vida. |
| Pyramid | 800 | 0.3 | Cambia a torreta pasiva en corto alcance. |
| Bomber | 500 | 1.0 | Alterna agresivo/defensivo al entrar en rango. |
| Summoner | 450 | 0.9 | Invoca esbirros; movimiento estándar. |
| Lancer | 400 | 1.4 | Cargas de alta velocidad hacia el objetivo. |
| Berserker | 750 | 1.1 | Agresivo con aceleración y fricción personalizadas. |
| Archer | 350 | 1.0 | Kiting defensivo (60–160 celdas, ~3–8 m). |
| Poison | 500 | 0.8 | Alterna huida y agresión al envenenar. |
| Illusion | 700 | 1.2 | Activa huida mientras un señuelo está vivo. |

## Detalle por gladiador

### Archer
- **Rangos:** ataque mínimo **60 celdas (~3 m)**, ataque máximo **160 celdas (~8 m)**, huida a **45 celdas (~2.25 m)**.
- Estrategia por defecto: `defensive`; cambia a `aggressive` al perseguir fuera de rango.
- Kiting: mantiene posición dentro del rango óptimo y retrocede suavemente si se le acerca demasiado el objetivo.

### Berserker
- Estrategia fija: `aggressive` con `seekAcceleration 0.15` y `friction 0.97` (más aceleración y menos fricción que el default). No usa rangos.

### Bomber
- Cambia a `defensive` si el enemigo está a **< 70 celdas (~3.5 m)**; activa un temporizador de huida de `18` frames.
- Al recibir daño: lanza bomba y fuerza huida `24` frames (defensive). Vuelve a `aggressive` al expirar el temporizador.
- Rastro de bombas mientras se mueve si la velocidad supera `35%` de su velocidad base.

### Cube
- Fricción fija `0.95` (más alta que la genérica).
- Inicia un **slam** si el enemigo más cercano está a **< 32 celdas (~1.6 m)** y el enfriamiento está listo.
- El golpe de área afecta a enemigos a **<= 28 celdas (~1.4 m)** con empuje `2.4`.

### Hex
- Cambia a `defensive` si la vida cae por debajo de `40%`; vuelve a `aggressive` al recuperar `>= 60%`.
- Fuerza retroceso temporal si un enemigo está a **< 100 celdas (~5 m)** aunque esté en agresivo.

### Illusion
- Activa **señuelo** cuando la vida < `30%`; mientras el señuelo está activo y queden >`30` frames, `fleeing = true` (la estrategia defensiva se usa en el motor).
- Reutiliza el señuelo cada `150 + 20*nivel` frames; mitiga daño al `50%` mientras está activo.

### Lancer
- Sin rangos de distancia, pero en **modo carga** aumenta velocidad a `3.2x` base hacia el enemigo más cercano y `2.4x` tras golpear.
- Empuja al enemigo con fuerza `3` (equivale a ~0.15 m de desplazamiento instantáneo si no hay otras fuerzas).

### Orb
- Acelera hacia el enemigo más cercano con `0.25 + 0.02*nivel` por frame.
- Gana XP adicional si el enemigo está a `< 100` celdas.

### Poison
- Cambia a `defensive` durante `18` frames tras aplicar veneno.
- Si un enemigo está a **< 70 celdas (~3.5 m)** mientras el temporizador sigue activo, mantiene la huida; vuelve a `aggressive` al expirar.

### Prism
- Teletransportes aleatorios en un rango de **`10 + nivel` celdas (~0.5 m + 0.05 m por nivel)** alrededor de su posición; clamp a `10` celdas de los bordes.

### Pyramid
- Cambia a modo torreta (estrategia `passive` con patrón `idle`) cuando el enemigo más cercano está a **< 60 celdas (~3 m)**.
- En modo torreta dispara proyectiles con enfriamiento base `45` frames (mínimo `15` con nivel) y gana poca XP pasiva.

### Speed
- Modo rebote: se activa al rebotar en un enemigo; velocidad se ajusta a `>= 1.8x` su base o se multiplica por `1.35`.
- Rebote en pared mientras está activo multiplica velocidad por `1.08`; sale del modo tras `5` rebotes.
- Fricción reducida a `0.995` durante el modo rebote para mantener la velocidad.

### Spinner
- Estrategia por defecto `passive` en patrón **orbit**.
- Radio de órbita **80 celdas (~4 m)** y velocidad angular base `0.2`, ambos escalados con nivel (`orbitSpeed = 0.2 + 0.05*nivel`).
- Centro de órbita: centro del escenario (`STAGE_W/2`, `STAGE_H/2`).

### Star
- Acumula energía según distancia recorrida; al superar `100` de energía, multiplica velocidad por `~1.5 + 0.05*nivel` y gasta `100`.
- Potencia daño si la energía > `50`.

### Summoner
- Invoca un esbirro inicial desplazado **8 celdas (~0.4 m)** a favor del lado del equipo.
- Nuevas invocaciones se sitúan a **6–10 celdas (~0.3–0.5 m)** del invocador en dirección aleatoria; comparte el `90%` de su velocidad base.

### Tank
- Estrategia `aggressive` permanente.
- Habilidad defensiva basada en tiempo; no usa rangos.

### Other base gladiators (Critical, Spike, Ninja)
- Usan movimiento estándar sin umbrales de distancia específicos; sus habilidades no dependen de rangos de posición.
