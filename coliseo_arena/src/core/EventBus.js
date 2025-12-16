/**
 * EventBus.js - Sistema de eventos pub/sub para desacoplar comunicación
 * Inspirado en el sistema de señales de Godot y eventos de Unity
 */

class EventBusManager {
    constructor() {
        if (EventBusManager.instance) {
            return EventBusManager.instance;
        }
        
        // Map de eventos: { eventName: Set([callbacks]) }
        this._listeners = new Map();
        
        // Tracking para debug
        this._eventHistory = [];
        this._maxHistorySize = 100;
        this._debugMode = false;
        
        EventBusManager.instance = this;
    }
    
    /**
     * Suscribirse a un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Función a llamar cuando se emita el evento
     * @param {Object} context - Contexto (this) para el callback
     * @returns {Function} Función para desuscribirse
     */
    on(eventName, callback, context = null) {
        if (typeof callback !== 'function') {
            console.error(`EventBus: callback debe ser una función para el evento "${eventName}"`);
            return () => {};
        }
        
        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, new Set());
        }
        
        const wrappedCallback = context ? callback.bind(context) : callback;
        wrappedCallback._original = callback; // Para poder identificarlo al desuscribir
        wrappedCallback._context = context;
        
        this._listeners.get(eventName).add(wrappedCallback);
        
        if (this._debugMode) {
            console.log(`EventBus: Listener añadido para "${eventName}"`, context);
        }
        
        // Retornar función para desuscribirse fácilmente
        return () => this.off(eventName, callback, context);
    }
    
    /**
     * Suscribirse a un evento solo una vez
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Función a llamar
     * @param {Object} context - Contexto (this) para el callback
     * @returns {Function} Función para desuscribirse
     */
    once(eventName, callback, context = null) {
        const wrappedCallback = (...args) => {
            this.off(eventName, wrappedCallback);
            callback.apply(context, args);
        };
        
        return this.on(eventName, wrappedCallback);
    }
    
    /**
     * Desuscribirse de un evento
     * @param {string} eventName - Nombre del evento
     * @param {Function} callback - Callback específico a remover (opcional, remueve todos si no se especifica)
     * @param {Object} context - Contexto específico (opcional)
     */
    off(eventName, callback = null, context = null) {
        if (!this._listeners.has(eventName)) {
            return;
        }
        
        const listeners = this._listeners.get(eventName);
        
        // Si no se especifica callback, remover todos
        if (!callback) {
            listeners.clear();
            if (this._debugMode) {
                console.log(`EventBus: Todos los listeners removidos para "${eventName}"`);
            }
            return;
        }
        
        // Remover callbacks específicos
        for (const wrappedCallback of listeners) {
            if (wrappedCallback._original === callback && 
                (context === null || wrappedCallback._context === context)) {
                listeners.delete(wrappedCallback);
                if (this._debugMode) {
                    console.log(`EventBus: Listener removido para "${eventName}"`, context);
                }
            }
        }
        
        // Limpiar si no quedan listeners
        if (listeners.size === 0) {
            this._listeners.delete(eventName);
        }
    }
    
    /**
     * Emitir un evento
     * @param {string} eventName - Nombre del evento
     * @param {*} data - Datos a pasar a los listeners
     */
    emit(eventName, data = null) {
        // Logging para debug
        if (this._debugMode) {
            console.log(`EventBus: Emitiendo "${eventName}"`, data);
        }
        
        // Agregar a historial
        this._eventHistory.push({
            name: eventName,
            data: data,
            timestamp: Date.now()
        });
        
        if (this._eventHistory.length > this._maxHistorySize) {
            this._eventHistory.shift();
        }
        
        // No hay listeners
        if (!this._listeners.has(eventName)) {
            return;
        }
        
        // Llamar a todos los listeners
        const listeners = Array.from(this._listeners.get(eventName));
        for (const callback of listeners) {
            try {
                callback(data);
            } catch (error) {
                console.error(`EventBus: Error en listener de "${eventName}":`, error);
            }
        }
    }
    
    /**
     * Verificar si hay listeners para un evento
     * @param {string} eventName - Nombre del evento
     * @returns {boolean}
     */
    has(eventName) {
        return this._listeners.has(eventName) && this._listeners.get(eventName).size > 0;
    }
    
    /**
     * Obtener cantidad de listeners para un evento
     * @param {string} eventName - Nombre del evento
     * @returns {number}
     */
    listenerCount(eventName) {
        return this._listeners.has(eventName) ? this._listeners.get(eventName).size : 0;
    }
    
    /**
     * Limpiar todos los listeners
     */
    clear() {
        this._listeners.clear();
        this._eventHistory = [];
        if (this._debugMode) {
            console.log('EventBus: Todos los listeners limpiados');
        }
    }
    
    /**
     * Activar/desactivar modo debug
     */
    setDebugMode(enabled) {
        this._debugMode = enabled;
    }
    
    /**
     * Obtener historial de eventos (para debugging)
     */
    getHistory(eventName = null) {
        if (eventName) {
            return this._eventHistory.filter(e => e.name === eventName);
        }
        return [...this._eventHistory];
    }
    
    /**
     * Obtener estadísticas de listeners
     */
    getStats() {
        const stats = {};
        for (const [eventName, listeners] of this._listeners.entries()) {
            stats[eventName] = listeners.size;
        }
        return stats;
    }
}

// Crear instancia singleton
const EventBus = new EventBusManager();

// No congelar el objeto porque necesita modificar sus propiedades internas
// El patrón singleton ya previene crear múltiples instancias

// Eventos predefinidos del juego (constantes para evitar typos)
export const GameEvents = {
    // Lifecycle del juego
    GAME_READY: 'game:ready',
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_RESTART: 'game:restart',
    GAME_OVER: 'game:over',
    
    // Entidades
    ENTITY_SPAWNED: 'entity:spawned',
    ENTITY_DESTROYED: 'entity:destroyed',
    ENTITY_COLLISION: 'entity:collision',
    
    // Combate
    DAMAGE_DEALT: 'combat:damage_dealt',
    DAMAGE_RECEIVED: 'combat:damage_received',
    ENTITY_DIED: 'combat:entity_died',
    ENTITY_HEALED: 'combat:entity_healed',
    
    // Gladiador
    GLADIATOR_LEVEL_UP: 'gladiator:level_up',
    GLADIATOR_ABILITY_USED: 'gladiator:ability_used',
    GLADIATOR_STATE_CHANGED: 'gladiator:state_changed',
    GLADIATOR_STRATEGY_CHANGED: 'gladiator:strategy_changed',
    
    // Proyectiles
    PROJECTILE_SPAWNED: 'projectile:spawned',
    PROJECTILE_HIT: 'projectile:hit',
    PROJECTILE_DESTROYED: 'projectile:destroyed',
    
    // UI/Visual
    FLOATING_TEXT_SPAWNED: 'ui:floating_text',
    SCREEN_SHAKE: 'ui:screen_shake',
    
    // Sistema
    SUDDEN_DEATH_START: 'system:sudden_death_start',
};

export default EventBus;