import { Projectile } from '../../entities/Projectile.js';
import { FloatingText } from '../../entities/FloatingText.js';
import { findNearestEnemy, updateCooldown, updateTimer, switchMovementStrategy } from '../../core/GladiatorUtils.js';

export default {
    key: 'bomber',
    name: 'Bomber',
    defaultMovementStrategy: 'aggressive',
    
    onInit(self) {
        self.bombTrailCD = 0;
        self.fleeTimer = 0;
        self.defensiveBombCD = 0; // Cooldown for bombs spawned on damage
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // Update cooldowns
        updateCooldown(self, 'bombTrailCD', simulationSpeed);
        updateTimer(self, 'fleeTimer', simulationSpeed);
        updateCooldown(self, 'defensiveBombCD', simulationSpeed);

        // Trail bombs while moving
        const moving = Math.hypot(self.vx, self.vy) > self.baseSpeed * 0.35;
        if (moving && self.bombTrailCD <= 0) {
            if (window.gameState && window.gameState.projectiles) {
                window.gameState.projectiles.push(new Projectile(self.x, self.y, 'bomb', self));
            }
            if (floatingTexts) floatingTexts.push(new FloatingText(self.x, self.y - 8, "BOMB", '#ff8800'));
            const jitter = 0.9 + Math.random() * 0.2;
            self.bombTrailCD = 120 * jitter;
        }

        // Find nearest enemy and update strategy
        const { enemy: nearestEnemy, distance: nearestDist } = findNearestEnemy(self, entities);
        
        const enemyClose = nearestEnemy && nearestDist < 70;
        if (enemyClose && self.fleeTimer <= 0) self.fleeTimer = 18;
        
        // Cambiar estrategia según fleeTimer
        if (enemyClose && self.fleeTimer > 0) {
            if (self.movementStrategy.name !== 'defensive') {
                self.changeMovementStrategy('defensive');
            }
        } else if (self.fleeTimer <= 0 && self.movementStrategy.name === 'defensive') {
            self.changeMovementStrategy('aggressive');
        }
    },
    onDamageTaken(self, attacker, amount, { floatingTexts }) {
        // Only drop bomb if cooldown has expired (prevent spam)
        if (self.defensiveBombCD <= 0 && window.gameState && window.gameState.projectiles) {
            window.gameState.projectiles.push(new Projectile(self.x, self.y, 'bomb', self));
            self.defensiveBombCD = 60; // ~1 second cooldown
            floatingTexts.push(new FloatingText(self.x, self.y - 10, "BOMB!", '#ff8800'));
        }
        
        // Activar flee al recibir daño
        self.fleeTimer = 24;
        self.changeMovementStrategy('defensive');
        
        self.gainXp(15, floatingTexts);

        if (window.gameState && window.gameState.screenShake) {
            window.gameState.screenShake.trigger(3, 8);
        }
        return amount;
    },
    onCombat() {},
    draw() {}
};

