/**
 * GameEngine.js - Motor central del juego estilo Godot/Unity
 * Gestiona el ciclo de vida completo del juego con lifecycle hooks claros
 */

import Time from './Time.js';
import EventBus, { GameEvents } from './EventBus.js';

/**
 * Motor principal del juego
 * Singleton que coordina todo el ciclo de vida del juego
 */
class GameEngineCore {
    constructor() {
        if (GameEngineCore.instance) {
            return GameEngineCore.instance;
        }
        
        /** @type {Array} Lista de entidades en el juego */
        this.entities = [];
        
        /** @type {Array} Lista de proyectiles */
        this.projectiles = [];
        
        /** @type {Array} Lista de textos flotantes */
        this.floatingTexts = [];
        
        /** @type {Grid} Referencia al grid del juego */
        this.grid = null;
        
        /** @type {Object} Referencia al contexto del canvas */
        this.ctx = null;
        
        /** @type {Object} Configuración del juego */
        this.config = {};
        
        /** @type {boolean} Si el engine está inicializado */
        this._isReady = false;
        
        /** @type {boolean} Si el engine está pausado */
        this._isPaused = false;
        
        /** @type {boolean} Si el juego ha terminado */
        this._isGameOver = false;
        
        /** @type {number} Acumulador para fixed timestep */
        this._accumulator = 0;
        
        /** @type {number} Máximo acumulador para evitar spiral of death */
        this._maxAccumulator = 0.25;
        
        /** @type {Object} Sistemas personalizados del juego */
        this.systems = {};
        
        /** @type {Object} Callbacks del juego */
        this._callbacks = {
            onReady: [],
            onProcess: [],
            onPhysicsProcess: [],
            onRender: [],
            onGameOver: []
        };
        
        GameEngineCore.instance = this;
    }
    
    /**
     * Inicializar el motor
     * @param {Object} config - Configuración del juego
     * @param {Grid} grid - Grid del juego
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     */
    initialize(config, grid, ctx) {
        if (this._isReady) {
            console.warn('GameEngine: Ya está inicializado');
            return;
        }
        
        this.config = config;
        this.grid = grid;
        this.ctx = ctx;
        
        // Reset time
        Time.reset();
        
        // Inicializar entidades existentes
        for (const entity of this.entities) {
            if (!entity._isReady) {
                this._readyEntity(entity);
            }
        }
        
        // Llamar callbacks de ready
        for (const callback of this._callbacks.onReady) {
            try {
                callback(this);
            } catch (error) {
                console.error('GameEngine: Error en callback onReady:', error);
            }
        }
        
        this._isReady = true;
        EventBus.emit(GameEvents.GAME_READY);
        
        console.log('GameEngine: Inicializado');
    }
    
    /**
     * Inicializar una entidad con lifecycle hooks
     * @param {Entity} entity
     */
    _readyEntity(entity) {
        if (entity._isReady) return;
        
        // Inyectar dependencias
        entity.grid = this.grid;
        
        // Inicializar componentes si existen
        if (entity.components) {
            entity.components.ready();
        }
        
        // Llamar _ready de la entidad
        if (typeof entity._ready === 'function') {
            entity._ready();
        }
        
        entity._isReady = true;
    }
    
    /**
     * Añadir una entidad al motor
     * @param {Entity} entity
     */
    addEntity(entity) {
        this.entities.push(entity);
        
        // Inicializar si el engine ya está ready
        if (this._isReady) {
            this._readyEntity(entity);
        }
        
        EventBus.emit(GameEvents.ENTITY_SPAWNED, { entity });
    }
    
    /**
     * Remover una entidad del motor
     * @param {Entity} entity
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            // Llamar lifecycle de salida
            if (entity._isReady && typeof entity._exit_tree === 'function') {
                entity._exit_tree();
            }
            
            this.entities.splice(index, 1);
            EventBus.emit(GameEvents.ENTITY_DESTROYED, { entity });
        }
    }
    
    /**
     * Añadir un proyectil
     * @param {Projectile} projectile
     */
    addProjectile(projectile) {
        this.projectiles.push(projectile);
        EventBus.emit(GameEvents.PROJECTILE_SPAWNED, { projectile });
    }
    
    /**
     * Añadir texto flotante
     * @param {FloatingText} text
     */
    addFloatingText(text) {
        this.floatingTexts.push(text);
        EventBus.emit(GameEvents.FLOATING_TEXT_SPAWNED, { text });
    }
    
    /**
     * Registrar un sistema personalizado
     * @param {string} name - Nombre del sistema
     * @param {Object} system - Sistema con métodos process/physicsProcess
     */
    registerSystem(name, system) {
        this.systems[name] = system;
        
        // Inicializar sistema si tiene método init
        if (typeof system.init === 'function') {
            system.init(this);
        }
    }
    
    /**
     * Registrar callback de lifecycle
     * @param {string} hookName - Nombre del hook (onReady, onProcess, etc)
     * @param {Function} callback
     */
    on(hookName, callback) {
        if (this._callbacks[hookName]) {
            this._callbacks[hookName].push(callback);
        } else {
            console.warn(`GameEngine: Hook desconocido "${hookName}"`);
        }
    }
    
    /**
     * Update con delta time variable
     * Se llama cada frame
     * @param {number} currentTime - Timestamp actual
     */
    process(currentTime) {
        if (!this._isReady || this._isPaused) return;
        
        // Actualizar Time
        Time.update(currentTime);
        const delta = Time.delta;
        
        // Callbacks de proceso
        for (const callback of this._callbacks.onProcess) {
            try {
                callback(delta, this);
            } catch (error) {
                console.error('GameEngine: Error en callback onProcess:', error);
            }
        }
        
        // Procesar entidades
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            
            if (!entity._isReady) continue;
            
            // Process de componentes
            if (entity.components) {
                entity.components.process(delta);
            }
            
            // Process de la entidad
            if (typeof entity._process === 'function') {
                entity._process(delta);
            }
            
            // Remover entidades muertas
            if (entity.hp !== undefined && entity.hp <= 0 && !entity._isBeingRemoved) {
                entity._isBeingRemoved = true;
                this.removeEntity(entity);
            }
        }
        
