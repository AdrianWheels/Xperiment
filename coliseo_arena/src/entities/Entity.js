import { CELL_SIZE, CLASSES, TYPE, STAGE_W, STAGE_H, MOVEMENT_CONFIG, SAFE_BOUNDS } from '../config.js';
import { FloatingText } from './FloatingText.js';
import { getCell, setCell, drawCircle, damageWall } from '../core/Grid.js';
import { isAutoAttacker, DebugMode } from '../core/Utils.js';
import { drawEntityDebug } from '../debug/DebugRenderer.js';
import { MovementStrategyFactory } from '../core/MovementSystem.js';
import { ComponentManager } from '../core/Component.js';
import Time from '../core/Time.js';
import EventBus, { GameEvents } from '../core/EventBus.js';

// Load Sprites
const sprites = new Image();
sprites.src = 'gladiators.png';
const SPRITE_SIZE = 256; // 1024 / 4 = 256px

export class Entity {
    constructor(x, y, className, elementType, team) {
        this.x = x;
        this.y = y;
        this.className = className;
        this.elementType = elementType;
        this.team = team; // 'red' or 'blue'

        const stats = CLASSES[className];

        // Base Stats
        this.maxHp = stats.hp;
        this.hp = this.maxHp;
        this.baseSpeed = stats.speed;
        this.radius = 10; // Collision radius - matches sprite visual size

        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;

        // DPS Tracking
        this.damageDealt = 0;

        // Movement
        this.vx = (Math.random() - 0.5) * this.baseSpeed;
        this.vy = (Math.random() - 0.5) * this.baseSpeed;

        // Combat Stats
        this.invulnerable = false;
        this.invulnTimer = 0;

        // Timers
        this.cooldown = 0;
        this.age = 0;
        this.dead = false;
        this.useBaseSprite = true;
        
        // Module-specific properties will be initialized by gladiator modules
        // via onInit hook

        // Flee/path helpers
        this._stuckFrames = 0;
        this._lastPosForStuck = { x, y };
        this.intentVec = { x: 0, y: 0 }; // desired steering for debug
        this.intentX = 0; // For new movement system
        this.intentY = 0;

        // Movement Strategy System (inicializado con aggressive por defecto)
        try {
            this.movementStrategy = MovementStrategyFactory.create('aggressive', this, MOVEMENT_CONFIG);
        } catch (e) {
            console.error('Error creating movement strategy:', e);
            this.movementStrategy = null;
        }
        
        // Grid reference (será inyectado por el loop)
        this.grid = null;
        
        // Time accumulator for ability cooldowns (frame-rate independent)
        this._abilityAccumulator = 0;
        this._lastAbilityUpdate = 0;
        
        // ===== NEW ENGINE SYSTEM =====
        
        /** @type {boolean} Si la entidad ya fue inicializada con _ready() */
        this._isReady = false;
        
        /** @type {boolean} Marca para evitar remover dos veces */
        this._isBeingRemoved = false;
        
        /** @type {ComponentManager} Sistema de componentes */
        this.components = new ComponentManager(this);
        
        /** @type {Object} Último contexto de update (para state machine) */
        this.lastContext = null;
    }
    
    // ===== ENGINE LIFECYCLE HOOKS =====
    
    /**
     * Llamado una vez cuando la entidad entra al árbol de escena
     * Override este método para inicialización personalizada
     */
    _ready() {
        // Override en subclases (Gladiator, etc)
        // Inicialización completa después del constructor
    }
    
    /**
     * Llamado cada frame (delta time variable)
     * @param {number} delta - Tiempo desde el último frame en segundos
     */
    _process(delta) {
        // Llamar al update legacy para compatibilidad
        // Las subclases pueden override este método directamente
        const simulationSpeed = delta * 60; // Convertir delta a frames a 60fps
        
        // Guardar contexto para state machine y otros sistemas
        this.lastContext = {
            entities: window.entities || [],
            floatingTexts: window.floatingTexts || [],
            checkCombatEnd: window.checkCombatEnd
        };
        
        // Llamar update legacy
        this.update(
            this.lastContext.entities,
            simulationSpeed,
            this.lastContext.floatingTexts,
            this.lastContext.checkCombatEnd
        );
    }
    
