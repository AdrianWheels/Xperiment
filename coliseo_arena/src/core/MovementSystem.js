/**
 * MovementSystem.js
 * Sistema robusto de movimiento para gladiadores
 * Proporciona estrategias intercambiables: Agresivo, Defensivo y Pasivo
 * 
 * Mejoras v2.0:
 * - Bounds centralizados con SAFE_BOUNDS del config
 * - Clamping de posición para prevenir wall crashes
 * - Corner escape emergente
 * - Wall collision simplificado y seguro
 * - Sistema defensive simplificado (flee directo sin pathfinding complejo)
 */

import { TYPE, SAFE_BOUNDS, WARNING_DISTANCE, STAGE_W, STAGE_H } from '../config.js';

/**
 * Clase base para todas las estrategias de movimiento
 */
export class BaseMovementStrategy {
    constructor(entity, config) {
        this.entity = entity;
        this.config = config;
        this.name = 'base';
    }

    /**
     * Actualiza el movimiento de la entidad
     * @param {number} simulationSpeed - Factor de velocidad de simulación
     * @param {Array} entities - Lista de todas las entidades
     * @param {Object} grid - Grid del juego
     */
    update(simulationSpeed, entities, grid) {
        // Orden crítico:
        // 1. Calcular velocidad según estrategia
        this.updateVelocity(simulationSpeed, entities, grid);
        
        // 2. Aplicar fricción
        this.applyFriction(simulationSpeed);
        
        // 3. Detectar y escapar de esquinas ANTES de mover
        this.handleCornerEscape(simulationSpeed);
        
        // 4. Actualizar posición
        this.updatePosition(simulationSpeed);
        
        // 5. Clampear posición a bounds seguros
        this.clampToArenaBounds();
        
        // 6. Manejar colisiones con paredes (bounce)
        this.handleWallCollisions(simulationSpeed, grid);
    }

    /**
     * Calcula la intención de movimiento (dirección deseada)
     */
    calculateIntent(entities) {
        // Subclases pueden override esto
        return { x: 0, y: 0, magnitude: 0 };
    }

    /**
     * Actualiza la velocidad según la estrategia
     */
    updateVelocity(simulationSpeed, entities, grid) {
        // Implementado por subclases
    }

    /**
     * Aplica fricción a la velocidad
     */
    applyFriction(simulationSpeed) {
        const entity = this.entity;
        
        // Permitir que el módulo override la fricción
        let frictionBase = this.config.friction || 0.98;
        if (entity.module && typeof entity.module.getFriction === 'function') {
            frictionBase = entity.module.getFriction(entity);
        }
        
        const friction = Math.pow(frictionBase, simulationSpeed);
        entity.vx *= friction;
        entity.vy *= friction;
    }

    /**
     * Actualiza la posición basada en velocidad
     */
    updatePosition(simulationSpeed) {
        const entity = this.entity;
        entity.x += entity.vx * simulationSpeed;
        entity.y += entity.vy * simulationSpeed;
    }

    /**
     * Clampea la posición de la entidad a los bounds seguros del arena
     * Previene que los gladiadores se salgan del área segura
     */
    clampToArenaBounds() {
        const entity = this.entity;
        
        // Clampear a bounds seguros
        const wasClamped = (
            entity.x < SAFE_BOUNDS.minX || entity.x > SAFE_BOUNDS.maxX ||
            entity.y < SAFE_BOUNDS.minY || entity.y > SAFE_BOUNDS.maxY
        );
        
        entity.x = Math.max(SAFE_BOUNDS.minX, Math.min(SAFE_BOUNDS.maxX, entity.x));
        entity.y = Math.max(SAFE_BOUNDS.minY, Math.min(SAFE_BOUNDS.maxY, entity.y));
        
        // Si fue clampeado, reducir velocidad en esa dirección
        if (wasClamped) {
            if (entity.x <= SAFE_BOUNDS.minX || entity.x >= SAFE_BOUNDS.maxX) {
                entity.vx *= -0.3; // Reducir y revertir velocidad X
            }
            if (entity.y <= SAFE_BOUNDS.minY || entity.y >= SAFE_BOUNDS.maxY) {
                entity.vy *= -0.3; // Reducir y revertir velocidad Y
            }
        }
    }

    /**
     * Maneja colisiones con paredes
     * Sistema simplificado: clampear primero, luego bounce suave
     */
    handleWallCollisions(simulationSpeed, grid) {
        const entity = this.entity;
        const cellType = grid.getCellType(entity.x, entity.y);
        
        if (cellType === TYPE.WALL) {
            // Primero: clampear posición de vuelta a zona segura
            entity.x = Math.max(SAFE_BOUNDS.minX, Math.min(SAFE_BOUNDS.maxX, entity.x));
            entity.y = Math.max(SAFE_BOUNDS.minY, Math.min(SAFE_BOUNDS.maxY, entity.y));
            
            // Segundo: aplicar bounce reducido (invertir y reducir velocidad)
            const bounceFactor = -(this.config.wallBounceFactor || 0.5);
            entity.vx *= bounceFactor;
            entity.vy *= bounceFactor;
            
            // Callback del módulo (para comportamientos especiales)
            if (entity.module && entity.module.onWallBounce) {
                entity.module.onWallBounce(entity);
            }
        }
        
        // Ring-out detection removido - se maneja en Gladiator.js para evitar duplicación
    }
    
