/**
 * StateMachine.js - Sistema de máquina de estados finitos
 * Implementación estilo Godot AnimationStateMachine y Unity Animator
 */

import EventBus from './EventBus.js';
import Time from './Time.js';

/**
 * Clase base para un estado individual
 */
export class State {
    constructor(name) {
        /** @type {string} Nombre del estado */
        this.name = name;
        
        /** @type {StateMachine} Referencia a la máquina de estados */
        this.stateMachine = null;
        
        /** @type {*} Referencia al owner (ej: gladiator) */
        this.owner = null;
    }
    
    /**
     * Llamado cuando se entra al estado
     * @param {*} previousState - Estado anterior
     */
    enter(previousState = null) {
        // Override en subclases
    }
    
    /**
     * Llamado cada frame mientras está activo
     * @param {number} delta - Delta time en segundos
     */
    update(delta) {
        // Override en subclases
    }
    
    /**
     * Llamado en fixed update mientras está activo
     * @param {number} fixedDelta - Fixed delta time
     */
    physicsUpdate(fixedDelta) {
        // Override en subclases
    }
    
    /**
     * Llamado cuando se sale del estado
     * @param {*} nextState - Siguiente estado
     */
    exit(nextState = null) {
        // Override en subclases
    }
    
    /**
     * Verificar condiciones de transición
     * @returns {string|null} Nombre del estado al que transicionar, o null
     */
    checkTransitions() {
        // Override en subclases
        return null;
    }
}

/**
 * Máquina de estados finitos
 */
export class StateMachine {
    constructor(owner = null) {
        /** @type {*} Dueño de la state machine (ej: gladiator) */
        this.owner = owner;
        
        /** @type {Map<string, State>} Estados disponibles */
        this.states = new Map();
        
        /** @type {State} Estado actual */
        this.currentState = null;
        
        /** @type {State} Estado anterior */
        this.previousState = null;
        
        /** @type {string} Nombre del estado inicial */
        this.initialStateName = null;
        
        /** @type {boolean} Si la state machine está activa */
        this.enabled = true;
        
        /** @type {number} Tiempo en el estado actual */
        this.timeInState = 0;
        
        /** @type {boolean} Si se debe chequear transiciones automáticas */
        this.autoTransitions = true;
    }
    
    /**
     * Añadir un estado
     * @param {State} state - Estado a añadir
     * @param {boolean} isInitial - Si es el estado inicial
     * @returns {StateMachine} this para chaining
     */
    addState(state, isInitial = false) {
        if (!(state instanceof State)) {
            console.error('StateMachine: Solo se pueden añadir instancias de State');
            return this;
        }
        
        state.stateMachine = this;
        state.owner = this.owner;
        this.states.set(state.name, state);
        
        if (isInitial || this.states.size === 1) {
            this.initialStateName = state.name;
        }
        
        return this;
    }
    
    /**
     * Obtener un estado por nombre
     * @param {string} stateName
     * @returns {State|null}
     */
    getState(stateName) {
        return this.states.get(stateName) || null;
    }
    
    /**
     * Iniciar la state machine (transiciona al estado inicial)
     */
    start() {
        if (!this.initialStateName) {
            console.error('StateMachine: No hay estado inicial definido');
            return;
        }
        
        this.transitionTo(this.initialStateName);
    }
    
    /**
     * Transicionar a un nuevo estado
     * @param {string} stateName - Nombre del estado destino
     * @param {boolean} force - Forzar transición aunque sea el mismo estado
     * @returns {boolean} true si la transición fue exitosa
     */
    transitionTo(stateName, force = false) {
        const nextState = this.states.get(stateName);
        
        if (!nextState) {
            console.warn(`StateMachine: Estado "${stateName}" no encontrado`);
            return false;
        }
        
        // Si ya estamos en ese estado y no forzamos, ignorar
        if (this.currentState === nextState && !force) {
            return false;
        }
        
        // Exit del estado anterior
        if (this.currentState) {
            this.currentState.exit(nextState);
        }
        
        // Cambiar estado
        this.previousState = this.currentState;
        this.currentState = nextState;
        this.timeInState = 0;
        
        // Enter del nuevo estado
        this.currentState.enter(this.previousState);
        
        // Emitir evento
        if (this.owner) {
            EventBus.emit('state:changed', {
                owner: this.owner,
                previous: this.previousState?.name || null,
                current: this.currentState.name,
                timestamp: Time.elapsedTime
            });
        }
        
        return true;
    }
    
    /**
     * Actualizar la state machine
     * @param {number} delta - Delta time
     */
    update(delta) {
        if (!this.enabled || !this.currentState) return;
        
        this.timeInState += delta;
        
        // Update del estado actual
        this.currentState.update(delta);
        
        // Chequear transiciones automáticas
        if (this.autoTransitions) {
            const nextStateName = this.currentState.checkTransitions();
            if (nextStateName) {
                this.transitionTo(nextStateName);
            }
        }
    }
    