    /**
     * Llamado cada fixed update (60 FPS fijo)
     * @param {number} fixedDelta - Delta time fijo (1/60)
     */
    _physics_process(fixedDelta) {
        // Override en subclases si necesitan física separada
        // Por ahora, toda la física está en update/move
    }
    
    /**
     * Llamado cuando la entidad sale del árbol de escena
     */
    _exit_tree() {
        // Limpiar componentes
        if (this.components) {
            this.components.clear();
        }
        
        // Override en subclases para cleanup personalizado
    }
    
    // ===== COMPONENT SYSTEM =====
    
    /**
     * Añadir un componente a esta entidad
     * @template T
     * @param {T} component
     * @returns {T}
     */
    addComponent(component) {
        return this.components.add(component);
    }
    
    /**
     * Obtener un componente de esta entidad
     * @template T
     * @param {new() => T} ComponentClass
     * @returns {T|null}
     */
    getComponent(ComponentClass) {
        return this.components.get(ComponentClass);
    }
    
    /**
     * Verificar si tiene un componente
     * @param {Function} ComponentClass
     * @returns {boolean}
     */
    hasComponent(ComponentClass) {
        return this.components.has(ComponentClass);
    }
    
    /**
     * Remover un componente
     * @param {Component|Function} componentOrClass
     * @returns {boolean}
     */
    removeComponent(componentOrClass) {
        return this.components.remove(componentOrClass);
    }
    
    // ===== LEGACY UPDATE SYSTEM (MANTENIDO PARA COMPATIBILIDAD) =====

    /**
     * Get current HP as percentage (0-1)
     */
    get hpPercent() {
        return Math.max(0, Math.min(1, this.hp / this.maxHp));
    }

    update(entities, simulationSpeed, floatingTexts, checkCombatEnd) {
        if (this.hp <= 0) return this.die(checkCombatEnd);
        this.age += simulationSpeed;

        // Decay cooldown
        if (this.cooldown > 0) {
            this.cooldown -= simulationSpeed;
            if (this.cooldown < 0) this.cooldown = 0;
        }

        this.applyClassLogic(entities, floatingTexts);
        this.move(entities, simulationSpeed, checkCombatEnd);
        this.checkCollisions(entities, simulationSpeed, floatingTexts);

        // Removed Passive XP
        if (this.xp >= this.xpToNextLevel) this.levelUp(floatingTexts);
        if (this.invulnTimer > 0) {
            this.invulnTimer -= simulationSpeed;
            this.invulnerable = true;
            if (this.invulnTimer <= 0) this.invulnerable = false;
        }
    }

    gainXp(amount, floatingTexts) {
        this.xp += amount;
    }

    applyClassLogic(entities, floatingTexts) {
        // Legacy method - logic moved to gladiator modules
        // Can be removed once all modules are migrated
    }

    move(entities, simulationSpeed, checkCombatEnd) {
        if (this.pyramidTurret) return;

        // Reset intent each frame
        this.intentVec = { x: 0, y: 0 };
        this.intentX = 0;
        this.intentY = 0;

        // Usar el sistema de movimiento si está disponible
        if (this.movementStrategy && this.grid) {
            // Delegar el movimiento a la estrategia
            this.movementStrategy.update(simulationSpeed, entities, this.grid);
            
            // Actualizar intentVec para compatibilidad con debug existente
            this.intentVec = { x: this.intentX, y: this.intentY };
        } else {
            // Fallback: inicializar movementStrategy si falta o no hacer nada si no hay grid
            if (!this.movementStrategy && this.grid) {
                try {
                    this.movementStrategy = MovementStrategyFactory.create('aggressive', this, MOVEMENT_CONFIG);
                } catch (e) {
                    console.error('Failed to create fallback movement strategy:', e);
                }
            }
            // Si aún no hay estrategia o grid, solo aplicar física básica
            if (!this.movementStrategy || !this.grid) {
                this.x += this.vx * simulationSpeed;
                this.y += this.vy * simulationSpeed;
                this.vx *= 0.98;
                this.vy *= 0.98;
            }
        }

        // Ring Out check usando SAFE_BOUNDS centralizados
        // Se verifica contra un límite más restrictivo para dar margen de seguridad
        const ringOutLimit = 2; // Límite crítico de ring-out (más allá del safe bounds)
        const outOfBounds = this.x < ringOutLimit || this.x > (STAGE_W - ringOutLimit) || 
                           this.y < ringOutLimit || this.y > (STAGE_H - ringOutLimit);
        
        if (outOfBounds) {
            // Intentar callbacks del módulo (soporte dual para onOutOfBounds y onRingOut legacy)
            let handled = false;
            
            if (this.module) {
                // Primero intentar onOutOfBounds (nuevo estándar)
                if (typeof this.module.onOutOfBounds === 'function') {
                    handled = this.module.onOutOfBounds(this, { checkCombatEnd });
                }
                // Si no fue manejado, intentar onRingOut (legacy, para gladiadores especiales como Speed)
                if (!handled && typeof this.module.onRingOut === 'function') {
                    handled = this.module.onRingOut(this, { checkCombatEnd });
                }
            }
            
            // Si ningún módulo manejó el ring-out, morir
            if (!handled) {
                this.die(checkCombatEnd);
            }
        }
    }

