# Sistema de Movimiento para Gladiadores

## Descripción General

El sistema de movimiento proporciona una arquitectura modular y robusta para controlar el comportamiento de movimiento de los gladiadores. En lugar de tener toda la lógica de movimiento en la clase `Entity`, ahora se utiliza un patrón de **Estrategia** que permite cambiar dinámicamente entre diferentes tipos de movimiento.

## Arquitectura

### Componentes Principales

1. **MovementSystem.js** (`src/core/MovementSystem.js`)
   - Contiene todas las estrategias de movimiento
   - `BaseMovementStrategy`: Clase base con funcionalidad común
   - `AggressiveMovement`: Persigue activamente a los enemigos
   - `DefensiveMovement`: Huye de los enemigos con pathfinding inteligente
   - `PassiveMovement`: Movimiento no reactivo (orbit, idle, patrol, wander)
   - `MovementStrategyFactory`: Factory para crear estrategias

2. **Entity.js** (Modificado)
   - Delegación de movimiento a `movementStrategy`
   - Método `setMovementStrategy()` para cambiar estrategias
   - Mantiene compatibilidad con módulos existentes

3. **Gladiator.js** (Extendido)
   - Método `changeMovementStrategy()` para cambio dinámico
   - Inicialización automática desde módulo de gladiador
   - Callback `onMovementStrategyChange` para módulos

4. **config.js** (Extendido)
   - `MOVEMENT_CONFIG`: Configuración centralizada
   - Parámetros ajustables por tipo de estrategia

## Tipos de Estrategias

### 1. Aggressive Movement

**Uso:** Gladiadores que persiguen activamente a sus enemigos.

**Comportamiento:**
- Busca el enemigo más cercano cada frame (configurable)
- Acelera hacia el objetivo
- Aplica fricción gradualmente

**Configuración en config.js:**
```javascript
AGGRESSIVE: {
    seekInterval: 1,           // Frames entre búsquedas (1 = cada frame)
    seekAcceleration: 0.1,     // Aceleración hacia objetivo
    friction: 0.98,            // Fricción (0.98 = 2% pérdida/frame)
    wallBounceFactor: 1.1,     // Factor de rebote en paredes
    repelForce: 0.5            // Fuerza de repulsión en colisiones
}
```

**Gladiadores que la usan:**
- Tank (siempre agresivo)
- Berserker (extra agresivo con configuración custom)
- Hex (cuando HP > 60%)
- Poison (cuando no está huyendo)
- Bomber (cuando no está huyendo)
- Pyramid (cuando no está en modo turret)

### 2. Defensive Movement

**Uso:** Gladiadores que huyen de los enemigos con evasión inteligente.

**Comportamiento:**
- Huye del enemigo más cercano
- Usa raycast para evitar paredes (16 muestras por defecto)
- Detecta si está atascado y añade empuje perpendicular
- Velocidad variable según distancia del enemigo

**Configuración en config.js:**
```javascript
DEFENSIVE: {
    fleeThresholdClose: 120,   // Distancia "cerca" del enemigo
    fleeSpeedClose: 0.9,       // Multiplicador velocidad cuando cerca
    fleeSpeedFar: 0.55,        // Multiplicador velocidad cuando lejos
    fleeSamples: 16,           // Muestras para detección de paredes
    fleeCheckDistance: 40,     // Distancia de raycast
    fleeSpreadAngle: π/2,      // Ángulo de búsqueda (90°)
    stuckThreshold: 20         // Frames sin mover = atascado
}
```

**Gladiadores que la usan:**
- Archer (por defecto, cambia a aggressive en rango óptimo)
- Hex (cuando HP < 40%)
- Poison (después de aplicar poison)
- Bomber (después de recibir daño o aplicar bomba)

### 3. Passive Movement

**Uso:** Gladiadores con patrones de movimiento no reactivos a enemigos.

**Patrones disponibles:**

#### a) **Idle** (Estacionario)
- No se mueve activamente
- La fricción lo detiene gradualmente

**Uso:** Pyramid en modo turret

#### b) **Orbit** (Orbital)
- Orbita alrededor de un punto central
- Velocidad angular configurable
- Radio ajustable

**Uso:** Spinner

**Configuración:**
```javascript
PASSIVE: {
    pattern: 'orbit',
    orbitSpeed: 0.2,           // Velocidad angular (rad/frame)
    orbitRadius: 50,           // Radio de órbita
    orbitSpeedMultiplier: 1.0  // Multiplicador velocidad lineal
}
```

#### c) **Patrol** (Patrulla)
- Se mueve entre puntos predefinidos
- Cicla continuamente

#### d) **Wander** (Errático)
- Movimiento aleatorio suave
- Usa función seno para cambios graduales

## Uso en Módulos de Gladiadores

### Configuración Inicial

Define la estrategia por defecto en el módulo del gladiador:

```javascript
export default {
    key: 'mi_gladiador',
    name: 'Mi Gladiador',
    
    // Estrategia por defecto
    defaultMovementStrategy: 'aggressive',
    
    // Opciones adicionales (opcional)
    movementOptions: {
        pattern: 'orbit',  // Solo para passive
        config: {          // Configuración custom (override MOVEMENT_CONFIG)
            AGGRESSIVE: {
                seekInterval: 1,
                seekAcceleration: 0.15
            }
        }
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // Lógica del gladiador...
    }
}
```

### Cambio Dinámico de Estrategia

Cambia la estrategia durante el juego:

```javascript
// En el método update() del módulo
update(self, { entities, simulationSpeed }) {
    const hpPercent = self.hp / self.maxHp;
    
    // Cambiar a defensive cuando HP < 40%
    if (hpPercent < 0.4 && self.movementStrategy.name !== 'defensive') {
        self.changeMovementStrategy('defensive');
    }
    
    // Volver a aggressive cuando HP > 60%
    if (hpPercent > 0.6 && self.movementStrategy.name === 'defensive') {
        self.changeMovementStrategy('aggressive');
    }
}
```

### Override Manual de Movimiento

Para casos especiales, puedes override el movimiento manualmente:

```javascript
update(self, { entities, simulationSpeed }) {
    // Desactivar seek automático por este frame
    self.skipSeek = true;
    
    // Aplicar velocidad custom
    const angle = Math.atan2(target.y - self.y, target.x - self.x);
    self.vx = Math.cos(angle) * self.baseSpeed * 1.5;
    self.vy = Math.sin(angle) * self.baseSpeed * 1.5;
}
```

## Ejemplos de Implementación

### Ejemplo 1: Archer (Kiting Dinámico)

```javascript
defaultMovementStrategy: 'defensive',

update(self, { entities, simulationSpeed }) {
    const nearestEnemy = findNearestEnemy(entities, self);
    const dist = distance(self, nearestEnemy);
    
    // Muy cerca: Defensive flee
    if (dist < 70) {
        if (self.movementStrategy.name !== 'defensive') {
            self.changeMovementStrategy('defensive');
        }
    }
    // Rango óptimo (60-160): Mantener posición
    else if (dist >= 60 && dist <= 160) {
        self.skipSeek = true;
        self.vx *= 0.95;
        self.vy *= 0.95;
    }
    // Muy lejos: Aggressive approach
    else {
        if (self.movementStrategy.name !== 'aggressive') {
            self.changeMovementStrategy('aggressive');
        }
    }
}
```

### Ejemplo 2: Hex (Basado en HP)

```javascript
defaultMovementStrategy: 'aggressive',

update(self, { entities, simulationSpeed }) {
    const hpPercent = self.hp / self.maxHp;
    
    // Histéresis: 40% para entrar en flee, 60% para salir
    if (hpPercent < 0.4 && self.movementStrategy.name !== 'defensive') {
        self.changeMovementStrategy('defensive');
    }
    else if (hpPercent >= 0.6 && self.movementStrategy.name === 'defensive') {
        self.changeMovementStrategy('aggressive');
    }
}
```

### Ejemplo 3: Spinner (Orbital Constante)

```javascript
defaultMovementStrategy: 'passive',
movementOptions: {
    pattern: 'orbit',
    config: {
        PASSIVE: {
            pattern: 'orbit',
            orbitSpeed: 0.2,
            orbitRadius: 80,
            orbitSpeedMultiplier: 1.2,
            friction: 1.0
        }
    }
},

update(self) {
    if (!self._spinnerInit && self.movementStrategy.name === 'passive') {
        // Configurar centro de órbita
        self.movementStrategy.orbitCenter = { 
            x: STAGE_W / 2, 
            y: STAGE_H / 2 
        };
        
        // Ajustar velocidad por nivel
        self.movementStrategy.config.orbitSpeed = 0.2 + (self.level * 0.05);
        
        self._spinnerInit = true;
    }
}
```

## Compatibilidad con Sistema Antiguo

El sistema mantiene compatibilidad con los módulos existentes:

### Hooks Preservados

1. **getFriction(self)** - Override de fricción
2. **onWallBounce(self)** - Callback al rebotar con pared
3. **onCollisionRepel(self, other)** - Override de fuerza de repulsión
4. **onOutOfBounds(self)** - Prevenir muerte por ring-out

### Flags Preservados

- `self.skipSeek` - Desactivar seek por un frame
- `self.pyramidTurret` - Desactivar movimiento completamente
- `self.intentX/intentY` - Dirección deseada (debug)

## Ventajas del Nuevo Sistema

1. **Modularidad**: Lógica de movimiento separada y reutilizable
2. **Mantenibilidad**: Más fácil de debuggear y extender
3. **Flexibilidad**: Cambios dinámicos entre estrategias
4. **Configurabilidad**: Parámetros centralizados en config.js
5. **Limpieza**: Entity.js más simple y enfocado
6. **Extensibilidad**: Fácil agregar nuevas estrategias

## Debugging

El sistema preserva las variables de debug existentes:

- `self.intentX` y `self.intentY`: Dirección deseada de movimiento
- `self.intentVec`: Objeto legacy con {x, y}
- DebugRenderer muestra las flechas de intención en verde

## Próximos Pasos Potenciales

1. **Estrategia Híbrida**: Mezclar múltiples estrategias con pesos
2. **Formaciones**: Estrategia para movimiento en grupo
3. **Predictive**: Predecir posición futura del enemigo
4. **Strafe**: Movimiento lateral manteniendo vista al objetivo
5. **Territory**: Defender áreas específicas del mapa

## Notas de Rendimiento

- El sistema está optimizado para 60 FPS
- `seekInterval` permite reducir frecuencia de búsqueda si es necesario
- Raycast de flee usa 16 muestras (configurable)
- No hay impacto perceptible en rendimiento vs sistema anterior

---

**Autor:** Sistema de Movimiento Gladiadores v1.0  
**Fecha:** Diciembre 2025  
**Archivos relacionados:**
- `src/core/MovementSystem.js`
- `src/entities/Entity.js`
- `src/gladiators/Gladiator.js`
- `src/config.js` (MOVEMENT_CONFIG)
