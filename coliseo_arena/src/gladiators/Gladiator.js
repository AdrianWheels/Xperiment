import { Entity } from '../entities/Entity.js';
import { getGladiatorModule } from './registry.js';
import { StateMachineFactory } from '../core/StateMachine.js';
import EventBus, { GameEvents } from '../core/EventBus.js';
import Time from '../core/Time.js';

export class Gladiator extends Entity {
    constructor(x, y, className, elementType, team) {
        super(x, y, className, elementType, team);
        this.module = getGladiatorModule(className);
        this.customSprite = new Image();
        this.customSprite.src = `assets/gladiators/${className}/sprites/base.png`;
        
        // Permitir que el módulo especifique la estrategia inicial de movimiento
        if (this.module && this.module.defaultMovementStrategy) {
            this.setMovementStrategy(this.module.defaultMovementStrategy, this.module.movementOptions || {});
        }
        
        // Initialize module-specific properties via onInit hook
        this._initialized = false;
        
        // ===== STATE MACHINE =====
        /** @type {StateMachine} Máquina de estados del gladiador */
        this.stateMachine = StateMachineFactory.createGladiatorStateMachine(this);
        
        /** @type {boolean} Flag para marcar si está atacando (usado por state machine) */
        this.isAttacking = false;
    }
    
    /**
     * Override de _ready para inicializar la state machine
     */
    _ready() {
        super._ready();
        
        // Inicializar módulo
        this._initializeModule({
            entities: window.entities || [],
            grid: this.grid
        });
        
        // Iniciar state machine
        this.stateMachine.start();
    }
    
    /**
     * Override de _process para actualizar state machine
     */
    _process(delta) {
        // Actualizar state machine primero
        if (this.stateMachine) {
            this.stateMachine.update(delta);
        }
        
        // Luego llamar al proceso normal
        super._process(delta);
    }
    
    /**
     * Override de _exit_tree para limpiar state machine
     */
    _exit_tree() {
        if (this.stateMachine) {
            this.stateMachine.destroy();
        }
        super._exit_tree();
    }
    
    /**
     * Initialize module-specific properties on first update
     * This is called once before the first update cycle
     */
    _initializeModule(context) {
        if (this._initialized) return;
        this._initialized = true;
        
        if (this.module && typeof this.module.onInit === 'function') {
            this.module.onInit(this, context);
        }
    }

    /**
     * Cambia dinámicamente la estrategia de movimiento del gladiador
     * @param {string} strategyType - 'aggressive', 'defensive', 'passive'
     * @param {object} options - Opciones adicionales como patrón, configuración custom
     */
    changeMovementStrategy(strategyType, options = {}) {
        this.setMovementStrategy(strategyType, options);
        
        // Emitir evento de cambio de estrategia
        EventBus.emit(GameEvents.GLADIATOR_STRATEGY_CHANGED, {
            gladiator: this,
            strategy: strategyType,
            options: options
        });
        
        // Callback al módulo si quiere ser notificado
        if (this.module && typeof this.module.onMovementStrategyChange === 'function') {
            this.module.onMovementStrategyChange(this, strategyType, options);
        }
    }

    update(entities, simulationSpeed, floatingTexts, checkCombatEnd) {
        // Initialize module properties on first update
        this._initializeModule({ entities, simulationSpeed, floatingTexts, checkCombatEnd });
        
        // Sistema de tiempo acumulado para habilidades (ejecutar cada ~100ms en lugar de cada frame)
        // Esto previene que las habilidades se ejecuten 60 veces por segundo
        const ABILITY_UPDATE_INTERVAL = 6; // frames (~100ms at 60fps)
        this._abilityAccumulator = (this._abilityAccumulator || 0) + simulationSpeed;
        
        // Solo ejecutar habilidades cuando acumulador alcanza el intervalo
        if (this._abilityAccumulator >= ABILITY_UPDATE_INTERVAL) {
            this._abilityAccumulator -= ABILITY_UPDATE_INTERVAL;
            
            // Run module logic con tiempo acumulado normalizado
            // Skip si tiene flag _noModuleUpdate (para minions de summoner)
            if (this.module && typeof this.module.update === 'function' && !this._noModuleUpdate) {
                this.module.update(this, { 
                    entities, 
                    simulationSpeed: ABILITY_UPDATE_INTERVAL, // Usar tiempo acumulado 
                    floatingTexts, 
                    checkCombatEnd 
                });
            }
        }
        
        // Siempre ejecutar update base para movimiento y combate
        super.update(entities, simulationSpeed, floatingTexts, checkCombatEnd);
    }

    applyDamageModifiers(damage, enemy, floatingTexts) {
        if (this.module && typeof this.module.modifyDamage === 'function') {
            return this.module.modifyDamage(this, enemy, damage, { floatingTexts });
        }
        return { damage };
    }

    handleCombat(enemy, simulationSpeed, floatingTexts) {
        // Marcar que está atacando para la state machine
        this.isAttacking = true;
        
        super.handleCombat(enemy, simulationSpeed, floatingTexts);
        
        if (this.module && typeof this.module.onCombat === 'function') {
            this.module.onCombat(this, enemy, { simulationSpeed, floatingTexts });
        }
        
        // Reset attacking flag después de un frame
        // La state machine decidirá cuándo volver a Moving
    }

    draw(ctx) {
        if (this.module && this.module.drawSpriteFirst && typeof this.module.draw === 'function') {
            this.useBaseSprite = false;
            this.module.draw(this, ctx);
        }
        if ((!this.module || !this.module.drawSpriteFirst) && this.customSprite && this.customSprite.complete && this.customSprite.naturalWidth > 0) {
            this.useBaseSprite = false;
            const sx = this.x * 12;
            const sy = this.y * 12;
            const sr = this.radius * 12;
            const drawSize = sr * 2.5;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.drawImage(
                this.customSprite,
                0, 0, this.customSprite.naturalWidth, this.customSprite.naturalHeight,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );
            ctx.restore();
        }
        super.draw(ctx);
        if (this.module && !this.module.drawSpriteFirst && typeof this.module.draw === 'function') {
            this.module.draw(this, ctx);
        }
    }
}
