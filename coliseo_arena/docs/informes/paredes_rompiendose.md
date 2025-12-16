# Paredes rompiéndose con el choque equivocado

## Regla de diseño
- Salir por la pared implica eliminación inmediata: la pared no debería romperse por un movimiento normal ni por chocar rápido (ej. Speed).
- La pared solo debería recibir daño cuando un gladiador empuja a otro contra ella; el golpe debería afectar tanto al gladiador empujado como a la pared hasta romperla tras varios impactos.

## Dónde está mal

1) **Daño a la pared al chocar uno mismo**  
   - El movimiento legacy todavía reduce vida a la pared al detectar que la celda actual es `TYPE.WALL`, sin comprobar si el daño proviene de empujar a otro.  
   - Esto permite que un gladiador que llega solo a la pared (o rebota en ella por velocidad) quite vida y termine rompiéndola, contradiciendo la regla de “salir por pared = eliminado”.

2) **Falta de lógica de empuje contra pared**  
   - El sistema de movimiento vigente (`MovementSystem.handleWallCollisions`) solo clampea la posición y aplica un rebote suave; no transfiere daño a la pared ni al gladiador empujado cuando alguien es arrinconado.  
   - Tampoco se registra ningún punto de entrada donde, tras resolver una colisión entre gladiadores, se evalúe si el impacto contra la pared debe descontar vida de ambos y degradar la pared en varios golpes.

## Por qué ocurre
- `Entity.legacyMove` sigue llamando a `damageWall` cuando el propio gladiador pisa una celda `TYPE.WALL` y rebota. No hay verificación de empuje ni de origen del daño, así que cualquier choque directo decrementa la vida de la pared.  
- El flujo principal de movimiento usa `MovementSystem.handleWallCollisions`, que únicamente rebota al gladiador y no contempla daño a la pared ni al objetivo empujado. Por eso el comportamiento correcto (daño solo al empujar a otro contra la pared) no existe en el código actual.