    /**
     * Método para cambiar la estrategia de movimiento dinámicamente
     */
    setMovementStrategy(strategyType, options = {}) {
        // Preservar configuración custom si se pasa
        const config = options.config || MOVEMENT_CONFIG;
        this.movementStrategy = MovementStrategyFactory.create(strategyType, this, config);
        
        // Para estrategias pasivas, permitir configurar el patrón
        if (strategyType === 'passive' && options.pattern) {
            this.movementStrategy.setPattern(options.pattern, options);
        }
    }

    /**
     * Movimiento legacy para compatibilidad (debería eliminarse eventualmente)
     */
    legacyMove(entities, simulationSpeed, checkCombatEnd) {
        // Legacy movement system - should not be used
        console.warn('legacyMove called - this should not happen');
        
        this.x += this.vx * simulationSpeed;
        this.y += this.vy * simulationSpeed;

        // Friction
        const frictionBase = (this.module && typeof this.module.getFriction === 'function')
            ? this.module.getFriction(this)
            : 0.98;
        const friction = Math.pow(frictionBase, simulationSpeed);
        this.vx *= friction;
        this.vy *= friction;

        // AI Seek
        const shouldSeek = !this.skipSeek && Math.floor(this.age) % 10 === 0;
        if (shouldSeek) this.seekEnemy(entities, simulationSpeed);
        this.skipSeek = false;

        // Wall collision
        const cellType = getCell(Math.floor(this.x), Math.floor(this.y));
        if (cellType === TYPE.WALL) {
            this.vx *= -1.1;
            this.vy *= -1.1;
            this.x += this.vx * 4;
            this.y += this.vy * 4;
            damageWall(Math.floor(this.x), Math.floor(this.y), 3);
            if (this.module && typeof this.module.onWallBounce === 'function') {
                this.module.onWallBounce(this);
            }
        }
    }

    seekEnemy(entities, simulationSpeed) {
        let nearest = null;
        let minD = 999;
        for (let e of entities) {
            if (e === this || e.team === this.team) continue; // Only target different teams
            let d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minD) { minD = d; nearest = e; }
        }