    /**
     * Physics update de la state machine
     * @param {number} fixedDelta - Fixed delta time
     */
    physicsUpdate(fixedDelta) {
        if (!this.enabled || !this.currentState) return;
        
        this.currentState.physicsUpdate(fixedDelta);
    }
    
    /**
     * Verificar si está en un estado específico
     * @param {string} stateName
     * @returns {boolean}
     */
    isInState(stateName) {
        return this.currentState && this.currentState.name === stateName;
    }
    
    /**
     * Obtener nombre del estado actual
     * @returns {string|null}
     */
    getCurrentStateName() {
        return this.currentState ? this.currentState.name : null;
    }
    
    /**
     * Reiniciar al estado inicial
     */
    reset() {
        this.timeInState = 0;
        if (this.initialStateName) {
            this.transitionTo(this.initialStateName, true);
        }
    }
    
    /**
     * Limpiar la state machine
     */
    destroy() {
        if (this.currentState) {
            this.currentState.exit(null);
        }
        this.states.clear();
        this.currentState = null;
        this.previousState = null;
        this.owner = null;
    }
}

/**
 * Estados predefinidos comunes para gladiadores
 */

export class IdleState extends State {
    constructor() {
        super('Idle');
    }
    
    enter(previousState) {
        // Gladiador en reposo
        if (this.owner) {
            this.owner.isAttacking = false;
        }
    }
    
    update(delta) {
        // Auto-transición si detecta enemigos
    }
    
    checkTransitions() {
        if (!this.owner) return null;
        
        // Si hay enemigos cerca, pasar a Moving
        const context = this.owner.lastContext;
        if (context && context.entities) {
            const enemies = context.entities.filter(e => 
                e !== this.owner && 
                e.team !== this.owner.team && 
                e.hp > 0
            );
            
            if (enemies.length > 0) {
                return 'Moving';
            }
        }
        
        return null;
    }
}

export class MovingState extends State {
    constructor() {
        super('Moving');
    }
    
    enter(previousState) {
        if (this.owner) {
            this.owner.isAttacking = false;
        }
    }
    
    update(delta) {
        // Movimiento manejado por MovementSystem
    }
    
    checkTransitions() {
        if (!this.owner) return null;
        
        // Si está atacando, pasar a Attacking
        if (this.owner.isAttacking) {
            return 'Attacking';
        }
        
        // Si no hay enemigos y está quieto, volver a Idle
        const context = this.owner.lastContext;
        if (context && context.entities) {
            const enemies = context.entities.filter(e => 
                e !== this.owner && 
                e.team !== this.owner.team && 
                e.hp > 0
            );
            
            if (enemies.length === 0 && Math.abs(this.owner.vx) < 0.1 && Math.abs(this.owner.vy) < 0.1) {
                return 'Idle';
            }
        }
        
        return null;
    }
}

export class AttackingState extends State {
    constructor() {
        super('Attacking');
        this.attackDuration = 0.3; // Duración del estado de ataque
    }
    
    enter(previousState) {
        // Marcar que está atacando
    }
    
    update(delta) {
        // Después de un tiempo corto, volver a moverse
    }
    
    checkTransitions() {
        if (!this.owner) return null;
        
        // Volver a Moving después de un tiempo
        if (this.stateMachine.timeInState > this.attackDuration) {
            return 'Moving';
        }
        
        return null;
    }
}

export class StunnedState extends State {
    constructor() {
        super('Stunned');
    }
    
    enter(previousState) {
        if (this.owner) {
            // Detener movimiento
            this.owner.vx = 0;
            this.owner.vy = 0;
            this.owner.isAttacking = false;
        }
    }
    
    update(delta) {
        // No puede moverse ni atacar
    }
    
    checkTransitions() {
        // Debe ser removido externamente (ej: después de X segundos)
        if (this.owner && this.owner.stunDuration !== undefined) {
            this.owner.stunDuration -= Time.delta;
            if (this.owner.stunDuration <= 0) {
                delete this.owner.stunDuration;
                return 'Moving';
            }
        }
        return null;
    }
    
    exit(nextState) {
        // Limpiar efecto de stun
        if (this.owner) {
            delete this.owner.stunDuration;
        }
    }
}

export class DeadState extends State {
    constructor() {
        super('Dead');
    }
    
    enter(previousState) {
        if (this.owner) {
            this.owner.vx = 0;
            this.owner.vy = 0;
            this.owner.isAttacking = false;
        }
    }
    
    update(delta) {
        // Animación de muerte, fade out, etc
    }
    
    checkTransitions() {
        // Estado final, no hay transiciones
        return null;
    }
}

/**
 * Factory para crear state machines comunes
 */
export class StateMachineFactory {
    /**
     * Crear una state machine básica para gladiadores
     * @param {*} owner - Dueño de la state machine
     * @returns {StateMachine}
     */
    static createGladiatorStateMachine(owner) {
        const sm = new StateMachine(owner);
        
        sm.addState(new IdleState(), true);
        sm.addState(new MovingState());
        sm.addState(new AttackingState());
        sm.addState(new StunnedState());
        sm.addState(new DeadState());
        
        return sm;
    }
}

export default StateMachine;