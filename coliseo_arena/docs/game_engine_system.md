# Sistema de Game Engine - Documentación

## 🎮 Resumen

Se ha implementado un **sistema de game engine robusto** inspirado en **Godot** y **Unity**, manteniendo **100% de compatibilidad** con el código existente. El nuevo sistema proporciona:

- ✅ **Lifecycle Hooks** claros (`_ready()`, `_process()`, `_physics_process()`, `_exit_tree()`)
- ✅ **Time Management** unificado con delta time consistente
- ✅ **Event Bus** para comunicación desacoplada
- ✅ **Component System** para lógica reutilizable (opcional)
- ✅ **State Machine** para estados de gladiadores (Idle, Moving, Attacking, Stunned, Dead)
- ✅ **GameEngine** centralizado que coordina todo

---

## 📁 Nuevos Archivos Core

### 1. **Time.js** - Gestión de Tiempo
**Ubicación:** `src/core/Time.js`

Singleton que centraliza todo el timing del juego.

#### Propiedades principales:
```javascript
import Time from './core/Time.js';

Time.delta          // Delta time del último frame (escalado, en segundos)
Time.unscaledDelta  // Delta sin escalar
Time.fixedDelta     // Delta fijo para física (1/60)
Time.timeScale      // Multiplicador de velocidad (1 = normal, 0.5 = slow-mo)
Time.frameCount     // Frames totales
Time.elapsedTime    // Tiempo total en segundos
Time.fps            // FPS promedio
```

#### Ejemplo de uso:
```javascript
// En un componente o entidad
_process(delta) {
    this.x += this.speed * Time.delta; // Movimiento frame-rate independent
    
    if (Time.elapsedTime > 60) {
        console.log("Han pasado 60 segundos!");
    }
}
```

---

### 2. **EventBus.js** - Sistema de Eventos
**Ubicación:** `src/core/EventBus.js`

Sistema pub/sub para desacoplar comunicación entre sistemas.

#### Eventos predefinidos (`GameEvents`):
```javascript
// Lifecycle
GAME_READY, GAME_START, GAME_PAUSE, GAME_RESUME, GAME_RESTART, GAME_OVER

// Entidades
ENTITY_SPAWNED, ENTITY_DESTROYED, ENTITY_COLLISION

// Combate
DAMAGE_DEALT, DAMAGE_RECEIVED, ENTITY_DIED, ENTITY_HEALED

// Gladiador
GLADIATOR_LEVEL_UP, GLADIATOR_ABILITY_USED, GLADIATOR_STATE_CHANGED, GLADIATOR_STRATEGY_CHANGED

// Proyectiles
PROJECTILE_SPAWNED, PROJECTILE_HIT, PROJECTILE_DESTROYED

// UI/Sistema
FLOATING_TEXT_SPAWNED, SCREEN_SHAKE, SUDDEN_DEATH_START
```

#### Ejemplo de uso:
```javascript
import EventBus, { GameEvents } from './core/EventBus.js';

// Suscribirse a un evento
const unsubscribe = EventBus.on(GameEvents.DAMAGE_DEALT, (data) => {
    console.log(`${data.attacker.className} hizo ${data.damage} de daño!`);
});

// Emitir evento
EventBus.emit(GameEvents.GLADIATOR_ABILITY_USED, {
    gladiator: this,
    abilityName: 'Arrow Shot'
});

// Desuscribirse
unsubscribe();
```

---

### 3. **Component.js** - Sistema de Componentes
**Ubicación:** `src/core/Component.js`

Sistema estilo Unity para adjuntar comportamientos reutilizables a entidades.

#### Crear un componente personalizado:
```javascript
import { Component } from './core/Component.js';

class HealthRegenComponent extends Component {
    constructor(regenRate = 5) {
        super();
        this.regenRate = regenRate;
    }
    
    _ready() {
        console.log('Componente de regeneración inicializado');
    }
    
    _process(delta) {
        if (this.entity.hp < this.entity.maxHp) {
            this.entity.hp += this.regenRate * delta;
            this.entity.hp = Math.min(this.entity.hp, this.entity.maxHp);
        }
    }
}

// Usar en una entidad
const gladiator = new Gladiator(...);
gladiator.addComponent(new HealthRegenComponent(10));

// Obtener componente
const regen = gladiator.getComponent(HealthRegenComponent);
if (regen) {
    regen.regenRate = 20; // Modificar rate
}
```

---

### 4. **StateMachine.js** - Máquina de Estados
**Ubicación:** `src/core/StateMachine.js`

FSM (Finite State Machine) para gestionar estados de gladiadores.

#### Estados predefinidos para gladiadores:
- **IdleState** - En reposo
- **MovingState** - Moviéndose hacia enemigos
- **AttackingState** - Ejecutando ataque
- **StunnedState** - Aturdido (no puede actuar)
- **DeadState** - Muerto

#### Transiciones automáticas:
```
Idle → Moving (detecta enemigos)
Moving → Attacking (colisiona con enemigo)
Attacking → Moving (después de 0.3s)
Moving → Idle (no hay enemigos)
* → Stunned (al recibir stun)
Stunned → Moving (después de X segundos)
* → Dead (hp <= 0)
```