    /**
     * Corner Escape: detecta si el gladiador está en una esquina y fuerza escape
     * Comportamiento emergente que previene quedar atrapado
     */
    handleCornerEscape(simulationSpeed) {
        const entity = this.entity;
        const centerX = STAGE_W / 2;
        const centerY = STAGE_H / 2;
        
        // Distancias a los bordes
        const distToLeft = entity.x - SAFE_BOUNDS.minX;
        const distToRight = SAFE_BOUNDS.maxX - entity.x;
        const distToTop = entity.y - SAFE_BOUNDS.minY;
        const distToBottom = SAFE_BOUNDS.maxY - entity.y;
        
        // Detectar si está cerca de 2 bordes (esquina)
        const nearLeftOrRight = distToLeft < WARNING_DISTANCE || distToRight < WARNING_DISTANCE;
        const nearTopOrBottom = distToTop < WARNING_DISTANCE || distToBottom < WARNING_DISTANCE;
        
        if (nearLeftOrRight && nearTopOrBottom) {
            // Está en esquina - forzar movimiento hacia el centro
            const toCenterX = centerX - entity.x;
            const toCenterY = centerY - entity.y;
            const distToCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
            
            if (distToCenter > 0) {
                // Aplicar fuerza hacia el centro (proporcional a qué tan cerca está de la esquina)
                const urgency = Math.min(
                    Math.min(distToLeft, distToRight) / WARNING_DISTANCE,
                    Math.min(distToTop, distToBottom) / WARNING_DISTANCE
                );
                
                const escapeForce = (1 - urgency) * entity.baseSpeed * 0.5;
                
                entity.vx += (toCenterX / distToCenter) * escapeForce * simulationSpeed;
                entity.vy += (toCenterY / distToCenter) * escapeForce * simulationSpeed;
            }
        }
    }
    
    /**
     * Predice la posición futura y valida si es segura
     * @param {number} steps - Número de pasos a predecir
     * @param {Object} grid - Grid del juego
     * @returns {Object} { safe: boolean, predictedX, predictedY }
     */
    predictPosition(steps, grid) {
        const entity = this.entity;
        const futureX = entity.x + entity.vx * steps;
        const futureY = entity.y + entity.vy * steps;
        
        const inBounds = (
            futureX >= SAFE_BOUNDS.minX && futureX <= SAFE_BOUNDS.maxX &&
            futureY >= SAFE_BOUNDS.minY && futureY <= SAFE_BOUNDS.maxY
        );
        
        const notWall = grid.getCellType(futureX, futureY) !== TYPE.WALL;
        
        return {
            safe: inBounds && notWall,
            predictedX: futureX,
            predictedY: futureY,
            inBounds,
            notWall
        };
    }

    /**
     * Encuentra la entidad enemiga más cercana
     */
    findNearestEnemy(entities) {
        const entity = this.entity;
        let nearest = null;
        let minDist = Infinity;
        
        for (const other of entities) {
            if (other.isDead || other.team === entity.team) continue;
            const dx = other.x - entity.x;
            const dy = other.y - entity.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = other;
            }
        }
        
        return { entity: nearest, distance: minDist, angle: nearest ? Math.atan2(nearest.y - entity.y, nearest.x - entity.x) : 0 };
    }

    /**
     * Calcula la fuerza de repulsión en colisión
     */
    getRepelForce() {
        const entity = this.entity;
        if (entity.module && typeof entity.module.onCollisionRepel === 'function') {
            return entity.module.onCollisionRepel(entity);
        }
        return this.config.repelForce || 0.5;
    }
}

/**
 * Estrategia de Movimiento Agresivo
 * Persigue activamente a los enemigos
 */
export class AggressiveMovement extends BaseMovementStrategy {
    constructor(entity, config) {
        super(entity, config);
        this.name = 'aggressive';
        this.seekInterval = config.seekInterval || 1; // Buscar cada frame por defecto
    }

    calculateIntent(entities) {
        const target = this.findNearestEnemy(entities);
        if (!target.entity) {
            return { x: 0, y: 0, magnitude: 0 };
        }
        
        const angle = target.angle;
        return {
            x: Math.cos(angle),
            y: Math.sin(angle),
            magnitude: 1,
            targetDistance: target.distance
        };
    }

