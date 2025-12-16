import { findNearestEnemy, updateCooldown, updateTimer, switchMovementStrategy } from '../../core/GladiatorUtils.js';

const ATTACK_MIN = 60;
const ATTACK_MAX = 160;
const FLEE_RANGE = 45;
const RANGE_CD = 60;

export default {
    key: 'archer',
    name: 'Archer',
    defaultMovementStrategy: 'defensive',
    debugRange: { min: ATTACK_MIN, max: ATTACK_MAX, color: '#00ffcc' },
    
    onInit(self) {
        self.rangedCD = 0;
        self.fleeTimer = 0;
    },
    
    update(gladiator, { entities, simulationSpeed, floatingTexts }) {
        // Update cooldowns and timers
        updateCooldown(gladiator, 'rangedCD', simulationSpeed);
        updateTimer(gladiator, 'fleeTimer', simulationSpeed);

        // Find nearest enemy using utility
        const { enemy: nearestEnemy, distance: nearestDist } = findNearestEnemy(gladiator, entities);

        // Cambiar entre defensive (flee) y aggressive (kiting) según rango
        const enemyClose = nearestEnemy && nearestDist < FLEE_RANGE;
        if (enemyClose && gladiator.fleeTimer <= 0) {
            gladiator.fleeTimer = 18;
        }
        
        // Si enemigo muy cerca, activar defensive flee
        if (enemyClose && gladiator.fleeTimer > 0) {
            if (gladiator.movementStrategy.name !== 'defensive') {
                gladiator.changeMovementStrategy('defensive');
            }
        } 
        // Si está en rango óptimo, usar movimiento custom de kiting
        else if (nearestEnemy && nearestDist >= ATTACK_MIN && nearestDist <= ATTACK_MAX) {
            // Mantener distancia - override con movimiento manual
            gladiator.skipSeek = true;
            // No moverse, solo mantener posición
            gladiator.vx *= 0.95;
            gladiator.vy *= 0.95;
        }
        // Si está muy lejos o muy cerca (pero no fleeing), acercarse
        else if (nearestEnemy && nearestDist < ATTACK_MIN) {
            // Retroceder
            gladiator.skipSeek = true;
            let angle = Math.atan2(nearestEnemy.y - gladiator.y, nearestEnemy.x - gladiator.x) + Math.PI;
            let accel = 0.18;
            gladiator.vx += Math.cos(angle) * accel * simulationSpeed;
            gladiator.vy += Math.sin(angle) * accel * simulationSpeed;
        }
        else if (nearestEnemy) {
            // Usar movimiento agresivo para acercarse
            if (gladiator.movementStrategy.name !== 'aggressive') {
                gladiator.changeMovementStrategy('aggressive');
            }
        }

        // Ranged attack at mid distance - solo si cooldown ha expirado
        const canShoot = nearestEnemy && nearestDist > ATTACK_MIN && nearestDist < ATTACK_MAX && gladiator.rangedCD <= 0;
        if (canShoot && window.gameState && window.gameState.projectiles && window.Projectile) {
            window.gameState.projectiles.push(new window.Projectile(gladiator.x, gladiator.y, 'arrow', gladiator, nearestEnemy));
            gladiator.rangedCD = RANGE_CD; // Establecer cooldown INMEDIATAMENTE
            gladiator.gainXp(10, floatingTexts);
        }
    },
    onCombat(self) {
        // Refresh flee window on hit like poison
        self.fleeTimer = 18;
    },
    draw() {},
    debugDraw(self, ctx, { CELL_SIZE }) {
        const fleeRange = 50;
        const attackMin = ATTACK_MIN;
        const attackMax = ATTACK_MAX;
        ctx.save();
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, fleeRange * (CELL_SIZE / 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, attackMin * (CELL_SIZE / 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, attackMax * (CELL_SIZE / 10), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Mark can-shoot state
        let nearestEnemyDist = 999;
        if (window.gameState) {
            for (let e of window.gameState.entities) {
                if (e !== self && e.team !== self.team) {
                    const d = Math.hypot(e.x - self.x, e.y - self.y);
                    if (d < nearestEnemyDist) nearestEnemyDist = d;
                }
            }
        }
        const canRanged = nearestEnemyDist > attackMin && nearestEnemyDist < attackMax && self.rangedCD <= 0 && !self.fleeing;
        if (canRanged) {
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('RANGE OK', self.radius * CELL_SIZE, 0);
        }
        ctx.restore();
    }
};