#### Crear estado personalizado:
```javascript
import { State } from './core/StateMachine.js';

class ChargingState extends State {
    constructor() {
        super('Charging');
        this.chargeTime = 0;
    }
    
    enter(previousState) {
        console.log('Comenzando carga...');
        this.chargeTime = 0;
        this.owner.vx = 0;
        this.owner.vy = 0;
    }
    
    update(delta) {
        this.chargeTime += delta;
        // Efecto visual de carga
    }
    
    checkTransitions() {
        if (this.chargeTime >= 2) {
            return 'Attacking'; // Transicionar a ataque después de 2s
        }
        return null;
    }
    
    exit(nextState) {
        console.log('Carga completa!');
    }
}

// Añadir al gladiator
gladiator.stateMachine.addState(new ChargingState());
gladiator.stateMachine.transitionTo('Charging');
```

---

### 5. **GameEngine.js** - Motor Central
**Ubicación:** `src/core/GameEngine.js`

Singleton que coordina todo el ciclo de vida del juego.

#### Métodos principales:
```javascript
import GameEngine from './core/GameEngine.js';

// Inicialización (ya se hace en main.js)
GameEngine.initialize(config, grid, ctx);

// Gestión de entidades
GameEngine.addEntity(entity);
GameEngine.removeEntity(entity);

// Control de juego
GameEngine.pause();
GameEngine.resume();
GameEngine.restart();
GameEngine.gameOver(winner);

// Registrar callbacks
GameEngine.on('onReady', (engine) => {
    console.log('Juego inicializado!');
});

GameEngine.on('onProcess', (delta, engine) => {
    // Lógica custom cada frame
});

// Registrar sistemas personalizados
GameEngine.registerSystem('mySystem', {
    init(engine) { /* setup */ },
    process(delta, engine) { /* cada frame */ },
    physicsProcess(fixedDelta, engine) { /* fixed update */ }
});

// Estado del engine
const state = GameEngine.getState();
console.log(`FPS: ${state.fps}, Entidades: ${state.entityCount}`);
```

---

## 🔧 Cambios en Entidades

### Entity.js - Nuevos Lifecycle Hooks

Todas las entidades ahora tienen estos métodos:

```javascript
class MyCustomEntity extends Entity {
    // Llamado una vez cuando la entidad entra al juego
    _ready() {
        console.log('Entidad lista!');
        // Inicialización que requiere que grid/ctx estén disponibles
    }
    
    // Llamado cada frame (variable delta time)
    _process(delta) {
        // Actualización visual, input, etc
        this.rotation += 180 * delta; // Rotar 180° por segundo
    }
    
    // Llamado cada fixed update (60 FPS fijo)
    _physics_process(fixedDelta) {
        // Física, movimiento, colisiones
        this.applyGravity(fixedDelta);
    }
    
    // Llamado cuando la entidad sale del juego
    _exit_tree() {
        // Cleanup, desuscribir eventos, etc
        this.cleanup();
    }
}
```

### Gladiator.js - State Machine Integrado

Todos los gladiadores ahora tienen una state machine automática:

```javascript
const gladiator = new Gladiator(...);

// Acceder a la state machine
console.log(gladiator.stateMachine.getCurrentStateName()); // "Moving"

// Cambiar estado manualmente
gladiator.stateMachine.transitionTo('Stunned');

// Verificar estado
if (gladiator.stateMachine.isInState('Attacking')) {
    console.log('¡Está atacando!');
}

// Escuchar cambios de estado
EventBus.on('state:changed', (data) => {
    console.log(`${data.owner.className}: ${data.previous} → ${data.current}`);
});
```

---

## 📝 Ejemplo Completo: Crear un Gladiador Custom