    updateVelocity(simulationSpeed, entities, grid) {
        const entity = this.entity;
        
        // Permitir que el módulo skip el seek behavior
        if (entity.skipSeek) {
            return;
        }
        
        // Seek behavior - buscar enemigos y acelerar hacia ellos
        const shouldSeek = Math.floor(entity.age) % this.seekInterval === 0;
        if (!shouldSeek) {
            return;
        }
        
        const target = this.findNearestEnemy(entities);
        if (!target.entity) {
            return;
        }
        
        const angle = target.angle;
        const accel = this.config.seekAcceleration || 0.1;
        
        // Almacenar intención para debug
        entity.intentX = Math.cos(angle);
        entity.intentY = Math.sin(angle);
        
        // Aplicar aceleración hacia el objetivo
        entity.vx += Math.cos(angle) * accel * simulationSpeed;
        entity.vy += Math.sin(angle) * accel * simulationSpeed;
        
        // Aplicar seek attractor si existe (para Orb, etc.)
        if (entity.seekAttractor) {
            const dx = target.entity.x - entity.x;
            const dy = target.entity.y - entity.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                target.entity.vx += (dx / dist) * entity.seekAttractor * simulationSpeed;
                target.entity.vy += (dy / dist) * entity.seekAttractor * simulationSpeed;
            }
        }
    }
}

/**
 * Estrategia de Movimiento Defensivo (Flee)
 * Sistema simplificado: huye directamente del enemigo más cercano
 * con ajuste básico para evitar paredes cercanas
 */
export class DefensiveMovement extends BaseMovementStrategy {
    constructor(entity, config) {
        super(entity, config);
        this.name = 'defensive';
    }

    calculateIntent(entities) {
        const target = this.findNearestEnemy(entities);
        if (!target.entity) {
            return { x: 0, y: 0, magnitude: 0 };
        }
        
        // Dirección opuesta al enemigo
        const angle = target.angle + Math.PI;
        return {
            x: Math.cos(angle),
            y: Math.sin(angle),
            magnitude: 1,
            targetDistance: target.distance
        };
    }

    updateVelocity(simulationSpeed, entities, grid) {
        const entity = this.entity;
        
        const target = this.findNearestEnemy(entities);
        if (!target.entity) {
            return;
        }
        
        // Dirección base: opuesta al enemigo
        let fleeAngle = target.angle + Math.PI;
        
        // Ajuste simple de wall avoidance: si la dirección de huida apunta hacia una pared cercana,
        // rotar ligeramente hacia un lado
        const prediction = this.predictPosition(10, grid);
        if (!prediction.safe) {
            // Intentar rotar 45 grados en ambas direcciones y elegir la mejor
            const leftAngle = fleeAngle + Math.PI / 4;
            const rightAngle = fleeAngle - Math.PI / 4;
            
            const leftX = entity.x + Math.cos(leftAngle) * 20;
            const leftY = entity.y + Math.sin(leftAngle) * 20;
            const rightX = entity.x + Math.cos(rightAngle) * 20;
            const rightY = entity.y + Math.sin(rightAngle) * 20;
            
            const leftSafe = (
                leftX >= SAFE_BOUNDS.minX && leftX <= SAFE_BOUNDS.maxX &&
                leftY >= SAFE_BOUNDS.minY && leftY <= SAFE_BOUNDS.maxY &&
                grid.getCellType(leftX, leftY) !== TYPE.WALL
            );
            
            const rightSafe = (
                rightX >= SAFE_BOUNDS.minX && rightX <= SAFE_BOUNDS.maxX &&
                rightY >= SAFE_BOUNDS.minY && rightY <= SAFE_BOUNDS.maxY &&
                grid.getCellType(rightX, rightY) !== TYPE.WALL
            );
            
            // Elegir el lado seguro, o si ambos son seguros/inseguros, alternar
            if (leftSafe && !rightSafe) {
                fleeAngle = leftAngle;
            } else if (rightSafe && !leftSafe) {
                fleeAngle = rightAngle;
            } else {
                // Alternar basado en frame
                fleeAngle = (Math.floor(entity.age) % 2 === 0) ? leftAngle : rightAngle;
            }
        }
        
        // Aplicar velocidad de huida
        const fleeThresholdClose = this.config.fleeThresholdClose || 120;
        const speedMultiplier = target.distance < fleeThresholdClose ? 
            (this.config.fleeSpeedClose || 0.9) : 
            (this.config.fleeSpeedFar || 0.55);
        
        const speed = entity.baseSpeed * speedMultiplier;
        entity.vx = Math.cos(fleeAngle) * speed;
        entity.vy = Math.sin(fleeAngle) * speed;
        
        // Almacenar intención para debug
        entity.intentX = Math.cos(fleeAngle);
        entity.intentY = Math.sin(fleeAngle);
    }
}