        if (nearest) {
            let angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            let accel = 0.1;

            if (nearest.seekAttractor) accel += nearest.seekAttractor;

            // Apply acceleration scaled by simulationSpeed
            const ax = Math.cos(angle) * accel * simulationSpeed;
            const ay = Math.sin(angle) * accel * simulationSpeed;
            this.vx += ax;
            this.vy += ay;
            this.intentVec = { x: ax * 10, y: ay * 10 }; // visualize desired seek direction
        }
    }

    checkCollisions(entities, simulationSpeed, floatingTexts) {
        for (let other of entities) {
            if (other === this || other.team === this.team) continue; // No friendly fire
            let dist = Math.hypot(this.x - other.x, this.y - other.y);
            if (dist < this.radius + other.radius) {
                // Only attack if cooldown has expired
                if (this.cooldown <= 0) {
                    this.handleCombat(other, simulationSpeed, floatingTexts);
                }

                // Repel (module can override force or null to use default)
                let angle = Math.atan2(this.y - other.y, this.x - other.x);
                let force = 0.5;
                const moduleForce = this.module && typeof this.module.onCollisionRepel === 'function'
                    ? this.module.onCollisionRepel(this, other, { floatingTexts })
                    : null;
                if (typeof moduleForce === 'number') {
                    force = moduleForce;
                }

                this.vx += Math.cos(angle) * force;
                this.vy += Math.sin(angle) * force;
            }
        }
    }

    handleCombat(enemy, simulationSpeed, floatingTexts) {
        let damage = 5 + (this.level * 2);
        let isCrit = false;

        if (typeof this.applyDamageModifiers === 'function') {
            const res = this.applyDamageModifiers(damage, enemy, floatingTexts) || {};
            if (typeof res.damage === 'number') damage = res.damage;
            if (res.isCrit) isCrit = true;
        }

        // Class Bonuses
        // Speed damage scaling moved to module

        // === NEW GLADIATORS COMBAT ===

        // Lancer handled in module

        const actualDamage = enemy.takeDamage(damage, this, floatingTexts);

        if (actualDamage > 0) {
            this.damageDealt += actualDamage;
            // Set cooldown to ~0.5 seconds at 60fps (30 frames)
            // This prevents rapid-fire attacks while entities are touching
            this.cooldown = 30;

            // Auto-attackers gain XP on hit
            if (isAutoAttacker(this.className)) {
                this.gainXp(5 + this.level, floatingTexts); // Base 5 + level
            }

            // Spawn Floating Text
            const color = isCrit ? '#ff0000' : '#ffffff';
            const text = Math.round(actualDamage).toString() + (isCrit ? '!' : '');
            floatingTexts.push(new FloatingText(enemy.x, enemy.y - 5, text, color));

            // Screen Shake on hit
            if (window.gameState && window.gameState.screenShake) {
                const shakeIntensity = isCrit ? 6 : 2;
                const shakeDuration = isCrit ? 12 : 5;
                window.gameState.screenShake.trigger(shakeIntensity, shakeDuration);
            }
            
            // Emitir evento de daño
            EventBus.emit(GameEvents.DAMAGE_DEALT, {
                attacker: this,
                target: enemy,
                damage: actualDamage,
                isCrit: isCrit
            });
        }
    }

    takeDamage(amount, attacker, floatingTexts) {
        if (this.module && typeof this.module.onDamageTakenPre === 'function') {
            const resPre = this.module.onDamageTakenPre(this, attacker, amount, { floatingTexts });
            if (typeof resPre === 'number') amount = resPre;
            else if (resPre && typeof resPre.amount === 'number') amount = resPre.amount;
        }

        if (this.invulnerable) {
            floatingTexts.push(new FloatingText(this.x, this.y - 5, "BLOCK", '#00ffff'));
            this.gainXp(30, floatingTexts); // XP Trigger
            return 0;
        }

        if (this.module && typeof this.module.onDamageTaken === 'function') {
            const res = this.module.onDamageTaken(this, attacker, amount, { floatingTexts });
            if (typeof res === 'number') amount = res;
            else if (res && typeof res.amount === 'number') amount = res.amount;
        }

        this.hp -= amount;

        // Blood particles
        if (Math.random() > 0.5) {
            setCell(Math.floor(this.x), Math.floor(this.y), this.elementType);
        }
        
        // Emitir evento de daño recibido
        EventBus.emit(GameEvents.DAMAGE_RECEIVED, {
            target: this,
            attacker: attacker,
            damage: amount
        });

        return amount;
    }

    levelUp(floatingTexts) {
        this.level++;
        this.xp = 0;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.2);

        // Fix: Maintain HP Percentage
        const hpPct = this.hp / this.maxHp;
        this.maxHp *= 1.2;
        this.hp = this.maxHp * hpPct;

        // Class-specific level scaling handled in modules
        if (this.module && typeof this.module.onLevelUp === 'function') {
            this.module.onLevelUp(this, { floatingTexts });
        }

        // Visual
        drawCircle(Math.floor(this.x), Math.floor(this.y), 15, TYPE.EMPTY);
        floatingTexts.push(new FloatingText(this.x, this.y - 10, "LEVEL UP!", '#ffff00'));
        
        // Emitir evento de level up
        EventBus.emit(GameEvents.GLADIATOR_LEVEL_UP, {
            entity: this,
            level: this.level
        });
    }

    die(checkCombatEnd) {
        drawCircle(Math.floor(this.x), Math.floor(this.y), this.radius * 2, this.elementType);
        this.dead = true;
        
        // Emitir evento de muerte
        EventBus.emit(GameEvents.ENTITY_DIED, {
            entity: this,
            team: this.team,
            level: this.level,
            damageDealt: this.damageDealt
        });
        
        if (checkCombatEnd) checkCombatEnd();
    }

    draw(ctx) {
        const sx = this.x * CELL_SIZE;
        const sy = this.y * CELL_SIZE;
        const sr = this.radius * CELL_SIZE;

        ctx.save();
        ctx.translate(sx, sy);

        // Draw Sprite
        const spriteIdx = CLASSES[this.className].spriteIdx;
        const col = spriteIdx % 4;
        const row = Math.floor(spriteIdx / 4);

        if (this.useBaseSprite && sprites.complete && sprites.naturalWidth > 0) {
            const sW = SPRITE_SIZE;
            const sH = SPRITE_SIZE;

            // Draw image scaled to radius
            const drawSize = sr * 2.5;

            ctx.drawImage(
                sprites,
                col * sW, row * sH, sW, sH,
                -drawSize / 2, -drawSize / 2, drawSize, drawSize
            );
        } else if (this.useBaseSprite) {
            ctx.fillStyle = CLASSES[this.className].color || '#fff';
            ctx.beginPath();
            ctx.arc(0, 0, sr, 0, Math.PI * 2);
            ctx.fill();
        }
        // Team Indicator (Ring)
        ctx.strokeStyle = this.team === 'red' ? '#ff0000' : '#0000ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, sr + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Health Bar
        const hpPct = this.hpPercent;
        const barWidth = sr * 2.5;
        const barHeight = 8; // Slightly thicker
        const barY = -sr * 1.5; // Position above sprite

        // Background with Border
        ctx.fillStyle = '#fff'; // Border color

        ctx.fillStyle = '#000';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        // HP Fill
        ctx.fillStyle = hpPct > 0.5 ? '#00ff00' : (hpPct > 0.25 ? '#ffff00' : '#ff0000');
        ctx.fillRect(-barWidth / 2 + 1, barY + 1, (barWidth - 2) * hpPct, barHeight - 2);

        // Info (Level)
        ctx.fillStyle = "#fff";
        ctx.font = "bold 64px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(`Lv.${this.level}`, 0, barY - 5);
        ctx.shadowBlur = 0;

        // === DEBUG DRAW ===
        if (DebugMode.enabled) {
            drawEntityDebug(this, ctx);
        }

        ctx.restore();
    }
}