```javascript
// En src/gladiators/mygladiator/index.js
import { State } from '../../core/StateMachine.js';
import { Component } from '../../core/Component.js';
import EventBus, { GameEvents } from '../../core/EventBus.js';

// ===== COMPONENTE CUSTOM =====
class ShieldComponent extends Component {
    constructor() {
        super();
        this.shieldActive = false;
        this.cooldown = 0;
    }
    
    _process(delta) {
        if (this.cooldown > 0) {
            this.cooldown -= delta;
        }
        
        if (this.entity.hp < this.entity.maxHp * 0.3 && this.cooldown <= 0) {
            this.activateShield();
        }
    }
    
    activateShield() {
        this.shieldActive = true;
        this.entity.invulnerable = true;
        this.cooldown = 10; // 10 segundos
        
        setTimeout(() => {
            this.shieldActive = false;
            this.entity.invulnerable = false;
        }, 3000); // 3 segundos de duración
        
        EventBus.emit(GameEvents.GLADIATOR_ABILITY_USED, {
            gladiator: this.entity,
            abilityName: 'Shield'
        });
    }
}

// ===== ESTADO CUSTOM =====
class BerserkState extends State {
    constructor() {
        super('Berserk');
    }
    
    enter() {
        this.owner.baseSpeed *= 2;
        console.log('¡MODO BERSERK!');
    }
    
    update(delta) {
        // Daño a todos los enemigos cercanos
        const nearbyEnemies = this.owner.lastContext.entities.filter(e => 
            e.team !== this.owner.team && 
            Math.hypot(e.x - this.owner.x, e.y - this.owner.y) < 30
        );
        
        nearbyEnemies.forEach(e => e.takeDamage(10 * delta, this.owner, []));
    }
    
    checkTransitions() {
        if (this.owner.hp > this.owner.maxHp * 0.5) {
            return 'Moving'; // Salir de berserk si recupera HP
        }
        return null;
    }
    
    exit() {
        this.owner.baseSpeed /= 2;
    }
}

// ===== MÓDULO DEL GLADIADOR =====
export default {
    key: 'mygladiator',
    name: 'My Custom Gladiator',
    defaultMovementStrategy: 'aggressive',
    
    onInit(self) {
        // Añadir componente de escudo
        self.addComponent(new ShieldComponent());
        
        // Añadir estado de berserk a la state machine
        self.stateMachine.addState(new BerserkState());
        
        // Suscribirse a evento de daño
        EventBus.on(GameEvents.DAMAGE_RECEIVED, (data) => {
            if (data.target === self && self.hp < self.maxHp * 0.3) {
                // Entrar en modo berserk si HP < 30%
                self.stateMachine.transitionTo('Berserk');
            }
        });
    },
    
    update(gladiator, context) {
        // Lógica de habilidades (se ejecuta cada ~100ms)
        if (gladiator.cooldown <= 0) {
            // Disparar proyectil, etc
        }
    },
    
    onCombat(self, enemy, context) {
        // Al golpear a un enemigo
        if (Math.random() < 0.2) {
            enemy.stunDuration = 1; // Stun de 1 segundo
            enemy.stateMachine.transitionTo('Stunned');
        }
    }
};
```

---

## 🎯 Buenas Prácticas

### ✅ DO:
- Usar `Time.delta` para movimiento frame-independent
- Emitir eventos para comunicación entre sistemas
- Crear componentes pequeños y reutilizables
- Usar state machine para comportamiento complejo
- Implementar `_ready()` para inicialización que requiere dependencias

### ❌ DON'T:
- No usar `performance.now()` directamente, usar `Time.elapsedTime`
- No hacer `entity.hp -= 5` sin `Time.delta`, usar `entity.hp -= 5 * Time.delta`
- No acceder a arrays globales (`window.entities`), usar `GameEngine.entities`
- No crear timers con `setTimeout` para lógica de juego, usar `Time.delta`

---

## 🔍 Debug y Testing

### EventBus Debug Mode
```javascript
import EventBus from './core/EventBus.js';

// Activar logs de eventos
EventBus.setDebugMode(true);

// Ver historial de eventos
console.log(EventBus.getHistory('DAMAGE_DEALT'));

// Ver estadísticas de listeners
console.log(EventBus.getStats());
```

### GameEngine State
```javascript
import GameEngine from './core/GameEngine.js';

// Ver estado del engine
const state = GameEngine.getState();
console.table(state);

// Pausar/reanudar
GameEngine.pause();
setTimeout(() => GameEngine.resume(), 2000);

// Time scale (slow motion/fast forward)
Time.timeScale = 0.5; // Slow motion
Time.timeScale = 2.0; // Fast forward
Time.timeScale = 1.0; // Normal
```

---

## 🚀 Próximos Pasos

El sistema ahora está listo para:

1. **Gladiadores más complejos** con múltiples estados custom
2. **Componentes reutilizables** (HealthRegen, Dash, Shield, etc)
3. **Sistemas de juego** (PowerUp system, Weather system, etc)
4. **Networking** (el EventBus facilita sincronizar eventos)
5. **Replay system** (guardar eventos del EventBus)
6. **AI mejorada** (usar state machine para comportamiento más rico)

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Update** | `update(entities, speed, texts, check)` | `_process(delta)` + `_physics_process(delta)` |
| **Timing** | `simulationSpeed * 60` manual | `Time.delta` automático |
| **Eventos** | Callbacks directos / globals | `EventBus` desacoplado |
| **Estados** | Flags booleanos (`isAttacking`) | `StateMachine` con transiciones |
| **Componentes** | Todo en Entity | Sistema de componentes modular |
| **Init** | En constructor + `onInit` | `_ready()` hook claro |
| **Cleanup** | Manual | `_exit_tree()` automático |

---

## 🎓 Recursos de Aprendizaje

**Godot Docs (equivalencias):**
- `_ready()` → https://docs.godotengine.org/en/stable/tutorials/scripting/overridable_functions.html
- `_process()` → Variable delta time loop
- `_physics_process()` → Fixed timestep physics

**Unity Docs (equivalencias):**
- `Awake()` → `constructor()`
- `Start()` → `_ready()`
- `Update()` → `_process(delta)`
- `FixedUpdate()` → `_physics_process(fixedDelta)`
- `OnDestroy()` → `_exit_tree()`

---

**¡El sistema está completamente funcional y listo para expandir!** 🎉