/**
 * Estrategia de Movimiento Pasivo
 * Movimiento no reactivo a enemigos (orbitar, patrullar, estacionario)
 */
export class PassiveMovement extends BaseMovementStrategy {
    constructor(entity, config) {
        super(entity, config);
        this.name = 'passive';
        this.pattern = config.pattern || 'idle'; // idle, orbit, patrol, wander
        this.orbitCenter = { x: entity.x, y: entity.y };
        this.orbitAngle = Math.random() * Math.PI * 2;
    }

    calculateIntent(entities) {
        switch (this.pattern) {
            case 'orbit':
                return {
                    x: Math.cos(this.orbitAngle + Math.PI / 2),
                    y: Math.sin(this.orbitAngle + Math.PI / 2),
                    magnitude: 1
                };
            case 'wander':
                return {
                    x: Math.cos(this.entity.age * 0.1),
                    y: Math.sin(this.entity.age * 0.1),
                    magnitude: 0.5
                };
            case 'idle':
            default:
                return { x: 0, y: 0, magnitude: 0 };
        }
    }

    updateVelocity(simulationSpeed, entities, grid) {
        const entity = this.entity;
        
        switch (this.pattern) {
            case 'idle':
                // No hacer nada, dejar que la fricción detenga al gladiador
                break;
                
            case 'orbit':
                // Orbitar alrededor de un punto central
                const orbitSpeed = this.config.orbitSpeed || 0.2;
                const orbitRadius = this.config.orbitRadius || 50;
                
                this.orbitAngle += orbitSpeed * simulationSpeed * (this.entity.level ? (1 + this.entity.level * 0.25) : 1);
                
                const targetX = this.orbitCenter.x + Math.cos(this.orbitAngle) * orbitRadius;
                const targetY = this.orbitCenter.y + Math.sin(this.orbitAngle) * orbitRadius;
                
                const dx = targetX - entity.x;
                const dy = targetY - entity.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 5) {
                    const speed = entity.baseSpeed * (this.config.orbitSpeedMultiplier || 1.0);
                    entity.vx = (dx / dist) * speed;
                    entity.vy = (dy / dist) * speed;
                }
                
                entity.intentX = Math.cos(this.orbitAngle + Math.PI / 2);
                entity.intentY = Math.sin(this.orbitAngle + Math.PI / 2);
                break;
                
            case 'patrol':
                // Patrullar entre puntos (implementación simple)
                if (!this.patrolPoints || this.patrolPoints.length === 0) {
                    this.patrolPoints = [
                        { x: entity.x, y: entity.y },
                        { x: entity.x + 100, y: entity.y },
                        { x: entity.x + 100, y: entity.y + 100 },
                        { x: entity.x, y: entity.y + 100 }
                    ];
                    this.currentPatrolIndex = 0;
                }
                
                const target = this.patrolPoints[this.currentPatrolIndex];
                const pdx = target.x - entity.x;
                const pdy = target.y - entity.y;
                const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
                
                if (pdist < 10) {
                    this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
                } else {
                    const speed = entity.baseSpeed * (this.config.patrolSpeed || 0.6);
                    entity.vx = (pdx / pdist) * speed;
                    entity.vy = (pdy / pdist) * speed;
                    
                    entity.intentX = pdx / pdist;
                    entity.intentY = pdy / pdist;
                }
                break;
                
            case 'wander':
                // Movimiento aleatorio suave
                const wanderFreq = this.config.wanderFrequency || 0.02;
                const wanderSpeed = entity.baseSpeed * (this.config.wanderSpeedMultiplier || 0.4);
                
                const wanderAngle = Math.sin(entity.age * wanderFreq) * Math.PI;
                entity.vx = Math.cos(wanderAngle) * wanderSpeed;
                entity.vy = Math.sin(wanderAngle) * wanderSpeed;
                
                entity.intentX = Math.cos(wanderAngle);
                entity.intentY = Math.sin(wanderAngle);
                break;
        }
    }

    setPattern(pattern, options = {}) {
        this.pattern = pattern;
        if (pattern === 'orbit' && options.center) {
            this.orbitCenter = options.center;
        }
        if (options.patrolPoints) {
            this.patrolPoints = options.patrolPoints;
            this.currentPatrolIndex = 0;
        }
    }
}

/**
 * Factory para crear estrategias de movimiento
 */
export class MovementStrategyFactory {
    static create(type, entity, config) {
        switch (type) {
            case 'aggressive':
                return new AggressiveMovement(entity, config.AGGRESSIVE || {});
            case 'defensive':
                return new DefensiveMovement(entity, config.DEFENSIVE || {});
            case 'passive':
                return new PassiveMovement(entity, config.PASSIVE || {});
            default:
                return new AggressiveMovement(entity, config.AGGRESSIVE || {});
        }
    }
}
