/**
 * Component.js - Sistema de componentes estilo Unity
 * Permite adjuntar comportamientos reutilizables a entidades
 */

import Time from './Time.js';
import EventBus from './EventBus.js';

/**
 * Clase base para componentes
 * Los componentes se adjuntan a entidades y proporcionan funcionalidad modular
 */
export class Component {
    constructor() {
        /** @type {Entity} Entidad a la que pertenece este componente */
        this.entity = null;
        
        /** @type {boolean} Si el componente está activo */
        this.enabled = true;
        
        /** @type {boolean} Si el componente ya fue inicializado */
        this._isReady = false;
        
        /** @type {string} Nombre del componente para debug */
        this.name = this.constructor.name;
    }
    
    /**
     * Llamado cuando el componente se adjunta a una entidad
     * Override este método para inicialización
     */
    _ready() {
        // Override en subclases
    }
    
    /**
     * Llamado cada frame (variable delta time)
     * @param {number} delta - Tiempo desde el último frame en segundos
     */
    _process(delta) {
        // Override en subclases
    }
    
    /**
     * Llamado cada fixed update (delta time fijo)
     * @param {number} fixedDelta - Tiempo fijo (1/60)
     */
    _physics_process(fixedDelta) {
        // Override en subclases
    }
    
    /**
     * Llamado cuando el componente es removido
     */
    _exit_tree() {
        // Override en subclases
    }
    
    /**
     * Obtener otro componente de la misma entidad
     * @template T
     * @param {new() => T} ComponentClass - Clase del componente a buscar
     * @returns {T|null}
     */
    getComponent(ComponentClass) {
        if (!this.entity) return null;
        return this.entity.getComponent(ComponentClass);
    }
    
    /**
     * Emitir un evento del componente
     * @param {string} eventName
     * @param {*} data
     */
    emit(eventName, data = null) {
        EventBus.emit(eventName, { component: this, entity: this.entity, ...data });
    }
    
    /**
     * Destruir el componente
     */
    destroy() {
        if (this.entity) {
            this.entity.removeComponent(this);
        }
    }
}

/**
 * ComponentManager - Gestiona componentes de una entidad
 */
export class ComponentManager {
    constructor(entity) {
        this.entity = entity;
        
        /** @type {Component[]} Lista de componentes */
        this.components = [];
        
        /** @type {Map<Function, Component>} Map de tipo a componente para búsqueda rápida */
        this.componentsByType = new Map();
    }
    
    /**
     * Añadir un componente
     * @template T
     * @param {T} component - Instancia del componente
     * @returns {T}
     */
    add(component) {
        if (!(component instanceof Component)) {
            console.error('ComponentManager: Solo se pueden añadir instancias de Component');
            return component;
        }
        
        // No permitir duplicados del mismo tipo
        const type = component.constructor;
        if (this.componentsByType.has(type)) {
            console.warn(`ComponentManager: Ya existe un componente de tipo ${component.name}`);
            return this.componentsByType.get(type);
        }
        
        // Añadir componente
        component.entity = this.entity;
        this.components.push(component);
        this.componentsByType.set(type, component);
        
        // Inicializar si la entidad ya está lista
        if (this.entity._isReady && !component._isReady) {
            component._ready();
            component._isReady = true;
        }
        
        return component;
    }
    
    /**
     * Obtener componente por tipo
     * @template T
     * @param {new() => T} ComponentClass
     * @returns {T|null}
     */
    get(ComponentClass) {
        return this.componentsByType.get(ComponentClass) || null;
    }
    
    /**
     * Verificar si tiene un componente
     * @param {Function} ComponentClass
     * @returns {boolean}
     */
    has(ComponentClass) {
        return this.componentsByType.has(ComponentClass);
    }
    
    /**
     * Remover un componente
     * @param {Component|Function} componentOrClass - Instancia o clase del componente
     * @returns {boolean} true si se removió
     */
    remove(componentOrClass) {
        let component;
        
        if (componentOrClass instanceof Component) {
            component = componentOrClass;
        } else {
            component = this.componentsByType.get(componentOrClass);
        }
        
        if (!component) return false;
        
        // Llamar exit
        if (component._isReady) {
            component._exit_tree();
        }
        
        // Remover de listas
        const index = this.components.indexOf(component);
        if (index !== -1) {
            this.components.splice(index, 1);
        }
        
        this.componentsByType.delete(component.constructor);
        component.entity = null;
        
        return true;
    }
    
    /**
     * Inicializar todos los componentes
     */
    ready() {
        for (const component of this.components) {
            if (!component._isReady) {
                component._ready();
                component._isReady = true;
            }
        }
    }
    
    /**
     * Procesar todos los componentes (_process)
     * @param {number} delta
     */
    process(delta) {
        for (const component of this.components) {
            if (component.enabled && component._isReady) {
                component._process(delta);
            }
        }
    }
    
    /**
     * Procesar física de todos los componentes (_physics_process)
     * @param {number} fixedDelta
     */
    physicsProcess(fixedDelta) {
        for (const component of this.components) {
            if (component.enabled && component._isReady) {
                component._physics_process(fixedDelta);
            }
        }
    }
    
    /**
     * Limpiar todos los componentes
     */
    clear() {
        for (const component of [...this.components]) {
            this.remove(component);
        }
    }
}

export default Component;