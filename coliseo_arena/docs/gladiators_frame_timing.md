# Gladiadores con temporizadores basados en frames

Este documento enumera los gladiadores que usan contadores expresados en *frames* (por ejemplo `cooldown -= simulationSpeed`) para cooldowns, duraciones o ticks. Estos casos son sensibles a variaciones del FPS porque los valores están pensados como "frames a 60fps" y no como segundos reales.

## Gladiadores detectados

| Gladiador | Propiedades en frames | Detalle del comportamiento |
| --- | --- | --- |
| Archer | `rangedCD = 60`, `fleeTimer = 18` | Usa `updateCooldown`/`updateTimer` con `simulationSpeed`, de modo que dispara y huye según frames acumulados. |
| Bomber | `bombTrailCD`, `defensiveBombCD = 60`, `fleeTimer = 18` | Los tres contadores se descuentan por `simulationSpeed`; el rastro de bombas se programa a `120` frames. |
| Cube | `slamCooldown`, `slamWindup = 12`, `slamFlash = 12` | Todo el ciclo de *slam* (carga, flash y downtime) se controla con contadores por frame. |
| Hex | `_hexRegenTimer` | Acumula `simulationSpeed` y regenera cada `60` frames. |
| Illusion | `decoyTimer = 150 + 20·nivel` | El señuelo y el estado de huida (`decoyTimer > 30`) dependen de contadores de frames. |
| Lancer | `lanceCD = 180 - 10·nivel` | Carga la lanza y fija el cooldown usando decrementos por `simulationSpeed`. |
| Poison | `fleeTimer = 18` | La ventana para retroceder tras aplicar veneno se mide en frames, aunque el tick del veneno usa segundos (`Time.elapsedTime`). |
| Pyramid | `rangedCD` (base 45, mínimo 15) | El modo torreta dispara en cuanto el cooldown por frames llega a 0. |
| Summoner | `summonCD = 90` | En combate, sólo invoca si el cooldown en frames está a cero; se reduce con `simulationSpeed`. |
| Berserker | `invulnTimer = 12` (al alcanzar umbrales de vida) | La invulnerabilidad temporal se expresa en frames al dispararse el stack de ira. |
| Tank | `invulnTimer = 30 + 10·nivel` | Activa escudo cada cierto tiempo en segundos pero su duración es un contador en frames. |

## Notas
- Los contadores anteriores son sensibles a cambios de FPS porque se descuentan con `simulationSpeed` (delta * 60). Reescribirlos en segundos o usar `Time.delta`/`Time.elapsedTime` los haría frame-rate independientes.
- Otros gladiadores como `spinner` o `poison` ya usan segundos (`Time.elapsedTime`) para parte de su lógica, pero mantienen algunos timers en frames indicados en la tabla.
