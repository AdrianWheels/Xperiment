import { CELL_SIZE } from '../../config.js';
import { findNearestEnemy, updateCooldown } from '../../core/GladiatorUtils.js';

const TURRET_RANGE = 60;

export default {
    key: 'pyramid',
    name: 'Pyramid',
    defaultMovementStrategy: 'aggressive',
    debugRange: { min: 0, max: TURRET_RANGE, color: '#00ffcc' },
    
    onInit(self) {
        self.pyramidTurret = false;
        self.rangedCD = 0;
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // Seek nearest enemy to toggle turret
        const { enemy: nearestEnemy, distance: nearestDist } = findNearestEnemy(self, entities);

        const shouldBeTurret = nearestEnemy && nearestDist < TURRET_RANGE;
        
        // Cambiar a modo turret (passive idle) cuando enemigo está en rango
        if (shouldBeTurret && !self.pyramidTurret) {
            self.pyramidTurret = true;
            self.changeMovementStrategy('passive', { pattern: 'idle' });
        }
        // Volver a aggressive cuando no hay enemigos cerca
        else if (!shouldBeTurret && self.pyramidTurret) {
            self.pyramidTurret = false;
            self.changeMovementStrategy('aggressive');
        }

        if (self.pyramidTurret) {
            // Drastically reduced passive XP while mounted
            self.gainXp(0.05 * simulationSpeed, floatingTexts);
            updateCooldown(self, 'rangedCD', simulationSpeed);

            // Solo disparar si cooldown ha expirado Y Projectile está disponible
            if (nearestEnemy && self.rangedCD <= 0 && window.gameState && window.gameState.projectiles && window.Projectile) {
                window.gameState.projectiles.push(new window.Projectile(self.x, self.y, 'arrow', self, nearestEnemy));
                // Fire faster with level; clamp to avoid instant fire
                const baseCD = 45;
                const scaledCD = Math.max(15, baseCD - (self.level * 4));
                self.rangedCD = scaledCD; // Establecer cooldown INMEDIATAMENTE
                self.gainXp(8, floatingTexts);
            }
        }
    },
    onDamageTaken(self, attacker, amount) {
        if (self.pyramidTurret) return amount * Math.max(0.1, 0.6 - (self.level * 0.05));
        return amount;
    },
    debugDraw(self, ctx, { CELL_SIZE }) {
        const turretRange = TURRET_RANGE;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, turretRange * (CELL_SIZE / 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    },
    onCombat() {},
    draw() {}
};

