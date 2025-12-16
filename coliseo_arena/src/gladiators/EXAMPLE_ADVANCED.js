/**
 * EJEMPLO: Cómo crear un gladiador usando el nuevo sistema de engine
 * 
 * Este archivo muestra cómo aprovechar todas las nuevas características:
 * - Components
 * - State Machine
 * - EventBus
 * - Time management
 */

import { Component } from '../../core/Component.js';
import { State } from '../../core/StateMachine.js';
import EventBus, { GameEvents } from '../../core/EventBus.js';
import Time from '../../core/Time.js';
import { Projectile } from '../../entities/Projectile.js';
import { FloatingText } from '../../entities/FloatingText.js';

// ============================================
// COMPONENTE: Regeneración de HP
// ============================================
class HealthRegenComponent extends Component {
    constructor(regenRate = 2) {
        super();
        this.regenRate = regenRate;
        this.regenDelay = 3; // Segundos sin recibir daño antes de regenerar
        this.timeSinceLastDamage = 0;
    }
    
    _ready() {
        // Suscribirse a eventos de daño
        this.unsubscribe = EventBus.on(GameEvents.DAMAGE_RECEIVED, (data) => {
            if (data.target === this.entity) {
                this.timeSinceLastDamage = 0; // Reset timer
            }
        });
    }
    
    _process(delta) {
        this.timeSinceLastDamage += delta;
        
        // Regenerar si no ha recibido daño recientemente
        if (this.timeSinceLastDamage >= this.regenDelay && this.entity.hp < this.entity.maxHp) {
            const healAmount = this.regenRate * delta;
            this.entity.hp = Math.min(this.entity.hp + healAmount, this.entity.maxHp);
            
            // Efecto visual cada segundo
            if (Math.floor(Time.elapsedTime) !== Math.floor(Time.elapsedTime - delta)) {
                EventBus.emit(GameEvents.ENTITY_HEALED, {
                    entity: this.entity,
                    amount: this.regenRate
                });
            }
        }
    }
    
    _exit_tree() {
        // Limpiar suscripción
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// ============================================
// COMPONENTE: Dash (teleport corto)
// ============================================
class DashComponent extends Component {
    constructor() {
        super();
        this.dashSpeed = 200;
        this.dashDuration = 0.2; // segundos
        this.dashCooldown = 5; // segundos
        this.cooldownTimer = 0;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDirection = { x: 0, y: 0 };
    }
    
    _process(delta) {
        // Cooldown
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= delta;
        }
        
        // Dash activo
        if (this.isDashing) {
            this.dashTimer -= delta;
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.entity.invulnerable = false;
            } else {
                // Mover en la dirección del dash
                this.entity.x += this.dashDirection.x * this.dashSpeed * delta;
                this.entity.y += this.dashDirection.y * this.dashSpeed * delta;
            }
        }
    }
    
    /**
     * Activar dash hacia un objetivo
     */
    dashTowards(targetX, targetY) {
        if (this.cooldownTimer > 0 || this.isDashing) return false;
        
        // Calcular dirección
        const dx = targetX - this.entity.x;
        const dy = targetY - this.entity.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
            this.dashDirection.x = dx / distance;
            this.dashDirection.y = dy / distance;
        }
        
        // Activar dash
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.cooldownTimer = this.dashCooldown;
        this.entity.invulnerable = true; // Invulnerable durante dash
        
        EventBus.emit(GameEvents.GLADIATOR_ABILITY_USED, {
            gladiator: this.entity,
            abilityName: 'Dash'
        });
        
        return true;
    }
}

// ============================================
// ESTADO: Channeling (canalizando habilidad)
// ============================================
class ChannelingState extends State {
    constructor() {
        super('Channeling');
        this.channelDuration = 2; // segundos
        this.abilityCallback = null;
    }
    
    enter(previousState) {
        this.timeChanneling = 0;
        this.owner.vx = 0;
        this.owner.vy = 0;
        
        // Efecto visual
        if (window.gameState) {
            window.gameState.floatingTexts.push(
                new FloatingText(this.owner.x, this.owner.y - 20, "CHANNELING...", '#ffff00')
            );
        }
    }
    
    update(delta) {
        this.timeChanneling += delta;
        
        // Efecto de partículas alrededor
        if (Math.random() < 0.1) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20;
            const px = this.owner.x + Math.cos(angle) * distance;
            const py = this.owner.y + Math.sin(angle) * distance;
            
            if (window.gameState && window.gameState.floatingTexts) {
                window.gameState.floatingTexts.push(
                    new FloatingText(px, py, "*", '#00ffff')
                );
            }
        }
    }
    
    checkTransitions() {
        if (this.timeChanneling >= this.channelDuration) {
            // Ejecutar habilidad
            if (this.abilityCallback) {
                this.abilityCallback(this.owner);
            }
            return 'Moving';
        }
        
        // Interrumpir si recibe daño
        if (this.owner.hp < this.owner.maxHp * 0.9) {
            return 'Moving';
        }
        
        return null;
    }
    
    exit(nextState) {
        if (this.timeChanneling >= this.channelDuration) {
            // Habilidad completada
            EventBus.emit(GameEvents.GLADIATOR_ABILITY_USED, {
                gladiator: this.owner,
                abilityName: 'Ultimate'
            });
        }
    }
}