        // Procesar proyectiles (usan firma legacy: update(entities, floatingTexts))
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (typeof projectile.update === 'function') {
                projectile.update(this.entities, this.floatingTexts);
            }
            
            // Projectiles usan .dead en lugar de .hp
            if (projectile.dead || projectile.hp <= 0) {
                this.projectiles.splice(i, 1);
                EventBus.emit(GameEvents.PROJECTILE_DESTROYED, { projectile });
            }
        }
        
        // Procesar textos flotantes (usan firma legacy: update(simulationSpeed))
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const text = this.floatingTexts[i];
            if (typeof text.update === 'function') {
                // FloatingText usa simulationSpeed (frames-based), convertir delta a frames
                const simulationSpeed = delta * 60;
                text.update(simulationSpeed);
            }
            
            // FloatingText usa .life en lugar de .age/.lifespan
            if (text.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
        
        // Procesar sistemas personalizados
        for (const system of Object.values(this.systems)) {
            if (typeof system.process === 'function') {
                system.process(delta, this);
            }
        }
    }
    
    /**
     * Physics update con delta time fijo
     * Debe ser llamado en un loop con fixed timestep
     * @param {number} fixedDelta - Delta time fijo (normalmente 1/60)
     */
    physicsProcess(fixedDelta) {
        if (!this._isReady || this._isPaused) return;
        
        Time.notifyFixedUpdate();
        
        // Callbacks de física
        for (const callback of this._callbacks.onPhysicsProcess) {
            try {
                callback(fixedDelta, this);
            } catch (error) {
                console.error('GameEngine: Error en callback onPhysicsProcess:', error);
            }
        }
        
        // Physics process de entidades
        for (const entity of this.entities) {
            if (!entity._isReady) continue;
            
            // Physics process de componentes
            if (entity.components) {
                entity.components.physicsProcess(fixedDelta);
            }
            
            // Physics process de la entidad
            if (typeof entity._physics_process === 'function') {
                entity._physics_process(fixedDelta);
            }
        }
        
        // Physics process de sistemas
        for (const system of Object.values(this.systems)) {
            if (typeof system.physicsProcess === 'function') {
                system.physicsProcess(fixedDelta, this);
            }
        }
    }
    
    /**
     * Render del juego
     * @param {number} interpolation - Factor de interpolación [0-1] para smooth rendering
     */
    render(interpolation = 1) {
        if (!this._isReady) return;
        
        // Callbacks de render
        for (const callback of this._callbacks.onRender) {
            try {
                callback(interpolation, this);
            } catch (error) {
                console.error('GameEngine: Error en callback onRender:', error);
            }
        }
    }
    
    /**
     * Pausar el juego
     */
    pause() {
        if (this._isPaused) return;
        this._isPaused = true;
        EventBus.emit(GameEvents.GAME_PAUSE);
    }
    
    /**
     * Reanudar el juego
     */
    resume() {
        if (!this._isPaused) return;
        this._isPaused = false;
        EventBus.emit(GameEvents.GAME_RESUME);
    }
    
    /**
     * Toggle pausa
     */
    togglePause() {
        if (this._isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    /**
     * Game Over
     */
    gameOver(winner = null) {
        if (this._isGameOver) return;
        
        this._isGameOver = true;
        
        // Callbacks de game over
        for (const callback of this._callbacks.onGameOver) {
            try {
                callback(winner, this);
            } catch (error) {
                console.error('GameEngine: Error en callback onGameOver:', error);
            }
        }
        
        EventBus.emit(GameEvents.GAME_OVER, { winner });
    }
    
    /**
     * Reiniciar el juego
     */
    restart() {
        // Limpiar entidades
        for (const entity of [...this.entities]) {
            this.removeEntity(entity);
        }
        
        this.entities = [];
        this.projectiles = [];
        this.floatingTexts = [];
        
        // Reset estados
        this._isGameOver = false;
        this._isPaused = false;
        this._accumulator = 0;
        
        // Reset time
        Time.reset();
        
        EventBus.emit(GameEvents.GAME_RESTART);
    }
    
    /**
     * Obtener estado del engine
     */
    getState() {
        return {
            isReady: this._isReady,
            isPaused: this._isPaused,
            isGameOver: this._isGameOver,
            entityCount: this.entities.length,
            projectileCount: this.projectiles.length,
            frameCount: Time.frameCount,
            fps: Time.fps,
            elapsedTime: Time.elapsedTime
        };
    }
    
    /**
     * Limpiar el engine
     */
    destroy() {
        // Limpiar entidades
        for (const entity of [...this.entities]) {
            this.removeEntity(entity);
        }
        
        // Limpiar sistemas
        for (const system of Object.values(this.systems)) {
            if (typeof system.destroy === 'function') {
                system.destroy();
            }
        }
        
        this.entities = [];
        this.projectiles = [];
        this.floatingTexts = [];
        this.systems = {};
        this._callbacks = {
            onReady: [],
            onProcess: [],
            onPhysicsProcess: [],
            onRender: [],
            onGameOver: []
        };
        
        this._isReady = false;
        this._isPaused = false;
        this._isGameOver = false;
    }
}

// Crear instancia singleton
const GameEngine = new GameEngineCore();

// No congelar el objeto porque necesita modificar sus propiedades internas
// El patrón singleton ya previene crear múltiples instancias

export default GameEngine;