# 🎮 Sistema de Game Engine - Quick Start

## ✅ Sistema Completado

Se ha implementado un **sistema de game engine robusto** inspirado en Godot/Unity con **100% compatibilidad** con el código existente.

## 📦 Nuevos Archivos Core

```
src/core/
├── Time.js           - Gestión unificada de tiempo y delta
├── EventBus.js       - Sistema de eventos pub/sub
├── Component.js      - Sistema de componentes reutilizables
├── StateMachine.js   - FSM para estados de gladiadores
└── GameEngine.js     - Motor central que coordina todo
```

## 🚀 Características Principales

### 1. **Time Management**
```javascript
import Time from './core/Time.js';

// Movimiento frame-independent
this.x += this.speed * Time.delta;

// Time scale (slow motion / fast forward)
Time.timeScale = 0.5; // Cámara lenta
```

### 2. **Event System**
```javascript
import EventBus, { GameEvents } from './core/EventBus.js';

// Suscribirse
EventBus.on(GameEvents.DAMAGE_DEALT, (data) => {
    console.log(`Daño: ${data.damage}`);
});

// Emitir
EventBus.emit(GameEvents.GLADIATOR_ABILITY_USED, { ... });
```

### 3. **Component System**
```javascript
import { Component } from './core/Component.js';

class MyComponent extends Component {
    _process(delta) {
        // Lógica cada frame
    }
}

gladiator.addComponent(new MyComponent());
```

### 4. **State Machine**
```javascript
// Cada gladiador tiene una state machine automática
gladiator.stateMachine.transitionTo('Attacking');

if (gladiator.stateMachine.isInState('Moving')) {
    // ...
}
```

### 5. **Lifecycle Hooks**
```javascript
class MyEntity extends Entity {
    _ready() {
        // Inicialización (una vez)
    }
    
    _process(delta) {
        // Cada frame (variable)
    }
    
    _physics_process(fixedDelta) {
        // Fixed update (60 FPS)
    }
    
    _exit_tree() {
        // Cleanup
    }
}
```

## 📖 Documentación Completa

Ver **[docs/game_engine_system.md](docs/game_engine_system.md)** para:
- Guía completa de cada sistema
- Ejemplos de código
- Buenas prácticas
- Referencia de API

## 🎯 Ejemplo de Uso

Ver **[src/gladiators/EXAMPLE_ADVANCED.js](src/gladiators/EXAMPLE_ADVANCED.js)** para un ejemplo completo de:
- Componentes custom (HealthRegen, Dash)
- Estados custom (Channeling)
- Uso de EventBus
- Habilidades complejas

## 🔧 Migración Gradual

El sistema es **100% compatible** con el código existente:
- ✅ Todos los gladiadores actuales funcionan sin cambios
- ✅ El loop antiguo sigue funcionando
- ✅ Puedes usar el nuevo sistema gradualmente

## 🎨 Próximos Pasos

Con este sistema puedes crear:
1. **Componentes reutilizables** (Shield, Teleport, etc)
2. **Estados complejos** (Charging, Berserking, etc)
3. **Sistemas de juego** (PowerUps, Weather, etc)
4. **Eventos custom** para mecánicas nuevas

## 📊 Estado del Sistema

✅ Time.js - Funcionando
✅ EventBus.js - Funcionando  
✅ Component.js - Funcionando  
✅ StateMachine.js - Funcionando  
✅ GameEngine.js - Funcionando  
✅ Entity.js - Refactorizado con nuevos hooks  
✅ Gladiator.js - Integrado con state machine  
✅ Loop.js - Integrado con GameEngine  
✅ main.js - Inicializa GameEngine  

## 🐛 Debug

```javascript
// Activar debug de eventos
EventBus.setDebugMode(true);

// Ver estado del engine
console.log(GameEngine.getState());

// Controlar tiempo
Time.timeScale = 0.1; // Super slow motion
```

## 💡 Tips

1. Usa `Time.delta` para todo el movimiento
2. Emite eventos para comunicar sistemas
3. Crea componentes pequeños y reutilizables
4. Usa la state machine para comportamiento complejo
5. Implementa `_ready()` para inicialización que necesita dependencias

---

**¡El sistema está listo para usar!** 🎉

Para empezar a crear gladiadores avanzados, mira el archivo de ejemplo y la documentación completa.