// ============================================
// MÓDULO DE GLADIADOR EJEMPLO
// ============================================
export default {
    key: 'example_advanced',
    name: 'Advanced Example Gladiator',
    defaultMovementStrategy: 'aggressive',
    
    /**
     * Inicialización del gladiador
     */
    onInit(self) {
        // Añadir componentes
        self.addComponent(new HealthRegenComponent(5)); // Regen 5 HP/s
        const dashComponent = self.addComponent(new DashComponent());
        
        // Añadir estado de channeling
        const channelingState = new ChannelingState();
        channelingState.abilityCallback = (owner) => {
            // Habilidad ultimate: Explosión AoE
            const enemies = window.entities.filter(e => 
                e.team !== owner.team && 
                Math.hypot(e.x - owner.x, e.y - owner.y) < 50
            );
            
            enemies.forEach(e => {
                e.takeDamage(100, owner, window.gameState.floatingTexts);
            });
            
            // Screen shake
            if (window.gameState && window.gameState.screenShake) {
                window.gameState.screenShake.trigger(10, 20);
            }
        };
        self.stateMachine.addState(channelingState);
        
        // Propiedades custom
        self.ultimateCooldown = 0;
        self.dashComponent = dashComponent;
        
        // Suscribirse a eventos
        self._eventUnsubscribers = [];
        
        self._eventUnsubscribers.push(
            EventBus.on(GameEvents.DAMAGE_DEALT, (data) => {
                if (data.attacker === self && data.isCrit) {
                    // Reducir cooldown de ultimate en crits
                    self.ultimateCooldown = Math.max(0, self.ultimateCooldown - 1);
                }
            })
        );
    },
    
    /**
     * Update de habilidades (se ejecuta cada ~100ms)
     */
    update(gladiator, context) {
        const { entities, simulationSpeed } = context;
        
        // Actualizar cooldown de ultimate
        if (gladiator.ultimateCooldown > 0) {
            gladiator.ultimateCooldown -= Time.delta;
        }
        
        // Buscar enemigo más cercano
        const enemies = entities.filter(e => e.team !== gladiator.team && !e.dead);
        if (enemies.length === 0) return;
        
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dist = Math.hypot(enemy.x - gladiator.x, enemy.y - gladiator.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        
        // Si hay un enemigo cerca
        if (nearest) {
            // Usar dash si está lejos y disponible
            if (minDist > 50 && minDist < 100) {
                gladiator.dashComponent.dashTowards(nearest.x, nearest.y);
            }
            
            // Usar ultimate si hay varios enemigos cerca
            const nearbyEnemies = enemies.filter(e => 
                Math.hypot(e.x - gladiator.x, e.y - gladiator.y) < 60
            );
            
            if (nearbyEnemies.length >= 2 && gladiator.ultimateCooldown <= 0) {
                gladiator.stateMachine.transitionTo('Channeling');
                gladiator.ultimateCooldown = 15; // 15 segundos de cooldown
            }
        }
    },
    
    /**
     * Al colisionar y atacar
     */
    onCombat(self, enemy, context) {
        // 20% de chance de aplicar stun
        if (Math.random() < 0.2) {
            enemy.stunDuration = 0.5; // 0.5 segundos de stun
            enemy.stateMachine.transitionTo('Stunned');
            
            context.floatingTexts.push(
                new FloatingText(enemy.x, enemy.y - 10, "STUNNED!", '#ff00ff')
            );
        }
    },
    
    /**
     * Modificar daño saliente
     */
    modifyDamage(self, enemy, baseDamage, context) {
        let damage = baseDamage;
        let isCrit = false;
        
        // Crítico en enemigos con bajo HP
        if (enemy.hp < enemy.maxHp * 0.3) {
            damage *= 2;
            isCrit = true;
        }
        
        return { damage, isCrit };
    },
    
    /**
     * Al subir de nivel
     */
    onLevelUp(self, context) {
        // Bonus: reducir cooldown de ultimate
        self.ultimateCooldown = Math.max(0, self.ultimateCooldown - 2);
        
        // Aumentar regen rate
        const regenComponent = self.getComponent(HealthRegenComponent);
        if (regenComponent) {
            regenComponent.regenRate += 1;
        }
    },
    
    /**
     * Cleanup al destruir
     */
    onDestroy(self) {
        // Desuscribirse de eventos
        if (self._eventUnsubscribers) {
            self._eventUnsubscribers.forEach(unsub => unsub());
        }
    }
};
