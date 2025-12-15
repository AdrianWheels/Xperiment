# coliseo_arena

Herramientas y experimentos para la arena de gladiadores geométricos.

## Testing de DPS

Se añadió un dummy de entrenamiento y un sistema de pruebas automatizado para medir el daño por segundo (DPS) de cada clase contra un objetivo estático, reutilizando la misma lógica de físicas y colisiones del juego.

Para ejecutar las pruebas desde la raíz del proyecto:

```bash
node --test coliseo_arena/test/dps.test.js
```