// Escape steering that prefers moving away from threat while keeping wall clearance.
function pickEscapeDir(self, threat) {
    // Away from threat vector
    let awayX = self.x - threat.x;
    let awayY = self.y - threat.y;
    const awayLen = Math.hypot(awayX, awayY) || 1;
    awayX /= awayLen; awayY /= awayLen;

    let best = { x: awayX, y: awayY, score: -999 }; // fallback
    const samples = 16;
    const maxRange = Math.min(STAGE_W, STAGE_H);

    for (let i = 0; i < samples; i++) {
        const ang = (Math.PI * 2 * i) / samples;
        const dx = Math.cos(ang);
        const dy = Math.sin(ang);

        // Distance to nearest wall along this direction
        const distX = dx > 0 ? (STAGE_W - self.x) / dx : (dx < 0 ? -self.x / dx : maxRange);
        const distY = dy > 0 ? (STAGE_H - self.y) / dy : (dy < 0 ? -self.y / dy : maxRange);
        const clearance = Math.max(0, Math.min(distX, distY));

        const align = dx * awayX + dy * awayY; // dot product
        const score = align * 1.0 + (clearance / maxRange) * 1.0;

        if (score > best.score) best = { x: dx, y: dy, score };
    }

    // Normalize
    const len = Math.hypot(best.x, best.y) || 1;
    return { x: best.x / len, y: best.y / len, wallX: best.x, wallY: best.y };
}

// Project a ray until hitting wall/bounds for debug billiards-style preview
function rayToWall(self, dir) {
    const maxRange = Math.max(STAGE_W, STAGE_H);
    const step = 1;
    let hit = null;
    for (let d = 0; d < maxRange; d += step) {
        const px = self.x + dir.x * d;
        const py = self.y + dir.y * d;
        const hitsBounds = px < 1 || px > STAGE_W - 1 || py < 1 || py > STAGE_H - 1;
        const hitsWall = getCell(Math.floor(px), Math.floor(py)) === TYPE.WALL;
        if (hitsBounds || hitsWall) { hit = { x: px, y: py, d }; break; }
    }
    return hit;
}

