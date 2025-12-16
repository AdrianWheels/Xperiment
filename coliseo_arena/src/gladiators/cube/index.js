import { FloatingText } from '../../entities/FloatingText.js';
import { CELL_SIZE } from '../../config.js';
import { findNearestEnemy, updateCooldown } from '../../core/GladiatorUtils.js';

const FRICTION = 0.95;

export default {
    key: 'cube',
    name: 'Cube',
    
    onInit(self) {
        self.slamCooldown = 60;
        self.slamWindup = 0;
        self.slamFlash = 0;
        self._slamInProgress = false; // Flag para prevenir inicio múltiple de slam
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // Class friction
        self.vx *= FRICTION;
        self.vy *= FRICTION;

        // Ground slam logic
        updateCooldown(self, 'slamCooldown', simulationSpeed);

        // Hold still while charging the ground slam
        if (self.slamWindup > 0) {
            self.vx *= 0.6;
            self.vy *= 0.6;
            updateCooldown(self, 'slamWindup', simulationSpeed);

            if (self.slamWindup <= 0) {
                const radius = 28;
                const damage = 12 + self.level * 3;
                for (const enemy of entities) {
                    if (enemy === self || enemy.team === self.team) continue;
                    const dist = Math.hypot(enemy.x - self.x, enemy.y - self.y);
                    if (dist <= radius) {
                        const dealt = enemy.takeDamage(damage, self, floatingTexts);
                        if (dealt > 0) {
                            const angle = Math.atan2(enemy.y - self.y, enemy.x - self.x);
                            enemy.vx += Math.cos(angle) * 2.4;
                            enemy.vy += Math.sin(angle) * 2.4;
                            self.damageDealt += dealt;
                        }
                    }
                }

                if (floatingTexts) floatingTexts.push(new FloatingText(self.x, self.y - 10, "SLAM!", '#ffffff'));
                if (window.gameState && window.gameState.screenShake) window.gameState.screenShake.trigger(4, 12);
                self.slamFlash = 12;
                self.slamCooldown = 120; // ~2s downtime before next slam
                self._slamInProgress = false; // Resetear flag
            }
            return;
        }

        // Start the windup when close enough and off cooldown
        if (self.slamCooldown <= 0 && !self._slamInProgress) {
            const { enemy: nearest, distance: nearestDist } = findNearestEnemy(self, entities);

            if (nearest && nearestDist < 32) {
                self.vx = 0;
                self.vy = 0;
                self.slamWindup = 12;
                self._slamInProgress = true; // Marcar slam en progreso
            }
        }
    },
    onCollisionRepel(self, other, { floatingTexts }) {
        // Stronger knockback with level scaling
        const force = 1.5 + (self.level * 0.2);
        self.gainXp(20, floatingTexts);
        return force;
    },
    onCombat() {},
    draw(self, ctx) {
        // Windup and slam flash overlay
        if (self.slamWindup <= 0 && self.slamFlash <= 0) return;

        const sx = self.x * CELL_SIZE;
        const sy = self.y * CELL_SIZE;
        const sr = self.radius * CELL_SIZE;

        ctx.save();
        ctx.translate(sx, sy);

        if (self.slamWindup > 0) {
            const pct = Math.min(1, self.slamWindup / 12);
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 4;
            ctx.globalAlpha = 0.4 + (0.3 * pct);
            ctx.beginPath();
            ctx.arc(0, 0, sr * 1.6, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (self.slamFlash > 0) {
            self.slamFlash -= 1;
            const pulse = 1 + (self.slamFlash / 6);
            ctx.fillStyle = '#ffaa00';
            ctx.globalAlpha = 0.2 + (self.slamFlash / 20);
            ctx.beginPath();
            ctx.arc(0, 0, sr * 1.8 * pulse, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
};

