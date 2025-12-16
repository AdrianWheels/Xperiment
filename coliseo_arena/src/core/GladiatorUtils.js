/**
 * GladiatorUtils.js
 * Common utility functions used by gladiator modules
 */

/**
 * Find the nearest enemy entity to the given entity
 * @param {Entity} self - The entity searching for enemies
 * @param {Array<Entity>} entities - All entities in the arena
 * @returns {{enemy: Entity|null, distance: number}} - Nearest enemy and distance
 */
export function findNearestEnemy(self, entities) {
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    for (const e of entities) {
        if (e === self || e.team === self.team || e.isDead) continue;
        const d = Math.hypot(e.x - self.x, e.y - self.y);
        if (d < nearestDist) {
            nearestDist = d;
            nearestEnemy = e;
        }
    }
    
    return { enemy: nearestEnemy, distance: nearestDist };
}

/**
 * Update a cooldown timer
 * @param {Entity} self - The entity with the cooldown
 * @param {string} propertyName - Name of the cooldown property (e.g., 'shootCD')
 * @param {number} simulationSpeed - Current simulation speed multiplier
 */
export function updateCooldown(self, propertyName, simulationSpeed) {
    if (self[propertyName] > 0) {
        self[propertyName] -= simulationSpeed;
        if (self[propertyName] < 0) self[propertyName] = 0;
    }
}

/**
 * Update a timer (same as cooldown but semantically different)
 * @param {Entity} self - The entity with the timer
 * @param {string} propertyName - Name of the timer property (e.g., 'fleeTimer')
 * @param {number} simulationSpeed - Current simulation speed multiplier
 */
export function updateTimer(self, propertyName, simulationSpeed) {
    if (self[propertyName] > 0) {
        self[propertyName] -= simulationSpeed;
        if (self[propertyName] < 0) self[propertyName] = 0;
    }
}

/**
 * Create a projectile targeting an enemy
 * @param {Entity} self - The entity shooting the projectile
 * @param {Entity} target - The target entity
 * @param {Object} config - Projectile configuration
 * @param {number} config.damage - Base damage
 * @param {number} config.speed - Projectile speed
 * @param {string} config.color - Projectile color
 * @param {number} [config.size=5] - Projectile size
 * @returns {Projectile} - The created projectile
 */
export function createProjectile(self, target, config) {
    const Projectile = window.Projectile;
    if (!Projectile) {
        console.error('Projectile class not available');
        return null;
    }
    
    const angle = Math.atan2(target.y - self.y, target.x - self.x);
    const vx = Math.cos(angle) * config.speed;
    const vy = Math.sin(angle) * config.speed;
    
    return new Projectile(
        self.x,
        self.y,
        vx,
        vy,
        config.damage,
        self.team,
        config.color,
        config.size || 5,
        self
    );
}

/**
 * Calculate distance between two entities
 * @param {Entity} e1 - First entity
 * @param {Entity} e2 - Second entity
 * @returns {number} - Distance between entities
 */
export function distanceBetween(e1, e2) {
    return Math.hypot(e2.x - e1.x, e2.y - e1.y);
}

/**
 * Check if entity is within range of another
 * @param {Entity} self - The entity checking range
 * @param {Entity} target - The target entity
 * @param {number} range - Range threshold
 * @returns {boolean} - True if within range
 */
export function isInRange(self, target, range) {
    return distanceBetween(self, target) <= range;
}

/**
 * Initialize property if undefined
 * @param {Entity} self - The entity
 * @param {string} propertyName - Name of the property
 * @param {*} defaultValue - Default value to set
 */
export function initProperty(self, propertyName, defaultValue) {
    if (self[propertyName] === undefined) {
        self[propertyName] = defaultValue;
    }
}

/**
 * Switch movement strategy with optional delay
 * @param {Entity} self - The entity
 * @param {string} strategy - New strategy ('aggressive', 'defensive', 'passive')
 */
export function switchMovementStrategy(self, strategy) {
    if (self.currentStrategy !== strategy) {
        self.setMovementStrategy(strategy);
    }
}

/**
 * Calculate movement vector towards or away from target
 * @param {Entity} self - The entity
 * @param {Entity} target - The target entity
 * @param {boolean} flee - True to flee, false to pursue
 * @returns {{dx: number, dy: number, angle: number}} - Direction vector and angle
 */
export function calculateDirection(self, target, flee = false) {
    const dx = target.x - self.x;
    const dy = target.y - self.y;
    const angle = Math.atan2(dy, dx);
    
    return {
        dx: flee ? -dx : dx,
        dy: flee ? -dy : dy,
        angle: flee ? angle + Math.PI : angle
    };
}
